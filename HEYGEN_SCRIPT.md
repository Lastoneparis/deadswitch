# DeadSwitch -- HeyGen Video Script
## ETHGlobal Cannes 2026 Submission

**Total duration:** ~2:30  
**HeyGen avatar settings:** Professional male/female presenter, confident and clear tone, medium pace, business casual attire. Background: dark gradient or minimal office. Eye contact with camera throughout.  
**Screen recordings:** Prepare clips from deadswitch.online for each [SCREEN] section.

---

### [SCENE 1 -- TITLE HOOK] (0:00 - 0:05)

**[SCREEN: DeadSwitch logo animates in. Tagline fades up: "Your crypto lives on."]**

**NARRATION:**  
"What happens to your crypto when you die? Right now... nothing. It's gone forever."

---

### [SCENE 2 -- PROBLEM] (0:05 - 0:20)

**[SCREEN: Stat cards animate in sequence -- "$140B lost", "No inheritance protocol", "Custodial solutions = trust assumptions"]**

**NARRATION:**  
"Over 140 billion dollars in crypto is permanently lost because there's no inheritance plan. Traditional solutions require trusting a custodian with your keys -- that defeats the entire purpose of self-custody. And lawyers don't understand seed phrases. We need a trustless, on-chain solution."

---

### [SCENE 3 -- SOLUTION OVERVIEW] (0:20 - 0:40)

**[SCREEN: Animated diagram -- Owner sends heartbeats, clock counts down, Chainlink triggers recovery, heir verifies with World ID, funds transfer.]**

**NARRATION:**  
"DeadSwitch is a decentralized dead man's switch for crypto inheritance. Here's how it works: you deposit funds into a smart contract vault and designate a beneficiary. Every month, you send a heartbeat -- a single transaction that says 'I'm still here.' If you stop checking in, Chainlink Automation detects the missed heartbeat and triggers the recovery process automatically. Your heir verifies their identity with World ID -- fully sybil-resistant -- and claims the funds. No custodian. No lawyer. No trust assumptions. Just code."

---

### [SCENE 4 -- LIVE DEMO] (0:40 - 1:40)

**[SCREEN: Browser showing deadswitch.online dashboard]**

**NARRATION:**  
"Let me show you how it works live on Sepolia."

**[SCREEN: Dashboard view. Vault card shows status ACTIVE in green. Balance: 0.5 ETH. Last heartbeat timestamp visible. Beneficiary shown as an ENS name like 'alice.eth'.]**

"Here's the owner dashboard. The vault is active, showing our balance in ETH with a live USD conversion from Chainlink Price Feeds. The beneficiary is set using an ENS name -- human-readable, no hex addresses to get wrong."

**[SCREEN: Owner clicks "Send Heartbeat" button. Green pulse animation ripples from the button. Toast notification: "Heartbeat confirmed. Next deadline: 30 days."]**

"Sending a heartbeat is one click. The contract records the timestamp on-chain. The countdown resets to 30 days."

**[SCREEN: Owner clicks "Simulate Death" button. A confirmation modal appears. Owner confirms. The timer fast-forwards visually. Status badge transitions from green ACTIVE to red RECOVERY. Warning banner appears.]**

"Now let's simulate what happens if the owner disappears. We click Simulate Death -- the heartbeat deadline passes, and Chainlink Automation triggers the recovery state. The vault turns red. Recovery mode is now active."

**[SCREEN: Switch to heir view. "Verify with World ID" button prominent. Heir clicks it. World ID orb verification modal appears. Verification completes with a checkmark.]**

"Switching to the heir's perspective. Before claiming anything, they must prove their identity with World ID. This prevents sybil attacks -- only the real, verified beneficiary can claim."

**[SCREEN: Heir clicks "Claim Funds". Transaction confirms. Gold confetti animation fills the screen. Balance updates. Success message: "0.5 ETH transferred to alice.eth".]**

"Identity verified. One click to claim. The funds transfer directly to the heir's wallet. No intermediary touched those funds at any point."

---

### [SCENE 5 -- TECHNICAL ARCHITECTURE] (1:40 - 2:00)

**[SCREEN: Architecture diagram with labeled components -- Smart Contract (Sepolia), Chainlink Automation, Chainlink Price Feeds, World ID, 0G Storage, Flare TEE, ENS, Ledger.]**

**NARRATION:**  
"Under the hood, DeadSwitch is fully non-custodial and modular. The core is a Solidity vault contract on Ethereum. Chainlink Automation monitors heartbeat deadlines and triggers recovery without any centralized server. For advanced users, we split recovery keys using Shamir Secret Sharing -- encrypted shards are stored on 0G's decentralized storage network, with Flare TEE attestations guaranteeing shard integrity. Every transaction supports Ledger hardware wallets through ERC-7730 clear signing -- you see exactly what you're approving on your device screen."

---

### [SCENE 6 -- SPONSOR INTEGRATIONS] (2:00 - 2:15)

**[SCREEN: Sponsor logos appear in a grid, each with a one-line description that highlights as the narrator mentions it.]**

**NARRATION:**  
"DeadSwitch integrates six ETHGlobal Cannes sponsors: Chainlink for automation and price feeds. World for sybil-resistant identity. Ledger for secure hardware signing. ENS for human-readable addresses. 0G for decentralized shard storage. And Flare for TEE-backed trust attestations."

---

### [SCENE 7 -- CLOSING] (2:15 - 2:30)

**[SCREEN: deadswitch.online URL centered on screen. Tagline: "Your crypto lives on." GitHub link below.]**

**NARRATION:**  
"Crypto gave us self-sovereignty. DeadSwitch makes sure that sovereignty survives us. Try it live at deadswitch.online. Your crypto should live on -- even when you don't."

**[SCREEN: Fade to DeadSwitch logo.]**

---

## Production Notes

- **Screen recordings needed:** 4 clips from deadswitch.online (dashboard, heartbeat, simulate death, heir claim flow)
- **HeyGen voice:** Use "confident and warm" preset. Avoid robotic cadence -- slightly slower on key phrases like "no custodian, no lawyer, no trust assumptions"
- **Music:** Subtle, modern electronic background track. Slight build during demo, peak at confetti moment, fade for closing
- **Pacing:** The demo section is the longest and most important -- let the screen recordings breathe. Don't rush the transitions between owner and heir views.
