import zlib from "zlib";
import crypto from "crypto";

import { Encryption } from "./common/Encryption";
import { PackVersion } from "./common/PackVersion";
import { CipherKeys } from "./keys/CipherKey";
import { IPackStream } from "./stream/IPackStream";
import { IPackFileHeader } from "./stream/IPackFileHeader";
import { BinaryBuffer } from "./common/BinaryBuffer";
import { AESCipher } from "./AESCipher";

export class CryptoManager {
  static decryptFileString(stream: IPackStream, buffer: BinaryBuffer) {
    if (!stream.compressedHeaderSize || !stream.encodedHeaderSize) {
      throw new Error(
        "ERROR decrypting file list: the size of the list is invalid."
      );
    }

    const src = BinaryBuffer.fromBuffer(
      buffer.readBytes(Number(stream.encodedHeaderSize))
    );
    return this.decrypt(
      stream.version ?? PackVersion.MS2F,
      stream.encodedHeaderSize ?? 0n,
      stream.compressedHeaderSize ?? 0n,
      new Encryption(Encryption.Aes | Encryption.Zlib),
      src
    );
  }

  static decryptFileTable(stream: IPackStream, buffer: BinaryBuffer) {
    if (
      !stream.compressedDataSize ||
      !stream.encodedDataSize ||
      !stream.dataSize
    ) {
      throw new Error(
        "ERROR decrypting file table: the size of the table is invalid."
      );
    }

    const src = BinaryBuffer.fromBuffer(
      buffer.readBytes(Number(stream.encodedDataSize))
    );
    return this.decrypt(
      stream.version ?? PackVersion.MS2F,
      stream.encodedDataSize ?? 0n,
      stream.compressedDataSize ?? 0n,
      new Encryption(Encryption.Aes | Encryption.Zlib),
      src
    );
  }

  static decryptData(pHeader: IPackFileHeader, data: BinaryBuffer) {
    if (
      !pHeader.compressedFileSize ||
      !pHeader.encodedFileSize ||
      !pHeader.fileSize
    ) {
      throw new Error(
        "ERROR decrypting data file segment: the size of the block is invalid."
      );
    }

    const start = Number(pHeader.offset ?? 0n);

    const src = data.slice(start, start + Number(pHeader.encodedFileSize));

    return this.decrypt(
      pHeader.version ?? PackVersion.MS2F,
      BigInt(pHeader.encodedFileSize ?? 0),
      pHeader.compressedFileSize ?? 0n,
      pHeader.bufferFlag ?? new Encryption(0),
      src
    );
  }

  static decrypt(
    version: PackVersion,
    size: bigint,
    sizeCompressed: bigint,
    flag: Encryption,
    src: BinaryBuffer
  ): BinaryBuffer {
    if (flag.hasFlag(Encryption.Aes)) {
      // Get the AES Key/IV for transformation
      const [key, iv] = CipherKeys.getKeyAndIV(version, sizeCompressed);
      // Decode the base64 encoded string
      const srcString = src.getBuffer().toString("utf8");
      src = BinaryBuffer.fromBuffer(Buffer.from(srcString, "base64"));

      const cipher = new AESCipher(key.getBuffer(), iv.getBuffer());
      cipher.transformBlock(src, 0, Number(size), src, 0);
    } else if (flag.hasFlag(Encryption.Xor)) {
      src = this.encryptXor(version, src, size, sizeCompressed);
    }

    if (flag.hasFlag(Encryption.Zlib)) {
      return BinaryBuffer.fromBuffer(zlib.unzipSync(src.getBuffer()));
    }

    return src;
  }

  static encrypt(
    version: PackVersion,
    src: BinaryBuffer,
    flag: Encryption
  ): [bigint, bigint, number] {
    let encrypted: BinaryBuffer;
    if (flag.hasFlag(Encryption.Zlib)) {
      encrypted = BinaryBuffer.fromBuffer(zlib.gzipSync(src.getBuffer()));
    } else {
      encrypted = BinaryBuffer.fromBuffer(Buffer.from(src.getBuffer()));
    }

    let size = BigInt(src.length);
    let sizeCompressed = BigInt(encrypted.length);

    if (flag.hasFlag(Encryption.Aes)) {
      // Get the AES Key/IV for transformation
      const [key, iv] = CipherKeys.getKeyAndIV(version, sizeCompressed);
      const cipher = crypto.createCipheriv(
        "aes-256-ctr",
        key.getBuffer(),
        iv.getBuffer()
      );
      cipher.setAutoPadding(false);

      encrypted = BinaryBuffer.fromBuffer(
        Buffer.from(cipher.update(encrypted.getBuffer()))
      );

      // Encode the encrypted data into a base64 encoded string
      encrypted = BinaryBuffer.fromBuffer(
        Buffer.from(Buffer.from(encrypted.getBuffer()).toString("base64"))
      );
    } else if (flag.hasFlag(Encryption.Xor)) {
      // Perform XOR block encryption
      encrypted = this.encryptXor(version, encrypted, size, sizeCompressed);
    }

    return [size, sizeCompressed, encrypted.length];
  }

  static encryptXor(
    version: PackVersion,
    src: BinaryBuffer,
    size: bigint,
    sizeCompressed: bigint
  ): BinaryBuffer {
    const xorKey = CipherKeys.getXorKey(version);

    let uBlock = size >> 2n;
    let uBlockOffset = 0n;
    let nKeyOffset = 0n;

    if (uBlock !== 0n) {
      while (uBlockOffset < uBlock) {
        const pBlockData =
          src.getBuffer().readBigUInt64LE(4 * Number(uBlockOffset)) ^
          src.getBuffer().readBigUInt64LE(4 * (Number(uBlockOffset) + 1));
        src.getBuffer().writeBigUInt64LE(pBlockData, 4 * Number(uBlockOffset));

        nKeyOffset = (nKeyOffset + 1n) & 0x1ffn;
        uBlockOffset++;
      }
    }

    uBlock = size & 3n;
    if (uBlock !== 0n) {
      let nStart = 4 * Number(uBlockOffset);

      uBlockOffset = 0n;
      nKeyOffset = 0n;

      while (uBlockOffset < uBlock) {
        src
          .getBuffer()
          .writeUInt32LE(
            src.getBuffer().readUInt32LE(nStart + Number(uBlockOffset)) ^
              xorKey.getBuffer().readUInt32LE(Number(nKeyOffset)),
            nStart + Number(uBlockOffset)
          );

        nKeyOffset = (nKeyOffset + 1n) & 0x7ffn;
      }
    }

    return src;
  }
}
