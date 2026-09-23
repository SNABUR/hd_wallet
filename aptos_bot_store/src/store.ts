import { DatabaseSync } from 'node:sqlite';
import { AptosStoredWallet, StoreStats, WalletStatus } from './types.js';

export class AptosWalletStore {
  private db: DatabaseSync;

  constructor(dbPath: string = 'aptos_wallets.db') {
    this.db = new DatabaseSync(dbPath);
    this.init();
  }

  private init(): void {
    // Modo WAL (Write-Ahead Logging) para máxima concurrencia y velocidad
    this.db.exec(`PRAGMA journal_mode = WAL;`);
    this.db.exec(`PRAGMA synchronous = NORMAL;`);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        idx INTEGER PRIMARY KEY,
        address TEXT NOT NULL UNIQUE,
        public_key TEXT NOT NULL,
        private_key TEXT NOT NULL,
        path TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'idle',
        tx_hash TEXT,
        error_message TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_wallets_status ON wallets(status);
      CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
    `);
  }

  /**
   * Inserta un lote de billeteras usando una transacción masiva atómica
   */
  public insertBatch(
    wallets: Array<{
      index: number;
      address: string;
      publicKey: string;
      privateKey: string;
      path: string;
    }>
  ): void {
    const now = Date.now();
    const insertStmt = this.db.prepare(`
      INSERT OR IGNORE INTO wallets (
        idx, address, public_key, private_key, path, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'idle', ?, ?)
    `);

    this.db.exec('BEGIN TRANSACTION;');
    try {
      for (const w of wallets) {
        insertStmt.run(w.index, w.address, w.publicKey, w.privateKey, w.path, now, now);
      }
      this.db.exec('COMMIT;');
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    }
  }

  /**
   * Obtiene la siguiente wallet disponible ('idle') y la marca atómicamente como 'busy'
   * Esto previene que dos bots o tareas tomen la misma billetera simultáneamente
   */
  public acquireNextWallet(): AptosStoredWallet | null {
    this.db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
      const selectStmt = this.db.prepare(`
        SELECT 
          idx as "index",
          address,
          public_key as "publicKey",
          private_key as "privateKey",
          path,
          status,
          tx_hash as "txHash",
          error_message as "errorMessage",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM wallets 
        WHERE status = 'idle' 
        ORDER BY idx ASC 
        LIMIT 1
      `);

      const wallet = selectStmt.get() as unknown as AptosStoredWallet | undefined;

      if (!wallet) {
        this.db.exec('COMMIT;');
        return null;
      }

      const updateStmt = this.db.prepare(`
        UPDATE wallets 
        SET status = 'busy', updated_at = ? 
        WHERE idx = ?
      `);
      updateStmt.run(Date.now(), wallet.index);

      this.db.exec('COMMIT;');
      return { ...wallet, status: 'busy' };
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    }
  }

  /**
   * Marca una wallet como 'completed' guardando opcionalmente el hash de la transacción
   */
  public markCompleted(index: number, txHash?: string): void {
    const stmt = this.db.prepare(`
      UPDATE wallets 
      SET status = 'completed', tx_hash = ?, error_message = NULL, updated_at = ? 
      WHERE idx = ?
    `);
    stmt.run(txHash || null, Date.now(), index);
  }

  /**
   * Marca una wallet con estado de error
   */
  public markError(index: number, errorMessage: string): void {
    const stmt = this.db.prepare(`
      UPDATE wallets 
      SET status = 'error', error_message = ?, updated_at = ? 
      WHERE idx = ?
    `);
    stmt.run(errorMessage, Date.now(), index);
  }

  /**
   * Libera una wallet volviéndola a colocar en estado 'idle'
   */
  public releaseWallet(index: number): void {
    const stmt = this.db.prepare(`
      UPDATE wallets 
      SET status = 'idle', updated_at = ? 
      WHERE idx = ?
    `);
    stmt.run(Date.now(), index);
  }

  /**
   * Obtiene una billetera por su índice
   */
  public getByIndex(index: number): AptosStoredWallet | null {
    const stmt = this.db.prepare(`
      SELECT 
        idx as "index",
        address,
        public_key as "publicKey",
        private_key as "privateKey",
        path,
        status,
        tx_hash as "txHash",
        error_message as "errorMessage",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM wallets 
      WHERE idx = ?
    `);
    const res = stmt.get(index) as unknown as AptosStoredWallet | undefined;
    return res || null;
  }

  /**
   * Obtiene estadísticas actuales de la base de datos
   */
  public getStats(): StoreStats {
    const totalRow = this.db.prepare(`SELECT COUNT(*) as count FROM wallets`).get() as { count: number };
    const idleRow = this.db.prepare(`SELECT COUNT(*) as count FROM wallets WHERE status = 'idle'`).get() as { count: number };
    const busyRow = this.db.prepare(`SELECT COUNT(*) as count FROM wallets WHERE status = 'busy'`).get() as { count: number };
    const completedRow = this.db.prepare(`SELECT COUNT(*) as count FROM wallets WHERE status = 'completed'`).get() as { count: number };
    const errorRow = this.db.prepare(`SELECT COUNT(*) as count FROM wallets WHERE status = 'error'`).get() as { count: number };

    return {
      total: Number(totalRow.count),
      idle: Number(idleRow.count),
      busy: Number(busyRow.count),
      completed: Number(completedRow.count),
      error: Number(errorRow.count),
    };
  }

  public close(): void {
    this.db.close();
  }
}
