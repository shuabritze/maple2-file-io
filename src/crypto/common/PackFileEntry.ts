import { IPackFileHeader } from "../stream/IPackFileHeader";
import { BinaryBuffer } from "./BinaryBuffer";

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

  createCopy(data: BinaryBuffer): PackFileEntry {
    return new PackFileEntry(
      this.index,
      this.hash,
      this.name,
      this.treeName,
      null,
      data ?? this.data,
      true
    );
  }

  compareTo(entry: PackFileEntry): number {
    if (this.index == entry.index) return 0;
    if (this.index > entry.index) return 1;
    return -1;
  }

  toString(): string {
    return this.hash
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
