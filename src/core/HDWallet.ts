import { generateMnemonic, validateMnemonic, mnemonicToSeed } from './mnemonic.js';
import { deriveEVMWallet } from '../chains/evm.js';
import { deriveBTCWallet } from '../chains/btc.js';
import { deriveSolanaWallet } from '../chains/solana.js';
import { deriveAptosWallet } from '../chains/aptos.js';
import { deriveSuiWallet } from '../chains/sui.js';
import { deriveSupraWallet } from '../chains/supra.js';
import { walletsToCSV, walletsToJSON } from '../exporters/export.js';
import {
  BatchDeriveOptions,
  ChainType,
  DerivedWallet,
  MultiChainWalletOptions,
} from './types.js';

export class MultiChainHDWallet {
  public readonly mnemonic: string;
  public readonly seed: Uint8Array;

  constructor(options: MultiChainWalletOptions = {}) {
    if (options.mnemonic) {
      if (!validateMnemonic(options.mnemonic)) {
        throw new Error('Invalid BIP-39 mnemonic phrase provided');
      }
      this.mnemonic = options.mnemonic.trim();
    } else {
      this.mnemonic = generateMnemonic(options.wordCount || 12);
    }

    this.seed = mnemonicToSeed(this.mnemonic, options.passphrase || '');
  }

  /**
   * Derive a single wallet for a specific chain at an index
   */
  public derive(chain: ChainType, index = 0, btcFormat?: 'segwit' | 'taproot' | 'legacy'): DerivedWallet {
    switch (chain) {
      case 'ETH':
        return deriveEVMWallet(this.seed, index);
      case 'BTC':
        return deriveBTCWallet(this.seed, index, btcFormat);
      case 'SOL':
        return deriveSolanaWallet(this.seed, index);
      case 'APTOS':
        return deriveAptosWallet(this.seed, index);
      case 'SUI':
        return deriveSuiWallet(this.seed, index);
      case 'SUPRA':
        return deriveSupraWallet(this.seed, index);
      default:
        throw new Error(`Unsupported blockchain: ${chain}`);
    }
  }

  /**
   * Derive a batch of wallets sequentially (e.g., from 0 to 1,000)
   */
  public deriveBatch(chain: ChainType, options: BatchDeriveOptions): DerivedWallet[] {
    const start = options.start ?? 0;
    const count = options.count;
    const wallets: DerivedWallet[] = new Array(count);

    for (let i = 0; i < count; i++) {
      const idx = start + i;
      wallets[i] = this.derive(chain, idx, options.btcFormat);
    }

    return wallets;
  }

  /**
   * Export an array of wallets to CSV format
   */
  public toCSV(wallets: DerivedWallet[]): string {
    return walletsToCSV(wallets);
  }

  /**
   * Export an array of wallets to JSON string
   */
  public toJSON(wallets: DerivedWallet[], pretty = true): string {
    return walletsToJSON(wallets, pretty);
  }
}
