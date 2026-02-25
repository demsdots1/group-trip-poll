# SCHEMA.md

## Schema Version
v1.0

## Conventions
- UUID primary keys
- `created_at` as timestamptz default now()
- Date-only candidate dates in v1 (`date` type)

---

## Table: trips
Stores the poll itself.

Columns:
- id (uuid, pk)
- title (text, not null)
- timezone (text, not null) — e.g. "America/Toronto"
- host_edit_token_hash (text, not null)
- is_archived (bool, not null, default false)
- created_at (timestamptz, not null, default now())

Indexes:
- pk on id

Notes:
- Host privileges are controlled by providing a token whose sha256 matches `host_edit_token_hash`.

---

## Table: trip_dates
Candidate dates for a trip.

Columns:
- id (uuid, pk)
- trip_id (uuid, not null, fk -> trips.id ON DELETE CASCADE)
- date_start (date, not null)
- label (text, null) — optional helper label ("Weekend 1")

Indexes:
- idx_trip_dates_trip_id (trip_id)

Constraints:
- Optional uniqueness (recommended): unique(trip_id, date_start)

---

## Table: participants
One row per guest (and optionally host) responding to a trip.

Columns:
- id (uuid, pk)
- trip_id (uuid, not null, fk -> trips.id ON DELETE CASCADE)
- display_name (text, not null)
- created_at (timestamptz, not null, default now())

Indexes:
- idx_participants_trip_id (trip_id)

Notes:
- In v1 we allow duplicate names; UI can warn but not block.

---

## Table: availability
Availability status per participant per trip_date.

Columns:
- id (uuid, pk)
- trip_id (uuid, not null, fk -> trips.id ON DELETE CASCADE)
- participant_id (uuid, not null, fk -> participants.id ON DELETE CASCADE)
- trip_date_id (uuid, not null, fk -> trip_dates.id ON DELETE CASCADE)
- status (smallint, not null) — 0=no, 1=maybe, 2=yes

Indexes:
- idx_availability_trip_id (trip_id)
- idx_availability_participant_id (participant_id)
- idx_availability_trip_date_id (trip_date_id)

Constraints:
- unique(participant_id, trip_date_id)

---

## Security (v1 approach)
- Fast ship mode: DB is public, relies on secret-ish tripId and token-gated host actions.
- No sensitive data stored.
- If hardening later: move writes behind server routes and enable RLS.

## Migration Notes
- Any change increments Schema Version and must be recorded here + in DB migrations.