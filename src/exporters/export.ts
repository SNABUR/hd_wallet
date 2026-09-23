import { DerivedWallet } from '../core/types.js';

export function walletsToCSV(wallets: DerivedWallet[]): string {
  const headers = ['Index', 'Chain', 'Derivation Path', 'Address', 'Public Key', 'Private Key'];
  const rows = wallets.map((w) => [
    w.index,
    w.chain,
    `"${w.path}"`,
    `"${w.address}"`,
    `"${w.publicKey}"`,
    `"${w.privateKey}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function walletsToJSON(wallets: DerivedWallet[], pretty = true): string {
  return JSON.stringify(wallets, null, pretty ? 2 : undefined);
}
