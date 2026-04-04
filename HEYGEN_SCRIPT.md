# DeadSwitch — HeyGen Video Script
## ETHGlobal Cannes 2026 Hackathon Submission

**Total duration:** 3:00–3:30
**HeyGen settings:** Professional avatar, confident + warm tone, medium pace, dark minimal background. Eye contact with camera.

---

## SCENE 1 — HOOK (0:00–0:10)

**[BACKGROUND: Black screen. Text types in: "$140,000,000,000"]**

**NARRATION:**
"One hundred and forty billion dollars. That's how much crypto is estimated to be permanently lost — because the owners died without a plan. Their families got nothing. No recovery. No inheritance. Just gone."

**[Text fades. Beat of silence.]**

---

## SCENE 2 — PROBLEM (0:10–0:35)

**[BACKGROUND: Slide — "The Problem" with 3 points appearing one by one]**

**NARRATION:**
"Here's the thing. Traditional inheritance doesn't work for crypto. You can't put a private key in a will — lawyers don't understand seed phrases, and courts can't access wallets.

The current solutions? They require you to trust a company with your keys. That defeats the entire point of self-custody.

What crypto needs is a trustless, decentralized inheritance protocol. Something that works automatically, without any company, any custodian, or any lawyer."

**[Pause]**

"That's what we built."

---

## SCENE 3 — SOLUTION (0:35–1:05)

**[BACKGROUND: Slide — Flow diagram: Owner → Heartbeat → Clock → Chainlink → World ID → Heir]**

**NARRATION:**
"DeadSwitch is a dead man's switch for crypto. Here's how it works in three simple steps.

First — you deposit your crypto into a smart contract vault and designate a beneficiary. Your heir. This can be a wallet address or an ENS name like alice.eth.

Second — you check in periodically by sending a heartbeat. One click, once a month. The contract records it on-chain. As long as you keep checking in, nothing happens.

Third — if you stop checking in... Chainlink Automation detects the missed heartbeat automatically. Recovery mode activates. Your heir verifies their identity with World ID — that's biometric, sybil-resistant verification — and claims the funds.

No intermediary touched the funds at any point. No company. No custodian. Just math."

---

## SCENE 4 — LIVE DEMO (1:05–2:15)

**[BACKGROUND: Screen recording of deadswitch.online]**

### 4A — Dashboard (1:05–1:20)

**[SCREEN: Browser showing deadswitch.online/dashboard. Green ACTIVE status. Live countdown ticking: "24d 13h 45m 32s". Balance: 0.5 ETH with Chainlink USD price. Beneficiary shown as ENS name.]**

**NARRATION:**
"Let me show you the product live. This is the owner's dashboard. The vault is active — you can see the live countdown ticking in real-time. The balance shows ETH converted to USD using Chainlink Price Feeds. The beneficiary is set as an ENS name — human-readable, no hex addresses to get wrong."

### 4B — Heartbeat (1:20–1:35)

**[SCREEN: Owner clicks "Send Heartbeat" button. Green pulse animation. Toast: "Alive confirmed — vault timer reset". Countdown resets to 30 days.]**

**NARRATION:**
"Sending a heartbeat is literally one click. Watch — I press the button, the contract records it on-chain, and the countdown resets. That's it. One click a month to protect your family's inheritance."

### 4C — Simulate Death (1:35–1:50)

**[SCREEN: Click "Simulate Death" in demo controls. Status card transitions from green to RED. Recovery timeline fills up. Pulsing red siren appears. Status: RECOVERY.]**

**NARRATION:**
"Now let's simulate what happens when the owner disappears. We skip forward 90 days. Chainlink Automation detects the expired heartbeat and triggers recovery mode. The vault turns red. The beneficiary can now act."

### 4D — Heir Claims (1:50–2:15)

**[SCREEN: World ID verification appears. Click verify. Checkmark. Then "Claim Inheritance" gold button. Click it. Gold confetti fills the screen. "Inheritance Transferred" message. Balance: 0 ETH.]**

**NARRATION:**
"Switching to the heir's perspective. First, they verify their identity with World ID — this prevents anyone else from claiming. Proof of humanity, not just a private key.

Now they click Claim. Watch — the funds transfer directly to their wallet. No intermediary. No waiting. No lawyer. That's the full cycle: deposit, heartbeat, recovery, claim."

**[Pause on confetti screen]**

"From vault creation to inheritance claim, the owner's keys were never exposed. Fully non-custodial."

---

## SCENE 5 — ARCHITECTURE (2:15–2:40)

**[BACKGROUND: Slide — Architecture diagram with labeled components]**

**NARRATION:**
"Under the hood. The core is a Solidity vault contract deployed on Ethereum Sepolia. Chainlink Automation monitors heartbeat deadlines — no centralized server needed.

For the price feed in the dashboard, we use Chainlink's ETH/USD oracle directly on-chain.

World ID provides sybil-resistant identity verification for heirs — biometric proof that you're a real, unique person.

For advanced recovery, we split keys using Shamir Secret Sharing. The encrypted shards are stored on 0G's decentralized storage network, with Flare TEE attestations guaranteeing shard integrity during reconstruction.

Every transaction supports Ledger hardware wallets through ERC-7730 clear signing. ENS resolves human-readable names to addresses."

---

## SCENE 6 — SPONSORS (2:40–2:55)

**[BACKGROUND: Slide — 6 sponsor logos in a clean grid, each with one line]**

**NARRATION:**
"Six sponsor integrations, all live:

Chainlink — Automation and Price Feeds.
World — Sybil-resistant identity.
Ledger — Hardware wallet clear signing.
ENS — Human-readable addresses.
0G — Decentralized shard storage.
Flare — TEE trust attestations."

---

## SCENE 7 — CLOSING (2:55–3:15)

**[BACKGROUND: Dark screen. deadswitch.online in large text. Logo below.]**

**NARRATION:**
"We built DeadSwitch because crypto gave us financial sovereignty — but that sovereignty dies with us if we don't plan for it.

One hundred and forty billion dollars in crypto has no heir. No recovery plan. No safety net.

DeadSwitch changes that. Try it live at deadswitch.online.

Your crypto should live on. Even when you don't."

**[Logo holds for 3 seconds. Fade to black.]**

---

## PRODUCTION NOTES FOR HEYGEN

### Avatar Settings
- **Style:** Professional, business casual
- **Tone:** Confident, warm, trustworthy — like a fintech CEO, not a crypto bro
- **Speed:** Medium pace. Slow down on key phrases: "no intermediary", "fully non-custodial", "just math"
- **Eye contact:** Camera, always

### Background Music
- Subtle electronic/ambient track
- Builds slightly during demo section (Scene 4)
- Peaks briefly at confetti moment
- Quiet and atmospheric for closing

### Screen Recordings Needed (4 clips)

| # | What to record | Duration | How |
|---|---------------|----------|-----|
| 1 | **Dashboard overview** — green status, countdown ticking, Chainlink price, beneficiary ENS | 15s | Open /dashboard with wallet connected, slowly scroll |
| 2 | **Send Heartbeat** — click button, green pulse, success toast, countdown resets | 12s | Click "Send Heartbeat" in demo, capture the full animation |
| 3 | **Simulate Death** — click, status goes red, recovery timeline fills, siren pulses | 12s | Click "Simulate Death", wait for full red transition |
| 4 | **Heir Claim** — World ID verify, click Claim, gold confetti, "Transferred" screen | 15s | Verify World ID, then claim, hold on confetti 3 seconds |

### Static Slides Needed (5 slides, make in Canva 1920x1080)

| # | Slide | Content |
|---|-------|---------|
| 1 | **Hook** | Black background. "$140,000,000,000" in large white monospace text. Nothing else. |
| 2 | **Problem** | "The Problem" title. 3 lines: "No inheritance protocol for crypto" / "Custodial solutions defeat self-custody" / "Lawyers don't understand seed phrases" |
| 3 | **Flow** | Horizontal flow: Owner icon → "Heartbeat" → Clock icon → "Chainlink detects" → World ID icon → "Heir claims". Use arrows. Green accent color on dark. |
| 4 | **Architecture** | Center: "InheritanceVault.sol". Connected to 6 boxes: Chainlink (top), World ID (top-right), Ledger (right), ENS (bottom-right), 0G (bottom-left), Flare (left). Clean lines. |
| 5 | **Sponsors** | 2x3 grid of sponsor logos. Under each: one-line role. "Chainlink: Automation + Oracles", "World: Identity", etc. |

### Slide Design Guidelines
- Background: #09090b (match your website)
- Text: #fafafa
- Accent: #10b981 (emerald green — same as your site)
- Font: Inter or Geist Sans
- No gradients, no stock images, no decorative elements
- Let the content breathe — lots of empty space

### Final Tips
- Total video should be 3:00–3:15
- The demo section (Scene 4) is the most important — let the screen recordings breathe, don't rush
- Add 0.5s fade transitions between scenes
- HeyGen "confident and warm" voice preset works best
- Export at 1080p minimum
