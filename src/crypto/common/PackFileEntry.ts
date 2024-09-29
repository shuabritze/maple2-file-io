import { IPackFileHeader } from "../stream/IPackFileHeader";
import { PackFileHeaderVer1 } from "../stream/PackFileHeaderVer1";
import { PackFileHeaderVer2 } from "../stream/PackFileHeaderVer2";
import { PackFileHeaderVer3 } from "../stream/PackFileHeaderVer3";
import { BinaryBuffer } from "./BinaryBuffer";
import { PackVersion } from "./PackVersion";

export class PackFileEntry {
  index: number;
  hash: string;
  name: string;
  treeName: string;
  fileHeader: IPackFileHeader | null;
  data: BinaryBuffer | null;
  changed: boolean;

  constructor(
    index: number,
    hash: string,
    name: string,
    treeName: string,
    fileHeader: IPackFileHeader | null,
    data: BinaryBuffer | null,
    changed: boolean
  ) {
    this.index = index;
    this.hash = hash;
    this.name = name;
    this.treeName = treeName;
    this.fileHeader = fileHeader;
    this.data = data;
    this.changed = changed;
  }

  createCopy(data?: BinaryBuffer): PackFileEntry {
    let header: IPackFileHeader;
    switch (this.fileHeader?.version) {
      case PackVersion.NS2F:
        header = new PackFileHeaderVer2();
        header.bufferFlag = this.fileHeader?.bufferFlag;
        header.fileIndex = this.fileHeader?.fileIndex;
        header.encodedFileSize = this.fileHeader?.encodedFileSize;
        header.compressedFileSize = this.fileHeader?.compressedFileSize;
        header.fileSize = this.fileHeader?.fileSize;
        header.offset = this.fileHeader?.offset;
        break;
      case PackVersion.OS2F:
      case PackVersion.PS2F:
        header = new PackFileHeaderVer3(this.fileHeader?.version);
        header.bufferFlag = this.fileHeader?.bufferFlag;
        header.fileIndex = this.fileHeader?.fileIndex;
        header.encodedFileSize = this.fileHeader?.encodedFileSize;
        (header as PackFileHeaderVer3).reserved[0] = 0;
        header.compressedFileSize = this.fileHeader?.compressedFileSize;
        header.fileSize = this.fileHeader?.fileSize;
        header.offset = this.fileHeader?.offset;
        break;
      case PackVersion.MS2F:
      default:
        header = new PackFileHeaderVer1();
        (header as PackFileHeaderVer1).packingDef = 0;
        (header as PackFileHeaderVer1).reserved = [0, 0];
        header.fileIndex = this.fileHeader?.fileIndex;
        header.bufferFlag = this.fileHeader?.bufferFlag;
        header.offset = this.fileHeader?.offset;
        header.encodedFileSize = this.fileHeader?.encodedFileSize;
        header.compressedFileSize = this.fileHeader?.compressedFileSize;
        header.fileSize = this.fileHeader?.fileSize;
        break
    }

    return new PackFileEntry(
      this.index,
      this.hash,
      this.name,
      this.treeName,
      header,
      data ?? this.data,
      this.changed
    );
  }

  compareTo(entry: PackFileEntry): number {
    if (this.index == entry.index) return 0;
    if (this.index > entry.index) return 1;
    return -1;
  }

  toString(): string {
    return !this.hash
      ? `${this.index},${this.name}\r\n`
      : `${this.index},${this.hash},${this.name}\r\n`;
  }

  static createFileList(fileString: string): PackFileEntry[] {
    const fileList: PackFileEntry[] = [];

    const entries = fileString.split("\r\n").filter((e) => e);
    for (const entry of entries) {
      let properties = 0;
      for (const c of entry) {
        if (c == ",") ++properties;
      }

      let index: string, name: string;
      switch (properties) {
        case 1:
          index = entry.split(",")[0];
          name = entry.split(",")[1];

          fileList.push(
            new PackFileEntry(parseInt(index), "", name, "", null, null, false)
          );
          break;
        case 2:
          index = entry.split(",")[0];
          name = entry.split(",")[2];

          fileList.push(
            new PackFileEntry(
              parseInt(index),
              entry.split(",")[1],
              name,
              "",
              null,
              null,
              false
            )
          );
          break;
      }
    }
    return fileList;
  }
}
