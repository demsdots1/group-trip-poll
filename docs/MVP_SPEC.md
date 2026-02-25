# MVP_SPEC.md

## Product
Group Trip Availability Poll (link-only, no login)

## Goal
Ship a complete, minimal web app that lets a group find the best date(s) for a trip.

## Non-Goals (explicitly NOT building in v1)
- Itinerary planning
- Expense splitting
- Chat/messaging
- Destination voting
- Calendar integrations
- Payments
- Accounts / authentication
- Multi-tenant orgs / roles beyond host vs guest
- Mobile app
- Complex scheduling/time slots (date-only in v1)

## Primary Users
- Host: creates the trip poll and shares it
- Guest: responds with availability

## Core Workflow (v1)
1. Host creates a trip with:
   - Title
   - Timezone
   - Candidate dates (date-only)
2. System returns:
   - Guest link: `/t/{tripId}`
   - Host edit link: `/t/{tripId}/edit?token={editToken}`
3. Guest opens link and:
   - Enters display name
   - Marks availability for each candidate date (No / Maybe / Yes)
4. Results view shows:
   - Best date(s) by score
   - Breakdown per date (#Yes, #Maybe, #No)
   - Participant matrix (optional if time allows)

## MVP Screens (minimum)
1. Landing/Create Trip
2. Trip page (guest view): enter name + availability grid + results summary
3. Host edit page: rename trip + add/remove dates (token-gated)

## Data Rules
- Guest identity is per trip via participant record (no global account)
- Availability is one status per participant per date
- Date granularity: DATE (no times in v1)

## “Done” Criteria (v1 shipped)
- Host can create a trip on production
- Guests can submit/update availability
- Results update correctly
- Share links work (guest + host edit)
- Basic input validation (required title/name; reasonable length limits)
- Deployed (Vercel + Supabase)
- README contains setup + env vars + deploy steps

## Backlog v2 (parking lot)
Any new ideas go in `backlog_v2.md` only.