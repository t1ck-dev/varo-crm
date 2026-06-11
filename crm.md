# Varo CRM Build Documentation

**Date:** 2026-06-11 (v2 redesign: 2026-06-12)
**Status:** ✅ Complete & Deployed
**Live:** https://varo-crm.netlify.app/

---

## Overview

Varo CRM is a personal client pipeline tracker for managing SA B2B sales leads from cold outreach through delivery. Built with React + Vite + Tailwind v4 + Supabase.

**v2 (2026-06-12):** Login removed entirely. The app now uses the same **no-login sync-code model** as the life dashboard: a secret capability token identifies the workspace — no email, no password, no Supabase Auth. Full UI redesign (refined dark "private ledger" aesthetic). All lead fields are optional.

---

## How It Works (v2)

### Sync model — no accounts
- First visit → **Welcome screen** with two options:
  - **Start a new pipeline** — generates a 32-hex-char token via `crypto.getRandomValues`, stored in `localStorage` (`varo_crm_sync_token`)
  - **I have a sync code** — paste a code from another device
- Every database row carries `sync_token`; all queries filter on it
- **Sync devices** (header chip) → modal with the code, a copy button, and a **sync link** (`https://…/#sync=<token>`) — open the link on the phone and it auto-adopts the token
- Realtime subscriptions are filtered per token (`sync_token=eq.<token>`), so phone/desktop update instantly
- **Disconnect this device** clears the local token; data stays in the cloud

### Security model (capability token)
- RLS is enabled but policies are **open to anon** — privacy rests entirely on the secrecy of the sync token, identical to the dashboard's `app_state` model
- Trade-off accepted for: no login friction, working realtime, single-user app
- The sync code is the only key to the data — losing it (cleared browser, no copy saved) means the workspace is orphaned. Copy it somewhere safe.

---

## UI (v2 redesign)

Design direction: **refined private-ledger luxury** — warm near-black surfaces, hairline borders, gold as a sparse signal color, film-grain overlay, subtle top glow.

### Type
- **Display:** Fraunces (serif, italic for the wordmark)
- **UI:** Instrument Sans
- **Data (money/dates/codes):** JetBrains Mono, tabular numerals

### Color tokens (CSS `@theme`, Tailwind v4)
```
--color-ink:      #131210   background
--color-surface:  #1b1a16   panels
--color-raise:    #24221d   cards
--color-edge:     rgba(232,222,202,0.08)  hairline borders
--color-cream:    #ede8df   text
--color-stone:    #a8a195   secondary text
--color-faint:    #716b60   tertiary text
--color-gold:     #d4a574 / --color-gold-bright: #e8c496
--color-sage:     #93c2a2   success
--color-rust:     #e07a6a   danger/overdue
```

### Screens
- **Welcome** — wordmark, "Start a new pipeline" / "I have a sync code"
- **Pipeline** — kanban: 8 stages + Lost, per-column colored stage dots, lead counts, **per-column MRR totals**, drag-drop with drop-zone highlight, overdue cards get a rust left border, empty-column placeholders
- **Lead detail** — editable company name (serif), all fields optional, stage dropdown + days-in-stage in the toolbar, service-interest toggle pills, deliverables checklist, activity log with icon-segmented type picker (note/call/email/whatsapp/meeting), quick links (website, Meta Ad Library), **delete lead**
- **Dashboard** — 4 metric cards (Monthly revenue, Active clients, Win rate, In-pipeline value), MRR goal progress bar with **inline-editable goal**, pipeline distribution as horizontal bars, overdue actions list
- **Add lead modal** — quick-add: only a company field up front, everything else under "More details (optional)"; every field optional (blank company shows as *Unnamed lead*)
- **Sync modal** — code display, copy code / copy link, disconnect

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS 4 (`@theme` in CSS — **no tailwind.config.js**) |
| Backend | Supabase (PostgreSQL + Realtime) |
| Identity | localStorage sync token (no auth) |
| Icons | Lucide React |
| Hosting | Netlify (auto-deploy from `main`) |

---

## Database Schema (v2 — `crm-schema.sql`)

Migration applied 2026-06-12 via Supabase Management API. **Drops the old auth-based tables** (leads/activity_log/settings/sync_codes keyed on `auth.users`).

```
leads         id, sync_token, company (nullable), contact_name, contact_email,
              contact_phone, website, stage, monthly_value (nullable),
              service_interests[], next_action, next_action_date, lost_reason,
              deliverables jsonb, deadline, stage_changed_at, created_at, updated_at
activity_log  id, lead_id FK, sync_token, activity_type, note, created_at
settings      sync_token PK, mrr_goal, updated_at
```

- RLS enabled, policies open to anon (`using(true)`) — capability-token model
- Indexes: `leads(sync_token)`, `leads(stage)`, `activity_log(lead_id)`, `activity_log(sync_token)`
- `leads` added to the `supabase_realtime` publication
- Note: a pre-existing unrelated `crm` table exists in the project — untouched

---

## Files Structure

```
varo-crm/
├── src/
│   ├── components/
│   │   ├── Welcome.jsx       # First-run: start fresh / enter sync code
│   │   ├── SyncModal.jsx     # Code + link sharing, disconnect
│   │   ├── Pipeline.jsx      # Kanban board (token-scoped + realtime)
│   │   ├── PipelineCard.jsx  # Lead card
│   │   ├── AddLeadModal.jsx  # Quick add — all fields optional
│   │   ├── LeadDetail.jsx    # Lead editor + deliverables + activity
│   │   └── Dashboard.jsx     # Metrics, MRR goal, distribution, overdue
│   ├── lib/
│   │   ├── supabase.js       # Client init
│   │   ├── sync.js           # Token create/adopt/clear, #sync= links
│   │   ├── stages.js         # Stage metadata + colors, service types
│   │   └── format.js         # Money/date/days helpers
│   ├── App.jsx               # Shell: header, segmented nav, view routing
│   ├── main.jsx
│   └── index.css             # Tailwind v4 @theme + design system
├── crm-schema.sql            # v2 schema (destructive migration)
├── .env                      # Supabase URL + anon key (committed for Netlify)
└── index.html                # Fonts: Fraunces, Instrument Sans, JetBrains Mono
```

---

## Local Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
```

---

## How to Use

1. Open the app → **Start a new pipeline**
2. Add leads with the gold **Add lead** button (only fill what you know)
3. Drag cards between stages; dropping on **Lost** asks for an optional reason
4. Click a card to edit details, log activity, track deliverables
5. **Sync to phone:** header **Sync** chip → *Copy sync link* → open on phone
6. ⚠️ Save your sync code somewhere safe — it is the only key to your data

---

## Troubleshooting

- **Blank board after v2 deploy** → old localStorage from v1 has no token: the Welcome screen should appear; if anything looks stuck, clear site data and reload
- **Sync not instant** → check WebSocket in DevTools; Realtime must be enabled for `leads` (it is, via publication)
- **Lost sync code** → data is unrecoverable by design; start a new pipeline
- **v1 data** → v2 migration dropped the auth-based tables; v1 leads were not migrated (none existed worth keeping at migration time)

---

**Built with Claude Code** — v1 2026-06-11, v2 redesign 2026-06-12
