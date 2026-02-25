# SPRINTS.md

## Project Rules (Non-negotiable)
- One active sprint at a time.
- No new features mid-sprint. New ideas go to `backlog_v2.md`.
- Max 3 major decisions per sprint.
- Schema changes require:
  - SCHEMA.md update
  - DB migration
  - version bump (SCHEMA.md)

---

## Sprint 0 — Spec + Validation + Setup (Days 1–3)
Goal:
- Lock MVP scope, schema v1, and deployment targets. Do light validation.

Scope (max 7):
- Finalize MVP_SPEC.md
- Finalize SCHEMA.md (v1.0)
- Finalize SPRINTS.md
- Create `backlog_v2.md`
- Light validation: 10 conversations/messages (date coordination pain)
- Repo setup (Next.js + TS) and Supabase project created
- Baseline deploy to Vercel (hello world)

Done means:
- Governance docs exist and are committed
- Supabase project exists and env vars are set locally
- Vercel project created and deploy works
- Validation notes captured (even if weak signal)

Decisions (max 3):
1) Stack: Next.js + Supabase + Vercel
2) Link-only access (no login)
3) Date-only scheduling (no times)

---

## Sprint 1 — Core Data + Trip Creation + Read API (Days 4–10)
Goal:
- Create trip, store dates, share links, and load trip data.

Scope:
- Implement schema in Supabase (tables + constraints)
- POST /api/trips (create trip + dates + token hash)
- GET /api/trips/:tripId (trip + dates + participants + availability)
- Landing/Create Trip UI (minimal)
- Trip page loads and displays candidate dates

Done means:
- User can create a trip in production
- Guest link loads trip and dates reliably
- Token hashing works and is tested

Decisions (max 3):
- Token length + hashing approach
- Date input UI approach (simple multi-date picker vs add-one-by-one)
- Read endpoint payload shape

---

## Sprint 2 — Participants + Availability Capture (Days 11–18)
Goal:
- Guests can submit/update availability.

Scope:
- POST /api/trips/:tripId/participants (create participant by name)
- PUT /api/trips/:tripId/availability (upsert per date)
- Availability grid UI (No/Maybe/Yes)
- Persist + reload availability
- Basic validation + error states

Done means:
- A guest can join with name and submit availability
- Refreshing page retains submitted data

---

## Sprint 3 — Results + Host Edit (Days 19–24)
Goal:
- Make it usable end-to-end for real groups.

Scope:
- Results summary (per date: counts + score)
- “Best date(s)” highlight
- Host edit page (token-gated):
  - rename trip
  - add date
  - remove date (with cascading availability delete)
- Share link UX (copy buttons)

Done means:
- Host can modify dates and see results update
- Guests can continue responding after edits

---

## Sprint 4 — Deployment + QA + Cleanup (Days 25–30)
Goal:
- Ship v1 cleanly and close the loop.

Scope:
- Production hardening (input limits, basic rate-limits if needed)
- QA checklist run (happy paths + edge cases)
- README: setup + env vars + deploy steps
- Tag release `v1.0`
- “Post-ship review” notes (what broke at 60%, what prevented it)

Done means:
- v1 is deployed and stable
- README is sufficient for a fresh clone setup
- Project is “closed” with a release tag