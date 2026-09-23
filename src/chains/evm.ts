import { HDKey } from '@scure/bip32';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { DerivedWallet } from '../core/types.js';

/**
 * Standard EIP-55 Checksum formatting for Ethereum addresses
 */
export function toChecksumAddress(address: string): string {
  const clean = address.toLowerCase().replace('0x', '');
  const hash = bytesToHex(keccak_256(new TextEncoder().encode(clean)));
  let ret = '0x';

  for (let i = 0; i < clean.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += clean[i].toUpperCase();
    } else {
      ret += clean[i];
    }
  }

  return ret;
}

/**
 * Derives EVM address from uncompressed public key (65 bytes with 0x04 prefix, or 64 bytes)
 */
export function pubKeyToEVMAddress(pubKeyBytes: Uint8Array): string {
  // If compressed (33 bytes), decompress to 65 bytes
  const point = secp256k1.Point.fromBytes(pubKeyBytes);
  const uncompressed = point.toBytes(false); // 65 bytes with 0x04 prefix
  const raw64 = uncompressed.slice(1); // omit 0x04
  const hash = keccak_256(raw64);
  const address20 = hash.slice(-20);
  return toChecksumAddress(bytesToHex(address20));
}

/**
 * Derives EVM wallet at index using standard BIP-44: m/44'/60'/0'/0/{index}
 */
export function deriveEVMWallet(seed: Uint8Array, index: number): DerivedWallet {
  const master = HDKey.fromMasterSeed(seed);
  const path = `m/44'/60'/0'/0/${index}`;
  const child = master.derive(path);

  if (!child.privateKey || !child.publicKey) {
    throw new Error(`Failed to derive EVM key at ${path}`);
  }

  const address = pubKeyToEVMAddress(child.publicKey);
  const privateKey = '0x' + bytesToHex(child.privateKey);
  const publicKey = '0x' + bytesToHex(child.publicKey);

  return {
    index,
    chain: 'ETH',
    path,
    address,
    publicKey,
    privateKey,
  };
}
