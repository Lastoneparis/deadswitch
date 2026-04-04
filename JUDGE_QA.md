# DeadSwitch — Judge Q&A Guide

Complete question/answer preparation for ETHGlobal Cannes 2026 judging.

---

## PROJECT CONCEPT

**Q: What is DeadSwitch in one sentence?**
> A decentralized dead man's switch for crypto inheritance — if you stop checking in, your designated heir can claim your funds automatically, without any intermediary.

**Q: Why did you build this?**
> My father passed away. If he had any crypto, it would have been lost forever — no one could access his keys. That realization is the whole reason this project exists. Losing someone shouldn't mean losing everything they left behind.

**Q: What problem does it solve?**
> $140 billion in crypto is estimated to be permanently lost because owners died without a plan. Traditional inheritance doesn't work for crypto — lawyers can't read seed phrases, and custodial solutions like Casa require you to trust a third party with your keys, which defeats self-custody.

**Q: How is this different from Casa, Sarcophagus, or Safe?**
> Casa is centralized — they hold your keys. Sarcophagus requires their token and third-party "Archaeologists." Safe is multi-sig but doesn't handle inheritance triggers. DeadSwitch is fully non-custodial, per-user contract deployment, and the trigger is 100% automated via Chainlink — no humans in the loop.

---

## TECHNICAL ARCHITECTURE

**Q: Walk me through the architecture.**
> Solidity 0.8.20 contract deployed to Sepolia, with OpenZeppelin's ReentrancyGuard. Each user deploys their OWN InheritanceVault contract from their wallet — so there's no shared state. Chainlink Automation monitors the heartbeat on-chain. Frontend is Next.js 16 + wagmi v3, and beneficiaries are named by ENS.

**Q: Why per-user deployment instead of a factory?**
> Isolation. Each vault is its own contract — owner's funds can't be affected by bugs in another user's vault. Users can also cancel their own vault without affecting others. The architectural simplicity makes auditing easier.

**Q: How does the heartbeat work exactly?**
> One function: `heartbeat()` updates `lastHeartbeat = block.timestamp`. That's it. The deadline is calculated live as `lastHeartbeat + heartbeatInterval`. The owner signs a transaction once a month. `onlyOwner` modifier ensures only the owner's wallet can call it.

**Q: What triggers recovery mode?**
> Chainlink Automation calls `checkUpkeep()` every few minutes. When `block.timestamp > lastHeartbeat + heartbeatInterval`, it returns true, and Chainlink's keeper network automatically calls `performUpkeep()` which sets `status = RecoveryMode`. Fully decentralized — no server.

**Q: Why the 30-day recovery delay?**
> Safety net. If the owner is in a coma and wakes up, or just missed a month, they have 30 days to cancel recovery before the heir can claim. Prevents edge cases where someone is declared "dead" prematurely.

---

## SPONSOR INTEGRATIONS (3 primary)

**Q: Which sponsors are you applying for?**
> Chainlink, ENS, and Ledger. All three with real implementations.

**Q: How does Chainlink fit?**
> Our contract implements the AutomationCompatibleInterface — `checkUpkeep` + `performUpkeep`. I have a live upkeep registered on Sepolia, funded with 2.1 LINK. When a heartbeat expires, Chainlink keepers automatically trigger recovery mode. This is real state change on-chain, not just frontend price feed reading. Bonus: we also use Chainlink's ETH/USD price feed for the dashboard.

**Q: How does ENS fit?**
> Heirs are identified by ENS name — "leave my crypto to wife.eth" instead of a hex address. Live resolution via ens.domains API, no hardcoded values. Both the ENS name AND resolved address are stored in the smart contract. Inheritance is about people, not wallet addresses — this is the most thematic ENS use case possible.

**Q: How does Ledger fit?**
> We submitted an ERC-7730 clear signing manifest to Ledger's official registry — PR #2511. Covers all 9 user-facing vault functions. When merged into Ledger firmware, every device globally will display "Send heartbeat — prove you are alive" instead of raw hex for DeadSwitch transactions.

---

## SECURITY & EDGE CASES

**Q: What if someone steals the owner's key?**
> They can send heartbeats and keep the vault "alive" but can't change the beneficiary or cancel without also being the owner. Worst case, attacker maintains status quo — they can't steal funds to themselves. Owner can mitigate with the cancel() function and redeploy to a new vault.

**Q: What if the beneficiary loses their key?**
> The owner can call `updateBeneficiary()` anytime while the vault is Active to change the heir. Plus we have Shamir Secret Sharing via 0G storage for V2 — split the heir's recovery key into 5 shards with 3-of-5 threshold.

**Q: What if the owner's key is compromised AND beneficiary's key is compromised?**
> That's a dual-wallet compromise. Recovery requires beneficiary to pass World ID verification AND have the matching nullifier hash. Attacker would need the beneficiary key AND pass biometric verification as the real person. That's the World ID role — sybil resistance.

**Q: Why testnet, not mainnet?**
> Inheritance holds people's life savings. Deploying without a formal audit would be irresponsible. Sepolia is appropriate hackathon scope — our architecture is production-ready, but audit comes first. Mainnet is on the roadmap after audit.

**Q: How do you prevent someone from claiming before the 30-day delay?**
> Contract enforces it: `require(block.timestamp >= recoveryActivatedAt + recoveryDelay, "Recovery delay not elapsed")`. Any claim attempt reverts on-chain until the 30 days have passed.

**Q: What if Chainlink Automation goes down?**
> Anyone can call `performUpkeep()` — it's a public function. Chainlink is the convenience layer. Even without it, the beneficiary could pay gas themselves to trigger recovery. The contract doesn't depend on any single entity.

---

## BUSINESS & ROADMAP

**Q: How do you make money?**
> Not yet — it's a hackathon project. The path forward: 0.5% fee on deposits or vault creation, or premium features like multi-heir, multi-chain, notifications, legal document generation.

**Q: What's next?**
> Formal smart contract audit (Trail of Bits or OpenZeppelin). Mainnet deployment. Multi-chain via Chainlink CCIP. Multi-heir with percentage splits. Mobile app with biometric heartbeats.

**Q: Who's the target user?**
> High net worth crypto holders who want to protect family assets without trusting custodians. Also OG crypto users who've accumulated 5-6 figures worth of tokens and realize they need a plan.

---

## DEMO-SPECIFIC

**Q: Can you demo the full flow right now?**
> Yes. I'll create a vault, send a heartbeat, simulate death, and the heir will try to claim. Note: the claim will revert on testnet because of the 30-day recovery delay safety feature — that's intentional. Want me to explain as I walk through it?

**Q: Why does MetaMask say "transaction will probably fail" on claim?**
> MetaMask simulates the transaction and catches the contract's safety checks — the on-chain vault status requires `performUpkeep` to have actually executed (which reverts if the heartbeat hasn't actually expired on testnet with long intervals), and the 30-day recovery delay. These are intentional production safeguards.

**Q: Can I actually claim right now?**
> Not live — the contract enforces a 30-day recovery delay from production safety. But I can show you the transaction attempt hitting the correct revert message, which proves the security works. I can also walk you through the contract code to show the safety logic.

---

## IF THEY PUSH BACK

**Q: "Your claim doesn't work, how can you say it's production-ready?"**
> The contract works — the CLAIM reverts because of intentional safety delays. That's not a bug, it's the feature. On mainnet with 90-day heartbeats and real time passing, the claim would execute cleanly. Look at the contract code: the claim logic is 4 lines and uses `call{value: amount}("")` — battle-tested pattern.

**Q: "Why should I trust this isn't vaporware?"**
> Contract is deployed and verified on Sepolia. Chainlink upkeep is live with 2.1 LINK. PR submitted to Ledger's registry. ENS resolution hits real API. GitHub has 35 passing tests. Everything is verifiable right now.

**Q: "What's stopping a competitor from copying this?"**
> Nothing. It's open source MIT. But the go-to-market matters — inheritance requires trust, which requires audits, which takes time. First-mover advantage + the 3 sponsor integrations. Also, my personal story (father's passing) isn't copyable.

---

## KEY TALKING POINTS (Memorize)

1. **"Per-user deployment, not shared contract"** — isolation = safety
2. **"30-day recovery delay is production safety"** — not a bug
3. **"Chainlink triggers on-chain, not backend"** — fully decentralized
4. **"Every sponsor integration is verifiable live"** — don't just claim, show
5. **"Testnet is correct for hackathon scope"** — audit before mainnet

---

## EVIDENCE LINKS (Show these to judges)

- Contract: https://sepolia.etherscan.io/address/0xF957cDA1f676B9EAE65Ab99982CAa3a31A193CB7
- Chainlink upkeep: https://automation.chain.link/sepolia/87279356538326214029017935707370766485868215829937943885304798493436723241100
- Ledger PR: https://github.com/LedgerHQ/clear-signing-erc7730-registry/pull/2511
- GitHub: https://github.com/Lastoneparis/deadswitch
- Live demo: https://deadswitch.online
