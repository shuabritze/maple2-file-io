export class Encryption {
  static Aes = 0xee000000n;
  static Zlib = 0x00000009n;
  static Xor = 0xff000000n;

  value: bigint;

  constructor(value: bigint | number) {
    if (typeof value === "number") {
      this.value = BigInt(value);
    } else {
      this.value = value;
    }
  }

  toString(): string {
    return this.value.toString(16);
  }

  hasFlag(flag: bigint): boolean {
    return (this.value & flag) === flag;
  }
}
