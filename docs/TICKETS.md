# TICKETS.md

## Rules (non-negotiable)
- Claude must implement ONE ticket at a time.
- Claude must NOT change schema unless the ticket explicitly instructs it.
- If a schema change seems necessary, Claude must propose it and stop.
- No new libraries unless explicitly approved in the ticket.

---

## Ticket Template

### Ticket ID
T-XXX

### Sprint
Sprint N

### Objective (1 sentence)
What this ticket accomplishes.

### Context
- Repo: (link or local)
- Current state: (what exists now)
- Related docs: MVP_SPEC.md / SCHEMA.md / SPRINTS.md

### Requirements (must)
- R1:
- R2:
- R3:

### Non-Requirements (explicitly not)
- NR1:
- NR2:

### Acceptance Criteria (testable)
- AC1:
- AC2:
- AC3:

### Files likely touched
- path/to/file
- path/to/file

### Notes / Constraints
- Schema version: v1.0 (no changes)
- Keep it minimal; no refactors

---

## “Claude Prompt Wrapper” (paste above every ticket)
You are implementing a Next.js + Supabase app. Implement ONLY the ticket below.
Do NOT introduce new abstractions or libraries. Do NOT change the schema unless the ticket says so.
If you believe a schema change is required, propose it and STOP.
Return code in copy-ready blocks with file paths.

### T-001 — Create Supabase schema v1.0
Objective: Create all tables + constraints from SCHEMA.md in Supabase.
Requirements:
- Create `trips`, `trip_dates`, `participants`, `availability`
- Add constraints + indexes as specified
Acceptance:
- Tables exist and basic inserts work
Notes: No RLS for v1.

### T-002 — POST /api/trips
Objective: Create trip + candidate dates + host edit token hash.
Requirements:
- Generate edit token (random 32+ bytes)
- Store sha256(editToken) in trips.host_edit_token_hash
- Return { tripId, guestUrl, hostEditUrl }
Acceptance:
- Creating a trip returns working URLs

### T-003 — GET /api/trips/:tripId
Objective: Fetch trip + dates + participants + availability.
Requirements:
- Return a single payload optimized for the trip page
Acceptance:
- Trip page can render using this response only

### T-004 — Landing/Create Trip page (minimal UI)
Objective: Allow host to enter title, timezone, dates and create trip.
Acceptance:
- Create trip works end-to-end in local dev

### T-005 — Trip page read-only view
Objective: Load trip and display candidate dates + placeholder for availability grid.
Acceptance:
- Visiting /t/:tripId shows trip title + dates