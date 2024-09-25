import crypto from "crypto";
import { BinaryBuffer } from "./common/BinaryBuffer";
export class AESCipher {
  iv: Buffer;
  blockSize: number;
  algorithm: string;
  encryptor: Buffer;
  constructor(userKey: Buffer, iv: Buffer) {
    if (![16, 24, 32].includes(userKey.length)) {
      throw new Error(
        "User key must be 16, 24, or 32 bytes for AES-128, AES-192, or AES-256"
      );
    }
    if (iv.length !== 16) {
      throw new Error("IV must be 16 bytes");
    }

    this.iv = Buffer.from(iv);
    this.blockSize = 16; // AES block size in bytes
    this.algorithm = "aes-256-ecb"; // Adjust this based on userKey length
    this.encryptor = userKey;
  }

  transformBlock(
    src: BinaryBuffer,
    offset: number,
    size: number,
    dst: BinaryBuffer,
    initialOffset: number
  ) {
    for (let i = 0; i < size; i += this.blockSize) {
      const xorBlock = this.encrypt(this.iv);
      this.incrementCounter();

      for (let j = 0; j < xorBlock.length; j++) {
        if (i + j >= dst.length) {
          break;
        }

        dst.getBuffer()[initialOffset + i + j] =
          src.getBuffer()[offset + i + j] ^ xorBlock[j];
      }
    }

    return size;
  }

  encrypt(input: Buffer) {
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptor, null);
    cipher.setAutoPadding(false);

    const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
    return encrypted.slice(0, this.blockSize); // Return only the block size
  }

  incrementCounter() {
    for (let i = this.iv.length - 1; i >= 0; i--) {
      ++this.iv[i];
      if (this.iv[i] !== 0) {
        break;
      }
    }
  }
}
