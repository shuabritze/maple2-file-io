import { BinaryBuffer } from "./crypto/common/BinaryBuffer";
import { Encryption } from "./crypto/common/Encryption";
import { PackFileEntry } from "./crypto/common/PackFileEntry";
import { PackVersion } from "./crypto/common/PackVersion";
import { CryptoManager } from "./crypto/CryptoManager";
import { PackFileHeaderVer1 } from "./crypto/stream/PackFileHeaderVer1";
import { PackStreamVer1 } from "./crypto/stream/PackStreamVer1";

import fs from "fs";
import { M2dReader } from "./M2dReader";
import { PackFileHeaderVer2 } from "./crypto/stream/PackFileHeaderVer2";
import { PackFileHeaderVer3 } from "./crypto/stream/PackFileHeaderVer3";
import { PackStreamVer2 } from "./crypto/stream/PackStreamVer2";
import { PackStreamVer3 } from "./crypto/stream/PackStreamVer3";
import { IPackStream } from "./crypto/stream/IPackStream";

export class M2dWriter {
  /**
   * Path to .m2d
   */
  filePath: string;
  dataBuffer: Buffer;
  files: PackFileEntry[];
  packVersion: PackVersion;

  constructor(filePath: string, packVersion: PackVersion = PackVersion.MS2F) {
    this.filePath = filePath;
    this.dataBuffer = Buffer.alloc(0);
    this.packVersion = packVersion;
    this.files = [];
  }

  static fromReader(reader: M2dReader) {
    const writer = new M2dWriter(reader.filePath);
    writer.files = reader.files.map((entry) => entry.createCopy());
    writer.dataBuffer = Buffer.from(reader.fileBuffer);
    writer.packVersion = reader.packVersion;

    return writer;
  }

  addEntry(entry: PackFileEntry) {
    if (!entry.data) {
      throw new Error("ERROR: Entry data is null.");
    }
    entry.changed = true;
    this.files.push(entry);
  }

  save() {
    this.files.sort((a, b) => a.compareTo(b));
    this.#writeData();
    this.#writeHeader();
  }

  #writeHeader() {
    const fileCount = this.files.length;
    const fileString = this.files.map((file) => file.toString()).join("\r\n");
    const fileStringBuffer = BinaryBuffer.fromBuffer(
      Buffer.from(fileString, "utf8")
    );

    const [
      encryptedHeaderBuffer,
      headerLength,
      headerCompressedLength,
      encodedHeaderLength,
    ] = CryptoManager.encrypt(
      this.packVersion,
      fileStringBuffer,
      new Encryption(Encryption.Aes | Encryption.Zlib)
    );

    const fileBuffer = new BinaryBuffer(fileCount * 48);
    for (const packFileEntry of this.files) {
      packFileEntry.fileHeader?.encode(fileBuffer);
    }

    const [
      encryptedFileBuffer,
      fileTableLength,
      fileTableCompressedLength,
      encodedFileTableLength,
    ] = CryptoManager.encrypt(
      this.packVersion,
      fileBuffer,
      new Encryption(Encryption.Aes | Encryption.Zlib)
    );

    let stream: IPackStream;
    switch (this.packVersion) {
      case PackVersion.MS2F:
        stream = new PackStreamVer1();
        break;
      case PackVersion.NS2F:
        stream = new PackStreamVer2();
        break;
      case PackVersion.OS2F:
      case PackVersion.PS2F:
        stream = new PackStreamVer3(this.packVersion);
        break;
      default:
        throw new Error(`Invalid PackVersion:${this.packVersion}`);
    }
    stream.fileListCount = BigInt(fileCount);
    stream.headerSize = BigInt(headerLength);
    stream.compressedHeaderSize = BigInt(headerCompressedLength);
    stream.encodedHeaderSize = BigInt(encodedHeaderLength);
    stream.dataSize = BigInt(fileTableLength);
    stream.compressedDataSize = BigInt(fileTableCompressedLength);
    stream.encodedDataSize = BigInt(encodedFileTableLength);

    const streamBuffer = new BinaryBuffer(stream.requiredBufferSpace ?? 60);
    stream.encode(streamBuffer);

    const fileStream = fs.createWriteStream(
      this.filePath.replace(".m2d", ".m2h")
    );
    const verBuffer = new BinaryBuffer(4);
    verBuffer.writeUInt32LE(stream.version!);
    fileStream.write(verBuffer.getBuffer());
    fileStream.write(streamBuffer.getBuffer());
    fileStream.write(encryptedHeaderBuffer.getBuffer());
    fileStream.write(encryptedFileBuffer.getBuffer());
    fileStream.close();
  }

  #writeData() {
    let version: PackVersion = PackVersion.MS2F;
    let offset = 0n;
    let index = 1;

    // Allocate space for each new entry & the original data buffer
    const sizeTotal =
      this.files
        .filter((file) => file.changed)
        .reduce((acc, cur) => {
          return acc + (cur.data?.length ?? 0) + 48;
        }, 0) + this.dataBuffer.length;
    const writeBuffer = new BinaryBuffer(sizeTotal);

    let bufferSize = 0;
    for (const packFileEntry of this.files) {
      let header = packFileEntry.fileHeader;

      if (packFileEntry.changed) {
        if (!header) {
          // New pack file entry
          // Hacky way of doing this, but this follows Nexon's current conventions.
          let dwBufferFlag = new Encryption(0);
          if (packFileEntry.name.endsWith(".usm")) {
            dwBufferFlag.value = Encryption.Xor;
          } else if (packFileEntry.name.endsWith(".png")) {
            dwBufferFlag.value = Encryption.Aes;
          } else {
            dwBufferFlag.value = Encryption.Aes | Encryption.Zlib;
          }

          switch (version) {
            case PackVersion.MS2F:
              header = PackFileHeaderVer1.createHeader(
                index,
                dwBufferFlag,
                offset,
                BinaryBuffer.fromBuffer(packFileEntry.data!.getBuffer())
              );
              break;
            case PackVersion.NS2F:
              header = PackFileHeaderVer2.createHeader(
                index,
                dwBufferFlag,
                offset,
                BinaryBuffer.fromBuffer(packFileEntry.data!.getBuffer())
              );
              break;
            case PackVersion.OS2F:
            case PackVersion.PS2F:
              header = PackFileHeaderVer3.createHeader(
                version,
                index,
                dwBufferFlag,
                offset,
                BinaryBuffer.fromBuffer(packFileEntry.data!.getBuffer())
              );
              break;
            default:
              header = PackFileHeaderVer1.createHeader(
                index,
                dwBufferFlag,
                offset,
                BinaryBuffer.fromBuffer(packFileEntry.data!.getBuffer())
              );
          }
          packFileEntry.fileHeader = header;
        } else {
          // Existing pack file entry
          header.fileIndex = index;
          header.offset = offset;
        }

        const [encryptedData, size, compressedSize, encodedSize] =
          CryptoManager.encrypt(
            version,
            packFileEntry.data!,
            header.bufferFlag ?? new Encryption(0)
          );
        writeBuffer.writeBytes(encryptedData.getBuffer());
        bufferSize += encryptedData.length;

        header.fileSize = BigInt(size);
        header.compressedFileSize = BigInt(compressedSize);
        header.encodedFileSize = encodedSize;

        packFileEntry.index = index;
        index++;

        offset += BigInt(header.encodedFileSize);
        continue;
      }

      if (!header) {
        return;
      }

      if (header.version && header.version !== version) {
        version = header.version;
      }

      const readBuffer = new BinaryBuffer(header.encodedFileSize!);
      this.dataBuffer.copy(
        readBuffer.getBuffer(),
        0,
        Number(header.offset),
        Number(header.offset) + header.encodedFileSize!
      );

      header.fileIndex = index;
      header.offset = BigInt(offset);
      writeBuffer.writeBytes(readBuffer.getBuffer());
      bufferSize += readBuffer.length;
      packFileEntry.index = index;

      index++;
      offset += BigInt(header.encodedFileSize!);
    }

    const endBuffer = writeBuffer.getBuffer().slice(0, bufferSize);
    fs.writeFileSync(this.filePath, endBuffer);
  }
}
