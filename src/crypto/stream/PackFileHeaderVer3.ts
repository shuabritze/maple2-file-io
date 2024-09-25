import { BinaryBuffer } from "../common/BinaryBuffer";
import { Encryption } from "../common/Encryption";
import { PackVersion } from "../common/PackVersion";
import { CryptoManager } from "../CryptoManager";
import { IPackFileHeader } from "./IPackFileHeader";

export class PackFileHeaderVer3 implements IPackFileHeader {
  // OS2F/PS2F
  version: PackVersion;

  bufferFlag?: Encryption;
  fileIndex?: number;
  offset?: bigint;
  encodedFileSize?: number;
  compressedFileSize?: bigint;
  fileSize?: bigint;

  reserved: number[] = [];

  constructor(version: PackVersion, reader?: BinaryBuffer) {
    this.version = version;
    if (!reader) {
      this.reserved[0] = 0;
      return;
    }

    this.bufferFlag = new Encryption(reader.readUInt32LE());
    this.fileIndex = reader.readInt32LE();
    this.encodedFileSize = reader.readUInt32LE();
    this.reserved[1] = reader.readInt32LE();
    this.compressedFileSize = reader.readBigInt64LE();
    this.fileSize = reader.readBigInt64LE();
    this.offset = reader.readBigInt64LE();
  }

  static createHeader(
    version: PackVersion,
    index: number,
    dwFlag: Encryption,
    offset: bigint,
    data: BinaryBuffer
  ): PackFileHeaderVer3 {
    const [_, size, compressedSize, encodedSize] = CryptoManager.encrypt(
      version,
      data,
      dwFlag
    );

    const header = new PackFileHeaderVer3(version);
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
    writer.writeInt32LE(this.reserved[0] ?? 0);
    writer.writeBigInt64LE(this.compressedFileSize ?? 0n);
    writer.writeBigInt64LE(this.fileSize ?? 0n);
    writer.writeBigInt64LE(this.offset ?? 0n);
  }
}
