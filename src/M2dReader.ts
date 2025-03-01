import fs from "fs";

import { XMLParser } from "fast-xml-parser";

import { PackFileEntry } from "./crypto/common/PackFileEntry";
import { IPackStream } from "./crypto/stream/IPackStream";
import { CryptoManager } from "./crypto/CryptoManager";
import { BinaryBuffer } from "./crypto/common/BinaryBuffer";
import { PackVersion } from "./crypto/common/PackVersion";

export class M2dReader {
  fileDescriptor: number;
  filePath: string;
  packVersion: PackVersion;

  readonly files: PackFileEntry[];

  constructor(filePath: string) {
    this.filePath = filePath;
    const fileSize = fs.statSync(filePath).size;
    if (!filePath.endsWith(".m2d")) {
      throw new Error("ERROR: File is not a .m2d file.");
    }

    this.fileDescriptor = fs.openSync(filePath, "r+");

    const headerPath = filePath.replace(".m2d", ".m2h");
    const headerBuffer = BinaryBuffer.fromBuffer(fs.readFileSync(headerPath));
    const stream = IPackStream.createStream(headerBuffer);
    this.packVersion = stream.version;

    // get fileString as a string
    const stringBytes = CryptoManager.decryptFileString(stream, headerBuffer);
    const fileString = stringBytes.getBuffer().toString("utf8");
    stream.fileList.push(...PackFileEntry.createFileList(fileString));
    stream.fileList.sort((a, b) => a.compareTo(b));

    // Load the file allocation table and assign each file header to the entry within the list
    const fileTable = CryptoManager.decryptFileTable(stream, headerBuffer);

    stream.initFileList(fileTable);

    this.files = stream.fileList;
  }

  getEntry(fileName: string) {
    return this.files.find((file) => file.name.endsWith(fileName));
  }

  getXmlDocument(entry: PackFileEntry) {
    if (!entry.fileHeader) {
      throw new Error("ERROR: File header is null.");
    }

    if (!this.fileDescriptor) {
      return null;
    }

    const parser = new XMLParser();
    const data = CryptoManager.decryptData(
      entry.fileHeader,
      this.fileDescriptor
    ).getBuffer();
    return parser.parse(data);
  }

  getBytes(entry: PackFileEntry) {
    if (!entry.fileHeader) {
      throw new Error("ERROR: File header is null.");
    }

    if (!this.fileDescriptor) {
      return null;
    }

    return CryptoManager.decryptData(entry.fileHeader, this.fileDescriptor);
  }

  getString(entry: PackFileEntry) {
    if (!entry.fileHeader) {
      throw new Error("ERROR: File header is null.");
    }

    if (!this.fileDescriptor) {
      return null;
    }

    const data = CryptoManager.decryptData(entry.fileHeader, this.fileDescriptor).getBuffer();

    let decoder = new TextDecoder("utf-8");
    let text = decoder.decode(data);
    if (text.includes('encoding="euc-kr"')) {
      decoder = new TextDecoder("euc-kr");
      text = decoder.decode(data);
    }

    return text;
  }
}
