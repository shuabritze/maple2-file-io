import { BinaryBuffer } from "../common/BinaryBuffer";
import { PackFileEntry } from "../common/PackFileEntry";
import { PackVersion } from "../common/PackVersion";
import { IPackStream } from "./IPackStream";
import { PackFileHeaderVer3 } from "./PackFileHeaderVer3";

export class PackStreamVer3 implements IPackStream {
  // OS2F/PS2F
  version: PackVersion;

  compressedHeaderSize: bigint = 0n;
  encodedHeaderSize: bigint = 0n;
  headerSize: bigint = 0n;

  compressedDataSize: bigint = 0n;
  encodedDataSize: bigint = 0n;
  dataSize: bigint = 0n;

  fileListCount: bigint = 0n;
  fileList: PackFileEntry[] = [];

  reserved: number = 0;

  constructor(version: PackVersion) {
    this.version = version;
  }

  static parseHeader(
    reader: BinaryBuffer,
    version: PackVersion
  ): PackStreamVer3 {
    const stream = new PackStreamVer3(version);
    stream.fileListCount = BigInt(reader.readUInt32LE());
    stream.reserved = reader.readUInt32LE();
    stream.compressedDataSize = reader.readBigInt64LE();
    stream.encodedDataSize = reader.readBigInt64LE();
    stream.compressedHeaderSize = reader.readBigInt64LE();
    stream.encodedHeaderSize = reader.readBigInt64LE();
    stream.dataSize = reader.readBigInt64LE();
    stream.headerSize = reader.readBigInt64LE();

    return stream;
  }

  encode(pWriter: BinaryBuffer): void {
    pWriter.writeUInt32LE(Number(this.fileListCount));
    pWriter.writeUInt32LE(this.reserved);
    pWriter.writeBigInt64LE(this.compressedDataSize);
    pWriter.writeBigInt64LE(this.encodedDataSize);
    pWriter.writeBigInt64LE(this.compressedHeaderSize);
    pWriter.writeBigInt64LE(this.encodedHeaderSize);
    pWriter.writeBigInt64LE(this.dataSize);
    pWriter.writeBigInt64LE(this.headerSize);
  }

  initFileList(reader: BinaryBuffer): void {
    for (let i = 0n; i < this.fileListCount; i++) {
      const fileHeader = new PackFileHeaderVer3(this.version, reader);
      this.fileList[Number(fileHeader.fileIndex) - 1].fileHeader = fileHeader;
    }
  }
}
