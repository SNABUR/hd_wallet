import { generateAndStoreAptosWallets } from '../src/generator.js';
import { AptosWalletStore } from '../src/store.js';

// Parámetros configurables:
const TOTAL_WALLETS = 1000; // Puedes cambiar a 2000, 5000, 10000, etc.
const DB_FILE = 'aptos_wallets.db';

async function main() {
  console.log(`[🚀 Generador] Generando ${TOTAL_WALLETS} billeteras Aptos en SQLite (${DB_FILE})...`);

  // Opcional: Si tienes una frase en .env o fija, puedes pasar mnemonic: "palabra1 ..."
  const result = await generateAndStoreAptosWallets({
    count: TOTAL_WALLETS,
    wordCount: 24,
    dbPath: DB_FILE,
  });

  console.log(`[✅ Éxito] ${result.totalInserted} billeteras generadas e insertadas en ${result.durationMs} ms!`);
  console.log(`[🔑 Semilla Maestra BIP-39]:`);
  console.log(`   "${result.mnemonic}"`);
  console.log(`\n[⚠️ IMPORTANTE]: Guarda esta semilla en un lugar seguro. Con ella puedes recuperar todas las claves.`);

  // Ver estadísticas actuales
  const store = new AptosWalletStore(DB_FILE);
  const stats = store.getStats();
  console.log('\n[📊 Estado de la Base de Datos]:', stats);
  store.close();
}

main().catch(console.error);
