import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { splitSecret, recoverSecret } from '../services/shamir';
import { storeShard, retrieveShards, getShardStatus } from '../integrations/zerog-shards';
import { verifyWorldId } from '../integrations/world-id';
import { checkVaults } from '../integrations/chainlink-automation';
import { broadcast, getConnectionCount } from '../websocket';

const router = Router();

// ─── Types ───

interface VaultRow {
  id: string;
  owner_address: string;
  beneficiary_address: string;
  vault_address: string | null;
  owner_ens: string | null;
  beneficiary_ens: string | null;
  heartbeat_interval: number;
  last_heartbeat: number;
  status: string;
  world_id_nullifier: string | null;
  balance: number;
  created_at: number;
}

// ─── Health & Stats ───

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'deadswitch-backend',
    timestamp: Math.floor(Date.now() / 1000),
    ws_connections: getConnectionCount(),
  });
});

router.get('/stats', (_req: Request, res: Response) => {
  const totalVaults = (db.prepare('SELECT COUNT(*) as cnt FROM vaults').get() as any).cnt;
  const activeVaults = (db.prepare("SELECT COUNT(*) as cnt FROM vaults WHERE status = 'active'").get() as any).cnt;
  const recoveryVaults = (db.prepare("SELECT COUNT(*) as cnt FROM vaults WHERE status = 'recovery'").get() as any).cnt;
  const claimedVaults = (db.prepare("SELECT COUNT(*) as cnt FROM vaults WHERE status = 'claimed'").get() as any).cnt;
  const totalBalance = (db.prepare('SELECT COALESCE(SUM(balance), 0) as total FROM vaults').get() as any).total;
  const totalHeartbeats = (db.prepare('SELECT COUNT(*) as cnt FROM heartbeats').get() as any).cnt;
  const totalClaims = (db.prepare('SELECT COUNT(*) as cnt FROM claims').get() as any).cnt;

  res.json({
    total_vaults: totalVaults,
    active_vaults: activeVaults,
    recovery_vaults: recoveryVaults,
    claimed_vaults: claimedVaults,
    total_protected_eth: totalBalance,
    total_heartbeats: totalHeartbeats,
    total_claims: totalClaims,
  });
});

// ─── Vault CRUD ───

router.post('/vault/create', (req: Request, res: Response) => {
  try {
    const { owner_address, beneficiary_address, heartbeat_interval, owner_ens, beneficiary_ens, balance } = req.body;

    if (!owner_address || !beneficiary_address) {
      res.status(400).json({ error: 'owner_address and beneficiary_address required' });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const vaultId = uuidv4();

    db.prepare(`
      INSERT INTO vaults (id, owner_address, beneficiary_address, vault_address, owner_ens, beneficiary_ens, heartbeat_interval, last_heartbeat, status, world_id_nullifier, balance, created_at)
      VALUES (@id, @owner_address, @beneficiary_address, @vault_address, @owner_ens, @beneficiary_ens, @heartbeat_interval, @last_heartbeat, @status, @world_id_nullifier, @balance, @created_at)
    `).run({
      id: vaultId,
      owner_address: owner_address.toLowerCase(),
      beneficiary_address: beneficiary_address.toLowerCase(),
      vault_address: null,
      owner_ens: owner_ens || null,
      beneficiary_ens: beneficiary_ens || null,
      heartbeat_interval: heartbeat_interval || 86400,
      last_heartbeat: now,
      status: 'active',
      world_id_nullifier: null,
      balance: balance || 0,
      created_at: now,
    });

    // Add initial heartbeat
    db.prepare(`
      INSERT INTO heartbeats (id, vault_id, tx_hash, timestamp)
      VALUES (@id, @vault_id, @tx_hash, @timestamp)
    `).run({
      id: uuidv4(),
      vault_id: vaultId,
      tx_hash: null,
      timestamp: now,
    });

    const vault = db.prepare('SELECT * FROM vaults WHERE id = @id').get({ id: vaultId });

    broadcast({
      type: 'vault_created',
      vault_id: vaultId,
      owner: owner_address,
      beneficiary: beneficiary_address,
      timestamp: now,
    });

    res.status(201).json({ success: true, vault });
  } catch (err: any) {
    console.error('[API] Create vault error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/vault/:id', (req: Request, res: Response) => {
  const vault = db.prepare('SELECT * FROM vaults WHERE id = @id').get({ id: String(req.params.id) }) as VaultRow | undefined;

  if (!vault) {
    res.status(404).json({ error: 'Vault not found' });
    return;
  }

  const heartbeats = db.prepare('SELECT * FROM heartbeats WHERE vault_id = @vault_id ORDER BY timestamp DESC LIMIT 10')
    .all({ vault_id: vault.id });

  const now = Math.floor(Date.now() / 1000);
  const timeUntilRecovery = vault.status === 'active'
    ? Math.max(0, (vault.last_heartbeat + vault.heartbeat_interval) - now)
    : 0;

  res.json({
    ...vault,
    recent_heartbeats: heartbeats,
    time_until_recovery: timeUntilRecovery,
    is_expired: vault.status === 'active' && timeUntilRecovery === 0,
  });
});

router.get('/vault/:id/shards', async (req: Request, res: Response) => {
  const vault = db.prepare('SELECT * FROM vaults WHERE id = @id').get({ id: String(req.params.id) }) as VaultRow | undefined;

  if (!vault) {
    res.status(404).json({ error: 'Vault not found' });
    return;
  }

  const status = await getShardStatus(vault.id);
  res.json({
    vault_id: vault.id,
    vault_status: vault.status,
    ...status,
  });
});

router.get('/vaults/owner/:addr', (req: Request, res: Response) => {
  const addr = String(req.params.addr).toLowerCase();
  const vaults = db.prepare('SELECT * FROM vaults WHERE LOWER(owner_address) = @addr ORDER BY created_at DESC')
    .all({ addr });
  res.json({ vaults });
});

router.get('/vaults/heir/:addr', (req: Request, res: Response) => {
  const addr = String(req.params.addr).toLowerCase();
  const vaults = db.prepare('SELECT * FROM vaults WHERE LOWER(beneficiary_address) = @addr ORDER BY created_at DESC')
    .all({ addr });
  res.json({ vaults });
});

// ─── Heartbeat ───

router.post('/vault/heartbeat', (req: Request, res: Response) => {
  try {
    const { vault_id, tx_hash } = req.body;

    if (!vault_id) {
      res.status(400).json({ error: 'vault_id required' });
      return;
    }

    const vault = db.prepare('SELECT * FROM vaults WHERE id = @id').get({ id: vault_id }) as VaultRow | undefined;

    if (!vault) {
      res.status(404).json({ error: 'Vault not found' });
      return;
    }

    if (vault.status !== 'active') {
      res.status(400).json({ error: `Cannot heartbeat a ${vault.status} vault` });
      return;
    }

    const now = Math.floor(Date.now() / 1000);

    db.prepare('UPDATE vaults SET last_heartbeat = @now WHERE id = @id').run({ now, id: vault_id });

    db.prepare(`
      INSERT INTO heartbeats (id, vault_id, tx_hash, timestamp)
      VALUES (@id, @vault_id, @tx_hash, @timestamp)
    `).run({
      id: uuidv4(),
      vault_id,
      tx_hash: tx_hash || null,
      timestamp: now,
    });

    broadcast({
      type: 'heartbeat_received',
      vault_id,
      owner: vault.owner_address,
      timestamp: now,
    });

    res.json({ success: true, last_heartbeat: now, next_deadline: now + vault.heartbeat_interval });
  } catch (err: any) {
    console.error('[API] Heartbeat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Claim ───

router.post('/vault/claim', async (req: Request, res: Response) => {
  try {
    const { vault_id, claimer_address, world_id_proof, nullifier_hash } = req.body;

    if (!vault_id || !claimer_address) {
      res.status(400).json({ error: 'vault_id and claimer_address required' });
      return;
    }

    const vault = db.prepare('SELECT * FROM vaults WHERE id = @id').get({ id: vault_id }) as VaultRow | undefined;

    if (!vault) {
      res.status(404).json({ error: 'Vault not found' });
      return;
    }

    if (vault.status !== 'recovery') {
      res.status(400).json({ error: `Vault must be in recovery mode to claim (current: ${vault.status})` });
      return;
    }

    if (claimer_address.toLowerCase() !== vault.beneficiary_address.toLowerCase()) {
      res.status(403).json({ error: 'Only the designated beneficiary can claim' });
      return;
    }

    // Verify World ID
    let worldIdVerified = false;
    if (world_id_proof && nullifier_hash) {
      const result = await verifyWorldId(world_id_proof, nullifier_hash);
      worldIdVerified = result.verified && result.human;

      // Store nullifier to prevent double-claim
      if (worldIdVerified) {
        db.prepare('UPDATE vaults SET world_id_nullifier = @nullifier WHERE id = @id')
          .run({ nullifier: nullifier_hash, id: vault_id });
      }
    }

    const now = Math.floor(Date.now() / 1000);
    const claimId = uuidv4();

    db.prepare(`
      INSERT INTO claims (id, vault_id, claimer_address, world_id_verified, amount, tx_hash, created_at)
      VALUES (@id, @vault_id, @claimer_address, @world_id_verified, @amount, @tx_hash, @created_at)
    `).run({
      id: claimId,
      vault_id,
      claimer_address: claimer_address.toLowerCase(),
      world_id_verified: worldIdVerified ? 1 : 0,
      amount: vault.balance,
      tx_hash: null,
      created_at: now,
    });

    // Update vault status
    db.prepare("UPDATE vaults SET status = 'claimed' WHERE id = @id").run({ id: vault_id });

    broadcast({
      type: 'inheritance_claimed',
      vault_id,
      claimer: claimer_address,
      amount: vault.balance,
      world_id_verified: worldIdVerified,
      timestamp: now,
    });

    // Retrieve shards for the beneficiary
    const shards = await retrieveShards(vault_id);

    res.json({
      success: true,
      claim_id: claimId,
      amount: vault.balance,
      world_id_verified: worldIdVerified,
      shards_available: shards.length,
      shards: shards.length > 0 ? shards : undefined,
    });
  } catch (err: any) {
    console.error('[API] Claim error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Cancel ───

router.post('/vault/cancel', (req: Request, res: Response) => {
  try {
    const { vault_id, owner_address } = req.body;

    if (!vault_id) {
      res.status(400).json({ error: 'vault_id required' });
      return;
    }

    const vault = db.prepare('SELECT * FROM vaults WHERE id = @id').get({ id: vault_id }) as VaultRow | undefined;

    if (!vault) {
      res.status(404).json({ error: 'Vault not found' });
      return;
    }

    if (owner_address && owner_address.toLowerCase() !== vault.owner_address.toLowerCase()) {
      res.status(403).json({ error: 'Only the owner can cancel' });
      return;
    }

    if (vault.status === 'claimed' || vault.status === 'cancelled') {
      res.status(400).json({ error: `Cannot cancel a ${vault.status} vault` });
      return;
    }

    db.prepare("UPDATE vaults SET status = 'cancelled' WHERE id = @id").run({ id: vault_id });

    res.json({ success: true, vault_id, new_status: 'cancelled' });
  } catch (err: any) {
    console.error('[API] Cancel error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Demo: Simulate Death ───

router.post('/vault/simulate-death', (req: Request, res: Response) => {
  try {
    const { vault_id } = req.body;

    if (!vault_id) {
      res.status(400).json({ error: 'vault_id required' });
      return;
    }

    const vault = db.prepare('SELECT * FROM vaults WHERE id = @id').get({ id: vault_id }) as VaultRow | undefined;

    if (!vault) {
      res.status(404).json({ error: 'Vault not found' });
      return;
    }

    if (vault.status !== 'active') {
      res.status(400).json({ error: `Vault is already in ${vault.status} mode` });
      return;
    }

    const now = Math.floor(Date.now() / 1000);

    // Set last_heartbeat far in the past so it looks expired
    const expiredTime = now - vault.heartbeat_interval - 3600; // expired 1 hour ago
    db.prepare('UPDATE vaults SET last_heartbeat = @expired, status = @status WHERE id = @id')
      .run({ expired: expiredTime, status: 'recovery', id: vault_id });

    broadcast({
      type: 'recovery_activated',
      vault_id,
      owner: vault.owner_address,
      beneficiary: vault.beneficiary_address,
      balance: vault.balance,
      simulated: true,
      timestamp: now,
    });

    console.log(`[DEMO] Simulated death for vault ${vault_id} -- recovery mode activated`);

    res.json({
      success: true,
      vault_id,
      new_status: 'recovery',
      message: 'Vault is now in recovery mode. Beneficiary can claim.',
      beneficiary: vault.beneficiary_address,
      balance: vault.balance,
    });
  } catch (err: any) {
    console.error('[API] Simulate death error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Shamir Split / Recover ───

router.post('/vault/split-key', async (req: Request, res: Response) => {
  try {
    const { vault_id, secret, total_shares, threshold } = req.body;

    if (!secret) {
      res.status(400).json({ error: 'secret required' });
      return;
    }

    const shares = splitSecret(secret, total_shares || 5, threshold || 3);

    // If vault_id provided, store shards
    if (vault_id) {
      for (let i = 0; i < shares.length; i++) {
        await storeShard(vault_id, i, shares[i]);
      }
    }

    res.json({
      success: true,
      total_shares: shares.length,
      threshold: threshold || 3,
      shares,
      stored_to_vault: vault_id || null,
    });
  } catch (err: any) {
    console.error('[API] Split key error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/vault/recover-key', (req: Request, res: Response) => {
  try {
    const { shares } = req.body;

    if (!shares || !Array.isArray(shares) || shares.length < 2) {
      res.status(400).json({ error: 'At least 2 shares required' });
      return;
    }

    const recovered = recoverSecret(shares);

    res.json({
      success: true,
      recovered_secret: recovered,
      shares_used: shares.length,
    });
  } catch (err: any) {
    console.error('[API] Recover key error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── World ID ───

router.post('/auth/verify-worldid', async (req: Request, res: Response) => {
  try {
    const { proof, nullifier_hash } = req.body;

    if (!nullifier_hash) {
      res.status(400).json({ error: 'nullifier_hash required' });
      return;
    }

    const result = await verifyWorldId(proof || {}, nullifier_hash);

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[API] World ID verify error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;

// ENS Resolution — using public ENS API (reliable, no RPC issues)
router.get('/ens/resolve/:name', async (req: any, res: any) => {
  try {
    const { name } = req.params;
    const response = await fetch(`https://api.ensideas.com/ens/resolve/${encodeURIComponent(name)}`);
    const data: any = await response.json();
    res.json({
      name,
      address: data.address || null,
      resolved: !!data.address,
      avatar: data.avatar || null,
      displayName: data.displayName || name,
    });
  } catch (err: any) {
    res.json({ name: req.params.name, address: null, resolved: false, error: err.message });
  }
});
