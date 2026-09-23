import { ed25519 } from '@noble/curves/ed25519.js';
import { blake2b } from '@noble/hashes/blake2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { derivePath } from '../core/slip10.js';
import { DerivedWallet } from '../core/types.js';

/**
 * Derives Sui wallet using official Move derivation standard:
 * Path: m/44'/784'/{index}'/0'/0'
 * Address: blake2b-256(0x00 || pubKey) -> 32-byte hex (0x...)
 */
export function deriveSuiWallet(seed: Uint8Array, index: number): DerivedWallet {
  const path = `m/44'/784'/${index}'/0'/0'`;
  const node = derivePath(path, seed);

  const pubKeyBytes = ed25519.getPublicKey(node.key);

  // Sui Ed25519 scheme flag is 0x00 prepended to the public key
  const authPayload = new Uint8Array(1 + pubKeyBytes.length);
  authPayload[0] = 0x00;
  authPayload.set(pubKeyBytes, 1);

  const addressHash = blake2b(authPayload, { dkLen: 32 });
  const address = '0x' + bytesToHex(addressHash);

  return {
    index,
    chain: 'SUI',
    path,
    address,
    publicKey: '0x' + bytesToHex(pubKeyBytes),
    privateKey: '0x' + bytesToHex(node.key),
  };
}
