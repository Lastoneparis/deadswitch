const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// Vault types matching backend schema
export interface VaultData {
  id: string;
  owner_address: string;
  beneficiary_address: string;
  vault_address: string | null;
  owner_ens: string | null;
  beneficiary_ens: string | null;
  heartbeat_interval: number;
  last_heartbeat: number;
  status: 'active' | 'recovery' | 'claimed' | 'cancelled';
  world_id_nullifier: string | null;
  balance: number;
  created_at: number;
  // Extended fields from GET /vault/:id
  recent_heartbeats?: { id: string; timestamp: number; tx_hash: string | null }[];
  time_until_recovery?: number;
  is_expired?: boolean;
}

// Get all vaults owned by a wallet address
export async function getUserVaults(ownerAddress: string): Promise<{ vaults: VaultData[] }> {
  return request(`/vaults/owner/${ownerAddress.toLowerCase()}`);
}

// Get all vaults where address is beneficiary
export async function getHeirVaults(beneficiaryAddress: string): Promise<{ vaults: VaultData[] }> {
  return request(`/vaults/heir/${beneficiaryAddress.toLowerCase()}`);
}

// Get single vault by ID (with heartbeat history)
export async function getVault(vaultId: string): Promise<VaultData> {
  return request(`/vault/${vaultId}`);
}

// Create vault (field names match backend)
export async function createVault(data: {
  owner_address: string;
  beneficiary_address: string;
  heartbeat_interval: number;
  balance: number;
  owner_ens?: string;
  beneficiary_ens?: string;
  world_id_nullifier?: string;
  vault_address?: string;
}) {
  return request('/vault/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Send heartbeat
export async function sendHeartbeat(vaultId: string, txHash?: string) {
  return request('/vault/heartbeat', {
    method: 'POST',
    body: JSON.stringify({ vault_id: vaultId, tx_hash: txHash }),
  });
}

// Simulate death (fast-forward for demo)
export async function simulateDeath(vaultId: string) {
  return request('/vault/simulate-death', {
    method: 'POST',
    body: JSON.stringify({ vault_id: vaultId }),
  });
}

// Claim inheritance
export async function claimInheritance(vaultId: string, claimerAddress: string, worldIdProof?: object) {
  return request('/vault/claim', {
    method: 'POST',
    body: JSON.stringify({
      vault_id: vaultId,
      claimer_address: claimerAddress,
      world_id_proof: worldIdProof,
    }),
  });
}

// Resolve ENS name to address
export async function resolveENS(name: string): Promise<{ address: string; name: string; resolved: boolean }> {
  return request(`/ens/resolve/${encodeURIComponent(name)}`);
}

// Search vaults by owner address (for claim page — user enters an address)
export async function searchVaultsByAddress(address: string): Promise<{ vaults: VaultData[] }> {
  return request(`/vaults/owner/${address.toLowerCase()}`);
}

// Cancel vault (owner only — returns funds)
export async function cancelVault(vaultId: string, ownerAddress: string) {
  return request('/vault/cancel', {
    method: 'POST',
    body: JSON.stringify({ vault_id: vaultId, owner_address: ownerAddress }),
  });
}

// Demo reset (for judges — resets vault to active)
export async function demoReset(vaultId: string) {
  return request('/vault/demo-reset', {
    method: 'POST',
    body: JSON.stringify({ vault_id: vaultId }),
  });
}

export async function getStats() {
  return request('/stats');
}
