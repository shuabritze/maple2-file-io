import { BinaryBuffer } from "../common/BinaryBuffer";
import { Encryption } from "../common/Encryption";
import { PackVersion } from "../common/PackVersion";

export interface IPackFileHeader {
  // Represents the format of the packed stream (MS2F/NS2F/etc)
  version?: PackVersion;

  // The flag that determines buffer manipulation
  bufferFlag?: Encryption;

  // The index of this file located within the lookup table
  fileIndex?: number;

  // The start offset of this file's data within the m2d file
  offset?: bigint;

  // The total (base64) encoded size of the file
  encodedFileSize?: number;
  // The total compressed size of the (raw) file
  compressedFileSize?: bigint;
  // The total size of the raw (decoded, decompressed) file
  fileSize?: bigint;

  encode(writer: BinaryBuffer): void;
}
