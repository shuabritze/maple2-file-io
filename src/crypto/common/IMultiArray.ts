import { BinaryBuffer } from "./BinaryBuffer";

export interface IMultiArray {
  name: string;
  arraySize: number;
  count: number;
  get(index: number): BinaryBuffer;
}
