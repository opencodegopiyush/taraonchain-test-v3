/* ── the SLINK investigation — compiled from the real on-chain report ──
   v14 FINAL. every entity, address, figure, timestamp and claim below
   comes verbatim from the user's FINAL INVESTIGATION REPORT v6.0 (SLINK /
   Shivolink, Robinhood Chain — complete deployment trail, report generated
   2026-09-06, investigation window Jul 25 — Sep 05 2026). NOTHING outside
   the pasted report is used or fabricated. Verification stack per the
   report: Alchemy RPC (alchemy_getAssetTransfers), free public Robinhood
   Chain RPC (chain ID 0x1237), DexScreener API, 4byte.directory — ~300+ calls.

   v14: the 28 insider wallets are no longer one cluster — each wallet is
   its own bubble in the trace, ranked by ROI (highest first), sized by
   ROI, each with its own early-buy and exit linkage. Full authored graph
   payload (positions, per-chapter active edges, per-chapter cameras).
   Used by the seed script AND as the bundled fallback when the case
   archive database is unavailable. */

import { buildDossier, type DraftCase } from "./dossier";
import type { CaseEdge, CaseNode, DossierFile, DossierGraph, Epistemic } from "./types";

const RHC = "ROBINHOOD CHAIN";

/* ── the 28 insider wallets — report §6, RANKED BY ROI (highest first).
   rep = wallet number as printed in the report table. hold = one of the
   11 wallets still sitting on a large ETH balance on Robinhood Chain
   ("not yet withdrawn" list in the report). Every field verbatim. ── */
const WALLETS: {
  rep: number; addr: string; eth: string; txs: number;
  entry: number; exit: number; roiN: number; roi: string; hold?: boolean;
}[] = [
  { rep: 16, addr: "0x9155ba22", eth: "56.654",   txs: 60,  entry: 23,  exit: 145500, roiN: 6326, roi: "6,326x", hold: true },
  { rep: 18, addr: "0xe5327ae2", eth: "50.903",   txs: 62,  entry: 23,  exit: 130800, roiN: 5687, roi: "5,687x", hold: true },
  { rep: 19, addr: "0x1e70ea76", eth: "49.876",   txs: 39,  entry: 23,  exit: 127400, roiN: 5539, roi: "5,539x", hold: true },
  { rep: 20, addr: "0xc6e901c7", eth: "49.409",   txs: 20,  entry: 23,  exit: 127400, roiN: 5539, roi: "5,539x", hold: true },
  { rep: 12, addr: "0x4254dcc3", eth: "73.844",   txs: 121, entry: 35,  exit: 188600, roiN: 5388, roi: "5,388x", hold: true },
  { rep: 9,  addr: "0xca1182ab", eth: "92.180",   txs: 59,  entry: 46,  exit: 240100, roiN: 5220, roi: "5,220x", hold: true },
  { rep: 24, addr: "0x10535531", eth: "40.375",   txs: 46,  entry: 23,  exit: 103600, roiN: 4504, roi: "4,504x", hold: true },
  { rep: 27, addr: "0xfe1fbd80", eth: "37.493",   txs: 60,  entry: 23,  exit: 95600,  roiN: 4157, roi: "4,157x", hold: true },
  { rep: 15, addr: "0x093ba0a9", eth: "58.485",   txs: 61,  entry: 38,  exit: 149800, roiN: 3942, roi: "3,942x", hold: true },
  { rep: 1,  addr: "0x1d4f6f17", eth: "10.047",   txs: 312, entry: 102, exit: 367700, roiN: 3605, roi: "3,605x" },
  { rep: 22, addr: "0xa0ac2753", eth: "0.000005", txs: 89,  entry: 38,  exit: 125600, roiN: 3305, roi: "3,305x" },
  { rep: 14, addr: "0x7f71e75e", eth: "0.000005", txs: 79,  entry: 48,  exit: 158100, roiN: 3294, roi: "3,294x" },
  { rep: 23, addr: "0x8c92f762", eth: "2.205",    txs: 45,  entry: 38,  exit: 113900, roiN: 2997, roi: "2,997x" },
  { rep: 3,  addr: "0xb1fd2862", eth: "0.004",    txs: 91,  entry: 126, exit: 344700, roiN: 2735, roi: "2,735x" },
  { rep: 25, addr: "0xfb2c1733", eth: "39.544",   txs: 32,  entry: 38,  exit: 100500, roiN: 2645, roi: "2,645x", hold: true },
  { rep: 26, addr: "0x5c273d65", eth: "0.002",    txs: 23,  entry: 38,  exit: 99300,  roiN: 2613, roi: "2,613x" },
  { rep: 4,  addr: "0xae15d608", eth: "0.003",    txs: 199, entry: 126, exit: 316900, roiN: 2515, roi: "2,515x" },
  { rep: 5,  addr: "0x6f7c5054", eth: "0.003",    txs: 138, entry: 126, exit: 297900, roiN: 2364, roi: "2,364x" },
  { rep: 2,  addr: "0xcbcefc4f", eth: "0.004",    txs: 138, entry: 148, exit: 346000, roiN: 2338, roi: "2,338x" },
  { rep: 7,  addr: "0x6b51c88b", eth: "0.003",    txs: 57,  entry: 126, exit: 276700, roiN: 2196, roi: "2,196x" },
  { rep: 8,  addr: "0x5b43c626", eth: "0.004",    txs: 90,  entry: 126, exit: 270200, roiN: 2144, roi: "2,144x" },
  { rep: 28, addr: "0xe74ef5c4", eth: "31.655",   txs: 28,  entry: 38,  exit: 80200,  roiN: 2110, roi: "2,110x", hold: true },
  { rep: 21, addr: "0x78a408ef", eth: "0.002",    txs: 58,  entry: 148, exit: 125700, roiN: 849,  roi: "849x" },
  { rep: 13, addr: "0xa85caa33", eth: "0.0003",   txs: 123, entry: 332, exit: 163800, roiN: 493,  roi: "493x" },
  { rep: 10, addr: "0x6687b0b3", eth: "0.0003",   txs: 185, entry: 524, exit: 203600, roiN: 388,  roi: "388x" },
  { rep: 11, addr: "0xa04543db", eth: "0.0003",   txs: 117, entry: 570, exit: 193100, roiN: 339,  roi: "339x" },
  { rep: 6,  addr: "0x4f55879a", eth: "0.0003",   txs: 120, entry: 927, exit: 284800, roiN: 307,  roi: "307x" },
  { rep: 17, addr: "0x721c39fc", eth: "1.358",    txs: 220, entry: 476, exit: 140500, roiN: 295,  roi: "295x" },
];

const pad2 = (n: number) => String(n).padStart(2, "0");
const usd = (n: number) => "$" + n.toLocaleString("en-US");
const rid = (i: number) => "R" + pad2(i + 1);

/* ── infrastructure entities — report §2/§4/§10, verbatim ── */
const INFRA_ENTITIES = [
  { label: "Root funding wallet (CEX/bridge?)", short: "ROOT", kind: "wallet" as const, chain: RHC, note: "0xf70da97812cb96acdf810712aa562db8dfa3dbef — EOA, 1,625,315 txs, 12.13 ETH, first activity May 8 2026; profile consistent with a CEX hot wallet or bridge withdrawal address" },
  { label: "Layer 1 — high-volume intermediary", short: "L1", kind: "wallet" as const, chain: RHC, note: "0x331d9a049d496385998067abf6cbb6371c8d2466 — EOA, 566,539 txs over 2 months, 3.998 ETH; likely CEX hot wallet or bridge relayer" },
  { label: "Layer 2 — intermediary", short: "L2", kind: "wallet" as const, chain: RHC, note: "0xba39cb790834d441e625f5e361d0366fa7c1603e — EOA, 7 txs, 0.10 ETH; also funded the DEX router with 12 + 5.95 ETH" },
  { label: "Layer 3 — pass-through", short: "L3", kind: "wallet" as const, chain: RHC, note: "0xf79f8e2f9d387dc40e57d7ac4b3144e66aec84e6 — EOA, 3 txs, 0.0003 ETH; single-purpose pass-through wallet" },
  { label: "Layer 4 — trading bot / relayer", short: "L4", kind: "wallet" as const, chain: RHC, note: "0x88d25c861938a91af4ad57ad964a8fcc6c6351d3 — EOA, 20,931 txs, 392.18 ETH; high-frequency trading bot profile" },
  { label: "SLINK deployer", short: "DEPLOY", kind: "wallet" as const, chain: RHC, note: "0x79ba699eb35550cff96d205cfad7a22d975695e3 — EOA, 15 txs, 0.187 ETH; verified via deployer() selector 0xd5f39488; NOT one of the 28 insider wallets" },
  { label: "Token factory", short: "FACTORY", kind: "contract" as const, chain: RHC, note: "0x7ed598bcef8bd9edd8c97a195c6d13f40801ec7e — 48,356 chars of code, 2 txs, deployed SLINK via CREATE2; owner is the ERC-1967 proxy holding 186.86 ETH" },
  { label: "Factory owner (ERC-1967 proxy)", short: "PROXY", kind: "contract" as const, chain: RHC, note: "0x263ed295dafae1d9aadd6e56c4b6f9f38ee019dd — 344 chars minimal proxy, 186.86 ETH (≈$467K); likely where the deployer\u2019s REAL profits sit" },
  { label: "SLINK token (ERC-20)", short: "TOKEN", kind: "contract" as const, chain: RHC, note: "0xfa89ed9d12bf74add8253ddfaa426c4d8a0fa603 — 6,498 chars; supply 1,000,000,000 × 10^18 in slot 2; owner() reverts; immutable" },
  { label: "Initial vault (fully drained)", short: "VAULT", kind: "vault" as const, chain: RHC, note: "0x154b9f869e8839195cabce575dcfb8afbd9f3117 — 48-char minimal proxy; received the full 1B supply from the constructor, distributed to the pool and early buyers; 0 ETH, 0 SLINK left" },
  { label: "Main liquidity pool (SLINK/ETH)", short: "POOL", kind: "contract" as const, chain: RHC, note: "0x8366a39cc670b4001a1121b8f6a443a643e40951 — 13,760.87 ETH (≈$34.4M) + 116,464,855 SLINK; ~$55M ETH side at ATH; where ALL buyers\u2019 ETH went" },
  { label: "Secondary liquidity pool", short: "POOL2", kind: "contract" as const, chain: RHC, note: "0xe5e702641ea86f4ae6cc3cdaed2b886f976be044 — 53.11 ETH" },
  { label: "Bonding curve", short: "CURVE", kind: "contract" as const, chain: RHC, note: "0xaa66c48225ede78b2c9c9b75381cd4f6b1bf16a3 — 20,460 chars; returned by SLINK\u2019s curve()" },
  { label: "DEX fee collector", short: "FEES", kind: "contract" as const, chain: RHC, note: "0x4cd00e387622c35bddb9b4c962c136462338bc31 — 17,258 chars; 443.92 ETH (≈$1.11M) accumulated from the ~$93M trading volume" },
  { label: "Pool factory (Uniswap V2-style)", short: "PFAC", kind: "contract" as const, chain: RHC, note: "0x6131b5fae19ea4f9d964eac0408e4408b66337b5 — 27,450 chars; createPair called on it 8 times (selector 0xb9303701); owner EOA 0x1874028262f1f4b2dd1f2700a72ee8b9b7c69090 (1 tx)" },
  { label: "Robinhood Chain DEX router", short: "RTR", kind: "contract" as const, chain: RHC, note: "0x8876789976decbfcbbbe364623c6 (as printed in the report) — funded by Layer 2 with 12 + 5.95 ETH for trading" },
  { label: "MEV bot / searcher", short: "MEV", kind: "wallet" as const, chain: RHC, note: "0x4337038429b76948ee97eb2d8115513277c3abf5 — EOA, 131,694 txs; professional MEV searcher that processed many SLINK trades" },
  { label: "Retail FOMO buyers (1,075+ wallets)", short: "BUYERS", kind: "cluster" as const, chain: RHC, note: "80,620 buys + 68,243 sells on the main pair; 9,028 Transfer events total; left holding a −99.3% drawdown" },
  { label: "Compromised @shivon account + @shillink", short: "SOCIAL", kind: "protocol" as const, chain: RHC, note: "X account hijacked Sep 4–5 2026; bio linked fake @shillink; fake nonprofit story; quote-tweet + Musk \u201c💯\u201d; all deleted after the dump; @shillink frozen" },
];

/* ── infrastructure connections — report §2/§4, verbatim ── */
const INFRA_CONNECTIONS = [
  { from: "ROOT", to: "L1", value: "5 ETH", channel: "direct" as const, epistemic: "observed" as const, basis: "Jul 25 03:00 IST", when: "JUL 25 03:00 IST", txHash: "" },
  { from: "ROOT", to: "L1", value: "2.53 ETH", channel: "direct" as const, epistemic: "observed" as const, basis: "Jul 25 03:17 IST", when: "JUL 25 03:17 IST", txHash: "" },
  { from: "ROOT", to: "L1", value: "2.91 ETH", channel: "direct" as const, epistemic: "observed" as const, basis: "Jul 25 03:41 IST", when: "JUL 25 03:41 IST", txHash: "" },
  { from: "ROOT", to: "L1", value: "2.56 ETH", channel: "direct" as const, epistemic: "observed" as const, basis: "Jul 25 04:07 IST", when: "JUL 25 04:07 IST", txHash: "" },
  { from: "ROOT", to: "L1", value: "2.59 ETH", channel: "direct" as const, epistemic: "observed" as const, basis: "Jul 25 04:34 IST · ~15.6 ETH total into Layer 1", when: "JUL 25 04:34 IST", txHash: "" },
  { from: "L1", to: "L2", value: "0.178 ETH", channel: "direct" as const, epistemic: "observed" as const, basis: "Aug 6 01:58 IST", when: "AUG 6 01:58 IST", txHash: "" },
  { from: "L2", to: "L3", value: "0.25 ETH", channel: "direct" as const, epistemic: "observed" as const, basis: "Aug 20 03:31 IST", when: "AUG 20 03:31 IST", txHash: "" },
  { from: "L2", to: "L3", value: "46.49 ETH", channel: "direct" as const, epistemic: "observed" as const, basis: "Aug 20 03:33 IST", when: "AUG 20 03:33 IST", txHash: "" },
  { from: "L2", to: "RTR", value: "12 ETH + 5.95 ETH", channel: "direct" as const, epistemic: "observed" as const, basis: "DEX router funding — for trading", when: "AUG 20", txHash: "" },
  { from: "L3", to: "L4", value: "46.49 ETH", channel: "direct" as const, epistemic: "observed" as const, basis: "Aug 20 03:33 IST — same minute pass-through", when: "AUG 20 03:33 IST", txHash: "" },
  { from: "L4", to: "DEPLOY", value: "0.198 ETH", channel: "direct" as const, epistemic: "observed" as const, basis: "block 0x33cc551 · tx 0x9edc6f938bcb2294b6d5fe3cc28cbdb1…", when: "SEP 5 00:51 IST", txHash: "0x9edc6f938bcb2294b6d5fe3cc28cbdb1…" },
  { from: "DEPLOY", to: "FACTORY", value: "GAS ~0.0005 ETH", channel: "direct" as const, epistemic: "observed" as const, basis: "nonce 0 — token factory deployed first", when: "SEP 5 02:05 IST", txHash: "" },
  { from: "DEPLOY", to: "PFAC", value: "8 × createPair", channel: "direct" as const, epistemic: "observed" as const, basis: "selector 0xb9303701 (Uniswap V2 createPair) called 8× on 0xef4fb24ad09162…; pools at nonces 1–7 (11:34–11:38 IST), final setup nonce 8 (12:25 IST)", when: "SEP 5 11:34–12:25 IST", txHash: "" },
  { from: "FACTORY", to: "TOKEN", value: "CREATE2 deploy", channel: "direct" as const, epistemic: "observed" as const, basis: "factory deployment pattern — full 1B supply minted in constructor", when: "SEP 5 12:25 IST", txHash: "" },
  { from: "TOKEN", to: "VAULT", value: "1,000,000,000 SLINK", channel: "direct" as const, epistemic: "observed" as const, basis: "constructor sent the full supply to the initial vault", when: "SEP 5 (CONSTRUCTOR)", txHash: "" },
  { from: "VAULT", to: "POOL", value: "SLINK (initial distribution)", channel: "direct" as const, epistemic: "observed" as const, basis: "vault distributed SLINK to the liquidity pool and early buyers; fully drained", when: "SEP 5", txHash: "" },
  { from: "SOCIAL", to: "TOKEN", value: "QUOTE-TWEET OF THE CONTRACT", channel: "direct" as const, epistemic: "observed" as const, basis: "@shivon quote-tweeted the contract address — \u201cI rarely post about crypto besides DOGE, but what these young folks are doing really impresses me\u201d — Elon Musk replied 💯", when: "SEP 4–5", txHash: "" },
  { from: "SOCIAL", to: "BUYERS", value: "FOMO TRIGGER", channel: "direct" as const, epistemic: "observed" as const, basis: "hijacked @shivon quote-tweeted the contract; Elon Musk replied 💯; promotional post deleted after the dump", when: "SEP 4–5", txHash: "" },
  { from: "BUYERS", to: "POOL", value: "≈$93M VOLUME", channel: "direct" as const, epistemic: "observed" as const, basis: "80,620 buys + 68,243 sells on the main pair; $81,188,280 24h volume on SLINK/USDG alone; all buyers\u2019 ETH went here", when: "SEP 5", txHash: "" },
  { from: "FACTORY", to: "PROXY", value: "OWNERSHIP", channel: "direct" as const, epistemic: "observed" as const, basis: "factory owner() returns the ERC-1967 minimal proxy holding 186.86 ETH — likely the deployer\u2019s real profits", when: "SEP 5", txHash: "" },
  { from: "POOL", to: "FEES", value: "443.92 ETH FEES", channel: "direct" as const, epistemic: "observed" as const, basis: "DEX trading fee collector accumulated ≈$1.1M from the $93M volume", when: "SEP 5", txHash: "" },
  { from: "MEV", to: "POOL", value: "MEV ROUTING", channel: "direct" as const, epistemic: "observed" as const, basis: "professional MEV searcher, 131,694 txs, processed many SLINK trades", when: "SEP 5", txHash: "" },
];

/* ── per-wallet early-buy and exit connections — report §6 ── */
const WALLET_CONNECTIONS = WALLETS.flatMap((w, i) => [
  {
    from: "VAULT", to: rid(i), value: `EARLY BUY ${usd(w.entry)}`,
    channel: "direct" as const, epistemic: "observed" as Epistemic,
    basis: `entry ${usd(w.entry)} in the first minutes at mc $8,312–$9,256 — report §6 verified P&L (wallet #${pad2(w.rep)})${w.rep === 1 ? " · 1 buy, 50 sells — fully traced via Transfer events" : w.rep === 2 ? " · 3 buys, 128 sells — fully traced via Transfer events" : ""}`,
    when: "SEP 5 (FIRST MINUTES)", txHash: "",
  },
  {
    from: rid(i), to: "POOL", value: `EXIT ${usd(w.exit)} · ${w.roi}`,
    channel: "direct" as const, epistemic: "observed" as Epistemic,
    basis: `fully exited — 0 SLINK, verified via balanceOf()${w.hold ? " · ETH still on Robinhood Chain, not yet withdrawn" : ""}`,
    when: "SEP 5 15:28–17:00 IST", txHash: "",
  },
]);

/* ── authored 3d graph — infrastructure scene + the ranked wallet arc ── */

function walletPos(i: number): [number, number, number] {
  /* ranked arc, left → right = best → worst ROI; the middle of the arc
     bows toward the camera and the ends lift, so the row reads as a
     stage, not a ruler */
  const t = (i - 13.5) / 13.5;
  return [-17 + i * (36 / 27), -5.8 + 2.6 * t * t, 12.2 - 4.4 * t * t];
}
function walletSize(roiN: number): number {
  /* bubble size = ROI on a log scale: 6,326x → 2.2, 295x → 1.0 */
  const lo = Math.log(295);
  const hi = Math.log(6326);
  return +(1.0 + 1.2 * ((Math.log(roiN) - lo) / (hi - lo))).toFixed(3);
}

const infraNodes: CaseNode[] = [
  { id: "ROOT", label: "Root funding wallet (CEX/bridge?)", short: "ROOT", kind: "wallet", address: "0xf70da97812cb96acdf810712aa562db8dfa3dbef", chain: RHC, firstSeen: "MAY 08 2026", lastSeen: "SEP 05 2026", received: 27.8, sent: 15.6, balance: 12.13, risk: 1, tags: [RHC, "FUNDING ROOT"], note: INFRA_ENTITIES[0].note, pos: [-26, 6, -10], size: 1.1 },
  { id: "L1", label: "Layer 1 — high-volume intermediary", short: "L1", kind: "wallet", address: "0x331d9a049d496385998067abf6cbb6371c8d2466", chain: RHC, firstSeen: "JUL 25 2026", lastSeen: "SEP 05 2026", received: 15.6, sent: 0.178, balance: 3.998, risk: 1, tags: [RHC, "566,539 TXS"], note: INFRA_ENTITIES[1].note, pos: [-19.5, 4.6, -7.5], size: 0.9 },
  { id: "L2", label: "Layer 2 — intermediary", short: "L2", kind: "wallet", address: "0xba39cb790834d441e625f5e361d0366fa7c1603e", chain: RHC, firstSeen: "AUG 06 2026", lastSeen: "SEP 05 2026", received: 0.178, sent: 64.69, balance: 0.1, risk: 1, tags: [RHC, "7 TXS"], note: INFRA_ENTITIES[2].note, pos: [-13.5, 3.4, -5.2], size: 0.8 },
  { id: "L3", label: "Layer 3 — pass-through", short: "L3", kind: "wallet", address: "0xf79f8e2f9d387dc40e57d7ac4b3144e66aec84e6", chain: RHC, firstSeen: "AUG 20 2026", lastSeen: "AUG 20 2026", received: 46.74, sent: 46.49, balance: 0.0003, risk: 1, tags: [RHC, "PASS-THROUGH"], note: INFRA_ENTITIES[3].note, pos: [-8, 2.4, -3.2], size: 0.7 },
  { id: "L4", label: "Layer 4 — trading bot / relayer", short: "L4", kind: "wallet", address: "0x88d25c861938a91af4ad57ad964a8fcc6c6351d3", chain: RHC, firstSeen: "AUG 20 2026", lastSeen: "SEP 05 2026", received: 46.49, sent: 0.198, balance: 392.18, risk: 2, tags: [RHC, "20,931 TXS"], note: INFRA_ENTITIES[4].note, pos: [-3, 1.6, -1.2], size: 1.0 },
  { id: "DEPLOY", label: "SLINK deployer", short: "DEPLOY", kind: "wallet", address: "0x79ba699eb35550cff96d205cfad7a22d975695e3", chain: RHC, firstSeen: "SEP 05 2026", lastSeen: "SEP 05 2026", received: 0.198, sent: 0.011, balance: 0.187, risk: 2, tags: [RHC, "15 TXS", "NOT AN INSIDER"], note: INFRA_ENTITIES[5].note, pos: [2, 1.8, 0.6], size: 1.0 },
  { id: "FACTORY", label: "Token factory", short: "FACTORY", kind: "contract", address: "0x7ed598bcef8bd9edd8c97a195c6d13f40801ec7e", chain: RHC, firstSeen: "SEP 05 2026", lastSeen: "SEP 05 2026", received: 0.0005, sent: 0, balance: 0.0135, risk: 2, tags: [RHC, "CREATE2"], note: INFRA_ENTITIES[6].note, pos: [5.5, 3, -0.5], size: 1.0 },
  { id: "PROXY", label: "Factory owner (ERC-1967 proxy)", short: "PROXY", kind: "contract", address: "0x263ed295dafae1d9aadd6e56c4b6f9f38ee019dd", chain: RHC, firstSeen: "SEP 05 2026", lastSeen: "SEP 05 2026", received: 0, sent: 0, balance: 186.86, risk: 3, tags: [RHC, "≈$467K", "LIKELY REAL PROFITS"], note: INFRA_ENTITIES[7].note, pos: [9, 4.6, -2], size: 1.15 },
  { id: "PFAC", label: "Pool factory (Uniswap V2-style)", short: "PFAC", kind: "contract", address: "0x6131b5fae19ea4f9d964eac0408e4408b66337b5", chain: RHC, firstSeen: "SEP 05 2026", lastSeen: "SEP 05 2026", received: 0, sent: 0, balance: 0, risk: 1, tags: [RHC, "8 × createPair"], note: INFRA_ENTITIES[14].note, pos: [0.5, -0.6, 3.6], size: 0.95 },
  { id: "TOKEN", label: "SLINK token (ERC-20)", short: "TOKEN", kind: "contract", address: "0xfa89ed9d12bf74add8253ddfaa426c4d8a0fa603", chain: RHC, firstSeen: "SEP 05 2026", lastSeen: "SEP 05 2026", received: 0, sent: 0, balance: 0, risk: 0, tags: [RHC, "1B MINTED IN CONSTRUCTOR", "IMMUTABLE"], note: INFRA_ENTITIES[8].note, pos: [8.5, 0.4, 2], size: 1.35 },
  { id: "VAULT", label: "Initial vault (fully drained)", short: "VAULT", kind: "vault", address: "0x154b9f869e8839195cabce575dcfb8afbd9f3117", chain: RHC, firstSeen: "SEP 05 2026", lastSeen: "SEP 05 2026", received: 1000000000, sent: 1000000000, balance: 0, risk: 1, tags: [RHC, "FULLY DRAINED"], note: INFRA_ENTITIES[9].note, pos: [5.5, -1.6, 4.4], size: 0.9 },
  { id: "POOL", label: "Main liquidity pool (SLINK/ETH)", short: "POOL", kind: "contract", address: "0x8366a39cc670b4001a1121b8f6a443a643e40951", chain: RHC, firstSeen: "SEP 05 2026", lastSeen: "SEP 05 2026", received: 13760.87, sent: 0, balance: 13760.87, risk: 1, tags: [RHC, "≈$34.4M REMAINS"], note: INFRA_ENTITIES[10].note, pos: [12.5, -1.2, 5.8], size: 1.6 },
  { id: "POOL2", label: "Secondary liquidity pool", short: "POOL2", kind: "contract", address: "0xe5e702641ea86f4ae6cc3cdaed2b886f976be044", chain: RHC, firstSeen: "SEP 05 2026", lastSeen: "SEP 05 2026", received: 0, sent: 0, balance: 53.11, risk: 0, tags: [RHC], note: INFRA_ENTITIES[11].note, pos: [16.5, -2.6, 3.6], size: 0.8 },
  { id: "CURVE", label: "Bonding curve", short: "CURVE", kind: "contract", address: "0xaa66c48225ede78b2c9c9b75381cd4f6b1bf16a3", chain: RHC, firstSeen: "SEP 05 2026", lastSeen: "SEP 05 2026", received: 0, sent: 0, balance: 0, risk: 0, tags: [RHC], note: INFRA_ENTITIES[12].note, pos: [14.5, 2.2, 0.6], size: 0.9 },
  { id: "FEES", label: "DEX fee collector", short: "FEES", kind: "contract", address: "0x4cd00e387622c35bddb9b4c962c136462338bc31", chain: RHC, firstSeen: "SEP 05 2026", lastSeen: "SEP 05 2026", received: 443.92, sent: 0, balance: 443.92, risk: 2, tags: [RHC, "≈$1.11M FEES"], note: INFRA_ENTITIES[13].note, pos: [15.8, 0.6, 8.2], size: 1.1 },
  { id: "RTR", label: "Robinhood Chain DEX router", short: "RTR", kind: "contract", address: "0x8876789976decbfcbbbe364623c6", chain: RHC, firstSeen: "AUG 20 2026", lastSeen: "SEP 05 2026", received: 17.95, sent: 0, balance: 0, risk: 0, tags: [RHC, "DEX ROUTER"], note: INFRA_ENTITIES[15].note, pos: [-10.5, 0.8, 3.4], size: 0.85 },
  { id: "MEV", label: "MEV bot / searcher", short: "MEV", kind: "wallet", address: "0x4337038429b76948ee97eb2d8115513277c3abf5", chain: RHC, firstSeen: "SEP 05 2026", lastSeen: "SEP 05 2026", received: 0, sent: 0, balance: 0, risk: 1, tags: [RHC, "131,694 TXS"], note: INFRA_ENTITIES[16].note, pos: [10, -3.2, 9.4], size: 1.05 },
  { id: "BUYERS", label: "Retail FOMO buyers (1,075+ wallets)", short: "BUYERS", kind: "cluster", address: "—", chain: RHC, firstSeen: "SEP 05 2026", lastSeen: "SEP 05 2026", received: 0, sent: 0, balance: 0, risk: 0, tags: [RHC, "−99.3% DRAWDOWN"], note: INFRA_ENTITIES[17].note, pos: [-4.5, -2.4, 9], size: 1.3 },
  { id: "SOCIAL", label: "Compromised @shivon account + @shillink", short: "SOCIAL", kind: "protocol", address: "—", chain: RHC, firstSeen: "SEP 04 2026", lastSeen: "SEP 05 2026", received: 0, sent: 0, balance: 0, risk: 3, tags: [RHC, "HIJACKED"], note: INFRA_ENTITIES[18].note, pos: [-18.5, 7.6, 5.5], size: 1.1 },
];

const walletNodes: CaseNode[] = WALLETS.map((w, i) => ({
  id: rid(i),
  label: `Insider wallet ${rid(i)} — ${w.roi} ROI (report #${pad2(w.rep)})`,
  short: rid(i),
  kind: "wallet",
  address: `${w.addr}…`,
  chain: RHC,
  firstSeen: "SEP 05 2026",
  lastSeen: "SEP 05 2026",
  received: w.entry,
  sent: w.exit,
  balance: parseFloat(w.eth),
  risk: 3,
  tags: [RHC, "INSIDER", ...(w.hold ? ["NOT YET WITHDRAWN"] : [])],
  note: `ROI rank ${rid(i)} · report #${pad2(w.rep)} · ${w.addr}… · holds ${w.eth} ETH · ${w.txs} txs · claimed P&L ${usd(w.entry)} → ${usd(w.exit)} · ROI ${w.roi} · fully exited (0 SLINK)${w.rep === 1 ? " · 1 buy, 50 sells — fully traced via Transfer events" : w.rep === 2 ? " · 3 buys, 128 sells — fully traced via Transfer events" : ""}${w.hold ? " · NOT YET WITHDRAWN" : ""}`,
  pos: walletPos(i),
  size: walletSize(w.roiN),
  key: i === 0,
}));

const infraEdges: CaseEdge[] = INFRA_CONNECTIONS.map((c, i) => ({
  id: `e-IN-${pad2(i + 1)}`,
  source: c.from,
  target: c.to,
  value: parseFloat(c.value.replace(/[^0-9.]/g, "")) || 0.02,
  epistemic: c.epistemic,
  basis: c.basis,
  channel: "direct" as const,
  txs: [],
  valueLabel: c.value,
}));

const walletEdges: CaseEdge[] = WALLETS.flatMap((w, i) => [
  {
    id: `e-B-${rid(i)}`, source: "VAULT", target: rid(i),
    value: w.entry, epistemic: "observed" as Epistemic,
    basis: `entry ${usd(w.entry)} — report §6 (wallet #${pad2(w.rep)})`,
    channel: "direct" as const, txs: [],
    valueLabel: `EARLY BUY ${usd(w.entry)}`,
  },
  {
    id: `e-X-${rid(i)}`, source: rid(i), target: "POOL",
    value: w.exit, epistemic: "observed" as Epistemic,
    basis: `exit ${usd(w.exit)} · ${w.roi} · fully exited (0 SLINK)${w.hold ? " · not yet withdrawn" : ""}`,
    channel: "direct" as const, txs: [],
    valueLabel: `EXIT ${usd(w.exit)} · ${w.roi}`,
  },
]);

/* active story edges per chapter — everything else renders faint */
const top10 = WALLETS.slice(0, 10).map((_, i) => rid(i));
const GRAPH: DossierGraph = {
  nodes: [...infraNodes, ...walletNodes],
  edges: [...infraEdges, ...walletEdges],
  chapterEdges: [
    /* 01 the setup */ ["e-IN-15", "e-IN-16", "e-IN-17", "e-IN-18"],
    /* 02 the pump */ ["e-IN-19", "e-IN-21", "e-IN-22"],
    /* 03 five layers */ ["e-IN-01", "e-IN-02", "e-IN-03", "e-IN-04", "e-IN-05", "e-IN-06", "e-IN-07", "e-IN-08", "e-IN-09", "e-IN-10", "e-IN-11"],
    /* 04 the hand */ ["e-IN-11", "e-IN-12", "e-IN-13", "e-IN-14", "e-IN-20"],
    /* 05 the machine */ ["e-IN-14", "e-IN-15", "e-IN-16", "e-IN-20", "e-IN-21", "e-IN-22"],
    /* 06 the twenty-eight */ [
      ...top10.flatMap((r) => [`e-B-${r}`, `e-X-${r}`]),
    ],
    /* 07 show the math */ ["e-IN-16", "e-IN-19", "e-IN-21"],
    /* 08 three hours */ ["e-IN-01", "e-IN-11", "e-IN-17", "e-IN-18", "e-IN-19", "e-X-R01", "e-X-R10"],
  ],
  chapterCams: [
    { target: [-4, 1.5, 5], radius: 26, theta: 1.4, phi: 1.12 },
    { target: [4, -1, 6], radius: 26, theta: 1.48, phi: 1.1 },
    { target: [-13, 3, -4], radius: 30, theta: 1.55, phi: 1.05 },
    { target: [5, 1.5, 2], radius: 20, theta: 1.45, phi: 1.12 },
    { target: [10.5, 0.5, 4.5], radius: 22, theta: 1.5, phi: 1.1 },
    { target: [-1, -4.4, 9], radius: 33, theta: 0.12, phi: 1.22 },
    { target: [7, -1, 7.5], radius: 24, theta: 1.52, phi: 1.08 },
    { target: [-6, 2, 0], radius: 34, theta: 1.6, phi: 1.05 },
  ],
};

const draft: DraftCase = {
  id: "R-0905",
  codename: "SLINK",
  status: "CLOSED",
  victim: "SLINK buyers (retail FOMO)",
  chains: RHC,
  amountText: "≈$4.83M EXTRACTED",
  amountUsd: "$82M PEAK MCAP",
  span: "JUL 25 — SEP 05 2026",
  updated: "2026-09-06",
  progress: "100",
  summary:
    "A hijacked @shivon account pushed a fake Neuralink-nonprofit story and quote-tweeted the $SLINK contract — Elon Musk replied \u201c💯\u201d — and the token hit an $82,000,000 market cap 75 minutes after launch. The on-chain record shows a deployer funded through five layers of chain-hopping over 42 days, 28 pre-positioned insider wallets extracting ≈$4,832,500 and fully exiting, and a factory-owner proxy quietly holding 186.86 ETH. Price collapsed 99.3% from the peak.",
  method:
    "All data collected via Alchemy RPC (alchemy_getAssetTransfers for the funding trail — THE KEY METHOD), the free public Robinhood Chain RPC (chain ID 0x1237), DexScreener API (market data, pairs) and 4byte.directory (selector decoding). ~300+ JSON-RPC calls: eth_getCode, eth_getBalance, eth_getTransactionCount, eth_call (name, symbol, decimals, totalSupply, balanceOf, owner, deployer, curve, factory), eth_getStorageAt (slots 0–2), eth_getLogs (9,028 Transfer events), eth_getBlockByNumber, eth_getTransactionByHash, eth_getTransactionReceipt, eth_blockNumber, eth_chainId. Deployer identity verified via the SLINK contract\u2019s deployer() selector 0xd5f39488, confirmed on 4byte.directory. Wallets #1–2 P&L computed from individual Transfer events.",
  limitations:
    "Whether the operator withdrew ETH from a CEX (Binance, OKX, Coinbase) or used a bridge (across from Ethereum mainnet or another L2) cannot be determined from Robinhood Chain alone — it would require cross-chain analysis. The real-world identity of the account hijackers is not established in this report. All tweets have since been deleted and @shillink has been frozen, so the social-engineering leg can no longer be independently re-verified.",
  nextSteps:
    "Cross-chain analysis of root 0xf70da978…dbef to identify the CEX or bridge behind the funding\nWatch the 11 insider wallets still sitting on ~580 ETH (≈$1.45M) on Robinhood Chain\nTrace factory-owner proxy 0x263ed295…19dd (186.86 ETH) for exit moves",
  sourceNote:
    "Compiled by taraonchain from the FINAL INVESTIGATION REPORT v6.0 (SLINK / Shivolink — complete deployment trail). All addresses, balances, transfer events and timestamps verifiable on-chain via Alchemy RPC + free public Robinhood Chain RPC + DexScreener API + 4byte.directory. Report generated 2026-09-06 (UTC).",
  assetRows: [
    { loc: "MAIN LIQUIDITY POOL", amt: "13,760.87 ETH (≈$34.4M)", state: "REMAINS IN POOL · ~$20.6M EXTRACTED BY SELLERS", tone: "fact" },
    { loc: "DEX FEE COLLECTOR", amt: "443.92 ETH (≈$1.11M)", state: "FEES FROM ~$93M VOLUME", tone: "fact" },
    { loc: "FACTORY-OWNER PROXY", amt: "186.86 ETH (≈$467K)", state: "LIKELY REAL OPERATOR PROFITS", tone: "assess" },
    { loc: "11 INSIDER WALLETS", amt: "~580 ETH (≈$1.45M)", state: "STILL ON ROBINHOOD CHAIN", tone: "risk" },
    { loc: "DEPLOYER EOA", amt: "0.187 ETH", state: "PUPPET BALANCE · NOT THE PRIZE", tone: "assess" },
    { loc: "28 INSIDER WALLETS", amt: "≈$4,832,500 COMBINED", state: "FULLY EXITED · 0 SLINK EACH", tone: "fact" },
  ],
  entities: [
    ...INFRA_ENTITIES,
    ...WALLETS.map((w, i) => ({
      label: `Insider wallet ${rid(i)} — ${w.roi} ROI (report #${pad2(w.rep)})`,
      short: rid(i),
      kind: "wallet" as const,
      chain: RHC,
      note: `ROI rank ${rid(i)} · report #${pad2(w.rep)} · ${w.addr}… · holds ${w.eth} ETH · ${w.txs} txs · claimed P&L ${usd(w.entry)} → ${usd(w.exit)} · ROI ${w.roi} · fully exited (0 SLINK)${w.hold ? " · NOT YET WITHDRAWN" : ""}`,
    })),
  ],
  connections: [...INFRA_CONNECTIONS, ...WALLET_CONNECTIONS],
  chapters: [
    {
      kicker: "The setup",
      title: "A hijacked account, a fake nonprofit, a Musk reply",
      body:
        "Shivon Zilis — Yale graduate, Bloomberg Beta founding partner, Tesla Autopilot alum, Director of Operations at Neuralink — was not a participant in any of this. On September 4–5, 2026, her X account (@shivon) was compromised by hackers who executed a prepared social-engineering script. The bio was updated to link @neuralink and a fake account, @shillink.\n\n@shillink posted the story: a nonprofit \u201cMIT student experiment\u201d connecting five paralyzed Neuralink patients via brain implants, funded by $SLINK transaction taxes. Then @shivon quote-tweeted the contract address — \u201cI rarely post about crypto besides DOGE, but what these young folks are doing really impresses me\u201d — and Elon Musk replied with a single emoji: 💯. That was the trigger. When the dump came, the promotional post was deleted. All tweets have since been deleted and @shillink has been frozen.",
      facts:
        "observed | @shivon bio updated to link @neuralink + fake @shillink\nobserved | @shillink story: 5 paralyzed Neuralink patients, funded by $SLINK transaction taxes\nobserved | Quote-tweet of the contract address · Elon Musk replied 💯\nobserved | Post deleted after the dump · @shillink frozen",
      focus: "SOCIAL, TOKEN, BUYERS",
    },
    {
      kicker: "Seventy-five minutes",
      title: "Launch to $82,000,000 before lunch was over",
      body:
        "The token went live at 08:42:58 UTC on September 5, 2026 — 14:12:58 IST — with the first transfer at block 55,061,075. From a market cap of roughly $8K, the pump ran seventy-five minutes without pause. At 09:58:13 UTC (15:28:13 IST), block 55,108,875, SLINK printed its all-time high: $82,000,000 market cap, ~$0.082 per token.\n\nThe density at the top says everything about the mania: 83 transfers in a single block at peak. Across its whole life the token recorded 9,028 Transfer events across 1,075+ unique wallets, and the main pair alone processed 80,620 buys against 68,243 sells in 24 hours.",
      facts:
        "observed | First transfer Sep 5 14:12:58 IST · block 55,061,075\nobserved | ATH $82,000,000 · ~$0.082/SLINK · block 55,108,875 · 75 min after launch\nobserved | 83 transfers in a single block at peak\nobserved | 9,028 Transfer events · 1,075+ unique wallets",
      focus: "TOKEN, POOL, BUYERS",
    },
    {
      kicker: "The road in",
      title: "Five layers, forty-two days",
      body:
        "The money that built SLINK did not start anywhere near the deployer. The trail begins at a root wallet — 0xf70da978…dbef, 1,625,315 transactions, first activity May 8, 2026 — whose profile is consistent with a CEX hot wallet or bridge withdrawal address. On July 25, between 03:00 and 04:34 IST, it pushed five transfers totalling ~15.6 ETH into Layer 1, a 566,539-transaction intermediary.\n\nFrom there the obfuscation thickens: 0.178 ETH to Layer 2 on August 6, then 0.25 + 46.49 ETH to Layer 3 on August 20, forwarded to Layer 4 — a 20,931-transaction trading bot holding 392.18 ETH — in the same minute. Layer 4 finally sent 0.198 ETH to the deployer at 00:51 IST on launch day. Five layers, forty-two days of preparation, and barely enough ETH at the end to pay for gas and contract deployment.",
      facts:
        "observed | Root 0xf70da978…dbef · 1,625,315 txs · profile consistent with CEX/bridge hot wallet\nobserved | Five transfers Jul 25 03:00–04:34 IST · ~15.6 ETH into Layer 1\nobserved | 0.198 ETH reached the deployer Sep 5 00:51 IST · block 0x33cc551\nunknown | Whether the root is a CEX withdrawal or a bridge — requires cross-chain analysis",
      focus: "ROOT, L1, L2, L3, L4, DEPLOY",
    },
    {
      kicker: "The hand",
      title: "Fifteen transactions, seven figures of setup",
      body:
        "The deployer — 0x79ba699e…95e3, an EOA with just 15 transactions and 0.187 ETH — is verified through the SLINK contract\u2019s own deployer() function (selector 0xd5f39488, confirmed on 4byte.directory). Its activity is a study in economy: at 02:05 IST on launch day it deployed the token factory (nonce 0). Between 11:34 and 11:38 IST it called createPair seven times (nonces 1–7), and at 12:25 IST the final setup transaction (nonce 8) deployed SLINK itself through the factory via CREATE2. Total gas: ~0.01 ETH.\n\nTwo details matter. First, the deployer is NOT one of the 28 insider wallets — separate wallets handled the insider trading, keeping the creation hand clean. Second, the factory owns the deploy: the factory-owner is an ERC-1967 minimal proxy sitting on 186.86 ETH — while the visible deployer holds pocket change.",
      facts:
        "observed | Deployer verified via deployer() · selector 0xd5f39488 · 4byte.directory\nobserved | Nonce 0 factory (02:05 IST) · nonces 1–7 createPair (11:34–11:38 IST) · nonce 8 SLINK deploy (12:25 IST)\nobserved | Deployer called 0xef4fb24ad09162… 8× with selector 0xb9303701 (Uniswap V2 createPair)\nobserved | Deployer is NOT one of the 28 insider wallets",
      focus: "DEPLOY, FACTORY, PFAC, TOKEN",
    },
    {
      kicker: "The machine",
      title: "An immutable token and a hungry periphery",
      body:
        "The SLINK token contract itself is clean — and deliberately so. It is a 6,498-character ERC-20 with no owner function (the call reverts), empty storage slots 0 and 1, and total supply 1,000,000,000 × 10^18 sitting in slot 2. The entire billion was minted in the constructor; across all 9,028 Transfer events there is not a single mint. Nobody can mint more, pause transfers, or withdraw from the contract. The token is immutable — a trust costume for the operation built around it.\n\nThat periphery is where the value pooled. The initial vault received the full supply and distributed it to the liquidity pool and early buyers before draining to zero. The main SLINK/ETH pool now holds 13,760.87 ETH (≈$34.4M). The DEX fee collector accumulated 443.92 ETH (≈$1.11M) from the ~$93M volume. A secondary pool holds 53.11 ETH, and a professional MEV bot with 131,694 transactions processed a large share of the trading. And the factory\u2019s owner — that 344-character proxy — holds 186.86 ETH.",
      facts:
        "observed | owner() reverts · slots 0–1 empty · slot 2 = 1,000,000,000 × 10^18\nobserved | Zero mint events across all 9,028 Transfer events — full supply minted in constructor\nobserved | Main pool 13,760.87 ETH (≈$34.4M) · fee collector 443.92 ETH (≈$1.11M)\nassessed | Factory-owner proxy (186.86 ETH ≈ $467K) — likely where the deployer\u2019s REAL profits sit",
      focus: "TOKEN, VAULT, POOL, FEES, PROXY",
    },
    {
      kicker: "The twenty-eight",
      title: "Every one of them fully exited",
      body:
        "Twenty-eight wallets bought inside the first minutes, when the market cap read $8,312–$9,256 — matching the \u201c$8k mc\u201d and \u201c$9k mc\u201d entries the operators later posted on Instagram. Entry tickets were tiny: $23 to $927 per wallet. The two largest are fully traced through their Transfer events. Wallet #1 bought 11,019,565.91 SLINK for ~$102 in a single transaction and sold in 50 sells for ~$367,700 — 3,605x, fully exited. Wallet #2 bought 17,804,969.83 SLINK for ~$148 across 3 buys and sold across 128 sells for ~$346,000 — 2,338x, fully exited.\n\nRanked by return, the roster runs from 6,326x ($23 → $145,500) at the top down to 295x ($476 → $140,500) — each wallet is its own bubble in the trace above, sized by ROI, ranked best to worst with the full verified ledger in the field notes below. Combined extraction: ≈$4,832,500, every wallet at 0 SLINK. Roughly 631 ETH (≈$1.58M) still sits in these wallets on Robinhood Chain — eleven of them hold ~580 ETH (≈$1.45M) and have not yet withdrawn.",
      facts: [
        "observed | All 28 insider wallets: 0 SLINK remaining — fully exited",
        "observed | Ranked by ROI: 6,326x (R01) down to 295x (R28) · combined ≈$4,832,500",
        "observed | 11 wallets still sit on ~580 ETH (≈$1.45M) on Robinhood Chain",
        "observed | THE LEDGER — ROI rank · report # · ETH held · txs · claimed P&L · ROI · SLINK left",
        ...WALLETS.map(
          (w, i) =>
            `observed | ${rid(i)} · #${pad2(w.rep)} ${w.addr}… · ${w.eth} ETH · ${w.txs} txs · ${usd(w.entry)} → ${usd(w.exit)} · ${w.roi} · 0 SLINK${w.hold ? " · NOT YET WITHDRAWN" : ""}`,
        ),
      ].join("\n"),
      focus: [...WALLETS.map((_, i) => rid(i)), "POOL", "VAULT"].join(", "),
    },
    {
      kicker: "Show the math",
      title: "Why $82,000,000 holds up",
      body:
        "The ATH claim survives arithmetic. At $0.082 per token, the pool\u2019s 111M SLINK was worth ~$9.1M, and the ETH side — swollen by the flood of buyers — is estimated at ~$55M at the peak. Total pool value of $64M–82M is consistent with an $82M market cap. After the dump, the verified state is 13,760.87 ETH (≈$34.4M) against 116,464,855 now near-worthless SLINK — meaning sellers extracted ~$20.6M of ETH from the pool on the way down.\n\nDexScreener corroborates the shape of the day: 30 trading pairs found, the main SLINK/USDG pair showing $81,188,280 of 24-hour volume and 80,620 buys against 68,243 sells, price down 98.15% in 24 hours. Current state: $0.000553 per token, $553,000 market cap — 99.3% below the peak. With 9,028 transfers at an average trade size of ~$10K, the ~$93M total volume figure is plausible.",
      facts:
        "observed | Pool at ATH: ~$55M ETH side · $64M–$82M total — consistent with the $82M claim\nobserved | Pool now: 13,760.87 ETH (≈$34.4M) · ~$20.6M extracted by sellers\nobserved | DexScreener: 30 pairs · main pair $81,188,280 24h volume · −98.15% price",
      focus: "POOL, FEES, BUYERS",
    },
    {
      kicker: "Three hours",
      title: "The whole arc, then the silence",
      body:
        "The pump took seventy-five minutes. The dump took roughly ninety. Between 15:28 and 17:00 IST, the promotional tweet was deleted, the 28 insider wallets pulled $4.7M+ out of the pool, and the ETH side drained from ~$55M to $34.4M. The last visible activity on-chain was around 17:00 IST at block 55,153,827. Total active window: about three hours.\n\nWhat remains is the residue this dossier is built from: a supply-side story that never existed, 9,028 transfers across 1,075+ wallets, ≈$4.83M moved to insider wallets — ~580 ETH of it still parked on Robinhood Chain — 186.86 ETH on the factory-owner proxy, and a funding root that only cross-chain analysis can name. The chain does not know the story. It never does.",
      facts:
        "observed | Pump: 75 minutes · dump: ~90 minutes · active window ~3 hours\nobserved | Last visible activity ~17:00 IST · block 55,153,827\nunknown | Real-world identity of the hijackers — not established in this report",
      focus: "TOKEN, POOL, ROOT",
    },
  ],
  findings: [
    {
      title: "28 pre-positioned wallets extracted ≈$4,832,500 and fully exited",
      epistemic: "observed",
      confidence: "",
      body:
        "Twenty-eight wallets bought $23–$927 of SLINK inside the first minutes at entry market caps of $8,312–$9,256, then sold into the pump for ≈$4,832,500 combined. All 28 wallets verified at 0 SLINK remaining via balanceOf(). Ranked by ROI the roster runs 6,326x ($23 → $145,500) down to 295x ($476 → $140,500). Wallets #1–2 P&L fully traced from Transfer events: $102 → $367,700 (3,605x, 50 sells) and $148 → $346,000 (2,338x, 128 sells). Entry market caps match the operators\u2019 Instagram \u201c$8k mc\u201d / \u201c$9k mc\u201d claims.",
    },
    {
      title: "Launch to $82M in 75 minutes; total active life ~3 hours",
      epistemic: "observed",
      confidence: "",
      body:
        "First transfer 08:42:58 UTC Sep 5 2026 (block 55,061,075); ATH $82,000,000 at 09:58:13 UTC (block 55,108,875, ~$0.082/SLINK) — 75 minutes later, with 83 transfers in a single peak block. Dump phase 15:28–17:00 IST drained the pool from ~$55M to $34.4M; last visible activity ~17:00 IST at block 55,153,827. Price settled 99.3% below peak ($0.000553, $553K mc).",
    },
    {
      title: "The factory-owner proxy holds the operator\u2019s real profits",
      epistemic: "assessed",
      confidence: "medium",
      body:
        "The token factory (0x7ed598bc…ec7e) is owned by an ERC-1967 minimal proxy (0x263ed295…19dd) holding 186.86 ETH (≈$467K) — while the deployer EOA itself holds only 0.187 ETH. The deployer created the factory first and deployed SLINK through it via CREATE2, leaving the visible creation hand empty. This is the report\u2019s assessment of where the deployer\u2019s REAL profits sit.",
    },
    {
      title: "The token contract is immutable — no owner, no mint, no pause",
      epistemic: "observed",
      confidence: "",
      body:
        "owner() execution reverts; storage slots 0 and 1 are empty; slot 2 holds exactly 1,000,000,000 × 10^18. The full supply was minted in the constructor and forwarded to the initial vault — zero mint events exist in the entire 9,028-transfer history. No admin can mint more tokens, pause transfers, or withdraw from the contract.",
    },
    {
      title: "The funding root is consistent with a CEX hot wallet or bridge",
      epistemic: "assessed",
      confidence: "medium",
      body:
        "The 5-layer funding trail terminates at 0xf70da978…dbef, an EOA with 1,625,315 transactions and first activity on May 8, 2026. Whether the operator withdrew ETH from a CEX (Binance, OKX, Coinbase) or used a bridge from Ethereum mainnet or another L2 cannot be determined from Robinhood Chain alone — cross-chain analysis is required. The five-layer chain-hopping pattern (Jul 25 → Sep 5, 42 days) is deliberate obfuscation: each intermediary carries a different profile (high-volume bot, pass-through, trading bot).",
    },
  ],
  graph: GRAPH,
};

let cached: DossierFile | null = null;

/** compile once, reuse everywhere — deterministic */
export function buildSlinkDossier(): DossierFile {
  if (!cached) {
    const result = buildDossier(draft);
    if (!result.ok) throw new Error("SLINK draft failed validation: " + result.errors.join(" | "));
    cached = result.dossier;
  }
  return cached;
}
