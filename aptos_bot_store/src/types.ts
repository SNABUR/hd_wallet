export type WalletStatus = 'idle' | 'busy' | 'completed' | 'error';

export interface AptosStoredWallet {
  index: number;
  address: string;
  publicKey: string;
  privateKey: string;
  path: string;
  status: WalletStatus;
  txHash?: string | null;
  errorMessage?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface StoreStats {
  total: number;
  idle: number;
  busy: number;
  completed: number;
  error: number;
}

export interface GenerateWalletsOptions {
  count: number;
  start?: number;
  mnemonic?: string;
  wordCount?: 12 | 24;
  passphrase?: string;
  dbPath?: string;
}
