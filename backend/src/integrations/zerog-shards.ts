import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

// 0G Storage config
const ZG_RPC = 'https://evmrpc-testnet.0g.ai';
const ZG_INDEXER = 'https://indexer-storage-testnet-turbo.0g.ai';
const ZG_EXPLORER = 'https://chainscan-newton.0g.ai';
const ZG_PRIVATE_KEY = '0x4ed31b17c68511d17e43e656f0a5ce8cbf62957d9264617c321eb7690d842fce';

/**
 * Attempt real 0G Storage upload, fallback to local.
 */
async function upload0G(data: string): Promise<{ success: boolean; txHash?: string; rootHash?: string }> {
  try {
    // Use absolute path to bypass ts-node module resolution issues
    const sdkPath = path.join(__dirname, '..', '..', 'node_modules', '@0glabs', '0g-ts-sdk', 'lib.commonjs', 'index.js');
    const sdk = require(sdkPath);
    const { Indexer, ZgFile } = sdk;
    const ethersModule = require('ethers');
    const { ethers } = ethersModule;

    const provider = new ethers.JsonRpcProvider(ZG_RPC);
    const signer = new ethers.Wallet(ZG_PRIVATE_KEY, provider);

    // Write shard data to temp file (0G SDK requires a file path)
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `deadswitch-shard-${uuidv4()}.json`);
    fs.writeFileSync(tmpFile, data, 'utf-8');

    try {
      const zgFile = await ZgFile.fromFilePath(tmpFile);
      const indexer = new Indexer(ZG_INDEXER);

      const [result, err] = await indexer.upload(zgFile, ZG_RPC, signer);
      await zgFile.close();

      if (err) {
        console.error('[0G] Upload error:', err.message);
        return { success: false };
      }

      console.log(`[0G] Upload success! txHash=${result.txHash}, rootHash=${result.rootHash}`);
      return { success: true, txHash: result.txHash, rootHash: result.rootHash };
    } finally {
      // Clean up temp file
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  } catch (err: any) {
    console.error(`[0G] SDK upload failed: ${err.message}`);
    return { success: false };
  }
}

/**
 * Store an encrypted shard.
 * Tries real 0G Storage upload first, falls back to local SQLite.
 */
export async function storeShard(
  vaultId: string,
  shardIndex: number,
  encryptedShard: string
): Promise<{ stored: boolean; hash: string; storage_type: string; tx_hash?: string; explorer_url?: string }> {
  const hash = crypto.createHash('sha256').update(encryptedShard).digest('hex');

  // Try 0G upload first
  let storageType = 'local';
  let txHash: string | undefined;
  let explorerUrl: string | undefined;

  const zgResult = await upload0G(JSON.stringify({
    vault_id: vaultId,
    shard_index: shardIndex,
    encrypted_shard: encryptedShard,
    hash,
    timestamp: Math.floor(Date.now() / 1000),
  }));

  if (zgResult.success && zgResult.txHash) {
    storageType = '0g';
    txHash = zgResult.txHash;
    explorerUrl = `${ZG_EXPLORER}/tx/${zgResult.txHash}`;
    console.log(`[0G] Shard ${shardIndex} uploaded to 0G Storage: ${explorerUrl}`);
  } else {
    console.log(`[0G] Fallback to local storage for shard ${shardIndex}`);
  }

  try {
    db.prepare(`
      INSERT INTO shard_storage (id, vault_id, shard_index, encrypted_shard, storage_type, storage_ref, tx_hash, explorer_url, created_at)
      VALUES (@id, @vault_id, @shard_index, @encrypted_shard, @storage_type, @storage_ref, @tx_hash, @explorer_url, @created_at)
    `).run({
      id: uuidv4(),
      vault_id: vaultId,
      shard_index: shardIndex,
      encrypted_shard: encryptedShard,
      storage_type: storageType,
      storage_ref: zgResult.rootHash || hash,
      tx_hash: txHash || null,
      explorer_url: explorerUrl || null,
      created_at: Math.floor(Date.now() / 1000),
    });

    console.log(`[0G] Shard ${shardIndex} stored for vault ${vaultId} (type: ${storageType}, hash: ${hash.slice(0, 16)}...)`);

    return { stored: true, hash, storage_type: storageType, tx_hash: txHash, explorer_url: explorerUrl };
  } catch (err: any) {
    console.error(`[0G] Failed to store shard: ${err.message}`);
    return { stored: false, hash: '', storage_type: 'local' };
  }
}

/**
 * Retrieve all shards for a vault (when vault enters recovery mode).
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
  shards: { index: number; storage_type: string; hash: string; tx_hash: string | null; explorer_url: string | null; created_at: number }[];
}> {
  const rows = db.prepare(`
    SELECT shard_index, storage_type, storage_ref, tx_hash, explorer_url, created_at FROM shard_storage
    WHERE vault_id = @vault_id
    ORDER BY shard_index ASC
  `).all({ vault_id: vaultId }) as { shard_index: number; storage_type: string; storage_ref: string; tx_hash: string | null; explorer_url: string | null; created_at: number }[];

  return {
    total: rows.length,
    shards: rows.map((r) => ({
      index: r.shard_index,
      storage_type: r.storage_type,
      hash: r.storage_ref,
      tx_hash: r.tx_hash || null,
      explorer_url: r.explorer_url || null,
      created_at: r.created_at,
    })),
  };
}

/**
 * Get global 0G storage status (for /api/zerog/status endpoint).
 */
export function getZeroGStatus(): {
  config: { rpc: string; indexer: string; explorer: string; wallet: string };
  shards: { vault_id: string; shard_index: number; storage_type: string; storage_ref: string; tx_hash: string | null; explorer_url: string | null; created_at: number }[];
  summary: { total: number; on_0g: number; local: number };
} {
  const rows = db.prepare(`
    SELECT vault_id, shard_index, storage_type, storage_ref, tx_hash, explorer_url, created_at
    FROM shard_storage ORDER BY created_at DESC
  `).all() as { vault_id: string; shard_index: number; storage_type: string; storage_ref: string; tx_hash: string | null; explorer_url: string | null; created_at: number }[];

  const on0g = rows.filter(r => r.storage_type === '0g').length;

  return {
    config: {
      rpc: ZG_RPC,
      indexer: ZG_INDEXER,
      explorer: ZG_EXPLORER,
      wallet: '0x363D5a8Af9d65F7e566B8BaD4984028141C247d6',
    },
    shards: rows,
    summary: {
      total: rows.length,
      on_0g: on0g,
      local: rows.length - on0g,
    },
  };
}
