import db from '../database';
import { broadcast } from '../websocket';

/**
 * Simulates Chainlink Automation keeper checks.
 * In production: this logic lives on-chain as a Chainlink Automation-compatible contract.
 * checkUpkeep() returns true when heartbeat expired, performUpkeep() triggers recovery.
 */

interface VaultRow {
  id: string;
  owner_address: string;
  beneficiary_address: string;
  heartbeat_interval: number;
  last_heartbeat: number;
  status: string;
  balance: number;
}

/**
 * Check all active vaults for expired heartbeats.
 * If last_heartbeat + heartbeat_interval < now, vault enters recovery mode.
 */
export async function checkVaults(): Promise<{ vaultsTriggered: number; details: object[] }> {
  const now = Math.floor(Date.now() / 1000);

  const expiredVaults = db.prepare(`
    SELECT id, owner_address, beneficiary_address, heartbeat_interval, last_heartbeat, status, balance
    FROM vaults
    WHERE status = 'active'
    AND (last_heartbeat + heartbeat_interval) < @now
  `).all({ now }) as VaultRow[];

  const details: object[] = [];

  for (const vault of expiredVaults) {
    // Transition to recovery mode
    db.prepare(`
      UPDATE vaults SET status = 'recovery' WHERE id = @id
    `).run({ id: vault.id });

    const detail = {
      vault_id: vault.id,
      owner: vault.owner_address,
      beneficiary: vault.beneficiary_address,
      heartbeat_expired_by: now - (vault.last_heartbeat + vault.heartbeat_interval),
      balance: vault.balance,
      triggered_at: now,
    };
    details.push(detail);

    // Broadcast recovery event via WebSocket
    broadcast({
      type: 'recovery_activated',
      vault_id: vault.id,
      owner: vault.owner_address,
      beneficiary: vault.beneficiary_address,
      balance: vault.balance,
      timestamp: now,
    });

    console.log(`[Chainlink] Recovery activated for vault ${vault.id} (heartbeat expired ${detail.heartbeat_expired_by}s ago)`);
  }

  if (details.length > 0) {
    console.log(`[Chainlink] ${details.length} vault(s) triggered for recovery`);
  }

  return { vaultsTriggered: details.length, details };
}

let automationInterval: NodeJS.Timeout | null = null;

/**
 * Start the Chainlink Automation simulator.
 * Checks every 5 minutes (300,000ms) for expired vaults.
 */
export function startAutomationSimulator(): void {
  if (automationInterval) {
    console.log('[Chainlink] Automation simulator already running');
    return;
  }

  // Run immediately on start
  checkVaults().catch(console.error);

  // Then every 5 minutes
  automationInterval = setInterval(() => {
    checkVaults().catch(console.error);
  }, 5 * 60 * 1000);

  console.log('[Chainlink] Automation simulator started (checking every 5 minutes)');
}

/**
 * Stop the automation simulator.
 */
export function stopAutomationSimulator(): void {
  if (automationInterval) {
    clearInterval(automationInterval);
    automationInterval = null;
    console.log('[Chainlink] Automation simulator stopped');
  }
}
