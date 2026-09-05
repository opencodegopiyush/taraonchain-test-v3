# AGENT_API.md — publishing investigations to the live site

This is the complete contract for an agent that publishes investigation
reports to the taraonchain website. Give this file (plus the site URL and the
`AGENT_PUBLISH_KEY`) to any agent — it can publish, update, list and remove
complete investigations **including the 3D experience**, without ever
touching the website's code.

```
POST   /api/agent/publish            create or update an investigation
GET    /api/agent/publish            list everything that is live
DELETE /api/agent/publish?caseId=X-0902
                                     remove one investigation
```

Every request carries the publishing key in a header:

```
x-agent-key: <AGENT_PUBLISH_KEY>
Content-Type: application/json
```

---

## What one POST publishes

The body is one JSON object — a whole investigation. The website compiles it
into:

- **the landing-page case card** (summary, exposure, lead finding),
- **the 3D trail workspace** — chapters drive the camera through the money
  graph exactly like the flagship case,
- **the full report** — findings, evidence table, asset status, method,
  limitations and source note.

Any number of chapters works. Send `graph` if the agent wants full manual
control of the 3D scene; omit it and the site **synthesizes the 3D trail
automatically** from `entities` and `connections` (recommended default).

---

## Field reference

### Top level

| Field         | Type    | Rules                                                    |
| ------------- | ------- | -------------------------------------------------------- |
| `id`          | string  | case id, format `LETTER-DIGITS`, e.g. `S-0915`, `H-0721` |
| `codename`    | string  | short case name, shown uppercase (`SHARAV`, `DUST LINE`) |
| `status`      | string  | `ACTIVE` \| `MONITORING` \| `CLOSED`                     |
| `victim`      | string  | who was harmed, e.g. `SHARAV buyers (retail)`            |
| `chains`      | string  | comma-separated, e.g. `SOLANA` or `ETHEREUM, SOLANA`     |
| `amountText`  | string  | exposure as display text, e.g. `≈$22,580 EXTRACTED`      |
| `amountUsd`   | string  | secondary figure, e.g. `$512K PEAK MCAP`                 |
| `span`        | string  | date range, e.g. `AUG 28 — SEP 01 2026`                  |
| `updated`     | string  | `YYYY-MM-DD` of the report's latest update               |
| `progress`    | string  | investigation completeness `0`–`100`                     |
| `summary`     | string  | 2+ sentences (min 30 chars) for the case card            |
| `method`      | string  | how the findings were produced (public records, tracing…)|
| `limitations` | string  | what this analysis cannot establish                      |
| `sourceNote`  | string? | **strongly recommended** — names the investigation report this case was compiled from |
| `nextSteps`   | string  | one step per line (`\n` separated)                       |
| `assetRows`   | array?  | asset status table — see below                           |
| `entities`    | array   | 2+ entities — the nodes of the graph                     |
| `connections` | array   | 1+ money flows between entities — the edges              |
| `chapters`    | array   | 1+ chapters — the guided 3D walkthrough                  |
| `findings`    | array   | the report's findings                                    |
| `graph`       | object? | optional hand-authored 3D payload — see below            |

### `entities[]` — the nodes

| Field   | Type   | Rules                                                                     |
| ------- | ------ | ------------------------------------------------------------------------- |
| `short` | string | unique code used everywhere else (`CREATOR`, `POOL`, `W1`) — uppercase    |
| `label` | string | human-readable name, ideally with the real address                        |
| `kind`  | string | `wallet` \| `contract` \| `protocol` \| `mixer` \| `bridge` \| `otc` \| `exchange` \| `cluster` \| `vault` |
| `chain` | string?| e.g. `SOLANA`                                                             |
| `note`  | string?| one-line evidence note (address, creation time, behaviour…)               |

### `connections[]` — the money flows

| Field       | Type   | Rules                                                              |
| ----------- | ------ | ------------------------------------------------------------------ |
| `from`/`to` | string | entity `short` codes (`to` ≠ `from`)                               |
| `value`     | string | verbatim display value, e.g. `13,232,322 SHARAV` or `41.37 SOL`    |
| `channel`   | string | `direct` \| `mixer` \| `bridge` \| `otc` \| `cluster`              |
| `epistemic` | string | `observed` (on-chain proof) \| `assessed` (inferred) \| `unknown`  |
| `basis`     | string | why this link holds (amount match, timing, funding graph…)         |
| `when`      | string | timestamp text, e.g. `AUG 28 14:07 UTC`                            |
| `txHash`    | string | real signature/hash, or `""` and the site synthesizes a reference  |

### `chapters[]` — the walkthrough (any number)

| Field     | Type   | Rules                                                                     |
| --------- | ------ | ------------------------------------------------------------------------- |
| `kicker`  | string | small label above the chapter title (`Origin`, `The exit`)                |
| `title`   | string | chapter title                                                             |
| `body`    | string | full prose; paragraphs separated by blank lines (`\n\n`)                  |
| `facts`   | string | one fact per line, format `observed \| text` (or `assessed`/`unknown`)    |
| `focus`   | string | comma-separated entity shorts the camera should feature (`CREATOR, POOL`) |

### `findings[]`

| Field        | Type   | Rules                                              |
| ------------ | ------ | -------------------------------------------------- |
| `title`      | string | finding headline                                   |
| `epistemic`  | string | `observed` \| `assessed` \| `unknown`              |
| `confidence` | string | `high` \| `medium` \| `low` \| `""`                |
| `body`       | string | the finding, with the concrete figures             |

### `assetRows[]` (optional)

| Field   | Type   | Rules                                            |
| ------- | ------ | ------------------------------------------------ |
| `loc`   | string | where the asset sits (`POOL`, `W5`)              |
| `amt`   | string | verbatim amount (`41.37 SOL`, `$0`)              |
| `state` | string | status text (`DRAINED`, `FROZEN`, `IN PLAY`)     |
| `tone`  | string | `fact` \| `assess` \| `risk` \| `unknown`        |

---

## Optional: full manual control of the 3D (`graph`)

Omit `graph` and the 3D trail is synthesized automatically — this is the
default and it looks good. An agent that wants to place every node and frame
every chapter shot supplies a `graph` object:

```jsonc
{
  "nodes": [
    {
      "id": "n-creator",            // unique
      "label": "Creator wallet",    // shown in 3D
      "short": "CREATOR",           // must match an entity short
      "kind": "wallet",
      "address": "8xz5…real address",
      "chain": "SOLANA",
      "firstSeen": "AUG 28", "lastSeen": "SEP 01",
      "received": 0, "sent": 4.2, "balance": 0,   // numbers in chain units
      "risk": 3,                     // 0–3
      "tags": ["insider"],
      "pos": [0, 0, 0],              // [x, y, z] — the money trail layout
      "key": true                    // flagship nodes glow brighter
    }
    // …
  ],
  "edges": [
    {
      "id": "e-1", "source": "n-creator", "target": "n-pool",
      "value": 41.37,                // numeric, chain units (flow particle size)
      "epistemic": "observed", "channel": "direct",
      "txs": [{ "hash": "5abc…", "ts": "AUG 31 12:44 UTC", "value": 0, "chain": "SOLANA", "kind": "transfer" }],
      "valueLabel": "41.37 SOL"      // verbatim display value (recommended)
    }
    // …
  ],
  "chapterEdges": [                  // OPTIONAL, one array per chapter —
    ["e-1", "e-2"],                  // which edges light up during each chapter
    ["e-3"]
  ],
  "chapterCams": [                   // OPTIONAL, exactly one camera per chapter
    { "target": [0, 0, 0], "radius": 26, "theta": 0.6, "phi": 1.15 }
    // …
  ]
}
```

Rules the site enforces: every `source`/`target` must reference an existing
node id, `chapterCams` (if given) must have exactly as many entries as
`chapters`, and invalid graphs are discarded gracefully (the 3D falls back to
synthesis — the report still publishes). A rich, complete worked example
lives in the repo at `src/lib/sharav-draft.ts`.

---

## House rules (the investigator's discipline)

1. **Only the investigation report is the source.** Every address, amount,
   timestamp and claim in a publish must come from the report itself — no
   invented figures, no embellishment, no filler.
2. Numbers that are not in the chain's native unit stay verbatim (use
   `value`/`valueLabel` as display strings; `0` numeric + label where the
   report doesn't quantify).
3. On-chain proof is `observed`; inference is `assessed` with a `basis`;
   open questions are `unknown`. Confidence grades only where the report
   states them.
4. Always include `sourceNote` naming the report — the API warns when it is
   missing.

---

## Responses

| Code    | Meaning                                                                 |
| ------- | ----------------------------------------------------------------------- |
| `201`   | created — the case is live on the landing page immediately              |
| `200`   | updated — same `id` re-published with new content                       |
| `422`   | validation failed, nothing published — `errors[]` lists every problem   |
| `401`   | missing/wrong key                                                       |
| `503`   | server has no `AGENT_PUBLISH_KEY` configured yet                        |
| `404`   | DELETE: no investigation with that `caseId`                             |

---

## Copy-paste examples

**Publish:**

```bash
curl -X POST https://taraonchain.vercel.app/api/agent/publish \
  -H "x-agent-key: $AGENT_PUBLISH_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @report.json
```

**List what is live:**

```bash
curl -H "x-agent-key: $AGENT_PUBLISH_KEY" \
  https://taraonchain.vercel.app/api/agent/publish
```

**Remove:**

```bash
curl -X DELETE -H "x-agent-key: $AGENT_PUBLISH_KEY" \
  "https://taraonchain.vercel.app/api/agent/publish?caseId=X-0902"
```

**Same publish in Node (for an agent's tool script):**

```js
const SITE = "https://taraonchain.vercel.app";
const KEY = process.env.AGENT_PUBLISH_KEY;

const res = await fetch(`${SITE}/api/agent/publish`, {
  method: "POST",
  headers: { "x-agent-key": KEY, "Content-Type": "application/json" },
  body: JSON.stringify(report), // the DraftCase object built from the report
});
const out = await res.json();
console.log(res.status, out.action, out.caseId, out.stats, out.warnings);
```

A runnable CLI that wraps these calls ships in the repo:
`node scripts/agent-publish-example.mjs <site-url> <key> list|post|delete …`
