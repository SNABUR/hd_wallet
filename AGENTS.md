# AGENTS.md - MultiChain HD Wallet SDK

Guía y contexto para agentes autónomos, bots y LLMs que operan o modifican este repositorio.

---

## 📌 Resumen del Proyecto

Este repositorio contiene un SDK en **TypeScript (ESM)** de alto rendimiento, modular y ligero para la generación y derivación jerárquica masiva de billeteras multi-cadena (**EVM, Bitcoin, Solana, Aptos, Sui**) cumpliendo con estándares criptográficos estándar de la industria:
- **BIP-39**: Generación de mnemónicos (12 o 24 palabras) y derivación de semilla con salt/passphrase opcional.
- **BIP-32 / BIP-44**: Derivación jerárquica para cadenas secp256k1 (EVM y Bitcoin).
- **SLIP-0010**: Derivación jerárquica endurecida para cadenas ed25519 (Solana, Aptos, Sui).

---

## 📁 Arquitectura del Repositorio

```
hd_wallet/
├── src/
│   ├── index.ts               # Punto de entrada y re-exportación de módulos públicos
│   ├── core/
│   │   ├── types.ts           # Interfaces, tipos (ChainType, DerivedWallet, etc.)
│   │   ├── mnemonic.ts        # Métodos para BIP-39 (generate, validate, mnemonicToSeed)
│   │   ├── slip10.ts          # Derivación SLIP-0010 Ed25519
│   │   └── HDWallet.ts        # Clase orquestadora principal MultiChainHDWallet
│   ├── chains/
│   │   ├── evm.ts             # Rutas m/44'/60'/0'/0/i + Keccak-256
│   │   ├── btc.ts             # SegWit (bc1q, BIP-84), Taproot (bc1p, BIP-86), Legacy (1..., BIP-44)
│   │   ├── solana.ts          # Ruta m/44'/501'/i'/0' + Base58
│   │   ├── aptos.ts           # Ruta m/44'/637'/i'/0'/0' + SHA3-256 AuthKey (0x + 64 hex)
│   │   └── sui.ts             # Ruta m/44'/784'/i'/0'/0' + Blake2b-256 Flag 0x00 (0x + 64 hex)
│   └── exporters/
│       └── export.ts          # Exportación a formato CSV y JSON
├── aptos_bot_store/          # Módulo autónomo SQLite para bots e indexadores de Aptos
│   ├── src/
│   │   ├── store.ts           # AptosWalletStore (transacciones atómicas SQLite)
│   │   ├── generator.ts       # Generación masiva SDK -> SQLite
│   │   └── types.ts           # Estados 'idle', 'busy', 'completed', etc.
│   ├── scripts/generate_wallets.ts # Script CLI para generar N billeteras
│   └── examples/bot_usage.ts  # Demo de consumo concurrente para workers
├── examples/
│   └── bot_generate_clusters.ts # Ejemplo de generación masiva de clusters de semillas y wallets
├── test/
│   └── hdwallet.test.ts       # Suite de pruebas unitarias con Vitest
├── package.json               # Configuración pnpm, dependencias @scure y @noble
├── tsconfig.json              # Configuración TypeScript (NodeNext, target ES2022)
└── README.md                  # Documentación rápida para usuarios y bots
```

---

## 🛠️ Tecnologías y Librerías Criptográficas

- **Runtime / Lenguaje**: Node.js >= 18, TypeScript (ESM nativo `"type": "module"`).
- **Gestor de paquetes**: `pnpm` (versión ^11.x recomendada).
- **Dependencias Criptográficas**:
  - `@scure/bip39`: Generación y validación de mnemónicos en inglés.
  - `@scure/bip32`: Derivación BIP-32 secp256k1.
  - `@noble/curves`: Curvas elípticas (secp256k1, ed25519).
  - `@noble/hashes`: Primitivas criptográficas (sha256, sha512, keccak, ripemd160, blake2b, sha3).
  - `@scure/base`: Codificaciones (base58, bech32, bech32m, hex).
- **Testing**: `vitest`.

---

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
pnpm install

# Ejecutar tests
pnpm test
# o en modo watch
pnpm exec vitest

# Compilar TypeScript a ./dist
pnpm run build

# Ejecutar ejemplo de bots
pnpm exec tsx examples/bot_generate_clusters.ts
```

---

## ⛓️ Cadenas Soportadas y Rutas de Derivación

| Cadena | `ChainType` | Curva | Ruta de Derivación | Formato de Dirección / Esquema |
| :--- | :--- | :--- | :--- | :--- |
| **EVM** (Ethereum, Polygon, BSC, Arbitrum, etc.) | `'ETH'` | secp256k1 | `m/44'/60'/0'/0/{index}` | Hex checksummed `0x...` (Keccak-256) |
| **Bitcoin SegWit** | `'BTC'` | secp256k1 | `m/84'/0'/0'/0/{index}` | Bech32 `bc1q...` (BIP-84) |
| **Bitcoin Taproot**| `'BTC'` | secp256k1 | `m/86'/0'/0'/0/{index}` | Bech32m `bc1p...` (BIP-86, Schnorr x-only) |
| **Bitcoin Legacy** | `'BTC'` | secp256k1 | `m/44'/0'/0'/0/{index}` | Base58Check `1...` (BIP-44, P2PKH) |
| **Solana** | `'SOL'` | ed25519 | `m/44'/501'/{index}'/0'` | Base58 (SLIP-0010) |
| **Aptos** | `'APTOS'` | ed25519 | `m/44'/637'/{index}'/0'/0'` | `0x` + 64 hex chars (SHA3-256 de PubKey + 0x00) |
| **Sui** | `'SUI'` | ed25519 | `m/44'/784'/{index}'/0'/0'` | `0x` + 64 hex chars (Blake2b-256 de 0x00 + PubKey) |

---

## 🤖 Directrices para Agentes y LLMs

1. **Inmutabilidad y Criptografía Segura**:
   - Nunca expongas ni loguees claves privadas (`privateKey`) ni mnemónicos (`mnemonic`) en consolas o salidas públicas.
   - En flujos de producción, favorece derivar las claves efímeramente en memoria únicamente al firmar transacciones.
2. **Compatibilidad ESM**:
   - Siempre incluye la extensión `.js` en los imports relativos de TypeScript (ej: `import { ... } from './core/types.js'`).
3. **Manejo de Errores**:
   - El constructor de `MultiChainHDWallet` valida que cualquier frase mnemónica provista sea un mnemónico BIP-39 válido; si no lo es, lanza `Error('Invalid BIP-39 mnemonic phrase provided')`.
4. **Agregado de Nuevas Cadenas**:
   - Crear el derivador en `src/chains/<nueva_cadena>.ts`.
   - Registrar el tipo en `ChainType` en [src/core/types.ts](file:///d:/hd_wallet/src/core/types.ts).
   - Agregar el caso en `MultiChainHDWallet.derive()` en [src/core/HDWallet.ts](file:///d:/hd_wallet/src/core/HDWallet.ts).
   - Re-exportar en [src/index.ts](file:///d:/hd_wallet/src/index.ts).
   - Añadir tests de vectores conocidos en [test/hdwallet.test.ts](file:///d:/hd_wallet/test/hdwallet.test.ts).
