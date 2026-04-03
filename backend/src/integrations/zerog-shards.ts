import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

/**
 * Store an encrypted shard.
 * Hackathon: stores locally in SQLite with SHA-256 hash.
 * Production: would use 0G DA layer for decentralized availability.
 */
export async function storeShard(
  vaultId: string,
  shardIndex: number,
  encryptedShard: string
): Promise<{ stored: boolean; hash: string; storage_type: string }> {
  const hash = crypto.createHash('sha256').update(encryptedShard).digest('hex');

  try {
    db.prepare(`
      INSERT INTO shard_storage (id, vault_id, shard_index, encrypted_shard, storage_type, storage_ref, created_at)
      VALUES (@id, @vault_id, @shard_index, @encrypted_shard, @storage_type, @storage_ref, @created_at)
    `).run({
      id: uuidv4(),
      vault_id: vaultId,
      shard_index: shardIndex,
      encrypted_shard: encryptedShard,
      storage_type: 'local', // Would be '0g' in production
      storage_ref: hash,
      created_at: Math.floor(Date.now() / 1000),
    });

    console.log(`[0G] Shard ${shardIndex} stored for vault ${vaultId} (hash: ${hash.slice(0, 16)}...)`);

    return { stored: true, hash, storage_type: 'local' };
  } catch (err: any) {
    console.error(`[0G] Failed to store shard: ${err.message}`);
    return { stored: false, hash: '', storage_type: 'local' };
  }
}

/**
 * Retrieve all shards for a vault (when vault enters recovery mode).
 * Returns the encrypted shard strings in order by shard_index.
 */
export async function retrieveShards(vaultId: string): Promise<string[]> {
  const rows = db.prepare(`
    SELECT encrypted_shard FROM shard_storage
    WHERE vault_id = @vault_id
    ORDER BY shard_index ASC
  `).all({ vault_id: vaultId }) as { encrypted_shard: string }[];

  console.log(`[0G] Retrieved ${rows.length} shards for vault ${vaultId}`);

  return rows.map((r) => r.encrypted_shard);
}

/**
 * Get shard metadata (without revealing the actual shard data).
 */
export async function getShardStatus(vaultId: string): Promise<{
  total: number;
  shards: { index: number; storage_type: string; hash: string; created_at: number }[];
}> {
  const rows = db.prepare(`
    SELECT shard_index, storage_type, storage_ref, created_at FROM shard_storage
    WHERE vault_id = @vault_id
    ORDER BY shard_index ASC
  `).all({ vault_id: vaultId }) as { shard_index: number; storage_type: string; storage_ref: string; created_at: number }[];

  return {
    total: rows.length,
    shards: rows.map((r) => ({
      index: r.shard_index,
      storage_type: r.storage_type,
      hash: r.storage_ref,
      created_at: r.created_at,
    })),
  };
}
