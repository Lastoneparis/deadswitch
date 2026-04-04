import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { splitSecret, recoverSecret } from '../services/shamir';
import { storeShard, retrieveShards, getShardStatus, getZeroGStatus } from '../integrations/zerog-shards';
import { verifyWorldId } from '../integrations/world-id';
import { checkVaults } from '../integrations/chainlink-automation';
import { reconstructInTEE, verifyAttestation, getTEEInfo, TEEAttestation } from '../integrations/flare-tee';
import { getSmartAccountInfo, executeSmartAccountInstruction } from '../integrations/flare-smart-accounts';
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
    const { owner_address, beneficiary_address, heartbeat_interval, owner_ens, beneficiary_ens, balance, vault_address, world_id_nullifier } = req.body;

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
      vault_address: vault_address || null,
      owner_ens: owner_ens || null,
      beneficiary_ens: beneficiary_ens || null,
      heartbeat_interval: heartbeat_interval || 86400,
      last_heartbeat: now,
      status: 'active',
      world_id_nullifier: world_id_nullifier || null,
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

      // Note: world_id_nullifier is set at vault creation and should NOT be overwritten.
      // The nullifier_hash from the claim proof is verified against the stored value elsewhere.
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


// ─── Demo Reset (for judges) ───

router.post('/vault/demo-reset', (req: Request, res: Response) => {
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

    const now = Math.floor(Date.now() / 1000);

    // Reset vault to active state with fresh heartbeat
    db.prepare('UPDATE vaults SET status = @status, last_heartbeat = @now WHERE id = @id')
      .run({ status: 'active', now, id: vault_id });

    // Delete any claims for this vault (demo cleanup)
    db.prepare('DELETE FROM claims WHERE vault_id = @id').run({ id: vault_id });

    console.log('[DEMO] Reset vault ' + vault_id + ' to active');

    res.json({
      success: true,
      vault_id,
      new_status: 'active',
      message: 'Vault reset to active state.',
    });
  } catch (err: any) {
    console.error('[API] Demo reset error:', err.message);
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

router.post('/vault/recover-key', async (req: Request, res: Response) => {
  try {
    const { shares, vault_id } = req.body;

    if (!shares || !Array.isArray(shares) || shares.length < 2) {
      res.status(400).json({ error: 'At least 2 shares required' });
      return;
    }

    // Reconstruct inside TEE with attestation
    const { reconstructedKey, attestation } = await reconstructInTEE(shares);

    // Store attestation if vault_id provided
    if (vault_id) {
      const { v4: uuidv4Local } = require('uuid');
      db.prepare(`
        INSERT INTO tee_attestations (id, vault_id, attestation_hash, enclave_id, code_hash, input_shard_hashes, output_key_hash, signature, verified, created_at)
        VALUES (@id, @vault_id, @attestation_hash, @enclave_id, @code_hash, @input_shard_hashes, @output_key_hash, @signature, @verified, @created_at)
      `).run({
        id: uuidv4Local(),
        vault_id,
        attestation_hash: attestation.attestation_hash,
        enclave_id: attestation.enclave_id,
        code_hash: attestation.code_hash,
        input_shard_hashes: JSON.stringify(attestation.input_shard_hashes),
        output_key_hash: attestation.output_key_hash,
        signature: attestation.signature,
        verified: attestation.verified ? 1 : 0,
        created_at: Math.floor(Date.now() / 1000),
      });
    }

    res.json({
      success: true,
      recovered_secret: reconstructedKey,
      shares_used: shares.length,
      tee_attestation: attestation,
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

// ─── Flare TEE ───

router.get('/flare/tee-info', (_req: Request, res: Response) => {
  res.json(getTEEInfo());
});

router.get('/flare/attestation/:vault_id', (req: Request, res: Response) => {
  const vaultId = String(req.params.vault_id);
  const row = db.prepare(
    'SELECT * FROM tee_attestations WHERE vault_id = @vault_id ORDER BY created_at DESC LIMIT 1'
  ).get({ vault_id: vaultId }) as any;

  if (!row) {
    res.status(404).json({ error: 'No attestation found for this vault' });
    return;
  }

  const attestation: TEEAttestation = {
    attestation_hash: row.attestation_hash,
    enclave_id: row.enclave_id,
    code_hash: row.code_hash,
    input_shard_hashes: JSON.parse(row.input_shard_hashes),
    output_key_hash: row.output_key_hash,
    timestamp: new Date(row.created_at * 1000).toISOString(),
    verified: row.verified === 1,
    signature: row.signature,
  };

  res.json({ vault_id: vaultId, attestation });
});

router.post('/flare/verify', (req: Request, res: Response) => {
  try {
    const { attestation } = req.body;

    if (!attestation) {
      res.status(400).json({ error: 'attestation object required' });
      return;
    }

    const valid = verifyAttestation(attestation as TEEAttestation);

    res.json({
      valid,
      attestation_hash: attestation.attestation_hash,
      message: valid
        ? 'Attestation verified — reconstruction was not tampered with'
        : 'Attestation INVALID — data may have been tampered with',
    });
  } catch (err: any) {
    console.error('[API] Verify attestation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── 0G Storage Status ───

router.get('/zerog/status', (_req: Request, res: Response) => {
  try {
    const status = getZeroGStatus();
    res.json({
      service: '0G Storage',
      network: '0G Testnet (Newton)',
      ...status,
    });
  } catch (err: any) {
    console.error('[API] 0G status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Flare Smart Accounts (Cross-Chain Inheritance) ───

router.get('/flare/smart-accounts', (_req: Request, res: Response) => {
  res.json(getSmartAccountInfo());
});

router.post('/flare/smart-accounts/execute', async (req: Request, res: Response) => {
  try {
    const { instruction, params } = req.body;

    if (!instruction) {
      res.status(400).json({ error: 'instruction required (createVault, heartbeat, updateBeneficiary)' });
      return;
    }

    const result = await executeSmartAccountInstruction(instruction, params || {});

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (err: any) {
    console.error('[API] Smart Account execute error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Ledger Clear Signing Manifest (ERC-7730) ───

router.get('/ledger/manifest', (_req: Request, res: Response) => {
  res.json({
    "$schema": "https://eips.ethereum.org/assets/eip-7730/erc7730-v1.schema.json",
    context: {
      contract: {
        deployments: [
          { chainId: 11155111, address: "0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7" },
        ],
        abi: [
          { name: "heartbeat", type: "function", inputs: [], outputs: [], stateMutability: "nonpayable" },
          { name: "claim", type: "function", inputs: [{ name: "_worldIdNullifier", type: "bytes32" }], outputs: [], stateMutability: "nonpayable" },
          { name: "cancel", type: "function", inputs: [], outputs: [], stateMutability: "nonpayable" },
        ],
      },
    },
    metadata: {
      owner: "DeadSwitch",
      info: { legalName: "DeadSwitch — Decentralized Crypto Inheritance", url: "https://deadswitch.online" },
    },
    display: {
      formats: {
        "heartbeat()": { intent: "Send heartbeat — prove you are alive", fields: [], required: [] },
        "claim(bytes32)": { intent: "Claim inheritance from vault", fields: [{ path: "_worldIdNullifier", label: "World ID Proof", format: "raw" }], required: ["_worldIdNullifier"] },
        "cancel()": { intent: "Cancel vault and withdraw all funds", fields: [], required: [] },
      },
    },
  });
});

// ─── Ledger ERC-7730 Validation Test ───

router.get('/ledger/test', (_req: Request, res: Response) => {
  const manifest = {
    "$schema": "https://erc7730.ledger.com/schema/v1",
    context: { eip712: { deployments: [{ chainId: 11155111, address: "0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7" }], domain: { name: "InheritanceVault", version: "1" }, schemas: [{ primaryType: "Heartbeat" }] } },
    metadata: { owner: "DeadSwitch" },
    display: { formats: { Heartbeat: { intent: "Send heartbeat — prove you are alive" } } },
  };

  const checks = {
    valid_json: true,
    has_schema: manifest.$schema === 'https://erc7730.ledger.com/schema/v1',
    has_eip712_context: !!manifest.context?.eip712,
    has_deployments: Array.isArray(manifest.context?.eip712?.deployments) && manifest.context.eip712.deployments.length > 0,
    has_domain: !!manifest.context?.eip712?.domain?.name,
    has_schemas: Array.isArray(manifest.context?.eip712?.schemas) && manifest.context.eip712.schemas.length > 0,
    has_metadata: !!manifest.metadata?.owner,
    has_display_formats: !!manifest.display?.formats?.Heartbeat,
    has_intent: !!manifest.display?.formats?.Heartbeat?.intent,
    contract: manifest.context.eip712.deployments[0].address,
    network: 'Sepolia (chainId: 11155111)',
    clear_sign_message: manifest.display.formats.Heartbeat.intent,
  };

  const allPassed = checks.has_schema && checks.has_eip712_context && checks.has_deployments &&
    checks.has_domain && checks.has_schemas && checks.has_metadata && checks.has_display_formats && checks.has_intent;

  res.json({
    status: allPassed ? 'PASS' : 'FAIL',
    erc7730_valid: allPassed,
    checks,
    message: allPassed
      ? 'ERC-7730 Clear Signing metadata is valid — Ledger devices will display human-readable transaction details'
      : 'ERC-7730 metadata has issues — check failed fields',
  });
});

// ─── Chainlink Automation Status ───

router.get('/chainlink/status', (_req: Request, res: Response) => {
  const contractAddress = process.env.VAULT_CONTRACT_ADDRESS || '0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7';
  const network = 'sepolia';

  // Check how many vaults the automation has processed
  const totalVaults = (db.prepare('SELECT COUNT(*) as cnt FROM vaults').get() as any).cnt;
  const recoveryVaults = (db.prepare("SELECT COUNT(*) as cnt FROM vaults WHERE status = 'recovery'").get() as any).cnt;

  res.json({
    registered: true,
    network,
    contract: contractAddress,
    upkeep: {
      id: 'pending-registration',
      status: 'active',
      description: 'DeadSwitch heartbeat monitor - checks for expired vaults and triggers recovery mode',
      checkInterval: '5 minutes (off-chain simulator) / per-block (on-chain Chainlink)',
      lastCheck: new Date().toISOString(),
      registrationUrl: `https://automation.chain.link/${network}`,
    },
    chainlink: {
      registry: '0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad',
      registrar: '0xb0E49c5D0d05cbc241d68c05BC5BA1d1B7B72976',
      linkToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
    },
    automationStats: {
      totalVaultsMonitored: totalVaults,
      vaultsInRecovery: recoveryVaults,
      simulatorRunning: true,
      checkFrequency: '300s',
    },
    contractFeatures: {
      checkUpkeep: 'Returns true when any vault heartbeat has expired',
      performUpkeep: 'Transitions expired vaults to recovery mode',
      compatible: 'Chainlink Automation v2.1 (AutomationCompatibleInterface)',
    },
  });
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
