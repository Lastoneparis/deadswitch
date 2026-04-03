import crypto from 'crypto';
import { recoverSecret } from '../services/shamir';

// ─── Types ───

export interface TEEAttestation {
  attestation_hash: string;
  enclave_id: string;
  code_hash: string;
  input_shard_hashes: string[];
  output_key_hash: string;
  timestamp: string;
  verified: boolean;
  signature: string;
}

const ENCLAVE_SIGNING_KEY = 'deadswitch-tee-enclave-key';

/**
 * Reconstruct a key from shards inside a TEE-like environment.
 *
 * In production: this runs inside a Flare TEE Extension (Intel SGX/TDX enclave).
 * For hackathon: we simulate the attestation flow with real cryptographic proofs.
 *
 * The attestation proves:
 * 1. Which shards were used (by hash, not content)
 * 2. That the reconstruction code is unmodified (code hash)
 * 3. That no one tampered with the process
 * 4. The output key hash matches (for verification without revealing the key)
 */
export async function reconstructInTEE(shards: string[]): Promise<{
  reconstructedKey: string;
  attestation: TEEAttestation;
}> {
  // 1. Hash the inputs (proves which shards were used without revealing them)
  const inputHashes = shards.map(s =>
    crypto.createHash('sha256').update(s).digest('hex')
  );

  // 2. Hash the reconstruction code (proves code integrity)
  const codeHash = crypto
    .createHash('sha256')
    .update(recoverSecret.toString())
    .digest('hex');

  // 3. Reconstruct the key inside the "enclave"
  const reconstructedKey = recoverSecret(shards);

  // 4. Hash the output (proves result without revealing it)
  const outputHash = crypto
    .createHash('sha256')
    .update(reconstructedKey)
    .digest('hex');

  // 5. Build attestation payload — deterministic JSON for verifiability
  const ts = new Date().toISOString();
  const attestationPayload = JSON.stringify({
    input_shard_hashes: inputHashes,
    code_hash: codeHash,
    output_key_hash: outputHash,
    timestamp: ts,
  });

  const attestationHash = crypto
    .createHash('sha256')
    .update(attestationPayload)
    .digest('hex');

  // 6. HMAC signature (simulates enclave hardware signing)
  const signature = crypto
    .createHmac('sha256', ENCLAVE_SIGNING_KEY)
    .update(attestationHash)
    .digest('hex');

  const attestation: TEEAttestation = {
    attestation_hash: attestationHash,
    enclave_id: `flare-tee-${crypto.randomBytes(8).toString('hex')}`,
    code_hash: codeHash,
    input_shard_hashes: inputHashes,
    output_key_hash: outputHash,
    timestamp: ts,
    verified: true,
    signature,
  };

  return { reconstructedKey, attestation };
}

/**
 * Verify a TEE attestation — recomputes the hash and checks the HMAC signature.
 */
export function verifyAttestation(attestation: TEEAttestation): boolean {
  // 1. Recompute attestation hash from components
  const payload = JSON.stringify({
    input_shard_hashes: attestation.input_shard_hashes,
    code_hash: attestation.code_hash,
    output_key_hash: attestation.output_key_hash,
    timestamp: attestation.timestamp,
  });
  const expectedHash = crypto.createHash('sha256').update(payload).digest('hex');

  if (expectedHash !== attestation.attestation_hash) {
    return false;
  }

  // 2. Verify HMAC signature
  const expectedSig = crypto
    .createHmac('sha256', ENCLAVE_SIGNING_KEY)
    .update(attestation.attestation_hash)
    .digest('hex');

  return expectedSig === attestation.signature;
}

/**
 * Returns info about the TEE provider (for the /api/flare/tee-info endpoint).
 */
export function getTEEInfo() {
  return {
    provider: 'Flare TEE Extensions',
    network: 'flare',
    enclave_type: 'simulated (production: Intel SGX/TDX via Flare)',
    purpose:
      'Verifiable key reconstruction — proves no one tampered with inheritance recovery',
    attestation_chain: [
      'input_shard_hashes (SHA-256 of each shard)',
      'code_hash (SHA-256 of reconstruction function)',
      'output_key_hash (SHA-256 of recovered key)',
      'attestation_hash (SHA-256 of full payload)',
      'signature (HMAC-SHA256 enclave signing)',
    ],
    docs: 'https://dev.flare.network/tee',
  };
}
