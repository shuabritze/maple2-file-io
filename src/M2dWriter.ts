import { BinaryBuffer } from "./crypto/common/BinaryBuffer";
import { Encryption } from "./crypto/common/Encryption";
import { PackFileEntry } from "./crypto/common/PackFileEntry";
import { PackVersion } from "./crypto/common/PackVersion";
import { CryptoManager } from "./crypto/CryptoManager";
import { PackFileHeaderVer1 } from "./crypto/stream/PackFileHeaderVer1";
import { PackStreamVer1 } from "./crypto/stream/PackStreamVer1";

import fs from "fs";
import { M2dReader } from "./M2dReader";

export class M2dWriter {
  /**
   * Path to .m2d
   */
  filePath: string;
  files: PackFileEntry[];

  constructor(filePath: string) {
    this.filePath = filePath;
    this.files = [];
  }

  static fromReader(reader: M2dReader) {
    const writer = new M2dWriter(reader.filePath);
    writer.files = reader.files;

    for (const file of reader.files) {
      file.data = reader.getBytes(file);
    }

    return writer;
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
      PackVersion.MS2F,
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
      PackVersion.MS2F,
      fileBuffer,
      new Encryption(Encryption.Aes | Encryption.Zlib)
    );

    const stream = new PackStreamVer1();
    stream.fileListCount = BigInt(fileCount);
    stream.headerSize = BigInt(headerLength);
    stream.compressedHeaderSize = BigInt(headerCompressedLength);
    stream.encodedHeaderSize = BigInt(encodedHeaderLength);
    stream.dataSize = BigInt(fileTableLength);
    stream.compressedDataSize = BigInt(fileTableCompressedLength);
    stream.encodedDataSize = BigInt(encodedFileTableLength);

    const streamBuffer = new BinaryBuffer(60);
    stream.encode(streamBuffer);

    const fileStream = fs.createWriteStream(
      this.filePath.replace(".m2d", ".m2h")
    );
    const verBuffer = new BinaryBuffer(4);
    verBuffer.writeUInt32LE(stream.version);
    fileStream.write(verBuffer.getBuffer());
    fileStream.write(streamBuffer.getBuffer());
    fileStream.write(encryptedHeaderBuffer.getBuffer());
    fileStream.write(encryptedFileBuffer.getBuffer());
  }

  #writeData() {
    let version: PackVersion = PackVersion.MS2F;
    let offset = 0n;
    let index = 1;

    const sizeTotal = this.files.reduce(
      (acc, cur) => acc + (cur.data?.length ?? 0),
      0
    );
    const writeBuffer = new BinaryBuffer(sizeTotal);

    for (const packFileEntry of this.files) {
      let header = packFileEntry.fileHeader;

      // TODO: Handle Unchanged
      //       // If the entry is unchanged, parse the block from the original offsets

      //       // Make sure the entry has a parsed file header from load
      //       if (pHeader == null) continue;

      //       // Update the initial versioning before any future crypto calls
      //       if (pHeader.GetVer() != uVer) uVer = pHeader.GetVer();

      //       // Access the current encrypted block data from the memory map initially loaded
      //       using (MemoryMappedViewStream pBuffer = pDataMappedMemFile.CreateViewStream((long) pHeader.GetOffset(), pHeader.GetEncodedFileSize())) {
      //           byte[] pSrc = new byte[pHeader.GetEncodedFileSize()];

      //           if (pBuffer.Read(pSrc, 0, (int) pHeader.GetEncodedFileSize()) != pHeader.GetEncodedFileSize()) continue;
      //           // Modify the header's file index to the updated offset after entry changes
      //           pHeader.SetFileIndex(nCurIndex);
      //           // Modify the header's offset to the updated offset after entry changes
      //           pHeader.SetOffset(uOffset);
      //           // Write the original (completely encrypted) block of data to file
      //           pWriter.Write(pSrc);

      //           // Update the Entry's index to the new current index
      //           pEntry.Index = nCurIndex;

      //           nCurIndex++;
      //           uOffset += pHeader.GetEncodedFileSize();
      //       }

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
              BigInt(offset),
              packFileEntry.data!
            );
            break;
          // case PackVersion.NS2F:
          //   header = PackFileHeaderVer2.createHeader(
          //     index,
          //     dwBufferFlag,
          //     BigInt(offset),
          //     packFileEntry.data!
          //   );
          //   break;
          // case PackVersion.OS2F:
          // case PackVersion.PS2F:
          //   header = PackFileHeaderVer3.createHeader(
          //     version,
          //     index,
          //     dwBufferFlag,
          //     BigInt(offset),
          //     packFileEntry.data!
          //   );
          //   break;
          default:
            header = PackFileHeaderVer1.createHeader(
              index,
              dwBufferFlag,
              BigInt(offset),
              packFileEntry.data!
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

      header.fileSize = BigInt(size);
      header.compressedFileSize = BigInt(compressedSize);
      header.encodedFileSize = encodedSize;

      packFileEntry.index = index;
      index++;

      offset += BigInt(header.encodedFileSize);
    }

    fs.writeFileSync(this.filePath, writeBuffer.getBuffer());
  }
}
