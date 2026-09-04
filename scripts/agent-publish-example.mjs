#!/usr/bin/env node
/* Minimal CLI that wraps the agent publish API — a starting point for
   publishing agents (see AGENT_API.md for the full contract).

   Usage:
     node scripts/agent-publish-example.mjs <site-url> <key> list
     node scripts/agent-publish-example.mjs <site-url> <key> post <report.json>
     node scripts/agent-publish-example.mjs <site-url> <key> delete <caseId>

   Examples:
     node scripts/agent-publish-example.mjs https://taraonchain.vercel.app toc_abc123 list
     node scripts/agent-publish-example.mjs https://taraonchain.vercel.app toc_abc123 post ./S-0915.json
     node scripts/agent-publish-example.mjs https://taraonchain.vercel.app toc_abc123 delete X-0902   */

import { readFileSync } from "node:fs";

const [, , site, key, command, arg] = process.argv;

if (!site || !key || !command) {
  console.error("Usage:\n  agent-publish <site-url> <key> list\n  agent-publish <site-url> <key> post <report.json>\n  agent-publish <site-url> <key> delete <caseId>");
  process.exit(1);
}

const base = site.replace(/\/+$/, "");

async function call(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: { "x-agent-key": key, ...(options.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

switch (command) {
  case "list": {
    const { status, body } = await call("/api/agent/publish");
    if (!body.ok) fail(status, body);
    console.log(`${body.count} investigation(s) live:`);
    for (const item of body.items) {
      console.log(
        `  ${item.caseId}  ${item.codename.padEnd(14)} ${item.status.padEnd(11)} ` +
          `${item.chapters} chapters, ${item.entities} entities, ${item.connections} connections ` +
          `[${item.threeDee}]`,
      );
    }
    break;
  }

  case "post": {
    if (!arg) {
      console.error("post needs a path to a report JSON file");
      process.exit(1);
    }
    const report = JSON.parse(readFileSync(arg, "utf8"));
    const { status, body } = await call("/api/agent/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    if (!body.ok) fail(status, body);
    console.log(`${body.action.toUpperCase()} ${body.caseId} "${body.codename}" — live now`);
    console.log(`  chapters ${body.stats.chapters} · entities ${body.stats.entities} · connections ${body.stats.connections} · findings ${body.stats.findings}`);
    console.log(`  3D: ${body.threeDee}`);
    for (const w of body.warnings ?? []) console.log(`  warning: ${w}`);
    break;
  }

  case "delete": {
    if (!arg) {
      console.error("delete needs a caseId, e.g. X-0902");
      process.exit(1);
    }
    const { status, body } = await call(`/api/agent/publish?caseId=${encodeURIComponent(arg)}`, {
      method: "DELETE",
    });
    if (!body.ok) fail(status, body);
    console.log(`deleted ${body.deleted}`);
    break;
  }

  default:
    console.error(`unknown command "${command}" — use list | post | delete`);
    process.exit(1);
}

function fail(status, body) {
  console.error(`FAILED (${status}): ${body.error ?? "unknown error"}`);
  if (body.errors) for (const e of body.errors) console.error(`  - ${e}`);
  process.exit(1);
}
