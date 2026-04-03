import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';

import { initDatabase } from './database';
import { initWebSocket } from './websocket';
import { startAutomationSimulator } from './integrations/chainlink-automation';
import { demoShamirSplit } from './services/shamir';
import routes from './api/routes';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api', routes);

// Root
app.get('/', (_req, res) => {
  res.json({
    name: 'DeadSwitch Protocol',
    description: 'Decentralized crypto inheritance via Shamir Secret Sharing, World ID, and Chainlink Automation',
    version: '1.0.0',
    hackathon: 'ETHGlobal Cannes 2026',
    endpoints: {
      health: '/api/health',
      stats: '/api/stats',
      create_vault: 'POST /api/vault/create',
      heartbeat: 'POST /api/vault/heartbeat',
      claim: 'POST /api/vault/claim',
      simulate_death: 'POST /api/vault/simulate-death',
      split_key: 'POST /api/vault/split-key',
      recover_key: 'POST /api/vault/recover-key',
      websocket: 'ws://localhost:' + PORT + '/ws',
    },
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize
initDatabase();
initWebSocket(server);

// Verify Shamir works on startup
const shamirDemo = demoShamirSplit();
console.log(`[Shamir] Self-test: split into ${shamirDemo.shares.length} shares, recovered=${shamirDemo.success}`);
if (!shamirDemo.success) {
  console.error('[Shamir] FATAL: Shamir self-test failed!');
  process.exit(1);
}

// Start Chainlink Automation simulator
startAutomationSimulator();

// Start server
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║       KEY RECOVERY PROTOCOL BACKEND       ║
  ║       ETHGlobal Cannes 2026               ║
  ╠═══════════════════════════════════════════╣
  ║  HTTP:  http://localhost:${PORT}             ║
  ║  WS:    ws://localhost:${PORT}/ws            ║
  ╠═══════════════════════════════════════════╣
  ║  Shamir SSS:     OK                       ║
  ║  Chainlink Sim:  Running (5min interval)  ║
  ║  World ID:       Mock mode                ║
  ║  0G Storage:     Local fallback           ║
  ╚═══════════════════════════════════════════╝
  `);
});

export default server;
