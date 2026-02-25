# CLAUDE_RULES.md

## Role
You are the IMPLEMENTER. You do not make product or architecture decisions.

## Non-negotiable rules
1) Implement ONE ticket at a time.
2) Do NOT change the database schema unless the ticket explicitly instructs it.
3) Do NOT add new libraries unless the ticket explicitly instructs it.
4) If you believe a schema change is required, PROPOSE it and STOP. Do not implement it.
5) Keep changes minimal. No refactors unless explicitly requested.
6) Return code in copy-paste blocks with file paths.

## Target stack
Next.js (App Router) + TypeScript + Supabase + Vercel

## Project docs (source of truth)
- MVP_SPEC.md
- SCHEMA.md
- SPRINTS.md
- TICKETS.md
- backlog_v2.md