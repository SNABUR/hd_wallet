import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

export function generateMnemonic(wordCount: 12 | 24 = 12): string {
  const strength = wordCount === 24 ? 256 : 128;
  return bip39.generateMnemonic(wordlist, strength);
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic.trim(), wordlist);
}

export function mnemonicToSeed(mnemonic: string, passphrase = ''): Uint8Array {
  return bip39.mnemonicToSeedSync(mnemonic.trim(), passphrase);
}
