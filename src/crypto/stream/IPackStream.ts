import { BinaryBuffer } from "../common/BinaryBuffer";
import { PackFileEntry } from "../common/PackFileEntry";
import { PackVersion } from "../common/PackVersion";
import { PackStreamVer1 } from "./PackStreamVer1";
import { PackStreamVer2 } from "./PackStreamVer2";
import { PackStreamVer3 } from "./PackStreamVer3";

export class IPackStream {
  version?: PackVersion;
  requiredBufferSpace?: number;
  compressedHeaderSize?: bigint;
  encodedHeaderSize?: bigint;
  headerSize?: bigint;
  compressedDataSize?: bigint;
  encodedDataSize?: bigint;
  dataSize?: bigint;
  fileListCount?: bigint;
  fileList: PackFileEntry[] = [];

  encode(pWriter: BinaryBuffer): void {
    // Encodes the header/data pack sizes to stream
  }

  initFileList(reader: BinaryBuffer): void {
    // Represents a list of file info containers (<Index>,<Hash>,<Name>)
  }

  /*
   * Creates a new packed stream based on the type of version.
   *
   * @param pHeader The stream to read the pack version from
   *
   * @return A packed stream with header sizes decoded
   *
   */
  static createStream(pHeader: BinaryBuffer) {
    const version = pHeader.readUInt32LE();
    switch (version) {
      case PackVersion.MS2F:
        return PackStreamVer1.parseHeader(pHeader);
      case PackVersion.NS2F:
        return PackStreamVer2.parseHeader(pHeader);
      case PackVersion.OS2F:
      case PackVersion.PS2F:
        return PackStreamVer3.parseHeader(pHeader, version);
      default:
        throw new Error(`Invalid PackVersion:${version}`);
    }
  }
}
