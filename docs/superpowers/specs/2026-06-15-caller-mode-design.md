# Varo CRM — Caller Mode, Niche Pitches & Bulk Import

**Date:** 2026-06-15
**Status:** Approved — building
**Branch:** `feat/caller-mode`

## Goal

Let sales callers work the pipeline themselves: lock in by name, browse leads
and their info, and read a ready-made pitch matched to each lead's niche. Plus
a fast way to load fresh cold call-lists via paste import. Additive — the owner
Pipeline/Dashboard experience is unchanged.

## Decisions (from brainstorming)

- **Caller login:** name-only identity, no password. Logged activity is tagged
  with the caller's name (attribution).
- **Pitch:** hand-written, one per **niche** (not per lead, no AI in app).
- **Niches:** fixed list, each lead tagged with one niche.
- **Cold list:** bulk import by pasting rows (one niche per batch).

## Data model (non-destructive migration)

Two new nullable columns — no table drops:

```sql
alter table leads add column if not exists niche text;
alter table activity_log add column if not exists caller text;
```

Niches + pitches live in code (`src/lib/niches.js`), hand-written:
`{ id, label, color, pitch }`. Starter set: Cosmetic Dentistry, Aesthetics
Clinic, Restaurants, E-commerce, Real Estate, Other.

## Components & files

**New**
- `src/lib/niches.js` — niche list + per-niche pitch + `getNiche(id)`.
- `src/lib/caller.js` — `getCaller()/setCaller(name)/clearCaller()` via
  `localStorage` key `varo_crm_caller`.
- `src/components/CallMode.jsx` — lock-in gate + lead list + call panel.
- `src/components/ImportLeadsModal.jsx` — paste-to-import cold leads.

**Edited**
- `src/App.jsx` — add **Call mode** nav segment + route.
- `src/components/Pipeline.jsx` — add **Import** button (opens ImportLeadsModal).
- `src/components/AddLeadModal.jsx` — niche dropdown under "More details".
- `src/components/LeadDetail.jsx` — niche dropdown; show "· by <name>" on
  attributed activity.
- `src/components/PipelineCard.jsx` — small niche tag chip.
- `crm-schema.sql` — append the two `alter table` lines.

## Call Mode flow

1. **Lock in** — no caller saved → centered "Who's calling?" name input →
   **Lock in** (saved to localStorage). Header chip: `● <name> · switch`.
2. **Lead list** — leads scoped to `sync_token`, filter chips by niche,
   default to callable stages (Cold / Contacted / Interested). Row shows
   company, contact, phone, niche tag.
3. **Call panel** — big company name; tap-to-call `tel:` phone; website +
   Meta Ad Library links; **pitch card** for the lead's niche with a Copy
   button (inline niche picker if untagged); **log outcome** buttons
   (Connected / No answer / Callback / Not interested + optional note) →
   inserts an `activity_log` row of type `call` with `caller = <name>`.

## Bulk import flow

`Import` on Pipeline → modal:
- Pick a **niche** for the batch (dropdown).
- Paste rows, one lead per line, `Company, Phone` (comma or tab; company-only
  ok). Live preview + parsed count; blank lines skipped; unparseable lines
  flagged.
- Import → batch insert as `stage: 'Cold'`, chosen `niche`, current
  `sync_token`. Appear immediately in Cold column and Call Mode.

## Attribution & data flow

Caller-logged activity carries `caller`; LeadDetail timeline renders
`date · Call · by <name>`. Owner-logged activity keeps `caller` null. All
queries still filter on `sync_token` (caller is inside the shared workspace).
No realtime changes beyond what exists.

## Testing

No test framework in the project (eslint only). Verify via `npm run build` +
`npm run lint` and a manual click-through: lock in → pick lead → copy pitch →
log a call → confirm attribution in LeadDetail; import a pasted batch → confirm
Cold leads appear. Not introducing a new test framework (out of scope).

## Out of scope (YAGNI)

AI pitch generation, per-caller PINs, per-lead custom pitches, caller
performance dashboards.
