import { AptosWalletStore } from '../src/store.js';

/**
 * Ejemplo de cómo tu bot consume las wallets sin colisiones
 */
async function botWorker(workerId: string) {
  const store = new AptosWalletStore('aptos_wallets.db');

  console.log(`[Bot ${workerId}] Buscando una wallet disponible...`);

  // 1. Obtener la siguiente wallet libre de forma atómica (se marca 'busy' automáticamente)
  const wallet = store.acquireNextWallet();

  if (!wallet) {
    console.log(`[Bot ${workerId}] No hay wallets disponibles para procesar.`);
    store.close();
    return;
  }

  console.log(`[Bot ${workerId}] Asignada Wallet #${wallet.index}:`);
  console.log(`   - Dirección:   ${wallet.address}`);
  console.log(`   - PrivateKey:  ${wallet.privateKey.slice(0, 10)}... (protegida)`);
  console.log(`   - Estado:      ${wallet.status}`);

  try {
    // 2. Aquí tu bot interactúa con Aptos usando el SDK oficial:
    // const aptosAccount = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(wallet.privateKey) });
    // const tx = await aptos.transferCoinTransaction({ signer: aptosAccount, ... });
    
    // Simulamos que el bot procesa una transacción:
    console.log(`[Bot ${workerId}] Ejecutando transacción en Aptos...`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const fakeTxHash = '0x' + Math.random().toString(16).substring(2).padEnd(64, '0');

    // 3. Marcar como completada
    store.markCompleted(wallet.index, fakeTxHash);
    console.log(`[Bot ${workerId}] ¡Transacción confirmada! TxHash: ${fakeTxHash}`);
  } catch (err: any) {
    console.error(`[Bot ${workerId}] Error procesando wallet #${wallet.index}:`, err.message);
    store.markError(wallet.index, err.message);
  } finally {
    const stats = store.getStats();
    console.log(`[Bot ${workerId}] Progreso global: ${stats.completed}/${stats.total} completadas.`);
    store.close();
  }
}

// Simulamos 3 workers del bot ejecutándose en paralelo:
async function main() {
  await Promise.all([
    botWorker('Worker-A'),
    botWorker('Worker-B'),
    botWorker('Worker-C'),
  ]);
}

main().catch(console.error);
