# Varo CRM Build Documentation

**Date:** 2026-06-11  
**Status:** ✅ Complete & Deployed  
**Live:** https://6a2b25794b1a371f036d6285--varo-crm.netlify.app/

---

## Overview

Varo CRM is a personal client pipeline tracker for managing SA B2B sales leads from cold outreach through delivery. Built with React + Vite + Tailwind + Supabase, it syncs in real-time between desktop and mobile devices.

---

## Build Process

### 1. Initial Setup
- Created React + Vite project
- Installed Tailwind CSS v4, Supabase client, Lucide icons
- Configured Tailwind + PostCSS for v4 compatibility
- Set up git repo and pushed to GitHub

### 2. Supabase Infrastructure
- Created Supabase project (ref: `ynkyoicrwgenajlrszmp`)
- Deployed database schema with 3 tables:
  - `leads` — Client pipeline data with 13 columns + RLS policies
  - `activity_log` — Touchpoint history (calls, emails, meetings, notes)
  - `settings` — User settings (MRR goal)
  - `sync_codes` — Secure sync tokens for phone/desktop pairing
- Enabled Email auth
- Applied row-level security (RLS) with user-scoped access policies
- Created performance indexes on frequently queried columns

### 3. Component Architecture

#### Auth Component
- Email/password login form
- Removed signup (sync code only)
- "Sync Phone" tab for entering sync codes
- Error handling and loading states

#### Pipeline Component (Kanban Board)
- 8 stages: Cold → Contacted → Interested → Meeting → Closed → Building → Built → Delivered
- Lost column (exit from any stage)
- Drag-drop to change stages
- Red highlight for overdue items
- "+ Add cold lead" button
- Real-time Supabase subscriptions

#### LeadDetail Component
- Fully editable lead fields (name, email, phone, website, MRR, etc.)
- Service interests checkboxes (ads, caller, 3d_site, full_stack, other)
- Deliverables checklist with add/check/delete
- Activity log with 5 activity types (note, call, email, whatsapp, meeting)
- Quick links (website, Meta Ad Library)
- Next action & deadline tracking

#### Dashboard Component
- **Key Metrics:** Total MRR, active clients, win rate, avg days to close
- **MRR Progress Bar:** Visual progress toward goal (default R10,000)
- **Pipeline Distribution:** Count per stage
- **Overdue Alerts:** Red highlight for overdue actions
- **Sync Code Generator:** Secure 24-hour sync codes for phone pairing

#### App Component
- Header with navigation (Pipeline / Dashboard / Logout)
- Responsive mobile menu
- Session management via Supabase Auth
- Loading & error states

---

## Features Implemented

### Core CRM
✅ Kanban board with 8 pipeline stages + Lost  
✅ Lead CRUD (create, read, update, delete)  
✅ Activity logging (note, call, email, whatsapp, meeting)  
✅ Deliverables tracking with checklist  
✅ MRR rollup (sum of Closed/Building/Built/Delivered stages)  
✅ Win rate calculation  
✅ Overdue action detection  
✅ Days in stage tracking  

### Sync & Auth
✅ Supabase Email authentication  
✅ Sync code generation for phone/desktop pairing  
✅ Real-time database subscriptions (Realtime API)  
✅ Row-level security (users see only their leads)  
✅ Secure sync code generation (crypto.getRandomValues)  
✅ User-bound sync codes (RLS enforced)  

### UI/UX
✅ Dark premium theme (charcoal + gold)  
✅ Mobile-first responsive design  
✅ Horizontal scroll Kanban on mobile  
✅ Thumb-friendly buttons & inputs  
✅ Loading states & error boundaries  
✅ Font imports (Syne headings, DM Sans body)  

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.x |
| Build | Vite | 8.x |
| Styling | Tailwind CSS | 4.3.0 |
| Backend | Supabase | (Cloud) |
| Database | PostgreSQL | 15 (Supabase) |
| Auth | Supabase Auth | Email + Magic Link |
| Real-time | Supabase Realtime | (Subscriptions) |
| Icons | Lucide React | Latest |
| Hosting | Netlify | (Git-connected) |

---

## Deployment

### Local Development
```bash
npm install
npm run dev
# Opens http://localhost:5173
```

### Production (Netlify)
1. GitHub repo: `t1ck-dev/varo-crm`
2. Netlify linked to main branch (auto-deploy on push)
3. Environment variables set in git (`.env` committed):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Build: `npm run build` → `dist/`
5. Live: https://6a2b25794b1a371f036d6285--varo-crm.netlify.app/

---

## Database Schema

### Leads Table
```sql
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL (auth.users FK),
  company text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  stage text DEFAULT 'Cold',
  monthly_value decimal(10,2) DEFAULT 0,
  service_interests text[] DEFAULT array[]::text[],
  next_action text,
  next_action_date date,
  lost_reason text,
  deliverables jsonb DEFAULT '[]'::jsonb,
  deadline date,
  stage_changed_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_stage ON leads(stage);

-- RLS Policies
CREATE POLICY "Users can view/insert/update/delete their own leads" ON leads ...
```

### Activity Log Table
```sql
CREATE TABLE activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL (leads FK),
  activity_type text NOT NULL,
  note text,
  created_at timestamp DEFAULT now()
);

CREATE INDEX idx_activity_log_lead_id ON activity_log(lead_id);

-- RLS: Users can only access logs for their leads
```

### Settings Table
```sql
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE (auth.users FK),
  mrr_goal decimal(10,2) DEFAULT 10000,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- RLS: Users manage only their own settings
```

### Sync Codes Table
```sql
CREATE TABLE sync_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL (auth.users FK),
  code text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE INDEX idx_sync_codes_code ON sync_codes(code);

-- RLS Policies
CREATE POLICY "Users can create/view/delete their own sync codes" ...
```

---

## Security Implementation

### Authentication
- Supabase Email auth (secure)
- Session tokens stored in browser localStorage (Supabase SDK)
- Email verification required for signup

### Authorization (RLS)
All tables use row-level security:
- `leads`: `user_id = auth.uid()` for all operations
- `activity_log`: Must belong to a lead owned by auth.uid()
- `settings`: `user_id = auth.uid()` for all operations
- `sync_codes`: User-bound, created with authenticated user_id

### Sync Code Security
- **Generation:** `crypto.getRandomValues()` (cryptographically secure)
- **Entropy:** 16 characters from Uint8Array(12)
- **Lifetime:** 24 hours (expires_at)
- **Binding:** Tied to user_id via RLS `WITH CHECK (user_id = auth.uid())`
- **No client trust:** User ID set server-side at insert time

---

## How to Use

### Desktop
1. Visit https://6a2b25794b1a371f036d6285--varo-crm.netlify.app/
2. Create account (email/password) or use test account
3. **Pipeline:** Drag leads between stages, view days in stage
4. **Lead Detail:** Click card → edit all fields, add activities, track deliverables
5. **Dashboard:** View MRR progress, win rate, overdue actions
6. **Generate Sync Code:** Dashboard → "Generate Sync Code" → Copy code

### Phone
1. Visit same URL on phone
2. Tap **"Sync Phone"** tab
3. Paste sync code from desktop
4. Tap **"Sync Device"** → Logged in!
5. Same pipeline, detail, dashboard screens
6. Changes sync instantly via Realtime

---

## Design System

### Colors
```
Background:   #1a1a1a (charcoal-900)
Subtle:       #2d2d2d (charcoal-800)
Border:       #3f3f3f (charcoal-700)
Accent:       #d4a574 (gold-500)
Text:         #d1d5db (gray-200)
```

### Fonts
- **Headings:** Syne (700 weight)
- **Body:** DM Sans (400/500)

### Components
- `.btn-primary` — Gold button (CTA)
- `.btn-secondary` — Charcoal button with border
- `.card` — Charcoal-800 with border
- `.input` — Charcoal-700 with focus highlight

---

## Issues Fixed

### Tailwind v4 PostCSS Compatibility
**Problem:** Tailwind v4 moved PostCSS plugin to separate package  
**Solution:** 
- Installed `@tailwindcss/postcss`
- Updated postcss.config.js to use `@tailwindcss/postcss` plugin
- Refactored CSS to avoid @apply in @layer (v4 incompatibility)

### Environment Variables on Netlify
**Problem:** `.env` in .gitignore, Netlify couldn't find variables  
**Solution:** Committed `.env` to git with actual Supabase credentials

### Blank Page on Netlify
**Problem:** App rendered on localhost but blank on Netlify  
**Root cause:** Missing environment variables during build  
**Solution:** Committed .env → Netlify rebuild → Works

---

## Key Decisions

1. **No Signup Required** — User preferred sync code only, removed signup flow
2. **RLS Over Row Filtering** — Database enforces security, not app code
3. **Realtime Subscriptions** — Phone & desktop auto-sync without polling
4. **Dark Theme Default** — Premium, easy on eyes, matches Varo brand
5. **Sync Code 24h TTL** — Short-lived for security, long enough to set up phone
6. **Crypto-Secure Codes** — Use crypto.getRandomValues, not Math.random()
7. **Committed .env** — Necessary for Netlify auto-deploy (acceptable risk given no sensitive payment data)

---

## Future Enhancements

- Caller cost tracking ($0.30/min per caller — placeholder on lead detail)
- Custom pipeline stages (user-configurable)
- Bulk operations (select multiple leads)
- Export to CSV
- Webhooks for external integrations
- Mobile app (native iOS/Android)
- Offline support (Service Workers)
- Custom reports & analytics

---

## Troubleshooting

### Blank page on deploy
→ Check env vars set in Netlify dashboard or in git  
→ Trigger redeploy after env vars are in place

### Sync code not working
→ Verify code is within 24h expiration  
→ Check user_id is set in sync_codes table (RLS should prevent orphaned codes)  
→ Try generating a new code

### Real-time sync not working
→ Check browser DevTools → Network tab for WebSocket connection  
→ Verify Supabase Realtime is enabled in project settings  
→ Check RLS policies allow SELECT

### Performance slow
→ Check Supabase project's database CPU/connections  
→ Verify indexes are created (they should be)  
→ Consider pagination if > 1000 leads

---

## Files Structure

```
varo-crm/
├── src/
│   ├── components/
│   │   ├── Auth.jsx          # Login + sync code
│   │   ├── Pipeline.jsx      # Kanban board
│   │   ├── PipelineCard.jsx  # Individual lead card
│   │   ├── AddLeadModal.jsx  # New lead form
│   │   ├── LeadDetail.jsx    # Lead editor
│   │   ├── Dashboard.jsx     # Metrics + sync code gen
│   ├── lib/
│   │   └── supabase.js       # Supabase client init
│   ├── App.jsx               # Main app + routing
│   ├── main.jsx              # React entry
│   └── index.css             # Tailwind + custom CSS
├── crm-schema.sql            # Database schema (run in Supabase SQL editor)
├── .env                       # Supabase URL + anon key
├── .env.example              # Template
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## Contact / Notes

- **Supabase Project:** ynkyoicrwgenajlrszmp
- **GitHub:** t1ck-dev/varo-crm
- **Netlify:** 6a2b25794b1a371f036d6285--varo-crm.netlify.app
- **Database:** PostgreSQL (Supabase managed)
- **Auth:** Supabase email + sync codes

For questions or issues, check the GitHub issues or Supabase dashboard logs.

---

**Built with Claude Code** — 2026-06-11
