import fs from 'node:fs/promises';
import path from 'node:path';
import { MultiChainHDWallet, ChainType } from '../src/index.js';

interface SeedClusterSummary {
  clusterId: number;
  mnemonic: string;
  totalWallets: number;
  sampleAddresses: {
    eth0: string;
    sol0: string;
  };
}

async function runBotWalletClusterGeneration() {
  const TOTAL_SEEDS = 10;
  const WALLETS_PER_SEED = 1000;
  const TARGET_CHAINS: ChainType[] = ['ETH', 'SOL'];

  const outputDir = path.resolve('./wallets_vault');
  await fs.mkdir(outputDir, { recursive: true });

  const manifest: SeedClusterSummary[] = [];
  const tStart = performance.now();

  console.log(`[Bot] Iniciando generación de ${TOTAL_SEEDS} semillas x ${WALLETS_PER_SEED} wallets...`);

  for (let i = 1; i <= TOTAL_SEEDS; i++) {
    const t0 = performance.now();
    // 1. Instanciar nueva semilla segura de 24 palabras (256 bits de entropía)
    const wallet = new MultiChainHDWallet({ wordCount: 24 });

    // 2. Derivar lotes de wallets masivas
    for (const chain of TARGET_CHAINS) {
      const derivedBatch = wallet.deriveBatch(chain, {
        start: 0,
        count: WALLETS_PER_SEED,
      });

      // 3. Exportar a CSV
      const csvData = wallet.toCSV(derivedBatch);
      const csvPath = path.join(outputDir, `seed_${i}_${chain}_1000.csv`);
      await fs.writeFile(csvPath, csvData, 'utf-8');
    }

    manifest.push({
      clusterId: i,
      mnemonic: wallet.mnemonic,
      totalWallets: WALLETS_PER_SEED * TARGET_CHAINS.length,
      sampleAddresses: {
        eth0: wallet.derive('ETH', 0).address,
        sol0: wallet.derive('SOL', 0).address,
      },
    });

    const t1 = performance.now();
    console.log(`[Bot] Semilla #${i} completada en ${(t1 - t0).toFixed(0)} ms.`);
  }

  // 4. Guardar manifiesto de semillas maestras
  await fs.writeFile(
    path.join(outputDir, 'master_seeds_manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  const tEnd = performance.now();
  console.log(`[Bot] Generación masiva finalizada con éxito en ${((tEnd - tStart) / 1000).toFixed(2)}s.`);
  console.log(`[Bot] Revisa la carpeta: ${outputDir}`);
}

runBotWalletClusterGeneration().catch((err) => {
  console.error('[Bot Error]', err);
});
