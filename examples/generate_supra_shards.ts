import { MultiChainHDWallet } from '../dist/index.js';

/**
 * Script de utilidad para generar Shards de Supra determinísticos.
 * Uso:
 *   npx tsx examples/generate_supra_shards.ts [mnemonic_opcional] [start_index] [count]
 */
function main() {
    const mnemonicArg = process.argv[2];
    const startIndex = parseInt(process.argv[3] || '0', 10);
    const count = parseInt(process.argv[4] || '5', 10);

    const wallet = new MultiChainHDWallet(
        mnemonicArg && mnemonicArg.split(' ').length >= 12
            ? { mnemonic: mnemonicArg }
            : { wordCount: 12 }
    );

    console.log('====================================================');
    console.log('🔑 SUPRA HD WALLET SHARD GENERATOR');
    console.log('====================================================');
    console.log(`📜 Mnemonic: "${wallet.mnemonic}"`);
    console.log(`🔢 Generando ${count} shards desde índice ${startIndex}...\n`);

    const batch = wallet.deriveBatch('SUPRA', { start: startIndex, count });

    batch.forEach((w) => {
        console.log(`[Shard #${w.index}]`);
        console.log(`  Path:       ${w.path}`);
        console.log(`  Address:    ${w.address}`);
        console.log(`  PrivateKey: ${w.privateKey}`);
        console.log('');
    });

    console.log('📋 Formato JSON para wallets.json:');
    console.log(JSON.stringify(batch.map(w => w.privateKey), null, 4));
    console.log('====================================================');
}

main();
