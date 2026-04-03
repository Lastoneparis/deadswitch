/**
 * World ID verification integration.
 * Hackathon: mock verification (always returns true).
 * Production: call World ID API with real proof verification.
 */

export interface WorldIdProof {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  verification_level: 'orb' | 'device';
  signal?: string;
}

export interface WorldIdResult {
  verified: boolean;
  human: boolean;
  nullifier_hash: string;
  verification_level: string;
}

/**
 * Verify a World ID proof.
 * Hackathon mode: returns verified=true for any proof.
 * Production: POST to https://developer.worldcoin.org/api/v1/verify/{app_id}
 */
export async function verifyWorldId(
  proof: Partial<WorldIdProof>,
  nullifierHash: string
): Promise<WorldIdResult> {
  const appId = process.env.WORLDID_APP_ID || 'app_staging_xxx';

  // --- HACKATHON MOCK ---
  // In production, this would call the World ID API:
  //
  // const res = await fetch(`https://developer.worldcoin.org/api/v1/verify/${appId}`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     merkle_root: proof.merkle_root,
  //     nullifier_hash: nullifierHash,
  //     proof: proof.proof,
  //     verification_level: proof.verification_level || 'orb',
  //     signal: proof.signal || '',
  //     action: 'claim-inheritance',
  //   }),
  // });
  //
  // const data = await res.json();
  // return { verified: data.success, human: true, ... };

  console.log(`[WorldID] Mock verification for nullifier: ${nullifierHash.slice(0, 16)}...`);

  return {
    verified: true,
    human: true,
    nullifier_hash: nullifierHash,
    verification_level: proof.verification_level || 'orb',
  };
}

/**
 * Check if a nullifier has already been used (prevents double-claim).
 */
export function isNullifierUsed(nullifierHash: string, db: any): boolean {
  const row = db.prepare(
    'SELECT COUNT(*) as cnt FROM vaults WHERE world_id_nullifier = @nullifier'
  ).get({ nullifier: nullifierHash }) as { cnt: number };

  return row.cnt > 0;
}
