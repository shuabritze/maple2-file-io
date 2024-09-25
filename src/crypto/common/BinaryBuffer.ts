export class BinaryBuffer {
  private buffer: Buffer;
  private offset: number;

  constructor(size: number) {
    this.buffer = Buffer.alloc(size);
    this.offset = 0;
  }

  static fromBuffer(buffer: Buffer, offset: number = 0): BinaryBuffer {
    const newBuffer = new BinaryBuffer(buffer.length);
    newBuffer.buffer = Buffer.from(buffer);
    newBuffer.offset = offset;
    return newBuffer;
  }

  // --- Read Methods ---

  readUInt8(): number {
    const value = this.buffer.readUInt8(this.offset);
    this.offset += 1;
    return value;
  }

  readUInt16LE(): number {
    const value = this.buffer.readUInt16LE(this.offset);
    this.offset += 2;
    return value;
  }

  readUInt16BE(): number {
    const value = this.buffer.readUInt16BE(this.offset);
    this.offset += 2;
    return value;
  }

  readUInt32LE(): number {
    const value = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  readUInt32BE(): number {
    const value = this.buffer.readUInt32BE(this.offset);
    this.offset += 4;
    return value;
  }

  readInt8(): number {
    const value = this.buffer.readInt8(this.offset);
    this.offset += 1;
    return value;
  }

  readInt16LE(): number {
    const value = this.buffer.readInt16LE(this.offset);
    this.offset += 2;
    return value;
  }

  readInt16BE(): number {
    const value = this.buffer.readInt16BE(this.offset);
    this.offset += 2;
    return value;
  }

  readInt32LE(): number {
    const value = this.buffer.readInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  readInt32BE(): number {
    const value = this.buffer.readInt32BE(this.offset);
    this.offset += 4;
    return value;
  }

  readFloatLE(): number {
    const value = this.buffer.readFloatLE(this.offset);
    this.offset += 4;
    return value;
  }

  readFloatBE(): number {
    const value = this.buffer.readFloatBE(this.offset);
    this.offset += 4;
    return value;
  }

  readDoubleLE(): number {
    const value = this.buffer.readDoubleLE(this.offset);
    this.offset += 8;
    return value;
  }

  readDoubleBE(): number {
    const value = this.buffer.readDoubleBE(this.offset);
    this.offset += 8;
    return value;
  }

  readBytes(length: number): Buffer {
    const value = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  readString(length: number, encoding: BufferEncoding = "utf8"): string {
    const value = this.buffer.toString(
      encoding,
      this.offset,
      this.offset + length
    );
    this.offset += length;
    return value;
  }

  readBigInt64LE(): bigint {
    const value = this.buffer.readBigInt64LE(this.offset);
    this.offset += 8;
    return value;
  }

  // --- Write Methods ---

  writeUInt8(value: number): void {
    this.buffer.writeUInt8(value, this.offset);
    this.offset += 1;
  }

  writeUInt16LE(value: number): void {
    this.buffer.writeUInt16LE(value, this.offset);
    this.offset += 2;
  }

  writeUInt16BE(value: number): void {
    this.buffer.writeUInt16BE(value, this.offset);
    this.offset += 2;
  }

  writeUInt32LE(value: number): void {
    this.buffer.writeUInt32LE(value, this.offset);
    this.offset += 4;
  }

  writeUInt32BE(value: number): void {
    this.buffer.writeUInt32BE(value, this.offset);
    this.offset += 4;
  }

  writeInt8(value: number): void {
    this.buffer.writeInt8(value, this.offset);
    this.offset += 1;
  }

  writeInt16LE(value: number): void {
    this.buffer.writeInt16LE(value, this.offset);
    this.offset += 2;
  }

  writeInt16BE(value: number): void {
    this.buffer.writeInt16BE(value, this.offset);
    this.offset += 2;
  }

  writeInt32LE(value: number): void {
    this.buffer.writeInt32LE(value, this.offset);
    this.offset += 4;
  }

  writeInt32BE(value: number): void {
    this.buffer.writeInt32BE(value, this.offset);
    this.offset += 4;
  }

  writeFloatLE(value: number): void {
    this.buffer.writeFloatLE(value, this.offset);
    this.offset += 4;
  }

  writeFloatBE(value: number): void {
    this.buffer.writeFloatBE(value, this.offset);
    this.offset += 4;
  }

  writeDoubleLE(value: number): void {
    this.buffer.writeDoubleLE(value, this.offset);
    this.offset += 8;
  }

  writeDoubleBE(value: number): void {
    this.buffer.writeDoubleBE(value, this.offset);
    this.offset += 8;
  }

  writeBytes(value: Buffer): void {
    value.copy(this.buffer, this.offset);
    this.offset += value.length;
  }

  writeString(value: string, encoding: BufferEncoding = "utf8"): void {
    const strBuffer = Buffer.from(value, encoding);
    this.writeBytes(strBuffer);
  }

  writeBigInt64LE(value: bigint): void {
    this.buffer.writeBigInt64LE(value, this.offset);
    this.offset += 8;
  }

  // --- Utility Methods ---

  slice(start: number, end: number): BinaryBuffer {
    return BinaryBuffer.fromBuffer(this.buffer.slice(start, end));
  }

  reset(): void {
    this.offset = 0;
  }

  getBuffer(): Buffer {
    return this.buffer;
  }

  getOffset(): number {
    return this.offset;
  }

  remainingLength(): number {
    return this.buffer.length - this.offset;
  }

  get length(): number {
    return this.buffer.length;
  }

  get(index: number): number {
    if (index < 0 || index >= this.buffer.length) {
      throw new RangeError("Index out of bounds");
    }
    return this.buffer[index];
  }

  // Setter for indexing
  set(index: number, value: number): void {
    if (index < 0 || index >= this.buffer.length) {
      throw new RangeError("Index out of bounds");
    }
    this.buffer[index] = value;
  }
}
