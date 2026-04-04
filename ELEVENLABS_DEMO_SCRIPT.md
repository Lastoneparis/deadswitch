# ElevenLabs Demo Audio Script — DeadSwitch

Voice narration for screen recording demo (1 minute 54 seconds total).

**Voice settings for ElevenLabs**:
- Voice: Professional male or female (e.g., "Adam", "Rachel", or "Sarah")
- Stability: 50%
- Clarity: 70%
- Style: 30%
- Speaking speed: 1.0x (natural pace)

---

## FULL SCRIPT (with timestamps)

Copy this into ElevenLabs. The script is timed to ~115 seconds, matching your screen recording.

---

### [0:00 – 0:10] — Opening

> "Meet DeadSwitch. A decentralized dead man's switch for crypto inheritance. Your family shouldn't lose your crypto when you're gone."

**[Pause 1 second]**

### [0:10 – 0:24] — Context

> "Let me show you how it works. I'm the owner, and I want to set up a vault that transfers my crypto to my wife if I stop checking in. I'll deploy a real smart contract on Sepolia, backed by Chainlink Automation and ENS."

### [0:24 – 0:30] — ENS Resolution (aligned to 24-27s visual)

> "I type wife dot eth as my heir. Watch — live ENS resolution happens as I type, hitting the real ENS API. The address is resolved and stored on-chain alongside the human-readable name."

### [0:30 – 0:45] — Interval & Amount

> "I pick a 90-day heartbeat interval. If I miss my monthly check-in, Chainlink Automation will trigger recovery mode automatically. Then I deposit my ETH into the vault — the contract holds the funds, not any intermediary."

### [0:45 – 0:54] — Contract Signature (aligned to 51s visual)

> "Now I deploy my own InheritanceVault contract. MetaMask asks me to sign the deployment transaction — this creates a unique contract instance just for me. Each user deploys their own vault. No shared state."

**[Pause at 0:54 for visual confirmation]**

### [0:54 – 1:10] — Vault Created & Dashboard

> "The vault is live on Sepolia, with its own contract address. I see the dashboard — active status, live countdown in seconds, beneficiary name, and balance with ETH-to-USD conversion from Chainlink Price Feeds."

### [1:10 – 1:20] — Simulate Death (aligned to 1:14 visual)

> "Now let's simulate what happens if I stop checking in. I click Simulate Death. The vault status turns red — Recovery Mode is active. Chainlink Automation would normally trigger this on mainnet when the heartbeat expires."

### [1:20 – 1:40] — Explain Heir Journey

> "Switching to the heir's perspective. My wife needs to prove she's the designated beneficiary AND verify she's a real human. First, she disconnects the owner wallet and connects her own wallet — the one I designated as wife dot eth."

### [1:40 – 1:45] — Wallet Switch (aligned to 1:40 visual)

> "Here I switch to the heir's wallet. The claim page automatically detects vaults where this wallet is designated as beneficiary. The system confirms the wallet matches the on-chain beneficiary address."

### [1:45 – 1:54] — World ID & Close (aligned to 1:45-1:54 visual)

> "She verifies with World ID — sybil-resistant biometric proof she's a real unique human. No bots, no attackers. When she claims, the smart contract transfers funds directly to her wallet. Non-custodial. On-chain. No lawyers."

### [1:54] — End

> "DeadSwitch. Your crypto lives on. Even when you don't. Try it at deadswitch dot online."

---

## TIMING BREAKDOWN TABLE

| Time | Visual Event | Narration Line |
|------|-------------|---------------|
| 0:00 | Opening landing page | "Meet DeadSwitch..." |
| 0:10 | Click "Create Your Vault" | "Let me show you how it works..." |
| 0:24 | Typing wife.eth in step 2 | "I type wife dot eth as my heir..." |
| 0:27 | ENS resolved (green check) | "...resolved and stored on-chain" |
| 0:30 | Step 3 (interval) | "I pick a 90-day heartbeat interval..." |
| 0:45 | Step 5 (review) | "Now I deploy my own InheritanceVault..." |
| 0:51 | MetaMask popup appears | "MetaMask asks me to sign..." |
| 0:54 | "Contract deployed" success | "The vault is live on Sepolia..." |
| 1:10 | Dashboard loaded | "Now let's simulate..." |
| 1:14 | Click "Simulate Death" | "I click Simulate Death..." |
| 1:20 | Vault turns red | "Switching to the heir's perspective..." |
| 1:40 | MetaMask wallet switch | "Here I switch to the heir's wallet..." |
| 1:45 | World ID QR code | "She verifies with World ID..." |
| 1:54 | End / logo | "Your crypto lives on..." |

---

## USAGE INSTRUCTIONS

1. Go to https://elevenlabs.io
2. Select voice (Rachel or Adam recommended)
3. Copy the script between the horizontal dividers (`---`) above
4. Remove the timestamp tags like `### [0:24 – 0:30]` and `**[Pause...]**`
5. Generate audio
6. Export as MP3
7. Import into video editor (CapCut, DaVinci, Premiere)
8. Align audio peaks with screen recording visual events per the timing table

### ElevenLabs-Ready Plain Text (copy this):

```
Meet DeadSwitch. A decentralized dead man's switch for crypto inheritance. Your family shouldn't lose your crypto when you're gone.

Let me show you how it works. I'm the owner, and I want to set up a vault that transfers my crypto to my wife if I stop checking in. I'll deploy a real smart contract on Sepolia, backed by Chainlink Automation and ENS.

I type wife dot eth as my heir. Watch — live ENS resolution happens as I type, hitting the real ENS API. The address is resolved and stored on-chain alongside the human-readable name.

I pick a 90-day heartbeat interval. If I miss my monthly check-in, Chainlink Automation will trigger recovery mode automatically. Then I deposit my ETH into the vault — the contract holds the funds, not any intermediary.

Now I deploy my own InheritanceVault contract. MetaMask asks me to sign the deployment transaction — this creates a unique contract instance just for me. Each user deploys their own vault. No shared state.

The vault is live on Sepolia, with its own contract address. I see the dashboard — active status, live countdown in seconds, beneficiary name, and balance with ETH-to-USD conversion from Chainlink Price Feeds.

Now let's simulate what happens if I stop checking in. I click Simulate Death. The vault status turns red — Recovery Mode is active. Chainlink Automation would normally trigger this on mainnet when the heartbeat expires.

Switching to the heir's perspective. My wife needs to prove she's the designated beneficiary AND verify she's a real human. First, she disconnects the owner wallet and connects her own wallet — the one I designated as wife dot eth.

Here I switch to the heir's wallet. The claim page automatically detects vaults where this wallet is designated as beneficiary. The system confirms the wallet matches the on-chain beneficiary address.

She verifies with World ID — sybil-resistant biometric proof she's a real unique human. No bots, no attackers. When she claims, the smart contract transfers funds directly to her wallet. Non-custodial. On-chain. No lawyers.

DeadSwitch. Your crypto lives on. Even when you don't. Try it at deadswitch dot online.
```

---

## TIPS FOR SYNC

1. **Record narration FIRST**, then record screen to match audio cues
2. Add **0.3-0.5s pauses** between sections in ElevenLabs for natural breath
3. If audio is too long, trim the "Explain Heir Journey" section (1:20-1:40)
4. If too short, add a "Why I built this" line mentioning your father
