import { BinaryBuffer } from "../common/BinaryBuffer";
import { Encryption } from "../common/Encryption";
import { PackVersion } from "../common/PackVersion";
import { CryptoManager } from "../CryptoManager";
import { IPackFileHeader } from "./IPackFileHeader";

export class PackFileHeaderVer2 implements IPackFileHeader {
  version: PackVersion = PackVersion.NS2F;
  bufferFlag?: Encryption;
  fileIndex?: number;
  offset?: bigint;
  encodedFileSize?: number;
  compressedFileSize?: bigint;
  fileSize?: bigint;

  constructor(reader?: BinaryBuffer) {
    if (!reader) {
      return;
    }

    this.bufferFlag = new Encryption(reader.readUInt32LE());
    this.fileIndex = reader.readInt32LE();
    this.encodedFileSize = reader.readUInt32LE();
    this.compressedFileSize = reader.readBigInt64LE();
    this.fileSize = reader.readBigInt64LE();
    this.offset = reader.readBigInt64LE();
  }

  static createHeader(
    index: number,
    dwFlag: Encryption,
    offset: bigint,
    data: BinaryBuffer
  ): PackFileHeaderVer2 {
    const [_, size, compressedSize, encodedSize] = CryptoManager.encrypt(
      PackVersion.NS2F,
      data,
      dwFlag
    );

    const header = new PackFileHeaderVer2();
    header.bufferFlag = dwFlag;
    header.fileIndex = index;
    header.encodedFileSize = encodedSize;
    header.compressedFileSize = BigInt(compressedSize) ?? 0n;
    header.fileSize = BigInt(size) ?? 0n;
    header.offset = offset ?? 0n;
    return header;
  }

  encode(writer: BinaryBuffer): void {
    writer.writeUInt32LE(Number(this.bufferFlag?.value ?? 0));
    writer.writeInt32LE(this.fileIndex ?? 0);
    writer.writeUInt32LE(this.encodedFileSize ?? 0);
    writer.writeBigInt64LE(this.compressedFileSize ?? 0n);
    writer.writeBigInt64LE(this.fileSize ?? 0n);
    writer.writeBigInt64LE(this.offset ?? 0n);
  }
}
