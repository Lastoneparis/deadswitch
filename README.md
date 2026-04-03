# DeadSwitch

**Your crypto shouldn't die with you.**

> If you stop checking in, your family gets your crypto. No lawyer. No company. Just math.

🌐 **Live**: [deadswitch.online](https://deadswitch.online)
📊 **Pitch Deck**: [deadswitch.online/pitch-deck.html](https://deadswitch.online/pitch-deck.html)
⛓ **Contract (Sepolia)**: [`0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7`](https://sepolia.etherscan.io/address/0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7)

> ETHGlobal Cannes 2026

---

## The Problem

$140 billion in crypto is permanently lost. Owners died, lost keys, or became incapacitated without sharing access. Your family has no way to recover your funds.

Existing solutions: Casa ($250/yr, centralized, they hold keys), Sarcophagus (needs SARCO token, 3 employees). **No simple decentralized solution exists.**

## How DeadSwitch Works

```
Owner sets up vault → deposits crypto → adds heir (wife.eth)
              ↓
Owner sends heartbeat monthly → "I'm still here" → timer resets
              ↓
Owner stops checking in (90 days no heartbeat)
              ↓
Chainlink Automation triggers → RECOVERY MODE
              ↓
Heir verifies with World ID → claims on Ledger → funds transferred
```

**One sentence**: If you stop checking in, your family gets your crypto automatically.

---

## Demo (30 seconds)

1. **Owner heartbeat** → click "I'm Still Here" → green ✅
2. **Simulate death** → 90 days pass → vault turns RED 🚨
3. **Heir claims** → World ID verification → funds transferred 💰

Try it live: [deadswitch.online/dashboard](https://deadswitch.online/dashboard)

---

## Architecture

```
Owner (Ledger heartbeat)
        │
        ▼
InheritanceVault.sol (Sepolia)
        │
        ▼
Chainlink Automation (checks every 30 days)
        │ (90 days no heartbeat)
        ▼
   RECOVERY MODE
        │
        ▼
┌───────────┬─────────────┬──────────┐
│  APPROVE  │   PENDING   │  CLAIM   │
│ Heartbeat │   Warning   │   Heir   │
│ received  │    sent     │  claims  │
└───────────┴─────────────┴──────────┘
        │
   ┌────┴────┐
   ▼         ▼
0G Storage  ENS Names
(shards)   (wife.eth)
```

---

## Sponsor Integrations (All 6 Real)

| Sponsor | Role | API Endpoint | Status |
|---------|------|-------------|--------|
| **Chainlink** | Dead man's switch timer — checkUpkeep/performUpkeep | `/api/chainlink/status` | ✅ Contract deployed |
| **World ID** | Anti-bot heir verification — real IDKit widget | `/api/auth/verify-worldid` | ✅ Staging app live |
| **Ledger** | EIP-712 Clear Signing for heartbeat + claim | `/api/ledger/manifest` | ✅ Manifest served |
| **0G** | Encrypted key shard storage with fallback | `/api/zerog/status` | ✅ SDK integrated |
| **ENS** | "hugo.eth → wife.eth" human-readable inheritance | `/api/ens/resolve/:name` | ✅ Real resolution |
| **Flare** | TEE attestation for key reconstruction | `/api/flare/tee-info` | ✅ Hash chain verified |

---

## Security Model — Defense in Depth

| Attack | Defense |
|--------|---------|
| **Wrong person claims** | Pre-approved address (set at creation) + World ID (anti-bot) + optional secret phrase |
| **Owner in coma (not dead)** | 90-day grace period + multi-channel alerts at 30/60/75/85 days + owner can cancel anytime |
| **Key shards compromised** | Shamir 3-of-5 threshold — attacker needs 3 shards from different storage locations |
| **Heir loses access** | Owner can update beneficiary anytime while vault is active |
| **Fake heartbeat (hacker keeps owner "alive")** | Ledger hardware signing — can't be faked remotely |
| **Smart contract bug** | 35 tests pass, OpenZeppelin ReentrancyGuard, simple design |

---

## V2 Roadmap (Planned)

- [ ] **Trusted Guardian** — 1-2 contacts can PAUSE recovery ("my brother can vouch I'm alive")
- [ ] **Multi-sig claim** — Beneficiary + guardian must both approve (2-of-3)
- [ ] **Escalating alerts** — Email + SMS + push at 30/60/75/85 days
- [ ] **Cancel window** — 30-day buffer after recovery mode before funds move
- [ ] **Auto-heartbeat** — Scheduled transactions for convenience
- [ ] **Duress signal** — Special heartbeat that silently alerts authorities
- [ ] **Multi-heir** — Split inheritance between multiple beneficiaries by percentage
- [ ] **Legal document export** — Generate PDF will from vault config
- [ ] **Mainnet deployment** — Ethereum + Polygon + Arbitrum
- [ ] **Formal audit** — Before mainnet launch

---

## Features

- 🔐 **Dead Man's Switch** — Monthly heartbeat. Miss 90 days → recovery activates
- 🆔 **World ID** — Anti-bot verification for heir claims
- 🔑 **Ledger** — Hardware proof of life + hardware claim signing
- ⛓ **Chainlink** — Decentralized automation, can't be bribed or stopped
- 🏷 **ENS** — "hugo.eth → wife.eth" instead of hex addresses
- 💾 **0G Storage** — Encrypted Shamir key shards, decentralized persistence
- 🛡 **Flare TEE** — Tamper-proof key reconstruction with attestation proof
- 🌐 **6 Languages** — EN, FR, ES, IT, DE, JA (auto-detect browser)
- 🔑 **Shamir Secret Sharing** — Key split into 5 shards, 3 needed to recover

---

## Quick Start

```bash
git clone https://github.com/Lastoneparis/deadswitch.git
cd deadswitch
./scripts/demo.sh
```

Dashboard: [localhost:3000](http://localhost:3000) | API: [localhost:3002](http://localhost:3002)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Contracts | Solidity 0.8.20, Hardhat, Sepolia |
| Frontend | Next.js 16, Tailwind CSS, wagmi |
| Backend | Node.js, Express, SQLite |
| Oracles | Chainlink Automation |
| Identity | World ID (@worldcoin/idkit) |
| Hardware | Ledger Clear Signing (EIP-712) |
| Storage | 0G DA Layer (@0glabs/0g-ts-sdk) |
| Naming | ENS (ensideas API) |
| TEE | Flare Network |
| Key Splitting | Shamir Secret Sharing |
| i18n | 6 languages, browser auto-detect |

---

## Project Structure

```
deadswitch/
  contracts/          # InheritanceVault.sol (35 tests, deployed Sepolia)
  backend/            # Express API (13 endpoints, Shamir, 0G, World ID, Chainlink, Flare)
  frontend/           # Next.js (landing, dashboard, create, claim, how-it-works)
  scripts/            # demo.sh, deploy
```

---

## Inspiration

This project was inspired by the passing of my father. He left behind more than memories — he left behind the realization that everything digital can disappear forever when someone dies.

DeadSwitch exists so that losing someone doesn't mean losing everything they left behind.

---

Built at ETHGlobal Cannes 2026 | MIT License
