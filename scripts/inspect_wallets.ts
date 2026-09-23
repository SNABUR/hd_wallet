import fs from 'fs';
import path from 'path';
import { MultiChainHDWallet } from '../dist/index.js';

// Leer .env manualmente si existe
function loadEnv() {
    const envPaths = [
        path.resolve(process.cwd(), '../spike_indexer/.env.local'),
        path.resolve(process.cwd(), '../spike_indexer/.env'),
        path.resolve(process.cwd(), '.env')
    ];
    for (const p of envPaths) {
        if (fs.existsSync(p)) {
            const content = fs.readFileSync(p, 'utf-8');
            for (const line of content.split('\n')) {
                const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
                if (match) {
                    const key = match[1];
                    let val = (match[2] || '').trim();
                    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
                    if (!process.env[key]) process.env[key] = val;
                }
            }
        }
    }
}
loadEnv();

const RPC_URL = process.env.SUPRA_RPC_URL_MAINNET || 'https://rpc-mainnet.supra.com';

async function getSupraBalance(address: string): Promise<string> {
    try {
        const res = await fetch(`${RPC_URL}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function: '0x1::coin::balance',
                type_arguments: ['0x1::supra_coin::SupraCoin'],
                arguments: [address]
            })
        });
        if (!res.ok) return '0.0000 SUPRA';
        const data: any = await res.json();
        const result = data?.result || data;
        if (Array.isArray(result) && result.length > 0) {
            const raw = BigInt(result[0]);
            return (Number(raw) / 1e8).toFixed(4) + ' SUPRA';
        }
        return '0.0000 SUPRA';
    } catch {
        return '0.0000 SUPRA';
    }
}

async function main() {
    // Detect argv correctly whether run with tsx or node
    const scriptIndex = process.argv.findIndex((arg: string) => arg.includes('inspect_wallets'));
    const userArgs = scriptIndex !== -1 ? process.argv.slice(scriptIndex + 1) : process.argv.slice(2);

    // Priority: CLI argument first, then environment variable
    let mnemonic = (userArgs[0] && userArgs[0].split(' ').length >= 12) ? userArgs[0] : '';
    let startIdx = parseInt(userArgs[1] || '0', 10);
    let countIdx = parseInt(userArgs[2] || '10', 10);

    if (!mnemonic && process.env.HD_WALLET_MNEMONIC) {
        const envVal = process.env.HD_WALLET_MNEMONIC.trim();
        // Ignore dummy placeholder values
        if (!envVal.startsWith('word1 word2') && envVal.split(' ').length >= 12) {
            mnemonic = envVal;
            startIdx = parseInt(userArgs[0] || '0', 10);
            countIdx = parseInt(userArgs[1] || '10', 10);
        }
    }

    if (!mnemonic || mnemonic.split(' ').length < 12) {
        console.error('❌ No se encontró un mnemónico válido.');
        console.error('Uso:');
        console.error('  npx tsx scripts/inspect_wallets.ts "<12_o_24_palabras>" [inicio] [cantidad]');
        console.error('  O define HD_WALLET_MNEMONIC en spike_indexer/.env');
        process.exit(1);
    }

    const wallet = new MultiChainHDWallet({ mnemonic });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 INSPECTOR DE WALLETS HD (SUPRA)');
    console.log(`🔌 RPC: ${RPC_URL}`);
    console.log(`🔢 Derivando ${countIdx} wallets desde el índice ${startIdx}...`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const batch = wallet.deriveBatch('SUPRA', { start: startIdx, count: countIdx });

    for (const w of batch) {
        const balance = await getSupraBalance(w.address);
        console.log(`[Shard #${w.index}] | Balance: ${balance}`);
        console.log(`  📍 Address:    ${w.address}`);
        console.log(`  🔑 PrivateKey: ${w.privateKey}`);
        console.log(`  🛤️ Path:       ${w.path}`);
        console.log('────────────────────────────────────────────────────────────────────');
    }

    console.log('\n📋 Array de Private Keys para copiar a wallets.json (si lo necesitas):');
    console.log(JSON.stringify(batch.map(w => w.privateKey), null, 2));
}

main();
