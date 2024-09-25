import { BinaryBuffer } from "./BinaryBuffer";
import { IMultiArray } from "./IMultiArray";

export class MultiArrayResource implements IMultiArray {
  private readonly fileBuffer: BinaryBuffer;

  arraySize: number;
  count: number;
  name: string;

  constructor(
    buffer: BinaryBuffer,
    count: number,
    name: string,
    arraySize: number
  ) {
    this.fileBuffer = buffer;
    this.count = count;
    this.arraySize = arraySize;
    this.name = name;
  }

  get(index: number): BinaryBuffer {
    return this.getResource()[index % this.count];
  }

  private getResource(): BinaryBuffer[] {
    const result: BinaryBuffer[] = [];

    for (let i = 0; i < this.count; i++) {
      const bytes = this.fileBuffer.slice(
        this.arraySize * i,
        this.arraySize * (i + 1)
      );
      if (bytes.length == this.arraySize) {
        result[i] = bytes;
      }
    }

    return result;
  }
}
