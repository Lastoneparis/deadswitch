const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

export async function createVault(data: {
  owner: string;
  beneficiary: string;
  heartbeatInterval: number;
  depositAmount: string;
}) {
  return request('/vault', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getVault(address: string) {
  return request(`/vault/${address}`);
}

export async function sendHeartbeat(vaultAddress: string, owner: string) {
  return request(`/vault/${vaultAddress}/heartbeat`, {
    method: 'POST',
    body: JSON.stringify({ owner }),
  });
}

export async function simulateDeath(vaultAddress: string) {
  return request(`/vault/${vaultAddress}/simulate-death`, {
    method: 'POST',
  });
}

export async function claimInheritance(vaultAddress: string, beneficiary: string) {
  return request(`/vault/${vaultAddress}/claim`, {
    method: 'POST',
    body: JSON.stringify({ beneficiary }),
  });
}

export async function getStats() {
  return request('/stats');
}
