# DEPLOY.md — putting taraonchain on Vercel

Vercel is **not** a VPS — there is no server to set up or maintain. You connect
your GitHub repo once, Vercel builds and hosts the site, and every later `git
push` re-deploys automatically. Published investigations live in a managed
PostgreSQL database, so they survive redeploys and restarts.

The repo is already fully prepared for this: the build command runs
`prisma generate && prisma db push && tsx scripts/seed-sharav.ts && next build`,
which creates the database tables on first deploy and seeds the SHARAV
investigation if the archive is empty.

---

## 1 · Put the code on GitHub

You need the code in a GitHub repository (free at github.com).

**Option A — with git installed (recommended)**

```bash
# unzip taraonchain-deploy.zip, then inside the folder:
git init
git add .
git commit -m "taraonchain — investigations platform"
git branch -M main
git remote add origin https://github.com/<your-username>/taraonchain.git
git push -u origin main
```

**Option B — no git installed**

Create an empty repo on github.com (no README), then on the repo page use
**"uploading an existing file"** and drag-drop the *contents* of the unzipped
folder (skip `node_modules` if you see one — the zip does not contain it).
Make sure the hidden dot-files `.gitignore` and `.env.example` come along:
macOS shows hidden files with `Cmd+Shift+.`, Windows with
View → Show → Hidden items.

> Note: the repo deliberately excludes QA screenshots, the original report
> text file, worklogs and local databases. Only the web app ships.

## 2 · Import into Vercel

1. Go to **vercel.com** → sign in **with GitHub**.
2. **Add New… → Project** → pick your `taraonchain` repo → **Import**.
3. Under **Project Name** enter exactly `taraonchain` — your free domain
   becomes **`https://taraonchain.vercel.app`**.
4. Framework preset: **Next.js** (auto-detected). Build settings: leave as is
   (it uses the `build` script, which handles Prisma + seeding itself).
5. **Do not hit Deploy yet** — do step 3 first.

## 3 · Create the database (one click)

The site needs one PostgreSQL database so published investigations persist.

1. In your Vercel project open the **Storage** tab → **Create Database**.
2. Choose **Vercel Postgres** (powered by Neon — free Hobby tier is enough).
3. When asked, connect it to **this project** and **all environments**
   (Production + Preview + Development). Vercel then injects `DATABASE_URL`
   automatically — you never copy it by hand.

## 4 · Set the secret environment variables

In the project: **Settings → Environment Variables** — add these three
(copy the same values into `.env` style storage, e.g. your password manager):

| Name                | What it is                                | Example                        |
| ------------------- | ----------------------------------------- | ------------------------------ |
| `AGENT_PUBLISH_KEY` | Secret key your publishing agent sends    | `toc_9f2c48…` (generate below) |
| `ADMIN_PASSCODE`    | Passcode for the hidden case-template UI  | your choice                    |
| `ADMIN_DOOR`        | Secret word that unlocks the hidden admin | your choice (e.g. `door_x41…`) |

Generate strong values on your machine, or ask any AI agent to:

```
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

## 5 · Deploy

Hit **Deploy**. First build takes a couple of minutes (it compiles three.js).
When it finishes, the site is live at `https://taraonchain.vercel.app` with:

- the landing page (interactive chain + your real investigations),
- the SHARAV investigation openable in the full 3D workspace,
- the agent publish API waiting for its first report (see AGENT_API.md),
- the admin UI hidden at `/admin?door=<ADMIN_DOOR>` (a plain 404 without it).

## 6 · Your domain "taraonchain"

- Free: `https://taraonchain.vercel.app` (from the project name — yours as
  long as the name is free; Vercel confirms during import).
- Custom: buy `taraonchain.com` (or `.xyz`/`.eth` DNS) at any registrar, then
  Vercel → **Settings → Domains → Add** and point it at the site. Vercel
  shows the exact DNS records to paste at your registrar.

## 7 · From now on

- Every `git push` to `main` → automatic rebuild + redeploy.
- Investigations published by your agent live in Postgres → **they survive
  every redeploy**. The seed step only adds SHARAV when the archive is empty,
  and never deletes anything.
- To publish investigation #2, #3, … your agent just calls
  `POST /api/agent/publish` — see **AGENT_API.md** for the exact contract
  you can hand to it.
