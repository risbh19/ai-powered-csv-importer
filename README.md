# GrowEasy CSV Lead Importer
 
Take-home assignment for the Software Developer Intern role at GrowEasy.
 
The brief: build something that can take a CSV from basically anywhere — Facebook Lead
Ads, Google Ads, a real estate CRM export, someone's hand-made spreadsheet — and use an
LLM to figure out which column is which, then map it onto GrowEasy's fixed CRM schema.
The hard part isn't reading the CSV, it's that every source names and orders its columns
differently.
 
Live app: [add your Vercel URL here]
Backend API: [add your Railway/Render URL here]
 
## How it works
 
1. Upload a CSV (drag & drop or file picker).
2. It gets parsed and previewed right in the browser — nothing is sent to the server or
   the AI yet, so you can sanity-check the file first.
3. Click Confirm, and only then does the raw file go to the backend.
4. The backend parses it (no assumptions about column names), splits the rows into
   batches, and sends each batch to an LLM with a prompt that maps fields, enforces the
   `crm_status`/`data_source` enums, and skips any row with no email and no phone number.
5. You get back a results table: what was imported, what got skipped and why, totals for
   both.
## Stack
 
- Frontend: Next.js (App Router) + TypeScript + Tailwind
- Backend: Node/Express
- AI: Gemini by default, Groq or a local Ollama model also work — swap with one env var,
  no code changes
- No database. The project doesn't need to persist anything, and skipping a DB removes a
  bunch of ways the deployment could break for no real benefit.
## Repo layout
 
```
groweasy-csv-importer/
├── frontend/
├── backend/
│   └── src/services/providers/   gemini.js, groq.js, ollama.js
├── samples/                      a few messy test CSVs
└── docker-compose.yml
```
 
Frontend and backend deploy independently (frontend → Vercel, backend → Railway/Render),
or run both together locally with Docker Compose.
 
## Running it locally
 
Needs Node 20+.
 
**Backend**
```bash
cd backend
cp .env.example .env      # set AI_PROVIDER and the matching API key
npm install
npm run dev                # http://localhost:4000
```
 
**Frontend**
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                # http://localhost:3000
```
 
Then just open localhost:3000 and try one of the CSVs in `/samples`.
 
### AI provider
 
Set `AI_PROVIDER` in `backend/.env` to `gemini`, `groq`, or `ollama`. All three go
through the same prompt and the same server-side validation, so switching is just a
config change.
 
```
# Gemini (default) — key from https://aistudio.google.com/app/apikey
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
 
# Groq — key from https://console.groq.com/keys
AI_PROVIDER=groq
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
 
# Ollama — local, no key, runs on your machine
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```
 
Gemini has native structured output, so its schema bakes the `crm_status`/`data_source`
enums in directly. Groq and Ollama don't support that, so they get a strict "JSON only"
instruction plus a small parser (`parseModelJson.js`) that strips markdown fences and
stray text before parsing the response.
 
## Docker
 
```bash
cp backend/.env.example backend/.env
docker compose up --build
```
 
Backend on :4000, frontend on :3000. If you're using Ollama with Docker, point
`OLLAMA_BASE_URL` at `http://host.docker.internal:11434` so the container can reach
Ollama running on your host machine.
 
## Tests
 
```bash
cd backend
npm test
```
 
Covers the CSV parser (arbitrary headers, BOM handling, ragged rows) and the record
validator (the skip rule, enum enforcement, bad dates, newline escaping) — these are the
two places bad input could actually corrupt data, so they're what's tested.
 
## Deploying
 
**Backend (Railway/Render):** root directory `backend/`, build `npm install`, start
`npm start`. Set `AI_PROVIDER` + provider key, `CORS_ORIGIN` (your frontend's URL once
you have it), `BATCH_SIZE`, `MAX_RETRIES`.
 
**Frontend (Vercel):** root directory `frontend/`, env var `NEXT_PUBLIC_API_URL` pointing
at the deployed backend.
 
Deploy the backend first so you have a URL to give the frontend, then go back and lock
`CORS_ORIGIN` down to the actual frontend URL once that's live too.
 
## A few notes on how it's built
 
- Every provider (Gemini/Groq/Ollama) implements the same `generate(headers, batch,
  batchStartIndex)` function, so the batching/retry/validation code in `aiExtractor.js`
  doesn't care which one is active.
- Nothing from the AI is trusted blindly — `validators.js` re-checks the enums, the
  `created_at` date, and the skip rule server-side regardless of what the model returned.
- Rows are batched (`BATCH_SIZE`, default 25) and each batch retries independently
  (`MAX_RETRIES`, default 3). If a batch still fails after retries, it's reported in
  `failedBatches` instead of taking down the whole import.
- Dark mode uses Tailwind's class strategy with a small inline script in `layout.tsx`
  that reads the saved preference before the page paints, so there's no flash of the
  wrong theme on load.
## License
 
Written for the GrowEasy take-home assignment.
