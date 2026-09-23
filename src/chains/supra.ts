import { ed25519 } from '@noble/curves/ed25519.js';
import { sha3_256 } from '@noble/hashes/sha3.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { derivePath } from '../core/slip10.js';
import { DerivedWallet } from '../core/types.js';

/**
 * Derives Supra L1 wallet using official Move derivation standard:
 * Path: m/44'/637'/{index}'/0'/0'
 * Address: sha3_256(pubKey || 0x00) -> 32-byte hex (0x...)
 * Matching native SupraAccount(privateKeyBytes) in supra-l1-sdk.
 */
export function deriveSupraWallet(seed: Uint8Array, index: number): DerivedWallet {
  const path = `m/44'/637'/${index}'/0'/0'`;
  const node = derivePath(path, seed);

  const pubKeyBytes = ed25519.getPublicKey(node.key);

  // Single-Key Ed25519 scheme identifier is 0x00
  const authKeyPayload = new Uint8Array(pubKeyBytes.length + 1);
  authKeyPayload.set(pubKeyBytes, 0);
  authKeyPayload[pubKeyBytes.length] = 0x00;

  const addressHash = sha3_256(authKeyPayload);
  const address = '0x' + bytesToHex(addressHash);

  return {
    index,
    chain: 'SUPRA',
    path,
    address,
    publicKey: '0x' + bytesToHex(pubKeyBytes),
    privateKey: '0x' + bytesToHex(node.key),
  };
}
