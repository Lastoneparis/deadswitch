# DeadSwitch — Local Deployment Guide

Run DeadSwitch locally for development or judging evaluation.

## Prerequisites

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **npm** or **pnpm**
- **Git**
- **MetaMask** browser extension
- **Sepolia testnet ETH** ([sepoliafaucet.com](https://sepoliafaucet.com))

---

## Quick Start (5 minutes)

```bash
# 1. Clone the repo
git clone https://github.com/Lastoneparis/deadswitch.git
cd deadswitch

# 2. Install dependencies (all 3 workspaces)
cd contracts && npm install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values (see below)

# 4. Start backend (Terminal 1)
cd backend
npm run dev
# Runs on http://localhost:3002

# 5. Start frontend (Terminal 2)
cd frontend
npm run dev
# Runs on http://localhost:3000

# 6. Open http://localhost:3000 in your browser
```

---

## Environment Variables

### Root `.env`
```bash
# Smart contract deployer wallet (Sepolia)
DEPLOYER_PRIVATE_KEY=0x...
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Etherscan (for contract verification)
ETHERSCAN_API_KEY=YourEtherscanAPIKey

# World ID (optional — staging app works out of box)
WORLDID_APP_ID=app_abf4ec65ebe37b0642f7393eae34f709
```

### `backend/.env`
```bash
PORT=3002
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VAULT_CONTRACT_ADDRESS=0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7

# 0G Storage (optional — uses fallback if unset)
ZG_PRIVATE_KEY=0x...

# World ID verification
WORLDID_APP_ID=app_abf4ec65ebe37b0642f7393eae34f709
```

### `frontend/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

---

## Deploy Your Own Contract

If you want to deploy a fresh contract to Sepolia:

```bash
cd contracts

# 1. Set DEPLOYER_PRIVATE_KEY in .env (fund it with Sepolia ETH first)

# 2. Compile
npx hardhat compile

# 3. Deploy
npx hardhat run scripts/deploy.ts --network sepolia

# 4. Verify on Etherscan
npx hardhat verify --network sepolia \
  YOUR_DEPLOYED_ADDRESS \
  BENEFICIARY_ADDRESS \
  HEARTBEAT_INTERVAL_SECONDS \
  WORLD_ID_NULLIFIER \
  "" "" 

# 5. Update frontend/src/lib/contract.ts with your address
```

---

## Chainlink Automation Setup (Optional)

Register an upkeep for your deployed contract:

1. Get Sepolia LINK: https://faucets.chain.link
2. Visit https://automation.chain.link/sepolia
3. Click "Register new Upkeep"
4. Select "Custom logic"
5. Target contract: your deployed address
6. Fund with 2+ LINK
7. Copy the Upkeep ID for your docs

---

## Running Tests

```bash
# Smart contract tests (35 tests)
cd contracts
npx hardhat test

# Frontend type checking
cd frontend
npx tsc --noEmit

# Backend
cd backend
npm run test
```

---

## Production Deployment (what we did)

- **Frontend + Backend**: VPS running nginx + PM2
- **SSL**: Let's Encrypt via certbot
- **Database**: SQLite (local file)
- **Contract**: Sepolia testnet via hardhat

### nginx config snippet

```nginx
server {
    server_name deadswitch.online;
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/deadswitch.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/deadswitch.online/privkey.pem;

    location /api/ {
        proxy_pass http://127.0.0.1:3002/api/;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

### PM2 commands

```bash
pm2 start backend/npm --name deadswitch-api -- run start
pm2 start frontend/npm --name deadswitch-web -- run start
pm2 save
pm2 startup
```

---

## Troubleshooting

### MetaMask doesn't pop up when deploying a vault
- Make sure you're on **Sepolia testnet** (chainId 11155111)
- Click "Switch to Sepolia" button if shown
- Check browser console for errors
- Try disconnecting + reconnecting MetaMask

### Transaction reverts with "Beneficiary cannot be owner"
- You're trying to set your own wallet as the heir
- Use a **different address** as beneficiary

### "Heartbeat interval too short"
- Contract requires **minimum 30 days** (2,592,000 seconds)
- Select 30, 60, or 90 days in the create flow

### Backend API returns 500
- Check `backend/.env` is correctly configured
- Verify SQLite database file exists: `backend/data/deadswitch.db`
- Check console logs: `pm2 logs deadswitch-api`

### ENS resolution returns null
- Only `.eth` names on Ethereum mainnet resolve
- Test with known names: `vitalik.eth`, `nick.eth`
- Check API endpoint directly: `curl http://localhost:3002/api/ens/resolve/vitalik.eth`

---

## Architecture

```
User → Next.js frontend → wagmi → MetaMask → Sepolia RPC
                       ↓
                  Express API → SQLite
                       ↓
                  ENS API (ensideas)
                  World ID API
                  0G Storage SDK
```

---

## Contribution

Pull requests welcome! Please:
1. Open an issue first to discuss major changes
2. Add tests for new functionality
3. Follow existing code style

---

## Security

Found a vulnerability? Open a [security issue](https://github.com/Lastoneparis/deadswitch/issues/new?template=security.md) or email security@deadswitch.online.

---

## License

MIT — see [LICENSE](./LICENSE)
