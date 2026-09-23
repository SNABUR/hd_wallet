import { hmac } from '@noble/hashes/hmac.js';
import { sha512 } from '@noble/hashes/sha2.js';

const ED25519_KEY = new TextEncoder().encode('ed25519 seed');
const HARDENED_OFFSET = 0x80000000;

export interface SLIP10Node {
  key: Uint8Array;
  chainCode: Uint8Array;
}

export function getMasterKeyFromSeed(seed: Uint8Array): SLIP10Node {
  const I = hmac(sha512, ED25519_KEY, seed);
  const IL = I.slice(0, 32);
  const IR = I.slice(32);
  return {
    key: IL,
    chainCode: IR,
  };
}

export function deriveChild(parent: SLIP10Node, index: number): SLIP10Node {
  if (index < HARDENED_OFFSET) {
    throw new Error('SLIP-0010 Ed25519 only supports hardened child derivation (index >= 0x80000000)');
  }

  const data = new Uint8Array(37);
  data[0] = 0x00;
  data.set(parent.key, 1);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  view.setUint32(33, index, false); // big endian

  const I = hmac(sha512, parent.chainCode, data);
  const IL = I.slice(0, 32);
  const IR = I.slice(32);

  return {
    key: IL,
    chainCode: IR,
  };
}

export function derivePath(path: string, seed: Uint8Array): SLIP10Node {
  const segments = path
    .split('/')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (segments[0] !== 'm') {
    throw new Error('Path must start with "m"');
  }

  let curr = getMasterKeyFromSeed(seed);

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    const isHardened = segment.endsWith("'") || segment.endsWith('h');
    const cleanSegment = isHardened ? segment.slice(0, -1) : segment;
    const indexNumber = parseInt(cleanSegment, 10);

    if (isNaN(indexNumber)) {
      throw new Error(`Invalid path segment: ${segment}`);
    }

    if (!isHardened) {
      throw new Error(`SLIP-0010 ed25519 requires hardened derivation for all segments: ${segment}`);
    }

    curr = deriveChild(curr, HARDENED_OFFSET + indexNumber);
  }

  return curr;
}
