import { PackVersion } from "../common/PackVersion";

import MS2F_KEY_DATA from "./MS2F/Key";
import MS2F_IV_DATA from "./MS2F/IV";
import MS2F_XOR_DATA from "./MS2F/XOR";
import NS2F_KEY_DATA from "./NS2F/Key";
import NS2F_IV_DATA from "./NS2F/IV";
import NS2F_XOR_DATA from "./NS2F/XOR";
import OS2F_KEY_DATA from "./OS2F/Key";
import OS2F_IV_DATA from "./OS2F/IV";
import OS2F_XOR_DATA from "./OS2F/XOR";
import PS2F_KEY_DATA from "./PS2F/Key";
import PS2F_IV_DATA from "./PS2F/IV";
import PS2F_XOR_DATA from "./PS2F/XOR";
import { MultiArrayResource } from "../common/MultiArrayResource";
import { BinaryBuffer } from "../common/BinaryBuffer";
const BITS = 128;
const IV_LEN = 16;
const KEY_LEN = 32;
const XOR_LEN = 2048;

export class CipherKeys {
  static MS2F_KEY = new MultiArrayResource(
    BinaryBuffer.fromBuffer(MS2F_KEY_DATA),
    BITS,
    "MS2F_Key",
    KEY_LEN
  );
  static MS2F_IV = new MultiArrayResource(
    BinaryBuffer.fromBuffer(MS2F_IV_DATA),
    BITS,
    "MS2F_IV",
    IV_LEN
  );
  static MS2F_XOR = new MultiArrayResource(
    BinaryBuffer.fromBuffer(MS2F_XOR_DATA),
    BITS,
    "MS2F_XOR",
    XOR_LEN
  );
  static NS2F_KEY = new MultiArrayResource(
    BinaryBuffer.fromBuffer(NS2F_KEY_DATA),
    BITS,
    "NS2F_Key",
    KEY_LEN
  );
  static NS2F_IV = new MultiArrayResource(
    BinaryBuffer.fromBuffer(NS2F_IV_DATA),
    BITS,
    "NS2F_IV",
    IV_LEN
  );
  static NS2F_XOR = new MultiArrayResource(
    BinaryBuffer.fromBuffer(NS2F_XOR_DATA),
    BITS,
    "NS2F_XOR",
    XOR_LEN
  );
  static OS2F_KEY = new MultiArrayResource(
    BinaryBuffer.fromBuffer(OS2F_KEY_DATA),
    BITS,
    "OS2F_Key",
    KEY_LEN
  );
  static OS2F_IV = new MultiArrayResource(
    BinaryBuffer.fromBuffer(OS2F_IV_DATA),
    BITS,
    "OS2F_IV",
    IV_LEN
  );
  static OS2F_XOR = new MultiArrayResource(
    BinaryBuffer.fromBuffer(OS2F_XOR_DATA),
    BITS,
    "OS2F_XOR",
    XOR_LEN
  );
  static PS2F_KEY = new MultiArrayResource(
    BinaryBuffer.fromBuffer(PS2F_KEY_DATA),
    BITS,
    "PS2F_Key",
    KEY_LEN
  );
  static PS2F_IV = new MultiArrayResource(
    BinaryBuffer.fromBuffer(PS2F_IV_DATA),
    BITS,
    "PS2F_IV",
    IV_LEN
  );
  static PS2F_XOR = new MultiArrayResource(
    BinaryBuffer.fromBuffer(PS2F_XOR_DATA),
    BITS,
    "PS2F_XOR",
    XOR_LEN
  );
  static getKeyAndIV(
    version: PackVersion,
    keyOffset: bigint
  ): [BinaryBuffer, BinaryBuffer] {
    let key: MultiArrayResource;
    let iv: MultiArrayResource;

    switch (version) {
      case PackVersion.MS2F:
        key = this.MS2F_KEY;
        iv = this.MS2F_IV;
        break;
      case PackVersion.NS2F:
        key = this.NS2F_KEY;
        iv = this.NS2F_IV;
        break;
      case PackVersion.OS2F:
        key = this.OS2F_KEY;
        iv = this.OS2F_IV;
        break;
      case PackVersion.PS2F:
        key = this.PS2F_KEY;
        iv = this.PS2F_IV;
        break;
      default: {
        throw new Error(
          "ERROR generating Key/IV: the specified package version does not exist!"
        );
      }
    }
    const userKey = new BinaryBuffer(32);
    const ivChain = new BinaryBuffer(16);
    const offset = Number(keyOffset) & 0x7f;

    for (let i = 0; i < 32; i++) {
      userKey.set(i, key.get(offset).get(i));
      if (i < 16) {
        ivChain.set(i, iv.get(offset).get(i));
      }
    }
    return [userKey, ivChain];
  }

  static getXorKey(version: PackVersion): BinaryBuffer {
    switch (version) {
      case PackVersion.MS2F:
        return this.MS2F_XOR.get(0);
      case PackVersion.NS2F:
        return this.NS2F_XOR.get(0);
      case PackVersion.OS2F:
        return this.OS2F_XOR.get(0);
      case PackVersion.PS2F:
        return this.PS2F_XOR.get(0);
      default: {
        // Nexon always defaults to MS2F here.
        return this.MS2F_XOR.get(0);
      }
    }
  }
}
