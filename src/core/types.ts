export type ChainType = 'ETH' | 'BTC' | 'SOL' | 'APTOS' | 'SUI';

export type BitcoinAddressFormat = 'segwit' | 'taproot' | 'legacy';

export interface DerivedWallet {
  index: number;
  chain: ChainType;
  path: string;
  address: string;
  publicKey: string;
  privateKey: string;
}

export interface BatchDeriveOptions {
  start?: number;
  count: number;
  btcFormat?: BitcoinAddressFormat;
}

export interface MultiChainWalletOptions {
  mnemonic?: string;
  passphrase?: string;
  wordCount?: 12 | 24;
}
