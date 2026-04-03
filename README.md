# DeadSwitch

**Decentralized crypto inheritance protocol. Your crypto shouldn't die with you.**

$140 billion in crypto is permanently lost because owners died without passing their keys. DeadSwitch is a dead man's switch for crypto: if you stop checking in, your family gets your funds. No lawyer. No company. No keys held by anyone. Just math.

> ETHGlobal Cannes 2026

---

## Quick Start

```bash
git clone https://github.com/your-org/deadswitch.git
cd deadswitch
cp .env.example .env
./scripts/demo.sh
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Architecture

```
                    +-----------------------+
                    |   Owner (Ledger)      |
                    |   Monthly heartbeat   |
                    +-----------+-----------+
                                |
                                v
                    +-----------+-----------+
                    | InheritanceVault.sol   |
                    |      (Sepolia)        |
                    +-----------+-----------+
                                |
                                v
                    +-----------+-----------+
                    | Chainlink Automation  |
                    |   (every 30 days)     |
                    +-----------+-----------+
                                |
                         90 days, no
                          heartbeat
                                |
                                v
                    +-----------+-----------+
                    |    RECOVERY MODE      |
                    +-----------+-----------+
                                |
                                v
                    +-----------+-----------+
                    |  Heir (World ID)      |
                    |  Claim via Ledger     |
                    |  Funds -> Heir wallet |
                    +-----------------------+
                                |
              +-----------------+-----------------+
              |                 |                 |
        +-----+-----+    +-----+-----+    +------+----+
        | 0G Storage|    | ENS Names |    | Flare TEE |
        +-----------+    +-----------+    +-----------+
```

---

## Features

- **Dead Man's Switch** — Monthly heartbeat from hardware wallet. Miss 90 days and recovery activates.
- **World ID Verification** — Heir must prove they're human. No fraud on a $500K inheritance.
- **Ledger Integration** — Hardware proof of life (owner) and hardware claim signing (heir).
- **Chainlink Automation** — Decentralized timer. Can't be bribed, can't be stopped.
- **ENS Support** — "hugo.eth -> wife.eth" instead of raw addresses.
- **0G Encrypted Storage** — Key shards survive 50 years, fully decentralized.
- **Flare TEE** — Tamper-proof key reconstruction in trusted execution environment.
- **AI Monitoring** — Local Llama 3.2 watches vault health, detects fraud, generates legal summaries.

---

## Sponsor Integrations

| Sponsor   | Role                          | Why Essential                                  |
|-----------|-------------------------------|------------------------------------------------|
| Chainlink | Dead man's switch timer       | Decentralized, unstoppable, can't be bribed    |
| World     | Verify heir is human          | Prevents fraud on $500K inheritance             |
| Ledger    | Hardware proof of life + claim| Can't be faked remotely                         |
| 0G        | Encrypted key shard storage   | Survives 50 years, decentralized                |
| ENS       | "hugo.eth -> wife.eth"        | Human-readable will                             |
| Flare     | TEE key reconstruction        | Tamper-proof computation                        |

---

## Demo Walkthrough

1. **Connect wallet** — Owner connects Ledger, creates a vault, designates an heir.
2. **Send heartbeat** — Owner clicks "I'm alive" once a month. Transaction recorded on-chain.
3. **Simulate death** — Click "Simulate Death" to fast-forward 90 days with no heartbeat.
4. **Recovery mode** — Vault turns red. Heir is notified.
5. **Heir claims** — Heir verifies with World ID, signs with Ledger, funds transfer automatically.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Contracts  | Solidity, Hardhat, Sepolia        |
| Oracles    | Chainlink Automation              |
| Identity   | World ID (Worldcoin)              |
| Hardware   | Ledger Connect Kit                |
| Storage    | 0G decentralized storage          |
| Naming     | ENS (Ethereum Name Service)       |
| TEE        | Flare Network                     |
| Frontend   | Next.js, Tailwind CSS             |
| Backend    | Node.js, Express                  |
| AI         | Llama 3.2 (local inference)       |

---

## Revenue Model

| Plan       | Price         | Includes                              |
|------------|---------------|---------------------------------------|
| Free       | $0            | 1 vault, 1 heir                       |
| Pro        | $9.99/month   | 5 vaults, alerts, ENS, AI monitor     |
| Family     | $29.99/month  | Shared vault, legal docs, multi-heir  |
| Enterprise | Custom        | Exchange integration, white-label     |

**Target**: 10,000 users x $10 avg = **$1.2M ARR**

---

## Project Structure

```
deadswitch/
  contracts/       # Solidity smart contracts (InheritanceVault.sol)
  backend/         # Express API server
  frontend/        # Next.js frontend
  scripts/         # Deployment and demo scripts
```

---

## Team

Built at ETHGlobal Cannes 2026.

---

## License

MIT
