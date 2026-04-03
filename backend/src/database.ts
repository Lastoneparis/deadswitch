import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = path.join(__dirname, '..', 'data', 'deadswitch.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vaults (
      id TEXT PRIMARY KEY,
      owner_address TEXT NOT NULL,
      beneficiary_address TEXT NOT NULL,
      vault_address TEXT,
      owner_ens TEXT,
      beneficiary_ens TEXT,
      heartbeat_interval INTEGER NOT NULL DEFAULT 86400,
      last_heartbeat INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','recovery','claimed','cancelled')),
      world_id_nullifier TEXT,
      balance REAL NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS heartbeats (
      id TEXT PRIMARY KEY,
      vault_id TEXT NOT NULL,
      tx_hash TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (vault_id) REFERENCES vaults(id)
    );

    CREATE TABLE IF NOT EXISTS shard_storage (
      id TEXT PRIMARY KEY,
      vault_id TEXT NOT NULL,
      shard_index INTEGER NOT NULL,
      encrypted_shard TEXT NOT NULL,
      storage_type TEXT NOT NULL DEFAULT 'local' CHECK(storage_type IN ('local','0g')),
      storage_ref TEXT,
      tx_hash TEXT,
      explorer_url TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (vault_id) REFERENCES vaults(id)
    );

    CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      vault_id TEXT NOT NULL,
      claimer_address TEXT NOT NULL,
      world_id_verified INTEGER NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      tx_hash TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (vault_id) REFERENCES vaults(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      vault_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('heartbeat_reminder','recovery_activated','claim_completed')),
      message TEXT NOT NULL,
      sent_at INTEGER NOT NULL,
      FOREIGN KEY (vault_id) REFERENCES vaults(id)
    );

    CREATE TABLE IF NOT EXISTS tee_attestations (
      id TEXT PRIMARY KEY,
      vault_id TEXT NOT NULL,
      attestation_hash TEXT NOT NULL,
      enclave_id TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      input_shard_hashes TEXT NOT NULL,
      output_key_hash TEXT NOT NULL,
      signature TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (vault_id) REFERENCES vaults(id)
    );

    CREATE INDEX IF NOT EXISTS idx_attestations_vault ON tee_attestations(vault_id);

    CREATE INDEX IF NOT EXISTS idx_vaults_owner ON vaults(owner_address);
    CREATE INDEX IF NOT EXISTS idx_vaults_beneficiary ON vaults(beneficiary_address);
    CREATE INDEX IF NOT EXISTS idx_vaults_status ON vaults(status);
    CREATE INDEX IF NOT EXISTS idx_heartbeats_vault ON heartbeats(vault_id);
    CREATE INDEX IF NOT EXISTS idx_shards_vault ON shard_storage(vault_id);
    CREATE INDEX IF NOT EXISTS idx_claims_vault ON claims(vault_id);
  `);

  // Migration: add tx_hash and explorer_url columns if missing
  try {
    db.prepare('SELECT tx_hash FROM shard_storage LIMIT 1').get();
  } catch {
    db.exec('ALTER TABLE shard_storage ADD COLUMN tx_hash TEXT');
    db.exec('ALTER TABLE shard_storage ADD COLUMN explorer_url TEXT');
    console.log('[DB] Migrated shard_storage: added tx_hash, explorer_url columns');
  }

  // Seed demo vault if none exist
  const count = db.prepare('SELECT COUNT(*) as cnt FROM vaults').get() as { cnt: number };
  if (count.cnt === 0) {
    seedDemoVault();
  }

  console.log('[DB] Database initialized');
}

function seedDemoVault(): void {
  const now = Math.floor(Date.now() / 1000);
  const vaultId = uuidv4();

  db.prepare(`
    INSERT INTO vaults (id, owner_address, beneficiary_address, vault_address, owner_ens, beneficiary_ens, heartbeat_interval, last_heartbeat, status, world_id_nullifier, balance, created_at)
    VALUES (@id, @owner_address, @beneficiary_address, @vault_address, @owner_ens, @beneficiary_ens, @heartbeat_interval, @last_heartbeat, @status, @world_id_nullifier, @balance, @created_at)
  `).run({
    id: vaultId,
    owner_address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    beneficiary_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
    vault_address: '0x0000000000000000000000000000000000000001',
    owner_ens: 'vitalik.eth',
    beneficiary_ens: null,
    heartbeat_interval: 86400, // 24 hours
    last_heartbeat: now,
    status: 'active',
    world_id_nullifier: null,
    balance: 2.5,
    created_at: now,
  });

  // Add initial heartbeat
  db.prepare(`
    INSERT INTO heartbeats (id, vault_id, tx_hash, timestamp)
    VALUES (@id, @vault_id, @tx_hash, @timestamp)
  `).run({
    id: uuidv4(),
    vault_id: vaultId,
    tx_hash: '0x' + 'a'.repeat(64),
    timestamp: now,
  });

  console.log(`[DB] Demo vault seeded: ${vaultId}`);
}

export function getDb(): Database.Database {
  return db;
}

export default db;
