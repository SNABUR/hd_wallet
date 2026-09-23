import { HDKey } from '@scure/bip32';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { bech32, bech32m, base58check } from '@scure/base';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { BitcoinAddressFormat, DerivedWallet } from '../core/types.js';

function hash160(data: Uint8Array): Uint8Array {
  return ripemd160(sha256(data));
}

/**
 * Encodes SegWit v0 address (Native SegWit bech32, bc1q...)
 */
export function pubKeyToSegWitAddress(compressedPubKey: Uint8Array, hrp = 'bc'): string {
  const pkh = hash160(compressedPubKey);
  const words = [0, ...bech32.toWords(pkh)];
  return bech32.encode(hrp, words);
}

/**
 * Encodes Taproot v1 address (BIP-341/BIP-350 bech32m, bc1p...)
 */
export function pubKeyToTaprootAddress(compressedPubKey: Uint8Array, hrp = 'bc'): string {
  // Extract x-only pubkey (32 bytes)
  const point = secp256k1.Point.fromBytes(compressedPubKey);
  const xOnly = point.toBytes(true).slice(1); // omit parity prefix
  const words = [1, ...bech32m.toWords(xOnly)];
  return bech32m.encode(hrp, words);
}

/**
 * Encodes Legacy P2PKH address (Base58Check, 1...)
 */
export function pubKeyToLegacyAddress(compressedPubKey: Uint8Array, versionByte = 0x00): string {
  const pkh = hash160(compressedPubKey);
  const b58check = base58check(sha256);
  const payload = new Uint8Array(21);
  payload[0] = versionByte;
  payload.set(pkh, 1);
  return b58check.encode(payload);
}

/**
 * Derives Bitcoin wallet based on format:
 * - 'segwit' (BIP-84): m/84'/0'/0'/0/{index}
 * - 'taproot' (BIP-86): m/86'/0'/0'/0/{index}
 * - 'legacy' (BIP-44): m/44'/0'/0'/0/{index}
 */
export function deriveBTCWallet(
  seed: Uint8Array,
  index: number,
  format: BitcoinAddressFormat = 'segwit'
): DerivedWallet {
  const master = HDKey.fromMasterSeed(seed);

  let path: string;
  if (format === 'segwit') {
    path = `m/84'/0'/0'/0/${index}`;
  } else if (format === 'taproot') {
    path = `m/86'/0'/0'/0/${index}`;
  } else {
    path = `m/44'/0'/0'/0/${index}`;
  }

  const child = master.derive(path);

  if (!child.privateKey || !child.publicKey) {
    throw new Error(`Failed to derive BTC key at ${path}`);
  }

  let address: string;
  if (format === 'segwit') {
    address = pubKeyToSegWitAddress(child.publicKey);
  } else if (format === 'taproot') {
    address = pubKeyToTaprootAddress(child.publicKey);
  } else {
    address = pubKeyToLegacyAddress(child.publicKey);
  }

  return {
    index,
    chain: 'BTC',
    path,
    address,
    publicKey: bytesToHex(child.publicKey),
    privateKey: bytesToHex(child.privateKey),
  };
}
