# DeadSwitch — Architecture Video Script

Dedicated "How It's Made" section for the ETHGlobal submission video.

**Duration:** 35-45 seconds
**Style:** Technical but accessible. Show the diagram, narrate the layers.

---

## Visual: Architecture Diagram

Build this diagram in Figma/Canva (1920×1080). Dark background (#09090b), emerald accent (#10b981).

```
                    ┌─────────────────────────────┐
                    │   DeadSwitch Frontend       │
                    │   Next.js 16 + wagmi v3     │
                    │   deadswitch.online         │
                    └──────────┬──────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
     ┌───────────────┐  ┌─────────────┐  ┌──────────────┐
     │   ENS API     │  │  Backend    │  │ MetaMask /   │
     │ Live resolver │  │ Express +   │  │ Ledger signs │
     │ (vitalik.eth) │  │ SQLite      │  │ tx           │
     └───────────────┘  └─────────────┘  └──────┬───────┘
                                                │
                                                ▼
                    ┌───────────────────────────────────┐
                    │   InheritanceVault.sol             │
                    │   Solidity 0.8.20 + OZ Reentrancy │
                    │   Sepolia 0xF957cDA1...CB7         │
                    └──────┬──────────────────┬─────────┘
                           │                  │
                           ▼                  ▼
              ┌────────────────────┐  ┌────────────────────┐
              │ Chainlink          │  │ Ledger ERC-7730    │
              │ Automation         │  │ Clear Signing      │
              │ checkUpkeep /      │  │ Manifest PR #2511  │
              │ performUpkeep      │  │                    │
              │ 2.1 LINK funded    │  │                    │
              └────────────────────┘  └────────────────────┘
```

---

## Narration Script (~40 seconds)

**[SCENE: Architecture diagram appears on screen. Each layer highlights as mentioned.]**

> "Here's how DeadSwitch is built.
>
> **[Highlight: Frontend]**
> The frontend is Next.js with wagmi — users connect MetaMask or Ledger, and deploy their own vault contract directly from their wallet. Each user gets a unique contract, no shared state.
>
> **[Highlight: ENS]**
> When you name your heir, we resolve the ENS name live via the ENS API — real-time, no hardcoded data. The resolved address and ENS name are both stored on-chain.
>
> **[Highlight: Smart Contract]**
> The core is a Solidity 0.8.20 contract on Sepolia, protected by OpenZeppelin's ReentrancyGuard. It holds the ETH, tracks the heartbeat, and handles recovery and claims.
>
> **[Highlight: Chainlink]**
> The recovery trigger is Chainlink Automation. Our contract implements the AutomationCompatibleInterface — checkUpkeep and performUpkeep. I registered a live upkeep on Sepolia, funded with 2.1 LINK. When a heartbeat expires, Chainlink keepers call performUpkeep and flip the vault into recovery mode. This is real on-chain state change, driven by Chainlink's decentralized network.
>
> **[Highlight: Ledger]**
> Every transaction — heartbeat, claim, cancel — is covered by an ERC-7730 Clear Signing manifest. I submitted it to Ledger's official registry as pull request #2511. Once merged, every Ledger device globally shows 'Send heartbeat' or 'Claim inheritance' instead of raw hex.
>
> **[Pause]**
>
> Non-custodial. Auditable. On-chain. That's DeadSwitch."

---

## Alternative Short Version (~25 seconds)

If you need to compress:

> "DeadSwitch is a Solidity vault contract on Sepolia, protected by OpenZeppelin's ReentrancyGuard. Each user deploys their own.
>
> Chainlink Automation triggers recovery — our contract implements checkUpkeep and performUpkeep. Live upkeep, 2.1 LINK funded.
>
> ENS resolves heir names live — no hardcoded data.
>
> Ledger clear signing via ERC-7730 manifest — PR #2511 submitted to their official registry.
>
> Frontend is Next.js plus wagmi. That's it. No centralized server, no custodian, no fake integrations."

---

## Visual Cues for HeyGen

| Time | Narration | Visual |
|------|-----------|--------|
| 0:00 | "Here's how DeadSwitch is built" | Full architecture diagram fades in |
| 0:04 | "Frontend is Next.js + wagmi" | Top box highlights (emerald glow) |
| 0:10 | "ENS resolution live" | Left branch highlights, show `vitalik.eth → 0xd8dA...` |
| 0:16 | "Solidity 0.8.20 on Sepolia" | Center contract box highlights |
| 0:22 | "Chainlink Automation" | Bottom-left box highlights, show LINK logo + 2.1 LINK |
| 0:30 | "Ledger ERC-7730" | Bottom-right box highlights, show Ledger logo + PR #2511 |
| 0:38 | "Non-custodial. On-chain." | Full diagram pulses emerald |

---

## Key Facts to Memorize (for live booth pitches)

- **Contract**: Solidity 0.8.20 + OpenZeppelin ReentrancyGuard
- **Address**: 0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7 (Sepolia)
- **Chainlink Upkeep ID**: 87279356...41100 (funded 2.1 LINK)
- **Ledger PR**: LedgerHQ/clear-signing-erc7730-registry#2511
- **ENS API**: Real live resolver via ens.domains backend
- **Frontend**: Next.js 16.2.2 + wagmi v3 + viem
- **Per-user deployment**: Each wallet deploys their own vault contract

---

## What NOT to say in the architecture section

- ❌ "We have a backend database" — judges don't care, it's auxiliary
- ❌ "We use TypeScript" — basic, doesn't differentiate
- ❌ "We integrate with 0G, Flare, World ID..." — stay focused on your 3 sponsors
- ❌ "We could add..." — no hypotheticals, only what's built
- ❌ "We're building..." — use "We built" — past tense, it's done

---

## What to say to sound credible

- ✅ Use specific version numbers: "Solidity 0.8.20", "Next.js 16", "wagmi v3"
- ✅ Name specific contracts: "ReentrancyGuard from OpenZeppelin"
- ✅ Give real numbers: "2.1 LINK funded", "9 functions covered"
- ✅ Reference specific interfaces: "AutomationCompatibleInterface"
- ✅ Cite registry URLs: "PR #2511 on LedgerHQ/clear-signing-erc7730-registry"
