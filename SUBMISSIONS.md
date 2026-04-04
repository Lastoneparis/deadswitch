# DeadSwitch — ETHGlobal Cannes 2026 Submissions

Complete sponsor submission texts and booth visit guide.

---

## Project Overview (for main submission)

**Name**: DeadSwitch
**Tagline**: Your crypto shouldn't die with you.
**URL**: https://deadswitch.online
**GitHub**: https://github.com/Lastoneparis/deadswitch
**Contract**: 0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7 (Sepolia)
**Video**: [HeyGen pitch video]

**Short description** (500 chars):
> DeadSwitch is a decentralized dead man's switch for crypto inheritance. Owners deposit ETH into a smart contract vault and designate an heir by ENS name. They send a monthly heartbeat to prove they're alive. If heartbeats stop, Chainlink Automation triggers recovery, and the heir verifies with World ID to claim the funds. Non-custodial, on-chain, no lawyer needed.

---

## Sponsor 1: Chainlink — "Connect the World with Chainlink" ($4K track)

```
DeadSwitch uses Chainlink Automation as the core trigger for 
inheritance recovery. Our InheritanceVault smart contract 
implements the AutomationCompatibleInterface (checkUpkeep + 
performUpkeep), so Chainlink's decentralized keeper network 
monitors every vault's heartbeat on-chain.

When a heartbeat expires (owner stops checking in), Chainlink 
Automation calls performUpkeep(), which executes a state change: 
status = Status.RecoveryMode + recoveryActivatedAt = block.timestamp. 
This is a real state change on-chain, triggered entirely by 
Chainlink — no centralized server involved.

Live upkeep registered on Sepolia:
https://automation.chain.link/sepolia/87279356538326214029017935707370766485868215829937943885304798493436723241100
Funded with 2.1 LINK, targeting contract 0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7.

Bonus: the dashboard also reads Chainlink ETH/USD Price Feed 
(0x694AA1769357215DE4FAC081bf1f309aDC325306) for live USD 
conversion of vault balances.
```

**Evidence links**:
- Contract: https://sepolia.etherscan.io/address/0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7
- Upkeep: https://automation.chain.link/sepolia/87279356538326214029017935707370766485868215829937943885304798493436723241100
- Source: https://github.com/Lastoneparis/deadswitch/blob/master/contracts/contracts/InheritanceVault.sol (lines 92-105)

---

## Sponsor 2: ENS — "Best Use of ENS" ($3K prize)

```
DeadSwitch uses ENS as the core beneficiary identification layer. 
When you set up an inheritance vault, you designate your heir by 
ENS name — "wife.eth" instead of "0x742d35Cc...". This isn't an 
afterthought; it's the fundamental UX of the product.

Live ENS resolution happens as the owner types:
- Real-time debounced resolution via ens.domains backend
- Visual feedback (resolving → resolved → not found) with status 
  indicator  
- Resolved address stored on-chain in the InheritanceVault contract 
  (ownerENS + beneficiaryENS string fields in Solidity)
- Heirs can search for their inheritance by their own ENS name

Why ENS fits inheritance better than any other use case:
Estate planning is about PEOPLE, not wallet addresses. "Leave my 
crypto to wife.eth" is something a regular person understands. 
"Leave my crypto to 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18" 
is not.

No hardcoded values — try typing any real ENS name at 
deadswitch.online/create to see live resolution.
```

**Evidence links**:
- Live demo: https://deadswitch.online/create (step 2)
- Backend endpoint: https://deadswitch.online/api/ens/resolve/vitalik.eth
- Solidity fields: https://github.com/Lastoneparis/deadswitch/blob/master/contracts/contracts/InheritanceVault.sol (lines 20-21)

---

## Sponsor 3: Ledger — "Clear Signing (ERC-7730)" ($4K track)

```
DeadSwitch implements ERC-7730 Clear Signing for all user-facing 
vault functions. When owners sign a heartbeat or heirs claim 
inheritance on a Ledger hardware wallet, they see 
human-readable intents instead of raw hex:

- "Send heartbeat — prove you are alive" (instead of 0x3defb962)
- "Claim inheritance" (instead of 0x1e83409a...)
- "Cancel vault & withdraw" (instead of 0x40e58ee5)
- Plus 6 more functions with clear intents and typed labels

Why this matters for inheritance:
DeadSwitch handles long-term, high-trust infrastructure. Owners 
set up a vault and may not interact with it for months. When they 
do, seeing raw hex on a Ledger creates anxiety: "Am I signing 
away my inheritance?" Clear signing removes that ambiguity.

Submitted as a PR to Ledger's official registry:
https://github.com/LedgerHQ/clear-signing-erc7730-registry/pull/2511

The manifest covers 9 user-facing functions, validates against 
erc7730-v1 schema, and targets our deployed contract on Sepolia 
(0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7). Once merged into 
Ledger's firmware, every Ledger device globally displays clear 
signing for DeadSwitch vaults automatically.

Manifest also served at: deadswitch.online/erc7730-manifest.json
```

**Evidence links**:
- PR: https://github.com/LedgerHQ/clear-signing-erc7730-registry/pull/2511
- Manifest: https://deadswitch.online/erc7730-manifest.json
- API: https://deadswitch.online/api/ledger/manifest

---

# BOOTH VISIT GUIDE — What to show each sponsor

## Chainlink Booth

**What to say** (30s pitch):
> "Hi, I built DeadSwitch — an inheritance protocol. When someone stops checking in, Chainlink Automation triggers recovery of their crypto to their heir. Our InheritanceVault contract implements AutomationCompatibleInterface and we have a live upkeep funded with LINK on Sepolia. The Automation network calls performUpkeep which changes the vault status on-chain — this is real Chainlink-triggered state change, not just price feed reading."

**What to show them**:
1. Open https://automation.chain.link/sepolia/87279356538326214029017935707370766485868215829937943885304798493436723241100 — **show the live upkeep with 2.1 LINK**
2. Open Etherscan contract: https://sepolia.etherscan.io/address/0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7 — show the `performUpkeep` function in the Read Contract tab
3. Show the Solidity code at `contracts/contracts/InheritanceVault.sol` lines 92-105

**Questions they may ask**:
- "Is your upkeep actually being called?" → "Not yet because no vault has an expired heartbeat, but the upkeep is funded and ready. The contract IS compliant with AutomationCompatibleInterface."
- "Are you using Price Feeds?" → "Yes, for the dashboard ETH/USD display (bonus), but the core qualification is the Automation integration."

---

## ENS Booth

**What to say** (30s pitch):
> "DeadSwitch is an inheritance protocol where you name your heir by ENS — 'I leave my crypto to wife.eth' instead of a hex address. It's real ENS resolution, live as you type, with status indicators. This is the most thematic ENS use case possible: estate planning is about people, not addresses."

**What to show them** (DO THIS LIVE):
1. Open https://deadswitch.online/create
2. Click through step 1 (connect wallet)
3. In step 2, type `vitalik.eth` — **let them watch it resolve in real-time** with green checkmark
4. Try `nonexistent.eth` — show the red "not found" error
5. Show the response: `curl https://deadswitch.online/api/ens/resolve/vitalik.eth`
6. Show the Solidity ownerENS/beneficiaryENS storage fields

**Questions they may ask**:
- "Why not just store the address?" → "We store both — ENS for display, address for on-chain operations. But the HEIR can search their inheritance by their ENS name on the claim page."
- "Do you use reverse resolution?" → "Yes, beneficiary_ens is displayed on the dashboard."
- "Any L2 plans?" → "Could mint L2 subnames for vault IDs as a future enhancement."

---

## Ledger Booth

**What to say** (30s pitch):
> "I submitted an ERC-7730 manifest for my inheritance contract. The manifest covers 9 vault functions with clear intents — so when an heir claims on a Ledger device, they see 'Claim inheritance' instead of raw hex. Inheritance is a one-shot, high-stakes action — clear signing is essential to reduce signing anxiety. PR is open on your registry, #2511."

**What to show them**:
1. Open the PR: https://github.com/LedgerHQ/clear-signing-erc7730-registry/pull/2511
2. Open the live manifest: https://deadswitch.online/erc7730-manifest.json
3. Show the Etherscan contract it targets: https://sepolia.etherscan.io/address/0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7
4. Talk through 2-3 function intents ("Send heartbeat", "Claim inheritance", "Cancel vault")

**Questions they may ask**:
- "Did you test it on a real Ledger?" → "The manifest validates against the v1 schema and is served publicly, but real device testing requires firmware integration after registry merge. I'd love feedback from your team on what I should add."
- "Why not EIP-712?" → "Our contract uses direct calldata (not signed messages), so contract context is correct. EIP-712 wouldn't apply here."
- "What if you need to update it?" → "I'd submit a follow-up PR. The contract is upgradeable if we redeploy."

---

# DEMO SCRIPT (to run at the booth, 2 minutes)

```
1. Open https://deadswitch.online (show landing page)
2. Click "Connect Wallet" → MetaMask → switch to Sepolia if prompted
3. Click "Protect Your Crypto" → create vault
4. Step 2: type "vitalik.eth" → watch live ENS resolve (ENS demo moment)
5. Continue through intervals/amount steps
6. Step 5: Review → click Deploy Vault → MetaMask pops up for deployment tx
7. Show the tx hash → open Etherscan link to verify
8. Go to /dashboard → show live countdown ticking in seconds
9. Click "Send Heartbeat" in demo controls → MetaMask → green success toast
10. Click "Simulate Death" → vault turns RED, recovery mode active
11. (Optional) switch to heir wallet → claim flow
12. Show Chainlink upkeep tab: https://automation.chain.link/sepolia/...
13. Show Ledger manifest tab: https://deadswitch.online/erc7730-manifest.json
```
