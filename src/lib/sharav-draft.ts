/* ── the SHARAV investigation — compiled from the real on-chain report ──
   every entity, address, figure and claim below comes verbatim from the
   user's FINAL CORRECTED report v4 (VERIFIED — re-checked on mainnet,
   upload/Pasted Content_1788418167423.txt). v4 supersedes all prior
   versions: 7 hallucinated addresses corrected, 1 truncated signature
   corrected, W6 P&L corrected upward (+11.92 → +24.81 SOL).
   Used by the seed script AND as the bundled fallback when the case
   archive database is unavailable. */

import { buildDossier, type DraftCase } from "./dossier";
import type { DossierFile } from "./types";

const SOL = "SOLANA";

const draft: DraftCase = {
  id: "S-0830",
  codename: "SHARAV",
  status: "CLOSED",
  victim: "SHARAV buyers (retail)",
  chains: "SOLANA",
  amountText: "≈$25,150 EXTRACTED",
  amountUsd: "$512K PEAK MCAP",
  span: "AUG 28 — SEP 01 2026",
  updated: "2026-09-03",
  progress: "100",
  summary:
    "An 11-year-old founder's \u201ccommunity coin\u201d hit a $512,327 market cap — while the on-chain record shows the creator dumping the entire dev allocation five minutes after launch, a funding chain six layers deep ending at a durable nonce, and an operator-linked wallet sniping the token at the exact slot of creation. Coordinated sniper bots and a manual FOMO buyer extracted ≈$25,150 as price collapsed 98.8% from the peak.",
  method:
    "All data from free public endpoints — Solana mainnet RPC (api.mainnet-beta.solana.com) and the Pump.fun public API. ~800+ JSON-RPC calls across 5 parallel agents, then a full v4 re-verification pass (~250+ calls): 29 of 32 wallet addresses existence-checked via getBalance, 17 transaction signatures verified via getTransaction, every balance and P&L computed from pre/post balance deltas. Creator activity sampled every 5th signature of 725 (25 SHARAV transactions found). Operator linkages are behavioural — shared transactions, fee-payer roles, timing gaps — and are reported as assessments with explicit confidence grades.",
  limitations:
    "Public RPC caps signatures at 1,000 per call and rate-limits transaction fetches; passive-recipient wallets often return zero indexed signatures. Bonding-curve creator fees are estimates (0.5% creator share, ~0.575–1.725 SOL from 2–3× virtual SOL reserves). The 16-minute pump window ran ~5,000 tx/min; all wallet-specific transactions in the window were captured via signature pagination. This file makes NO claim about Sharav Arora himself or LabelTruth — whether he was aware of these mechanics or fronted for an operator cannot be determined from chain data alone.",
  sourceNote:
    "Compiled by taraonchain from public Solana mainnet RPC + Pump.fun API records (~1,050+ calls across verification passes). v4: 29/32 wallets verified (3 hallucinated addresses corrected), 17/17 signatures verified, W6 P&L corrected +11.92 → +24.81 SOL.",
  assetRows: [
    { loc: "W1 SNIPER", amt: "+41.365 SOL (≈$8,273)", state: "EXTRACTED · CASHED OUT", tone: "fact" },
    { loc: "W3 SNIPER", amt: "+32.533 SOL (≈$6,507)", state: "EXTRACTED · CASHED OUT", tone: "fact" },
    { loc: "W5 — BOT-PLATFORM TRADER", amt: "+2,697.87 USDC", state: "EXTRACTED · +999% ROI", tone: "fact" },
    { loc: "INSIDER 8xz5…Yu1iL", amt: "+0.263 SOL (≈$53)", state: "EXTRACTED · 47 MIN", tone: "fact" },
    { loc: "W6 — MANUAL BUYER", amt: "+24.81 SOL · 71,608.63 SHARAV LEFT", state: "BAGHOLDER · 3 REBUYS AT TOP", tone: "assess" },
    { loc: "CREATOR", amt: "+1.263 SOL DEV DUMP · NET −$41", state: "THE FRONT, NOT THE WINNER", tone: "assess" },
    { loc: "SHARED SWEEP 9rVZ9G5…", amt: "3.31 SOL · 426 SIGS", state: "REFUNDS FROM CREATOR + INSIDER", tone: "fact" },
    { loc: "PRESS NARRATIVE — \u201c$15,000 EARNED\u201d", amt: "—", state: "NOT VERIFIABLE ON-CHAIN", tone: "unknown" },
    { loc: "OFF-CHAIN ARRANGEMENTS (OTC / SIDE DEALS)", amt: "—", state: "CANNOT BE SEEN FROM CHAIN DATA", tone: "unknown" },
  ],
  nextSteps:
    "Trace the insider wallet 8xz5…'s other pump.fun token trades\nDeep-dive the shared sweep wallet 9rVZ9G5… (426 sigs since Aug 19)\nArchive-RPC pass to capture the full pump-window density (~5,000 tx/min)\nVerify the $15,000 press figure off-chain — OTC or side deals are invisible on-chain",

  entities: [
    { label: "Durable nonce account", short: "NONCE", kind: "contract", chain: SOL, note: "9CMCqJQTCYiydNiN1WxQrc7EBFnxHewxoNKZUPir1SSC — obfuscation layer; authority pgWHnND… (4 sigs); 2 sigs, 0 SOL" },
    { label: "Root ephemeral wallet", short: "ROOT", kind: "wallet", chain: SOL, note: "28bNuYwAGoqF2GGY6r96rMZWAZpQ8VGUzvYvpj6MF7VL — 8-second life, 3 sigs; funded with +1.310 SOL at Aug 28 05:55:17" },
    { label: "Ultimate source (pump.fun trader)", short: "SOURCE", kind: "wallet", chain: SOL, note: "9rcALugXYTEh4vJ5KAE7U1iWFop9Ms9ctzEbLxgyn5a — 10 sigs, 0.0033 SOL; paid gas for a tx including the insider (Aug 28 07:11:05); traded 2 other pump.fun tokens" },
    { label: "Layer 0 — gas payer", short: "GASPAY", kind: "wallet", chain: SOL, note: "8KEfoCbdHNhnL8XooB5cRUtUftHjPZa3XuLX9V7wNjLu — 4-min life, 5 sigs, pure SOL pass-through" },
    { label: "Layer 1 — passive hop", short: "HOP-1", kind: "wallet", chain: SOL, note: "6KphaijmtBPN6LUAgZQWRwv4guifvnapsHu6wgZN9Xdc — 2 sigs; received 1.531 SOL at 07:37:46, sent on at 07:37:50 — 4-second hold" },
    { label: "Layer 2 — ephemeral funder", short: "FUND-2", kind: "wallet", chain: SOL, note: "2mBmtSpzu6UwaHctNjULcUPjDugQFMfy2V3gkd6Hbz8G — 38-sec life, 3 sigs; sent 1.530 SOL to creator at 07:38:26" },
    { label: "Creator wallet", short: "CREATOR", kind: "wallet", chain: SOL, note: "7mQDWDAqwA47DdnpWz3TCA3JWhaEftdajGpVBVT8MEzn — 725 sigs, 0.000891 SOL; dumped the 25,851,479.11 dev allocation at minute 5" },
    { label: "SHARAV token mint", short: "SHARAV", kind: "contract", chain: SOL, note: "pUcbexRicdtRG6BJ7neNb6v5iKVVj7i1KPC7jBgpump — Token-2022, 1B supply, 6 decimals; ATH mcap $512,327.67" },
    { label: "pump.fun bonding curve", short: "CURVE", kind: "contract", chain: SOL, note: "99UYK9e1hcSvxYJh9yMeuoAAwaHL17a8raMMXZPLmGJY — graduated; 114.93 SOL virtual reserves, 280,085,503 tokens left at completion" },
    { label: "PumpSwap AMM pool", short: "POOL", kind: "exchange", chain: SOL, note: "61uepyj88BPmRbbjcSZJosZSYFcSTofmDtV1XURu48UR — post-graduation venue for W1/W3/W5/W6 exits" },
    { label: "Insider wallet", short: "INSIDER", kind: "wallet", chain: SOL, note: "8xz5Y1TxvSVF8MeQD55u5nFNLCU5FBz8gwKunD4Yu1iL — 51 sigs, 1.526803 SOL; sniped at the creation slot; first activity Aug 21 22:24:57 UTC" },
    { label: "Shared sweep wallet", short: "SWEEP", kind: "wallet", chain: SOL, note: "9rVZ9G5PUGjabAUEb5tuYbLg5JTe1TzsQuNWoFHHenNs — 426 sigs since Aug 19, 3.31 SOL; rent refunds from BOTH creator and insider" },
    { label: "W1 sniper contract", short: "W1F", kind: "contract", chain: SOL, note: "CaMgUkP7xqB8ZifS24987R7u9t3z8ao3cr91uv4MqynD — DeJBGd sniper program; self-funded since Aug 9, 2026; 4,000+ sigs; 12.39 SOL" },
    { label: "Sniper holder W1", short: "W1", kind: "wallet", chain: SOL, note: "93H5JmbVQ6svkAHP2XaQHNSEDkY2jFyJ2xTmaoexCR49 — 263 sigs since Jun 10; +41.365 SOL in 14 minutes; now 0.71 SOL" },
    { label: "W3 sniper contract", short: "W3F", kind: "contract", chain: SOL, note: "7oomzLCZjnxbaaJSLNHDh95TTW6z9qaMNiL7DqYcGaTh — DeJBGd sniper program; self-funded, active since Aug 8; 4,000+ sigs; 12.48 SOL" },
    { label: "Sniper holder W3", short: "W3", kind: "wallet", chain: SOL, note: "4RC43FzPSnYMUMZdwoyu1oWVHosqxsgkMQjV9DZ77wEo — 306 sigs since Aug 21; +32.533 SOL; bought 10 s before W1; now 6.27 SOL" },
    { label: "Shared fee recipient", short: "FEES", kind: "wallet", chain: SOL, note: "J5XGHmzrRmnYWbmw45DbYkdZAU2bwERFZ11qCDXPvFB5 — fee recipient in W1 funder's first tx (slot 438,238,526, Aug 9); shared by BOTH sniper funders" },
    { label: "Bot-platform trader W5", short: "W5", kind: "wallet", chain: SOL, note: "3zFnLrtJmVj3dvDNRsGTyir7uM663FShbi1XwBCRqfPQ — 1,904+ sigs since Nov 2025; +$2,697.87 (+999.2%); gas paid by relayer; now 0.005 SOL + 11,759.28 USDC" },
    { label: "Shared relayer (fee-payer-as-a-service)", short: "RELAYER", kind: "wallet", chain: SOL, note: "AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51 — Telegram-style bot platform; 1,615 SOL; pays gas for W2 and W5" },
    { label: "Manual FOMO buyer W6", short: "W6", kind: "wallet", chain: SOL, note: "EgQvLAhoQi3Eo1E5A6aR4VW7iT9Xs7uA8AhtRT9YxaMQ — 44% failed txs; 6 buys, 10 sells, 3 rebuys; +24.81 SOL; still holds 71,608.63; now 9.36 SOL" },
  ],

  connections: [
    { from: "NONCE", to: "ROOT", value: "1.311 SOL", channel: "direct", epistemic: "observed", basis: "System::withdrawFromNonce at Aug 28 05:55:11 UTC", when: "08-28 05:55:11", txHash: "" },
    { from: "ROOT", to: "SOURCE", value: "1.310 SOL", channel: "direct", epistemic: "observed", basis: "Root ephemeral funded the ultimate source", when: "08-28 05:55:17", txHash: "" },
    { from: "SOURCE", to: "INSIDER", value: "JOINT TX", channel: "cluster", epistemic: "observed", basis: "Slot 442,287,061 — ultimate source PAID GAS for a transaction that included the insider wallet (Aug 28 07:11:05 UTC, 2 days before launch)", when: "08-28 07:11:05", txHash: "slot 442,287,061" },
    { from: "SOURCE", to: "GASPAY", value: "1.532 SOL", channel: "direct", epistemic: "observed", basis: "Includes +0.0015 SOL astra fee — 25 min before token creation", when: "08-30 07:34:33", txHash: "" },
    { from: "GASPAY", to: "HOP-1", value: "1.531 SOL", channel: "direct", epistemic: "observed", basis: "Gas payer funded the passive hop", when: "08-30 07:37:46", txHash: "" },
    { from: "HOP-1", to: "FUND-2", value: "1.531 SOL", channel: "direct", epistemic: "observed", basis: "4-second hold", when: "08-30 07:37:50", txHash: "" },
    { from: "FUND-2", to: "CREATOR", value: "1.530 SOL", channel: "direct", epistemic: "observed", basis: "Creator funded 21 min before token creation", when: "08-30 07:38:26", txHash: "" },
    { from: "CREATOR", to: "SHARAV", value: "25,851,479 SHARAV", channel: "direct", epistemic: "observed", basis: "Dev allocation at minting — 2.585% of supply", when: "08-30 07:59:52", txHash: "5ZE4HuqN…" },
    { from: "SHARAV", to: "CURVE", value: "974,148,520 SHARAV", channel: "direct", epistemic: "observed", basis: "97.415% of supply to the bonding curve — only 2 recipients at creation", when: "08-30 07:59:52", txHash: "5ZE4HuqN…" },
    { from: "INSIDER", to: "CURVE", value: "16,014,197 SHARAV", channel: "direct", epistemic: "observed", basis: "BOUGHT 11,178,038.55 AT THE EXACT SLOT OF CREATION (bundled tx) + 4,836,159.21 at 08:12:51", when: "08-30 07:59:52", txHash: "slot 442,828,340" },
    { from: "CURVE", to: "INSIDER", value: "0.915 SOL", channel: "direct", epistemic: "observed", basis: "Sold all 16,014,197.76 — +40% in 47 minutes", when: "08-30 08:46:09", txHash: "" },
    { from: "CREATOR", to: "CURVE", value: "25,851,479 SHARAV", channel: "direct", epistemic: "observed", basis: "DEV ALLOCATION DUMPED for +1.263012 SOL — 5 min 7 s after creation", when: "08-30 08:04:59", txHash: "slot 442,829,309" },
    { from: "CREATOR", to: "SWEEP", value: "RENT REFUND", channel: "direct", epistemic: "observed", basis: "Shared infrastructure wallet — refunds from BOTH creator and insider", when: "08-30", txHash: "" },
    { from: "INSIDER", to: "SWEEP", value: "RENT REFUND", channel: "direct", epistemic: "observed", basis: "Token account closure rent refund (TX #4)", when: "08-30 09:13:44", txHash: "" },
    { from: "W3F", to: "W3", value: "13,343,434 SHARAV", channel: "direct", epistemic: "observed", basis: "DeJBGd sniper program buy — fee paid by 7oomzLCZ", when: "08-30 22:47:05", txHash: "slot 442,996,183" },
    { from: "W1F", to: "W1", value: "13,232,322 SHARAV", channel: "direct", epistemic: "observed", basis: "DeJBGd sniper program buy — 10 seconds after W3, fee paid by CaMgUkP7", when: "08-30 22:47:15", txHash: "slot 442,996,215" },
    { from: "W3F", to: "FEES", value: "SNIPER FEES", channel: "direct", epistemic: "observed", basis: "Common fee recipient — verified in W1 funder's first tx (slot 438,238,526, Aug 9)", when: "08-30 22:47:05", txHash: "" },
    { from: "W1F", to: "FEES", value: "SNIPER FEES", channel: "direct", epistemic: "observed", basis: "Common fee recipient — same bot platform as W3", when: "08-30 22:47:15", txHash: "" },
    { from: "W3", to: "POOL", value: "32.53 SOL", channel: "direct", epistemic: "observed", basis: "Two equal Jupiter sells (+16.372362, +16.160733) — 42 s before W1", when: "08-30 23:00:39", txHash: "slot 442,998,746" },
    { from: "W1", to: "POOL", value: "41.37 SOL", channel: "direct", epistemic: "observed", basis: "Two equal Jupiter sells (+18.674980, +22.690123) — 14-minute hold", when: "08-30 23:01:21", txHash: "slot 442,998,880" },
    { from: "RELAYER", to: "W5", value: "GAS", channel: "cluster", epistemic: "observed", basis: "Fee-payer-as-a-service — Telegram-style bot platform; also pays for W2", when: "08-30", txHash: "" },
    { from: "CURVE", to: "W5", value: "12,747,586 SHARAV", channel: "direct", epistemic: "observed", basis: "270 USDC in via Tessera DEX — 2 min 17 s after the snipers", when: "08-30 22:49:32", txHash: "slot 442,996,643" },
    { from: "W5", to: "POOL", value: "2,967.87 USDC", channel: "direct", epistemic: "observed", basis: "5 Jupiter sells across 14h (4 in the pump, 1 capitulation at −87.3%)", when: "08-30 22:59 → 08-31 13:12", txHash: "slot 443,159,714" },
    { from: "CURVE", to: "W6", value: "10,848,311 SHARAV", channel: "direct", epistemic: "observed", basis: "6 buys (3 entries + 3 rebuys), −9.392604 SOL — entered 10 min after the snipers", when: "08-30 22:56 → 23:11", txHash: "" },
    { from: "W6", to: "POOL", value: "34.20 SOL", channel: "direct", epistemic: "observed", basis: "10 sells (+34.203188) — 8 micro-sells in 9 s at the top, 2 later; still holds 71,608.63", when: "08-30 23:02:38", txHash: "slot 442,999,125" },
    { from: "CREATOR", to: "CURVE", value: "≈2.28M SHARAV (buys)", channel: "direct", epistemic: "observed", basis: "19 FOMO buys (−1.813009 SOL) into the pump; 2 sells after (+0.209915); net direct trading −$41", when: "08-30 22:53 → 08-31 04:34", txHash: "" },
  ],

  chapters: [
    {
      kicker: "The front",
      title: "A community coin for a young founder",
      body:
        "The story travelled fast: an 11-year-old builder, rejected by Y Combinator, going viral for his AI nutrition-label tool — then launching SHARAV on pump.fun to fund it. The metadata promised \u201c100% of generated fees going toward funding LabelTruth.\u201d Press later reported he \u201cearned about $15,000.\u201d\n\nThat narrative is why this token is worth reading at all. The chain does not know the story. It only knows who signed what, and when — and the signatures tell a different tale.",
      facts: "observed | Token created Aug 30 07:59:52 UTC · slot 442,828,340\nobserved | Metadata: fees promised to LabelTruth\nassessed | Launch rode the viral YC-rejection story",
      focus: "SHARAV, CREATOR, CURVE",
    },
    {
      kicker: "Six layers",
      title: "The money behind the creator",
      body:
        "Before the token existed, the creator wallet was assembled like a cutout. A durable nonce account withdrew 1.311 SOL at 05:55:11 into an 8-second ephemeral wallet, which funded the \u201cultimate source\u201d — an active pump.fun trader. From there the money moved through a gas payer, a 4-second passive hop and a 38-second ephemeral funder before reaching the creator at 07:38:26, 21 minutes before launch.\n\nAll six funding wallets were created within ~22 minutes, five of the six are now empty, and the chain terminates at a durable nonce — a deliberate operator-level obfuscation pattern.",
      facts: "observed | 6 funding wallets created within ~22 minutes; 5 now empty\nobserved | Chain ends at durable nonce 9CMC…r1SSC — authority pgWHnND…\nassessed | Operator-level obfuscation — high confidence",
      focus: "NONCE, ROOT, SOURCE, GASPAY, HOP-1, FUND-2, CREATOR",
    },
    {
      kicker: "Five minutes",
      title: "Created, sniped, dumped",
      body:
        "At 07:59:52 the token went live — and in the same bundled slot, the insider wallet bought 11,178,038.55 SHARAV at the exact slot of creation. Five minutes later the creator sold the entire 25,851,479.11 dev allocation back to the bonding curve for 1.263012 SOL, roughly $252.\n\nAt the eventual ATH that allocation would have been worth $13,239. The creator never held for it. Whatever the story said, the wallet's first real move was the exit.",
      facts: "observed | Insider buy bundled with the mint tx — same slot 442,828,340\nobserved | Dev dump: 25,851,479.11 SHARAV → +1.263012 SOL at 08:04:59\nassessed | At ATH the allocation = $13,239 — dumped at minute 5",
      focus: "CREATOR, SHARAV, CURVE, INSIDER",
    },
    {
      kicker: "The insider",
      title: "The same hand on both wallets",
      body:
        "The insider wallet 8xz5…Yu1iL is an active pump.fun trader — 51 lifetime sigs, first activity Aug 21, nine days before launch. On Aug 28 at 07:11:05 (slot 442,287,061), two days before SHARAV, the creator's ultimate funding source paid gas for a transaction that included the insider wallet. That is a hard, on-chain linkage.\n\nThe insider bought 11,178,038.55 SHARAV in the creation bundle, accumulated 4,836,159.21 more thirteen minutes later, and sold all 16,014,197.76 at 08:46:09 — +40% (~$53) in 47 minutes. Both the creator's and the insider's rent refunds sweep to the same wallet, 9rVZ9G5… (426 sigs). The position was closed 14 hours before the pump even started.",
      facts: "observed | Slot 442,287,061 — SOURCE paid gas for a tx including the insider\nobserved | Bought 16,014,197.76; sold all at 08:46:09 — +40% in 47 min\nassessed | Same operator as the creator's funder — high confidence",
      focus: "INSIDER, SOURCE, SWEEP",
    },
    {
      kicker: "The snipers",
      title: "Two bots, one operator",
      body:
        "At 22:47 the pump began — and two sniper contracts bought within ten seconds of each other via the same DeJBGd program, paying fees to the same recipient J5XGHm… — a wallet already present in W1's funder's very first transaction, back on Aug 9. Tokens landed on two holder wallets, W3 and W1, which each sold in two equal Jupiter halves, 42 seconds apart, after identical 14-minute holds.\n\nTogether they extracted ~74 SOL — roughly $14,780 — in 14 minutes. Parallel execution with mirrored manners: one operator, two hands.",
      facts: "observed | W3 buy 22:47:05 · W1 buy 22:47:15 — 10 s apart\nobserved | Shared fee recipient J5XGHm… — verified since Aug 9\nassessed | Same operator — parallel bot execution",
      focus: "W3F, W3, W1F, W1, FEES",
    },
    {
      kicker: "The pump",
      title: "Sixteen minutes to $512K",
      body:
        "Then the crowd arrived. Density hit ~5,000 tx/min; at 23:02:13 SHARAV printed its all-time-high market cap of $512,327.67 — about fifteen hours after creation. W5, a Telegram-bot-platform trader, flipped 270 USDC into 2,967.87 over five routed sells (+999.2%). W6 bought in late with three rapid buys — 5,214,864.61, then 4,620,165.07, then 157,241.14 — then made the classic mistake: rebuying 524,387 SHARAV 41 seconds after ATH.\n\nEven the creator FOMO-bought the move — 19 tranches, −1.813009 SOL, chasing the very pump his own launch had set up.",
      facts: "observed | ATH $512,327.67 at 23:02:13 — ~15h after creation\nobserved | W6 rebought 524,387 SHARAV 41 s after ATH\nobserved | Creator FOMO-bought 19 tranches (−1.813009 SOL)",
      focus: "W5, W6, CREATOR, RELAYER",
    },
    {
      kicker: "The exit",
      title: "Thirty-four seconds of distribution",
      body:
        "The top lasted seconds. W6 fired eight micro-sells in nine seconds at the top — then two more at 23:07:50 and 23:10:39 that the earlier pass missed, adding +14.03 SOL to his take. W5's final capitulation print came 14 hours later at −87.3% versus his first sell. W6's three emotional rebuys left 71,608.63 SHARAV in the wallet — essentially worthless.\n\nFinal tally across the six active traders: ≈+$25,150 — the two coordinated snipers took ~$14,780 of it in 14 minutes. Retail holds the remaining bag, down 98.8% from ATH.",
      facts: "observed | W6: 8 top sells in 9 s + 2 later sells (+14.03 SOL)\nobserved | W5 capitulation −87.3% vs first sell — 14h later\nassessed | ≈$25,150 extracted by six active traders",
      focus: "POOL, W5, W6, W1, W3",
    },
    {
      kicker: "Verdict",
      title: "What the chain proves",
      body:
        "The press said the young founder earned $15,000. The chain supports $482–$597: a 1.263 SOL dev dump plus estimated bonding-curve fees — and shows a net LOSS of $41 on direct trading. The creator's wallet behaved like an operator's cutout, the funding chain was engineered for obfuscation, and the launch bundle carried an insider snipe.\n\nWhat this file does not say: anything about the boy himself. Intent lives off-chain. The record only shows who moved the money — and the money moved like a scripted operation, not a kid's first token.",
      facts: "observed | Verifiable creator earnings: ~$482–$597\nassessed | \u201c$15,000 earned\u201d not supported on-chain — high confidence\nunknown | Off-chain arrangements — invisible to chain data",
      focus: "",
    },
  ],

  findings: [
    {
      title: "Creator dumped the entire dev allocation 5 minutes after creation",
      epistemic: "observed",
      confidence: "",
      body: "At creation (Aug 30 07:59:52 UTC, slot 442,828,340) the creator received 25,851,479.11 SHARAV (2.585% of supply). Five minutes later (08:04:59, slot 442,829,309) the entire allocation was sold back to the bonding curve for +1.263012 SOL (~$252). Final SHARAV balance: 0 (fully exited). Verified sig: 28ibx63h…9pzA.",
    },
    {
      title: "\u201c$15,000 earned\u201d is not verifiable on-chain",
      epistemic: "assessed",
      confidence: "high",
      body: "On-chain verifiable creator earnings: ~$482–$597 (dev dump + bonding-curve fees). The $15K figure likely came from valuing the dev allocation at ATH ($13,239) without accounting for the minute-5 dump. Creator net direct-trading P&L: −0.205446 SOL (−$41).",
    },
    {
      title: "Insider wallet directly linked to the creator's funder — sniped at creation",
      epistemic: "assessed",
      confidence: "high",
      body: "Wallet 8xz5Y1TxvSVF8… (51 sigs) co-transacted with the creator's ultimate funding source 9rcALugXYTEh4… on Aug 28 — slot 442,287,061: the source PAID GAS for a transaction that included the insider wallet. The insider then bought 16,014,197.76 SHARAV (creation bundle + a 08:12:51 accumulation) and sold all of it 47 minutes later (+40%, ~$53). Shared sweep wallet 9rVZ9G5… corroborates.",
    },
    {
      title: "Creator's funding chain runs 6 layers deep and ends at a durable nonce",
      epistemic: "observed",
      confidence: "",
      body: "Layer 0 gas payer (4-min life, 5 sigs) → passive hop (2 sigs, 4-sec hold) → ephemeral funder (38-sec life, 3 sigs) → creator. Ultimate source 9rcALugXYTEh4… funded from a root ephemeral (8-sec life) that withdrew 1.311 SOL from durable nonce 9CMCqJQTCYiy… (authority pgWHnND…). 5 of the 6 funding wallets are now empty — a deliberate operator-level obfuscation pattern using nonce bundling.",
    },
    {
      title: "W5 exact P&L: +$2,697.87 (+999.2% ROI / ~10x)",
      epistemic: "observed",
      confidence: "",
      body: "Bought 12,747,586.01 SHARAV for 270 USDC at 22:49:32; sold in 5 sells via complex Jupiter routing — total 2,967.87 USDC received, net +2,697.87 USDC. Holding time: 14 hours 22 minutes. Final sell degraded −87.3% versus the first.",
    },
    {
      title: "Sniper bots W1 and W3 are likely the same operator",
      epistemic: "assessed",
      confidence: "high",
      body: "Both used the DeJBGd sniper program and paid fees to common wallet J5XGHmzrRmnYWbmw45DbYkdZAU2bwERFZ11qCDXPvFB5 (verified in W1 funder's first tx at slot 438,238,526, Aug 9, 2026). Bought 10 seconds apart, sold within 90 seconds, held ~14 minutes each, identical two-equal-swap sell patterns. Combined extraction: ~74 SOL (~$14,780) in 14 minutes.",
    },
    {
      title: "No CEX hot wallets involved anywhere in the funding web",
      epistemic: "observed",
      confidence: "",
      body: "None of the traced wallets were funded from Binance, OKX, Coinbase or Bybit. All funding came from private Solana wallets; the closest thing to centralized was the shared relayer AgmLJBMDCqWynY… (1,615 SOL) — a Telegram-style trading-bot platform that pays gas for W2 and W5.",
    },
  ],

  /* NOTE: the evidence table is synthesized by buildDossier() from the
     connections below — txHash + when on each connection ARE the evidence. */


  graph: {
    nodes: [
      { id: "NONCE", label: "Durable nonce account", short: "NONCE", kind: "contract", address: "9CMCqJQTCYiydNiN1WxQrc7EBFnxHewxoNKZUPir1SSC", chain: "SOLANA", firstSeen: "08-28", lastSeen: "08-28", received: 0, sent: 1.311, balance: 0, risk: 2, tags: ["OBFUSCATION", "DURABLE NONCE"], note: "Nonce authority pgWHnND… (4 sigs); withdrew 1.311 SOL at Aug 28 05:55:11", pos: [-46, 3.2, -5], size: 1.0 },
      { id: "ROOT", label: "Root ephemeral wallet", short: "ROOT", kind: "wallet", address: "28bNuYwAGoqF2GGY6r96rMZWAZpQ8VGUzvYvpj6MF7VL", chain: "SOLANA", firstSeen: "08-28", lastSeen: "08-28", received: 1.31, sent: 1.31, balance: 0, risk: 2, tags: ["8-SEC LIFE", "3 SIGS"], note: "Funded with +1.310 SOL at Aug 28 05:55:17 — 8-second life", pos: [-41.5, 1.4, -3], size: 0.8 },
      { id: "SOURCE", label: "Ultimate source (pump.fun trader)", short: "SOURCE", kind: "wallet", address: "9rcALugXYTEh4vJ5KAE7U1iWFop9Ms9ctzEbLxgyn5a", chain: "SOLANA", firstSeen: "08-28", lastSeen: "08-30", received: 1.31, sent: 1.5335, balance: 0.0033, risk: 3, tags: ["OPERATOR", "PUMP.FUN TRADER", "10 SIGS"], key: true, note: "Only wallet in the chain with prior activity (since Aug 28); paid gas for a tx including the insider; traded 2 other pump.fun tokens", attribution: { claim: "Same operating entity as the insider wallet — and the likely operator of the entire launch", basis: "Paid gas for a transaction that included the insider wallet (slot 442,287,061) + funded the deployer + insider sniped in the launch bundle", confidence: "high" }, pos: [-37, 0, 0], size: 1.3 },
      { id: "GASPAY", label: "Layer 0 — gas payer", short: "GASPAY", kind: "wallet", address: "8KEfoCbdHNhnL8XooB5cRUtUftHjPZa3XuLX9V7wNjLu", chain: "SOLANA", firstSeen: "08-30", lastSeen: "08-30", received: 1.532, sent: 1.531, balance: 0, risk: 1, tags: ["4-MIN LIFE", "5 SIGS", "PASS-THROUGH"], pos: [-32, 1.8, -3.5], size: 0.8 },
      { id: "HOP-1", label: "Layer 1 — passive hop", short: "HOP-1", kind: "wallet", address: "6KphaijmtBPN6LUAgZQWRwv4guifvnapsHu6wgZN9Xdc", chain: "SOLANA", firstSeen: "08-30", lastSeen: "08-30", received: 1.531, sent: 1.531, balance: 0, risk: 1, tags: ["2 SIGS", "4-SEC HOLD"], pos: [-29, 0.2, 1.5], size: 0.75 },
      { id: "FUND-2", label: "Layer 2 — ephemeral funder", short: "FUND-2", kind: "wallet", address: "2mBmtSpzu6UwaHctNjULcUPjDugQFMfy2V3gkd6Hbz8G", chain: "SOLANA", firstSeen: "08-30", lastSeen: "08-30", received: 1.531, sent: 1.53, balance: 0, risk: 1, tags: ["38-SEC LIFE", "3 SIGS", "PASS-THROUGH"], pos: [-26, 1.2, -1.5], size: 0.8 },
      { id: "CREATOR", label: "Creator wallet", short: "CREATOR", kind: "wallet", address: "7mQDWDAqwA47DdnpWz3TCA3JWhaEftdajGpVBVT8MEzn", chain: "SOLANA", firstSeen: "08-30", lastSeen: "08-31", received: 3.137563, sent: 1.813009, balance: 0.000891, risk: 3, tags: ["DEV DUMP +5 MIN", "725 SIGS", "FOMO BUYS", "FRONT"], key: true, note: "Dumped the full 25,851,479.11 dev allocation at minute 5; 19 FOMO buys (−1.813009 SOL); net −$41 on direct trading", pos: [-16, 0, 1], size: 1.6 },
      { id: "SHARAV", label: "SHARAV token mint", short: "SHARAV", kind: "contract", address: "pUcbexRicdtRG6BJ7neNb6v5iKVVj7i1KPC7jBgpump", chain: "SOLANA", firstSeen: "08-30", lastSeen: "09-01", received: 1000000000, sent: 974148520.89, balance: 0, risk: 2, tags: ["TOKEN-2022", "ATH $512,327.67", "1B SUPPLY"], key: true, note: "Token-2022, 6 decimals; created Aug 30 07:59:52 UTC (slot 442,828,340); only 2 recipients at creation", pos: [-8, 0.6, -1.5], size: 2.2 },
      { id: "CURVE", label: "pump.fun bonding curve", short: "CURVE", kind: "contract", address: "99UYK9e1hcSvxYJh9yMeuoAAwaHL17a8raMMXZPLmGJY", chain: "SOLANA", firstSeen: "08-30", lastSeen: "08-30", received: 974148520.89, sent: 0, balance: 0, risk: 1, tags: ["GRADUATED", "114.93 SOL VIRTUAL", "280,085,503 AT GRADUATION"], note: "Bonding curve complete — all real reserves moved to the PumpSwap AMM at graduation", pos: [-11.5, -1.8, 2], size: 1.4 },
      { id: "POOL", label: "PumpSwap AMM pool", short: "POOL", kind: "exchange", address: "61uepyj88BPmRbbjcSZJosZSYFcSTofmDtV1XURu48UR", chain: "SOLANA", firstSeen: "08-30", lastSeen: "09-01", received: 0, sent: 0, balance: 0, risk: 2, tags: ["PUMPSWAP AMM", "POST-GRADUATION"], note: "Post-graduation venue for the W1/W3/W5/W6 exits — Jupiter and direct PumpSwap swaps", pos: [30, 0, -0.5], size: 1.7 },
      { id: "INSIDER", label: "Insider wallet", short: "INSIDER", kind: "wallet", address: "8xz5Y1TxvSVF8MeQD55u5nFNLCU5FBz8gwKunD4Yu1iL", chain: "SOLANA", firstSeen: "08-21", lastSeen: "08-30", received: 0.915167, sent: 0.653555, balance: 1.526803, risk: 3, tags: ["LAUNCH SNIPE", "BUNDLED TX", "51 SIGS", "STILL ACTIVE"], key: true, note: "Bought 16,014,197.76 SHARAV at the creation slot + 13 min later; sold all at 08:46:09 (+40% in 47 min); flat through the pump", attribution: { claim: "Operated by the same entity as the creator's ultimate funding source", basis: "The ultimate source paid gas for a transaction that included this wallet (slot 442,287,061, Aug 28) + shared sweep wallet for rent refunds", confidence: "high" }, pos: [-13, 4, 3.5], size: 1.4 },
      { id: "SWEEP", label: "Shared sweep wallet", short: "SWEEP", kind: "wallet", address: "9rVZ9G5PUGjabAUEb5tuYbLg5JTe1TzsQuNWoFHHenNs", chain: "SOLANA", firstSeen: "08-19", lastSeen: "08-30", received: 0, sent: 0, balance: 3.31, risk: 2, tags: ["426 SIGS", "SHARED INFRASTRUCTURE"], note: "Receives rent refunds from BOTH the insider's token account closure and the creator's transactions — active since Aug 19", pos: [-20.5, -2.6, 4.5], size: 0.9 },
      { id: "W1F", label: "W1 sniper contract", short: "W1F", kind: "contract", address: "CaMgUkP7xqB8ZifS24987R7u9t3z8ao3cr91uv4MqynD", chain: "SOLANA", firstSeen: "08-09", lastSeen: "08-30", received: 0, sent: 0.397019, balance: 12.39, risk: 3, tags: ["DeJBGd SNIPER", "SELF-FUNDED AUG 9", "4,000+ SIGS"], note: "First tx (slot 438,238,526, Aug 9 2026) was a SELL of pump.fun tokens — no external funder", pos: [2, 2.8, -2.5], size: 1.0 },
      { id: "W1", label: "Sniper holder W1", short: "W1", kind: "wallet", address: "93H5JmbVQ6svkAHP2XaQHNSEDkY2jFyJ2xTmaoexCR49", chain: "SOLANA", firstSeen: "06-10", lastSeen: "08-30", received: 41.365103, sent: 0, balance: 0.71, risk: 3, tags: ["+41.365 SOL", "14-MIN HOLD", "263 SIGS"], attribution: { claim: "Same operator as sniper holder W3", basis: "10 s buy gap · 42 s sell gap · shared fee recipient J5XGHm… · same DeJBGd program", confidence: "high" }, note: "13,232,322 SHARAV (2.66% of supply) sniped via CaMgUkP7, sold in two equal Jupiter halves; was 36 SOL earlier — now 0.71", pos: [6.5, 2.2, -1], size: 1.3 },
      { id: "W3F", label: "W3 sniper contract", short: "W3F", kind: "contract", address: "7oomzLCZjnxbaaJSLNHDh95TTW6z9qaMNiL7DqYcGaTh", chain: "SOLANA", firstSeen: "08-08", lastSeen: "08-30", received: 0, sent: 0.385125, balance: 12.48, risk: 3, tags: ["DeJBGd SNIPER", "SELF-FUNDED", "4,000+ SIGS"], note: "Active pump.fun sniper since Aug 8 — executed W3's buy and transferred the tokens to W3", pos: [2, -2.6, 2.5], size: 1.0 },
      { id: "W3", label: "Sniper holder W3", short: "W3", kind: "wallet", address: "4RC43FzPSnYMUMZdwoyu1oWVHosqxsgkMQjV9DZ77wEo", chain: "SOLANA", firstSeen: "08-21", lastSeen: "08-30", received: 32.533095, sent: 0, balance: 6.27, risk: 3, tags: ["+32.533 SOL", "BOUGHT 10s BEFORE W1", "306 SIGS"], note: "13,343,434 SHARAV via 7oomzLCZ; two equal Jupiter sells 42 s before W1", pos: [6.5, -1.6, 1], size: 1.3 },
      { id: "FEES", label: "Shared fee recipient", short: "FEES", kind: "wallet", address: "J5XGHmzrRmnYWbmw45DbYkdZAU2bwERFZ11qCDXPvFB5", chain: "SOLANA", firstSeen: "08-09", lastSeen: "08-30", received: 0, sent: 0, balance: 0, risk: 2, tags: ["COMMON FEE RECIPIENT", "VERIFIED AUG 9 TX"], note: "Fee recipient in W1 sniper funder's first tx (+0.010100 SOL, slot 438,238,526); both W1 and W3 sniper funders paid fees here — same bot platform", pos: [0, 0.2, 0.5], size: 0.85 },
      { id: "W5", label: "Bot-platform trader W5", short: "W5", kind: "wallet", address: "3zFnLrtJmVj3dvDNRsGTyir7uM663FShbi1XwBCRqfPQ", chain: "SOLANA", firstSeen: "2025-11-01", lastSeen: "08-31", received: 0, sent: 0, balance: 0.005, risk: 2, tags: ["+$2,697.87", "+999.2% ROI", "11,759.28 USDC"], note: "Gas paid by the shared relayer; 12,747,586.01 SHARAV for 270 USDC, sold in 5 Jupiter batches across 14h 22m; now 0.005 SOL + 11,759.28 USDC", pos: [19.5, 2.6, 1], size: 1.25 },
      { id: "RELAYER", label: "Shared relayer (bot platform)", short: "RELAYER", kind: "wallet", address: "AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51", chain: "SOLANA", firstSeen: "—", lastSeen: "—", received: 0, sent: 0, balance: 1615, risk: 1, tags: ["1,615 SOL", "FEE-PAYER-AS-A-SERVICE"], note: "Telegram-style trading-bot platform — pays gas for W2 and W5", pos: [16, 4.4, 3], size: 1.0 },
      { id: "W6", label: "Manual FOMO buyer W6", short: "W6", kind: "wallet", address: "EgQvLAhoQi3Eo1E5A6aR4VW7iT9Xs7uA8AhtRT9YxaMQ", chain: "SOLANA", firstSeen: "08-28", lastSeen: "08-31", received: 34.203188, sent: 9.392604, balance: 9.36, risk: 1, tags: ["44% FAILED TXS", "3 REBUYS AT TOP", "71,608.63 LEFT"], note: "6 buys (−9.392604 SOL), 10 sells (+34.203188 SOL), 3 rebuys — the final rebuy IS the bag still held; net +24.81 SOL", pos: [22, -2.2, -2.5], size: 1.2 },
    ],
    edges: [
      { id: "e01", source: "NONCE", target: "ROOT", value: 1.311, epistemic: "observed", channel: "direct", txs: [{ hash: "withdrawFromNonce", ts: "08-28 05:55:11", value: 1.311, chain: "Solana", kind: "transfer" }] },
      { id: "e02", source: "ROOT", target: "SOURCE", value: 1.31, epistemic: "observed", channel: "direct", txs: [{ hash: "08-28 05:55:17", ts: "08-28 05:55:17", value: 1.31, chain: "Solana", kind: "transfer" }] },
      { id: "e03", source: "SOURCE", target: "INSIDER", value: 0.001, epistemic: "observed", basis: "Slot 442,287,061 — SOURCE paid gas for a tx that included the insider wallet", channel: "cluster", valueLabel: "JOINT TX", txs: [{ hash: "slot 442,287,061", ts: "08-28 07:11:05", value: 0, chain: "Solana", kind: "call" }] },
      { id: "e04", source: "SOURCE", target: "GASPAY", value: 1.532, epistemic: "observed", channel: "direct", txs: [{ hash: "08-30 07:34:33", ts: "08-30 07:34:33", value: 1.532, chain: "Solana", kind: "transfer" }] },
      { id: "e05", source: "GASPAY", target: "HOP-1", value: 1.531, epistemic: "observed", channel: "direct", txs: [{ hash: "08-30 07:37:46", ts: "08-30 07:37:46", value: 1.531, chain: "Solana", kind: "transfer" }] },
      { id: "e06", source: "HOP-1", target: "FUND-2", value: 1.531, epistemic: "observed", channel: "direct", txs: [{ hash: "08-30 07:37:50", ts: "08-30 07:37:50", value: 1.531, chain: "Solana", kind: "transfer" }] },
      { id: "e07", source: "FUND-2", target: "CREATOR", value: 1.53, epistemic: "observed", channel: "direct", txs: [{ hash: "08-30 07:38:26", ts: "08-30 07:38:26", value: 1.53, chain: "Solana", kind: "transfer" }] },
      { id: "e08", source: "CREATOR", target: "SHARAV", value: 0.6, epistemic: "observed", basis: "Dev allocation at minting — 2.585% of supply", channel: "direct", valueLabel: "25,851,479 SHARAV", txs: [{ hash: "5ZE4HuqNdcwr7Zt5Y6xFrE3Tfv9uHmtS6HRaGMti4aU5Ye4cwF24TeBNxd9SzmHk9v7EaXSrCMBRhmfh9Nm8im23", ts: "08-30 07:59:52", value: 0, chain: "Solana", kind: "call" }] },
      { id: "e09", source: "SHARAV", target: "CURVE", value: 0.5, epistemic: "observed", basis: "97.415% of supply to the curve — only 2 recipients at creation", channel: "direct", valueLabel: "974,148,520 SHARAV", txs: [] },
      { id: "e10", source: "INSIDER", target: "CURVE", value: 0.65185, epistemic: "observed", basis: "Bought 11,178,038.55 at the exact slot of creation (bundled) + 4,836,159.21 at 08:12:51", channel: "direct", valueLabel: "16,014,197 SHARAV", txs: [{ hash: "5ZtxaMkh4RTyXdpCkozYdQQ6SS4j9PQj1vebJajDxiiMCXZNSgcHpSyNUPnP7Tvf3X4Ja7rS1ifHy6qgf8vDioeX", ts: "08-30 07:59:52", value: 0.397019, chain: "Solana", kind: "call" }, { hash: "3DKQAy4ZXaN4FFAK97tcmtXvyYuuaFSV1ptdfzPnQSdC5NkKhmQb6vmYTYX4U1FzqYk5wuRzKHwkJufCe9m83H9v", ts: "08-30 08:12:51", value: 0.254831, chain: "Solana", kind: "call" }] },
      { id: "e11", source: "CURVE", target: "INSIDER", value: 0.915167, epistemic: "observed", basis: "Sold all 16,014,197.76 — +40% in 47 minutes", channel: "direct", txs: [{ hash: "4fbPPYnorx92yenUJ1LVomJuCazUWhhfJeCFn6ANDZXSk5hE5f9AwPfmLi7NHMoZwbAnYB1HL8mQYwkHcE2Lwzgm", ts: "08-30 08:46:09", value: 0.915167, chain: "Solana", kind: "call" }] },
      { id: "e12", source: "CREATOR", target: "CURVE", value: 1.263012, epistemic: "observed", basis: "DEV ALLOCATION DUMP — 5 min 7 s after creation", channel: "direct", valueLabel: "25,851,479 SHARAV", txs: [{ hash: "28ibx63h9JXyZChTm6pKbcvZcogCJ1jsoQEGP4gRcPmrdXXwn4sBkpZ6jdg4TKkbhnqhLtbQyb4ZYrWjZoUo9pzA", ts: "08-30 08:04:59", value: 1.263012, chain: "Solana", kind: "call" }] },
      { id: "e14", source: "CREATOR", target: "SWEEP", value: 0.002, epistemic: "observed", basis: "Shared infrastructure wallet — refunds from BOTH creator and insider", channel: "direct", valueLabel: "RENT REFUND", txs: [] },
      { id: "e15", source: "INSIDER", target: "SWEEP", value: 0.002, epistemic: "observed", basis: "Token account closure rent refund (TX #4)", channel: "direct", valueLabel: "RENT REFUND", txs: [{ hash: "62xg5goCU7Wk2fKsyjNVjpWR7m9fdGoovQ41PVHHnHmjCWdN2z9Z5DkWojFQqBujtM33NMRgs1Q22veej9dKioGf", ts: "08-30 09:13:44", value: 0, chain: "Solana", kind: "call" }] },
      { id: "e16", source: "W3F", target: "W3", value: 0.9, epistemic: "observed", basis: "DeJBGd sniper buy — 10 s before W1; fee paid by 7oomzLCZ", channel: "direct", valueLabel: "13,343,434 SHARAV", txs: [{ hash: "4KM39ozkTWSBtrScz6dszA7iUWUTKM33h2F8MxPqsr9JcsSmM6MSvjnvMg3ZBaEyKZWC7iuXPSsZUTFeeWDDXZuK", ts: "08-30 22:47:05", value: 0, chain: "Solana", kind: "call" }] },
      { id: "e17", source: "W1F", target: "W1", value: 0.9, epistemic: "observed", basis: "DeJBGd sniper buy; fee paid by CaMgUkP7", channel: "direct", valueLabel: "13,232,322 SHARAV", txs: [{ hash: "51DznwsFE2cn3U9kBrNEMX8nc1P4LfdGufaoJyFKajUeB8WzsCaQ7tpwAwdCqmp8pcTuUtvoU6ZfXsLt4L4wUCD8", ts: "08-30 22:47:15", value: 0, chain: "Solana", kind: "call" }] },
      { id: "e18", source: "W3F", target: "FEES", value: 0.002, epistemic: "observed", basis: "Shared fee recipient — verified since Aug 9; same bot platform", channel: "direct", valueLabel: "SNIPER FEES", txs: [] },
      { id: "e19", source: "W1F", target: "FEES", value: 0.002, epistemic: "observed", basis: "Shared fee recipient — same bot platform as W3", channel: "direct", valueLabel: "SNIPER FEES", txs: [] },
      { id: "e20", source: "W3", target: "POOL", value: 32.533095, epistemic: "observed", basis: "Two equal Jupiter sells (+16.372362, +16.160733) — 42 s before W1", channel: "direct", txs: [{ hash: "Lj2hVCyua4U4BWBa4GBBeprchNgtiRrS377UFtYg8AmwCTbqHqLmHngMAnhjSBBqkrG5H9B6RPbmRkisSkaHVsJ", ts: "08-30 23:00:39", value: 16.372362, chain: "Solana", kind: "pool" }] },
      { id: "e21", source: "W1", target: "POOL", value: 41.365103, epistemic: "observed", basis: "Two equal Jupiter sells (+18.674980, +22.690123) — 14-minute hold", channel: "direct", txs: [{ hash: "3Pue5LspB9zM2PE5wKwBiDsGjt1ktbhfB97xmEsqHgHDJ6u4tNJWmoup3HVBSug6n8FqbfQBp4ynepm3pa9af5SA", ts: "08-30 23:01:21", value: 18.67498, chain: "Solana", kind: "pool" }] },
      { id: "e22", source: "RELAYER", target: "W5", value: 0.002, epistemic: "observed", basis: "Fee-payer-as-a-service — also pays for W2", channel: "cluster", valueLabel: "GAS", txs: [] },
      { id: "e23", source: "CURVE", target: "W5", value: 1.35, epistemic: "observed", basis: "270 USDC in via Tessera DEX — 2 min 17 s after the snipers", channel: "direct", valueLabel: "12,747,586 SHARAV", txs: [{ hash: "4gaLZxmAAYouLXauqUZQsiAbcYfdd3z3gw8o1D8n9MKAfzzdwXRd3Rx8YEPND8SWon1DA4DwRbdJrroKSocAQRCY", ts: "08-30 22:49:32", value: 0, chain: "Solana", kind: "call" }] },
      { id: "e24", source: "W5", target: "POOL", value: 14.84, epistemic: "observed", basis: "5 Jupiter sells across 14h (4 in the pump, 1 capitulation at −87.3%)", channel: "direct", valueLabel: "2,967.87 USDC", txs: [{ hash: "4yVRR3S71UMeBAQKbkD6jmVFZuFo8V4J8tT3d72ecmyabMrwXdzWw47qmr837b9e5TDDvbtrXwvPYqP9aChGBhH2", ts: "08-31 13:12:04", value: 0, chain: "Solana", kind: "pool" }] },
      { id: "e25", source: "CURVE", target: "W6", value: 9.392604, epistemic: "observed", basis: "6 buys (3 entries + 3 rebuys) — entered 10 min after the snipers", channel: "direct", valueLabel: "10,848,311 SHARAV (6 BUYS)", txs: [] },
      { id: "e26", source: "W6", target: "POOL", value: 34.203188, epistemic: "observed", basis: "10 sells — 8 micro-sells in 9 s at the top, 2 later (missed in v3); still holds 71,608.63", channel: "direct", valueLabel: "34.20 SOL (10 SELLS)", txs: [{ hash: "66bRTpyQpweSTaEdqYLbG2MYhwMmJtmkUkX8ddXFT1qFW21HY4pbpB3igB6BCaqJXCy6uPNZAANij3pP8eFL6qNM", ts: "08-30 23:02:40", value: 3.235043, chain: "Solana", kind: "pool" }, { hash: "slot 443,000,104", ts: "08-30 23:07:50", value: 8.347133, chain: "Solana", kind: "pool" }] },
      { id: "e27", source: "CREATOR", target: "CURVE", value: 1.813009, epistemic: "observed", basis: "19 FOMO buys into the pump; 2 sells after; net −$41", channel: "direct", valueLabel: "≈2.28M SHARAV (19 BUYS)", txs: [] },
    ],
    chapterEdges: [
      ["e08", "e09"],
      ["e01", "e02", "e04", "e05", "e06", "e07"],
      ["e08", "e09", "e10", "e12"],
      ["e03", "e10", "e11", "e14", "e15"],
      ["e16", "e17", "e18", "e19", "e20", "e21"],
      ["e22", "e23", "e25", "e27"],
      ["e20", "e21", "e24", "e26"],
      [],
    ],
    chapterCams: [
      { target: [-10, 0.4, 0], radius: 20, theta: 1.42, phi: 1.2 },
      { target: [-36, 1.2, -2], radius: 25, theta: 1.32, phi: 1.18 },
      { target: [-12, 1.5, 0.5], radius: 17, theta: 1.5, phi: 1.14 },
      { target: [-15, 1.8, 3], radius: 16.5, theta: 1.6, phi: 1.12 },
      { target: [4, 0.6, 0], radius: 15.5, theta: 1.44, phi: 1.16 },
      { target: [19, 1.4, 0.5], radius: 17, theta: 1.56, phi: 1.12 },
      { target: [24, 0.4, -0.5], radius: 18.5, theta: 1.5, phi: 1.14 },
      { target: [0, 0.5, 0], radius: 56, theta: 1.55, phi: 0.94 },
    ],
  },
};

let cached: DossierFile | null = null;

/** compile once, reuse everywhere — deterministic */
export function buildSharavDossier(): DossierFile {
  if (!cached) {
    const result = buildDossier(draft);
    if (!result.ok) throw new Error("SHARAV draft failed validation: " + result.errors.join(" | "));
    cached = result.dossier;
  }
  return cached;
}
