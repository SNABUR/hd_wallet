# Aptos Bot Wallet Store 🚀

Módulo SQLite de alto rendimiento diseñado para bots e indexadores de Aptos que necesitan operar con miles de billeteras sin colisiones y con persistencia atómica.

---

## 📦 Características

- **Base de Datos SQLite Ultrarrápida (`node:sqlite`)**: Sin dependencias C++ complejas, nativo en Node.js 22+.
- **Transacciones Atómicas (`BEGIN IMMEDIATE TRANSACTION`)**: Permite que múltiples workers o hilos tomen wallets concurrentemente (`acquireNextWallet()`) sin duplicidad.
- **Ciclo de Vida de Wallets**: Estados `idle` ➡️ `busy` ➡️ `completed` o `error`.
- **Auditoría y Trazabilidad**: Guarda el `txHash`, tiempos y mensajes de error por cada wallet.
- **Portabilidad Total**: Puedes dejar esta carpeta aquí o moverla a cualquier otra parte de tu sistema.

---

## 🛠️ Comandos

### 1. Generar Wallets Masivas en la Base de Datos
Genera 1,000 wallets de Aptos (o las que desees) en menos de 1 segundo:
```bash
pnpm exec tsx scripts/generate_wallets.ts
```

### 2. Probar la Ejecución de Bots (Simulación de Workers Paralelos)
```bash
pnpm exec tsx examples/bot_usage.ts
```

---

## 🤖 Cómo usarlo en tu Bot

```typescript
import { AptosWalletStore } from './src/store.js';

const store = new AptosWalletStore('aptos_wallets.db');

// 1. Obtener la siguiente wallet disponible (se marca 'busy' atómicamente)
const wallet = store.acquireNextWallet();

if (wallet) {
  try {
    // 2. Usar con el SDK oficial de Aptos (@aptos-labs/ts-sdk)
    // const account = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(wallet.privateKey) });
    // const tx = await aptos.signAndSubmitTransaction({ signer: account, ... });

    // 3. Marcar completada con el hash
    store.markCompleted(wallet.index, '0x...');
  } catch (error) {
    store.markError(wallet.index, error.message);
  }
}

// 4. Ver progreso en cualquier momento
const stats = store.getStats();
console.log(stats); // { total: 1000, idle: 998, busy: 0, completed: 2, error: 0 }

store.close();
```
