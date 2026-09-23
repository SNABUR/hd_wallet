# MultiChain HD Wallet SDK (AI & Bot Agent Reference)

SDK modular, ligero y de alto rendimiento en TypeScript / Node.js para generación y derivación jerárquica masiva de billeteras (**EVM, BTC, SOL, Aptos, Sui**) bajo estándares **BIP-39, BIP-32, BIP-44 y SLIP-0010**.

---

## 🤖 Directrices Rápidas para Bots y Agentes IA

Un bot o agente autónomo puede operar este SDK con mínimas líneas de código.

### 1. Importación
```typescript
import { MultiChainHDWallet } from './src/index.js';
// o mediante paquete si está publicado/linkeado
```

### 2. Generación Básica
```typescript
// Genera automáticamente una semilla BIP-39 aleatoria segura (12 o 24 palabras)
const wallet = new MultiChainHDWallet({ wordCount: 24 });

console.log(wallet.mnemonic); // 24 palabras
```

---

## 🛡️ Caso de Uso: Generar 10 Semillas con 1,000 Wallets cada una

Para mitigar el riesgo de punto único de fallo, un bot puede crear "clusters" de semillas aisladas.

### Código Automatizado para Bot / Script:

```typescript
import fs from 'node:fs/promises';
import path from 'node:path';
import { MultiChainHDWallet, ChainType } from './src/index.js';

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
  const TARGET_CHAINS: ChainType[] = ['ETH', 'SOL', 'BTC'];

  const outputDir = path.resolve('./wallets_vault');
  await fs.mkdir(outputDir, { recursive: true });

  const manifest: SeedClusterSummary[] = [];

  for (let i = 1; i <= TOTAL_SEEDS; i++) {
    // 1. Instanciar nueva semilla segura de 24 palabras (256 bits de entropía)
    // Opcional: pasar passphrase adicional si se requiere cifrado KDF en memoria
    const wallet = new MultiChainHDWallet({ wordCount: 24 });

    // 2. Derivar lotes de wallets masivas (ultrarrápido)
    for (const chain of TARGET_CHAINS) {
      const derivedBatch = wallet.deriveBatch(chain, {
        start: 0,
        count: WALLETS_PER_SEED,
      });

      // 3. Exportar a CSV o JSON para consumo de bases de datos
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

    console.log(`[Bot] Semilla #${i} completada: 1,000 wallets por cadena generadas.`);
  }

  // 4. Guardar archivo maestro de semillas (¡PROTEGER O ENCRIPTAR ESTE ARCHIVO!)
  await fs.writeFile(
    path.join(outputDir, 'master_seeds_manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  console.log('[Bot] Finalizado exitosamente. Archivos guardados en ./wallets_vault');
}

runBotWalletClusterGeneration();
```

---

## 🔒 ¿Dónde debe guardar las semillas un Bot de manera segura?

Si una IA o script automatizado genera estas semillas, **nunca debe dejarlas en texto plano en repositorios públicos**. Las 3 alternativas recomendadas según el entorno son:

### Opción 1: Archivo local cifrado con AES-256-GCM (Recomendado para CLI/Scripts)
El bot cifra el archivo `master_seeds_manifest.json` utilizando una contraseña maestra conocida únicamente por el operador (pasada por variable de entorno `MASTER_ENCRYPTION_KEY`).

### Opción 2: Base de Datos Cifrada / Key Vault (Recomendado para Servicios en Producción)
- **Cloud KMS / Vault:** Guardar las semillas en **AWS Secrets Manager**, **Google Secret Manager** o **HashiCorp Vault**.
- **Base de datos relacional (PostgreSQL / Supabase / Cloudflare D1):** 
  - Solo guardar la **dirección pública (`address`)** y el **índice de derivación (`index`)**.
  - **No** guardar las claves privadas de las 1,000 wallets en la base de datos.
  - La clave privada se recalcula en memoria **únicamente cuando el bot necesita firmar una transacción**, consultando la semilla en el KMS.

---

## 📖 API Cheatsheet (Referencia de Métodos)

### `new MultiChainHDWallet(options)`
- `wordCount`: `12 | 24` (por defecto `12`). Usa `24` para máxima seguridad.
- `mnemonic`: Frase opcional existente (la valida con BIP-39).
- `passphrase`: Contraseña adicional BIP-39 (sal criptográfica opcional).

### `wallet.derive(chain, index, btcFormat?)`
- `chain`: `'ETH' | 'BTC' | 'SOL' | 'APTOS' | 'SUI'`
- `index`: número de derivación (ej: `0`, `1`, `999`).
- `btcFormat`: `'segwit' | 'taproot' | 'legacy'` (solo para Bitcoin).

### `wallet.deriveBatch(chain, { start, count, btcFormat? })`
- `start`: índice de inicio (por defecto `0`).
- `count`: total de wallets a generar de forma secuencial.

### `wallet.toCSV(wallets)` / `wallet.toJSON(wallets, pretty?)`
- Formateo directo a strings listos para escribir a disco o enviar por API.
