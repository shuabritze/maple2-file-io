import { BinaryBuffer } from "../common/BinaryBuffer";
import { PackFileEntry } from "../common/PackFileEntry";
import { PackVersion } from "../common/PackVersion";
import { IPackStream } from "./IPackStream";
import { PackFileHeaderVer1 } from "./PackFileHeaderVer1";

export class PackStreamVer1 implements IPackStream {
  version: PackVersion = PackVersion.MS2F;
  requiredBufferSpace: number = 60;

  compressedHeaderSize: bigint = 0n;
  encodedHeaderSize: bigint = 0n;
  headerSize: bigint = 0n;

  compressedDataSize: bigint = 0n;
  encodedDataSize: bigint = 0n;
  dataSize: bigint = 0n;

  fileListCount: bigint = 0n;
  fileList: PackFileEntry[] = [];

  reserved: number = 0;

  static parseHeader(reader: BinaryBuffer): PackStreamVer1 {
    const stream = new PackStreamVer1();
    stream.reserved = reader.readUInt32LE();
    stream.compressedDataSize = reader.readBigInt64LE();
    stream.encodedDataSize = reader.readBigInt64LE();
    stream.headerSize = reader.readBigInt64LE();
    stream.compressedHeaderSize = reader.readBigInt64LE();
    stream.encodedHeaderSize = reader.readBigInt64LE();
    stream.fileListCount = reader.readBigInt64LE();
    stream.dataSize = reader.readBigInt64LE();
    return stream;
  }

  encode(pWriter: BinaryBuffer): void {
    pWriter.writeUInt32LE(this.reserved);
    pWriter.writeBigInt64LE(this.compressedDataSize);
    pWriter.writeBigInt64LE(this.encodedDataSize);
    pWriter.writeBigInt64LE(this.headerSize);
    pWriter.writeBigInt64LE(this.compressedHeaderSize);
    pWriter.writeBigInt64LE(this.encodedHeaderSize);
    pWriter.writeBigInt64LE(this.fileListCount);
    pWriter.writeBigInt64LE(this.dataSize);
  }

  initFileList(reader: BinaryBuffer): void {
    for (let i = 0n; i < this.fileListCount; i++) {
      const fileHeader = new PackFileHeaderVer1(reader);
      this.fileList[Number(fileHeader.fileIndex) - 1].fileHeader = fileHeader;
    }
  }
}
