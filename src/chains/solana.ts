import { ed25519 } from '@noble/curves/ed25519.js';
import { base58 } from '@scure/base';
import { bytesToHex } from '@noble/hashes/utils.js';
import { derivePath } from '../core/slip10.js';
import { DerivedWallet } from '../core/types.js';

/**
 * Derives Solana wallet using standard Phantom/Backpack derivation:
 * Path: m/44'/501'/{index}'/0'
 */
export function deriveSolanaWallet(seed: Uint8Array, index: number): DerivedWallet {
  const path = `m/44'/501'/${index}'/0'`;
  const node = derivePath(path, seed);

  // Derive Ed25519 public key from the 32-byte private seed
  const pubKeyBytes = ed25519.getPublicKey(node.key);
  const address = base58.encode(pubKeyBytes);

  // Solana 64-byte keypair (secretKey + publicKey) often exported in base58 or hex
  const fullKeypair = new Uint8Array(64);
  fullKeypair.set(node.key, 0);
  fullKeypair.set(pubKeyBytes, 32);

  return {
    index,
    chain: 'SOL',
    path,
    address,
    publicKey: address,
    privateKey: base58.encode(fullKeypair),
  };
}
