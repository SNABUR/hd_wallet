import { describe, it, expect } from 'vitest';
import { MultiChainHDWallet } from '../src/core/HDWallet.js';
import { validateMnemonic } from '../src/core/mnemonic.js';

describe('MultiChainHDWallet SDK', () => {
  // Standard 12-word test mnemonic
  const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  it('generates a valid random 12-word mnemonic', () => {
    const wallet = new MultiChainHDWallet({ wordCount: 12 });
    expect(wallet.mnemonic.split(' ').length).toBe(12);
    expect(validateMnemonic(wallet.mnemonic)).toBe(true);
  });

  it('generates a valid random 24-word mnemonic', () => {
    const wallet = new MultiChainHDWallet({ wordCount: 24 });
    expect(wallet.mnemonic.split(' ').length).toBe(24);
    expect(validateMnemonic(wallet.mnemonic)).toBe(true);
  });

  it('derives standard EVM addresses deterministically', () => {
    const wallet = new MultiChainHDWallet({ mnemonic: testMnemonic });
    const eth0 = wallet.derive('ETH', 0);
    const eth1 = wallet.derive('ETH', 1);

    expect(eth0.chain).toBe('ETH');
    expect(eth0.path).toBe("m/44'/60'/0'/0/0");
    // Standard test vector for 'abandon ... about' on m/44'/60'/0'/0/0
    expect(eth0.address.startsWith('0x')).toBe(true);
    expect(eth0.address).toBe('0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
    expect(eth1.address.startsWith('0x')).toBe(true);
    expect(eth0.address).not.toBe(eth1.address);
  });

  it('derives Bitcoin Native SegWit (bc1q) and Taproot (bc1p)', () => {
    const wallet = new MultiChainHDWallet({ mnemonic: testMnemonic });
    const btcSegwit = wallet.derive('BTC', 0, 'segwit');
    const btcTaproot = wallet.derive('BTC', 0, 'taproot');
    const btcLegacy = wallet.derive('BTC', 0, 'legacy');

    expect(btcSegwit.address.startsWith('bc1q')).toBe(true);
    expect(btcTaproot.address.startsWith('bc1p')).toBe(true);
    expect(btcLegacy.address.startsWith('1')).toBe(true);
  });

  it('derives Solana addresses via SLIP-0010', () => {
    const wallet = new MultiChainHDWallet({ mnemonic: testMnemonic });
    const sol0 = wallet.derive('SOL', 0);
    const sol1 = wallet.derive('SOL', 1);

    expect(sol0.chain).toBe('SOL');
    expect(sol0.path).toBe("m/44'/501'/0'/0'");
    expect(sol0.address.length).toBeGreaterThanOrEqual(32);
    expect(sol0.address).not.toBe(sol1.address);
  });

  it('derives Aptos Move addresses via SLIP-0010 and SHA3-256 AuthKey', () => {
    const wallet = new MultiChainHDWallet({ mnemonic: testMnemonic });
    const aptos0 = wallet.derive('APTOS', 0);
    const aptos1 = wallet.derive('APTOS', 1);

    expect(aptos0.chain).toBe('APTOS');
    expect(aptos0.path).toBe("m/44'/637'/0'/0'/0'");
    expect(aptos0.address.startsWith('0x')).toBe(true);
    expect(aptos0.address.length).toBe(66); // 0x + 64 hex chars
    expect(aptos0.address).not.toBe(aptos1.address);
  });

  it('derives Sui Move addresses via SLIP-0010 and Blake2b-256 AuthKey', () => {
    const wallet = new MultiChainHDWallet({ mnemonic: testMnemonic });
    const sui0 = wallet.derive('SUI', 0);
    const sui1 = wallet.derive('SUI', 1);

    expect(sui0.chain).toBe('SUI');
    expect(sui0.path).toBe("m/44'/784'/0'/0'/0'");
    expect(sui0.address.startsWith('0x')).toBe(true);
    expect(sui0.address.length).toBe(66); // 0x + 64 hex chars
    expect(sui0.address).not.toBe(sui1.address);
  });

  it('derives Supra Move addresses via SLIP-0010 and SHA3-256 AuthKey', () => {
    const wallet = new MultiChainHDWallet({ mnemonic: testMnemonic });
    const supra0 = wallet.derive('SUPRA', 0);
    const supra1 = wallet.derive('SUPRA', 1);

    expect(supra0.chain).toBe('SUPRA');
    expect(supra0.path).toBe("m/44'/637'/0'/0'/0'");
    expect(supra0.address.startsWith('0x')).toBe(true);
    expect(supra0.address.length).toBe(66); // 0x + 64 hex chars
    expect(supra0.privateKey.startsWith('0x')).toBe(true);
    expect(supra0.address).not.toBe(supra1.address);
  });

  it('handles batch derivation and CSV/JSON exporting', () => {
    const wallet = new MultiChainHDWallet({ mnemonic: testMnemonic });
    const batch = wallet.deriveBatch('ETH', { start: 0, count: 5 });

    expect(batch.length).toBe(5);
    expect(batch[0].index).toBe(0);
    expect(batch[4].index).toBe(4);

    const csv = wallet.toCSV(batch);
    expect(csv.includes('Index,Chain,Derivation Path,Address,Public Key,Private Key')).toBe(true);
    expect(csv.split('\n').length).toBe(6); // Header + 5 rows

    const json = wallet.toJSON(batch);
    const parsed = JSON.parse(json);
    expect(parsed.length).toBe(5);
    expect(parsed[0].address).toBe(batch[0].address);
  });
});
