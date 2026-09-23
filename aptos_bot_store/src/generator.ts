import { MultiChainHDWallet } from '../../src/index.js';
import { AptosWalletStore } from './store.js';
import { GenerateWalletsOptions } from './types.js';

/**
 * Deriva de forma masiva billeteras Aptos y las inserta en la base de datos SQLite
 */
export async function generateAndStoreAptosWallets(options: GenerateWalletsOptions): Promise<{
  mnemonic: string;
  totalInserted: number;
  durationMs: number;
  dbPath: string;
}> {
  const dbPath = options.dbPath || 'aptos_wallets.db';
  const startIdx = options.start ?? 0;
  const count = options.count;

  const t0 = performance.now();

  // 1. Inicializar wallet HD (o usar mnemónico provisto)
  const wallet = new MultiChainHDWallet({
    mnemonic: options.mnemonic,
    wordCount: options.wordCount || 24,
    passphrase: options.passphrase,
  });

  // 2. Derivar masivamente con el SDK
  const derived = wallet.deriveBatch('APTOS', {
    start: startIdx,
    count: count,
  });

  // 3. Insertar en base de datos SQLite
  const store = new AptosWalletStore(dbPath);
  store.insertBatch(derived);

  const t1 = performance.now();

  return {
    mnemonic: wallet.mnemonic,
    totalInserted: count,
    durationMs: Math.round(t1 - t0),
    dbPath,
  };
}
