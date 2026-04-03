// eslint-disable-next-line @typescript-eslint/no-var-requires
const sss = require('shamirs-secret-sharing');

/**
 * Split a secret (private key, seed phrase, etc.) into N shares.
 * Need K (threshold) shares to reconstruct.
 */
export function splitSecret(secret: string, totalShares: number, threshold: number): string[] {
  if (threshold > totalShares) {
    throw new Error('Threshold cannot exceed total shares');
  }
  if (threshold < 2) {
    throw new Error('Threshold must be at least 2');
  }
  if (totalShares < 2) {
    throw new Error('Total shares must be at least 2');
  }

  const secretBuffer = Buffer.from(secret, 'utf-8');
  const shares = sss.split(secretBuffer, { shares: totalShares, threshold });

  return shares.map((share: Buffer) => share.toString('hex'));
}

/**
 * Recover a secret from K or more shares.
 */
export function recoverSecret(sharesHex: string[]): string {
  if (sharesHex.length < 2) {
    throw new Error('Need at least 2 shares to recover');
  }

  const shareBuffers = sharesHex.map((hex: string) => Buffer.from(hex, 'hex'));
  const recovered = sss.combine(shareBuffers);

  return recovered.toString('utf-8');
}

/**
 * Demo: split a test seed phrase and verify recovery works.
 */
export function demoShamirSplit(): { original: string; shares: string[]; recovered: string; success: boolean } {
  const testSeed = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  const shares = splitSecret(testSeed, 5, 3);
  // Recover with just 3 of 5 shares
  const recovered = recoverSecret(shares.slice(0, 3));

  return {
    original: testSeed,
    shares,
    recovered,
    success: recovered === testSeed,
  };
}
