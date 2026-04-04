# DeadSwitch — HeyGen Video Script (ETHGlobal Format)
## ETHGlobal Cannes 2026 — 2:30 submission video

**Duration:** 2:30
**Structure:** Intro → How it works → Demo → How it's made → Future work → Close
**Tone:** Personal, confident, technical but accessible

---

## SCENE 1 — SELF INTRODUCTION (0:00–0:12)

**[VISUAL: Your own face on camera OR Sofia avatar with your name on screen]**

**NARRATION (by you or Sofia):**
"Hi, I'm Hugo. I built DeadSwitch after my father passed away and I realized his crypto — his private keys — would have been lost forever if we hadn't been lucky. This is my ETHGlobal Cannes submission: a decentralized dead man's switch for crypto inheritance."

**[Personal photo of father briefly at "my father passed away" — 1 second]**

---

## SCENE 2 — HOW IT WORKS (0:12–0:50)

**[VISUAL: Screen recording of landing page + flow diagram]**

**NARRATION:**
"Here's the problem: $140 billion in crypto is estimated to be permanently lost because owners died without a plan. Traditional inheritance doesn't work — lawyers can't read seed phrases, and custodial solutions defeat self-custody.

DeadSwitch fixes this in three steps.

Step one: you deposit ETH into a smart contract vault and designate an heir by wallet address or ENS name.

Step two: you send a heartbeat once a month. One click, one transaction — it says 'I'm still here.'

Step three: if you stop checking in, Chainlink Automation triggers recovery. Your heir verifies with World ID, and claims the funds. No custodian, no lawyer, no company in the middle."

---

## SCENE 3 — LIVE DEMO (0:50–1:40)

**[VISUAL: Screen recording of deadswitch.online]**

**NARRATION:**
"Let me show you live on Sepolia.

This is the owner dashboard — vault is active, countdown ticking in real-time, balance shown with live ETH/USD price from Chainlink.

I click Send Heartbeat — MetaMask confirms, the contract records the timestamp on-chain, countdown resets. Done.

Now let's simulate what happens if the owner dies. I click Simulate Death — the vault status turns red, recovery mode activates.

Switching to the heir's wallet. They verify with World ID — sybil-resistant identity proof. Then click Claim. The funds transfer directly to the heir's wallet. Fully on-chain. No intermediary touched those funds."

---

## SCENE 4 — HOW IT'S MADE (1:40–2:10)

**[VISUAL: Architecture diagram with sponsor logos]**

**NARRATION:**
"The stack: a Solidity vault contract deployed on Ethereum Sepolia, using OpenZeppelin's ReentrancyGuard for safety.

Three core sponsor integrations power this.

First — Chainlink. Chainlink Automation monitors every vault's heartbeat deadline on-chain, no centralized server. Chainlink Price Feeds give us the live ETH to USD conversion on the dashboard.

Second — World ID. Every heir must prove they're a real, unique human with biometric verification before claiming. No sybil attacks, no bots, no fraud.

Third — Ledger. We ship a full ERC-7730 manifest. Every transaction — heartbeat, claim, cancel — displays human-readable on the Ledger hardware screen. Clear signing for maximum security.

Additional integrations include ENS for readable addresses, 0G for decentralized shard storage, and Flare for TEE attestations."

---

## SCENE 5 — FUTURE WORK (2:10–2:22)

**[VISUAL: Roadmap slide]**

**NARRATION:**
"Next steps: mainnet deployment, multi-chain support via Chainlink CCIP, smart contract audit, and adding guardian multi-sig for enterprise use. Eventually, a mobile app with biometric heartbeats."

---

## SCENE 6 — CLOSE (2:22–2:30)

**[VISUAL: deadswitch.online URL + logo]**

**NARRATION:**
"Try it at deadswitch.online. GitHub is open source. Your crypto should live on — even when you don't.

Thanks for watching."

**[Optional: photo of father, "In memory of Papa" — 2 seconds]**

---

## PRODUCTION NOTES

### Video Structure Match
ETHGlobal's preferred structure:
1. ✅ Who you are (personal intro)
2. ✅ How it works (problem + solution)
3. ✅ Live demo (screen recordings)
4. ✅ How it's made (tech stack)
5. ✅ Future work (roadmap)
6. ✅ Website + closing

### If Using HeyGen Sofia Avatar
- Scene 1: Sofia introduces "Hi, I'm Hugo's project presenter..." OR just use your real face for 10s
- Script avoids first-person assumptions so it works with either

### If Recording Yourself
- Scene 1: Record a 10s intro on your phone/webcam, intercut with Sofia for the rest
- More authentic — judges score "personal story" highly
- Your father reference makes this memorable

### Screen Recordings Needed (same 4 as before)
1. Dashboard overview (10s)
2. Send Heartbeat (10s)
3. Simulate Death (10s)
4. Heir Claim (15s)

### Slides Needed (4 new)
1. **Title card** — "DeadSwitch" + your name + "ETHGlobal Cannes 2026"
2. **Problem stat** — "$140,000,000,000 lost" on black
3. **Architecture diagram** — Smart contract center, 6 sponsor logos around
4. **Roadmap** — Mainnet → Multi-chain → Audit → Guardian multi-sig → Mobile app

### Voice Direction
- Scene 1: Slow, personal, sincere
- Scenes 2-4: Medium pace, confident
- Scene 5: Excited, forward-looking
- Scene 6: Warm, close
