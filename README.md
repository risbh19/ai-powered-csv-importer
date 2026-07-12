# GrowEasy — AI-Powered CSV Lead Importer

Take-home assignment submission for the Software Developer Intern role at GrowEasy.

Uploads a lead CSV in **any layout** (Facebook Lead Ads export, Google Ads export, real
estate CRM export, hand-made spreadsheet — whatever column names/order) and uses an LLM
to intelligently map it onto GrowEasy's fixed CRM schema. Works with **Gemini, Groq, or a
local Ollama model** — pick whichever fits your setup, no code changes required.

## How it works

1. **Upload** — drag & drop or file picker, `.csv` only.
2. **Preview** — the file is parsed *entirely in the browser* (no AI, no network call) and
   shown in a scrollable table with sticky headers, so you can sanity-check it before
   anything is sent anywhere.
3. **Confirm import** — only on clicking this does the frontend send the raw file to the
   backend.
4. **Backend** parses the CSV (no assumption about column names), splits rows into
   batches, and sends each batch to the configured AI provider with a schema-constrained
   prompt that maps fields, enforces the `crm_status` / `data_source` enums, and skips
   rows with neither an email nor a phone number.
5. **Results** — a table of successfully mapped CRM records, a table of skipped rows and
   why, and totals for both.

## Repo structure

```
groweasy-csv-importer/
├── frontend/        Next.js (App Router, TypeScript, Tailwind), incl. dark mode
├── backend/         Express API — CSV parsing, multi-provider AI extraction, tests
│   └── src/services/providers/   gemini.js · groq.js · ollama.js · index.js (registry)
├── samples/         A few messy sample CSVs to test with
└── docker-compose.yml
```

Frontend and backend are independent deployables inside one repo — deploy each
separately (e.g. frontend → Vercel, backend → Railway/Render), or run both together with
Docker Compose (see below).

## Choosing an AI provider

Set `AI_PROVIDER` in `backend/.env` to `gemini`, `groq`, or `ollama`. All three send the
exact same prompt and are validated the same way server-side — swapping providers never
changes behavior, only cost/speed/privacy trade-offs.

| Provider | Cost | Speed | Setup |
|---|---|---|---|
| **Gemini** (default) | Free tier | Fast | Cloud API key only |
| **Groq** | Free tier | Very fast (Llama on Groq's inference hardware) | Cloud API key only |
| **Ollama** | Free | Depends on your machine | Runs Llama locally, no data leaves your machine |

**Gemini** — get a free key at https://aistudio.google.com/app/apikey
```
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

**Groq** — get a free key at https://console.groq.com/keys
```
AI_PROVIDER=groq
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

**Ollama** — install from https://ollama.com, then pull a model and start the server:
```bash
ollama pull llama3.1
ollama serve
```
```
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```
Ollama has no native structured-output schema like Gemini's, so its adapter asks for
strict JSON in the prompt and runs the response through a fence-stripping/parsing safety
net (`backend/src/services/providers/parseModelJson.js`) before it ever reaches the
validators. If `ollama serve` isn't running, the backend returns a clear error naming the
exact command to fix it, instead of a raw connection error.

## Running locally

**Requires Node.js 20+** (the Gemini SDK, `@google/genai`, requires it).

### Backend

```bash
cd backend
cp .env.example .env      # then set AI_PROVIDER + the matching key (see above)
npm install
npm run dev                # http://localhost:4000
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # points at the local backend by default
npm install
npm run dev                        # http://localhost:3000
```

Open http://localhost:3000, upload one of the CSVs in `/samples`, preview it, and confirm
the import. Use the sun/moon toggle in the header to switch between light and dark mode —
your choice is remembered across reloads.

## Running with Docker

Requires Docker + Docker Compose.

```bash
cp backend/.env.example backend/.env    # set AI_PROVIDER + the matching key
docker compose up --build
```

This builds and runs both services:
- Backend → http://localhost:4000
- Frontend → http://localhost:3000 (built with `NEXT_PUBLIC_API_URL=http://localhost:4000`
  baked in at build time, since Next.js inlines `NEXT_PUBLIC_*` vars into the client bundle)

If you set `AI_PROVIDER=ollama` in `backend/.env`, keep `OLLAMA_BASE_URL` as
`http://host.docker.internal:11434` so the backend *container* can reach an Ollama server
running on your *host* machine — `docker-compose.yml` already maps that hostname on Linux
via `extra_hosts` (Docker Desktop on Mac/Windows supports it natively).

The frontend's `Dockerfile` uses Next.js's `output: "standalone"` build (set in
`next.config.js`) so the final image only ships the server + the node_modules it actually
needs, not the full dev dependency tree.

## Running tests

```bash
cd backend
npm test
```

Covers the CSV parser (`csvParser.js` — arbitrary headers, BOM stripping, mismatched
column counts, chunking) and the server-side validator/normalizer (`validators.js` — the
skip rule, enum enforcement, unparseable-date handling, newline escaping). These are the
two places most likely to silently corrupt data, so they're what's under test rather than
route wiring.

## Deploying

**Backend (Railway or Render):**
1. Create a new service, root directory `backend/`, build command `npm install`, start
   command `npm start`.
2. Set env vars: `AI_PROVIDER` + the matching provider key/model (see table above),
   `CORS_ORIGIN` (your deployed frontend URL, e.g. `https://your-app.vercel.app`),
   `BATCH_SIZE`, `MAX_RETRIES`.
   - Note: if you deploy with `AI_PROVIDER=ollama`, the host running Ollama needs to be
     reachable from your backend host — that generally means self-hosting Ollama on a
     server with a public/VPN-reachable address, not `localhost`. For a normal cloud
     deployment, Gemini or Groq is the simpler choice.
3. Note the deployed URL (e.g. `https://groweasy-backend.up.railway.app`).

**Frontend (Vercel):**
1. Import the repo, set root directory to `frontend/`.
2. Set env var `NEXT_PUBLIC_API_URL` to the backend URL from above.
3. Deploy.

## Design decisions

- **Multi-provider AI, one shared contract.** `backend/src/services/providers/` defines a
  single adapter interface (`generate(headers, batch, batchStartIndex) → records[]`).
  Gemini, Groq, and Ollama each implement it independently — swapping `AI_PROVIDER` never
  touches the batching, retry, or validation logic in `aiExtractor.js`.
- **Structured output where the API supports it, a parsing safety net where it
  doesn't.** Gemini's call uses `responseSchema` with the `crm_status`/`data_source`
  enums baked in at the schema level, not just described in the prompt. Groq and Ollama
  don't offer that, so they get an explicit "JSON only" instruction plus
  `parseModelJson.js`, which strips markdown fences and stray text before parsing.
- **Every provider still goes through the same server-side validator.** Regardless of
  which AI produced a record, `backend/src/utils/validators.js` re-checks the enums, the
  `created_at` date, and the skip rule before anything reaches the response — never trust
  a single layer for rules that matter.
- **Stateless backend.** No database — the evaluation criteria (prompt engineering,
  backend architecture, frontend UX, code quality) don't reward persistence, and a DB adds
  failure points (connection strings, migrations, hosting) that only cost points if
  something breaks during grading/demo.
- **Batching + retries.** Rows are chunked (`BATCH_SIZE`, default 25) before hitting the
  AI, and each batch gets its own retry loop (`MAX_RETRIES`, default 3) with backoff. A
  batch that still fails is reported separately in `failedBatches` rather than silently
  dropped or crashing the whole import.
- **Dark mode via a class strategy, not a redesign.** Tailwind's `darkMode: "class"` plus
  a pre-hydration inline script in `layout.tsx` (reads `localStorage`, falls back to
  `prefers-color-scheme`) avoids a flash of the wrong theme on load, without needing a
  server round-trip or a flicker-prone `useEffect`-only toggle.

## What's implemented from the bonus list

- ✅ Drag & drop upload
- ✅ Loading indicator during AI processing ("Mapping fields with AI…")
- ✅ Retry mechanism for failed AI batches
- ✅ Multi-provider AI support (Gemini / Groq / Ollama)
- ✅ Docker setup (`docker-compose.yml`, per-service Dockerfiles)
- ✅ Dark mode
- ✅ Unit tests (`backend/npm test`)
- ✅ Well-written README (this file, plus inline code comments)
- ⬜ Deployment — do this last, once you've picked hosts (see above)
- ⬜ Virtualized table for large CSVs
- ⬜ Streaming/incremental parsing

## License

Written for the GrowEasy take-home assignment.
#   a i - p o w e r e d - c s v - i m p o r t e r  
 