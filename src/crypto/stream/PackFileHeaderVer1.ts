import { BinaryBuffer } from "../common/BinaryBuffer";
import { Encryption } from "../common/Encryption";
import { PackVersion } from "../common/PackVersion";
import { CryptoManager } from "../CryptoManager";
import { IPackFileHeader } from "./IPackFileHeader";

export class PackFileHeaderVer1 implements IPackFileHeader {
  version: PackVersion = PackVersion.MS2F;

  bufferFlag?: Encryption;
  fileIndex?: number;
  offset?: bigint;
  encodedFileSize?: number;
  compressedFileSize?: bigint;
  fileSize?: bigint;

  packingDef: number;
  reserved: number[] = [];

  constructor(reader?: BinaryBuffer) {
    if (!reader) {
      this.packingDef = 0;
      this.reserved[0] = 0;
      this.reserved[1] = 0;
      return;
    }

    this.packingDef = reader.readUInt32LE();
    this.fileIndex = reader.readInt32LE();
    this.bufferFlag = new Encryption(reader.readUInt32LE());
    this.reserved[0] = reader.readInt32LE();
    this.offset = reader.readBigInt64LE();
    this.encodedFileSize = reader.readUInt32LE();
    this.reserved[1] = reader.readInt32LE();
    this.compressedFileSize = reader.readBigInt64LE();
    this.fileSize = reader.readBigInt64LE();
  }

  static createHeader(
    index: number,
    dwFlag: Encryption,
    offset: bigint,
    data: BinaryBuffer
  ): PackFileHeaderVer1 {
    const [_, size, compressedSize, encodedSize] = CryptoManager.encrypt(
      PackVersion.MS2F,
      data,
      dwFlag
    );

    const header = new PackFileHeaderVer1();
    header.fileIndex = index;
    header.bufferFlag = dwFlag;
    header.offset = offset;
    header.encodedFileSize = encodedSize;
    header.compressedFileSize = BigInt(compressedSize);
    header.fileSize = BigInt(size);

    return header;
  }

  encode(writer: BinaryBuffer): void {
    writer.writeUInt32LE(this.packingDef);
    writer.writeUInt32LE(this.fileIndex ?? 0);
    writer.writeUInt32LE(Number(this.bufferFlag?.value ?? 0));
    writer.writeInt32LE(this.reserved[0]);
    writer.writeBigInt64LE(this.offset ?? 0n);
    writer.writeUInt32LE(this.encodedFileSize ?? 0);
    writer.writeInt32LE(this.reserved[1]);
    writer.writeBigInt64LE(this.compressedFileSize ?? 0n);
    writer.writeBigInt64LE(this.fileSize ?? 0n);
  }
}
