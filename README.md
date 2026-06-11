# Varo CRM

A personal CRM for managing SA client pipeline. Track leads from cold outreach through delivery.

## Setup

### 1. Supabase Project

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy the SQL from `crm-schema.sql` and run it in the SQL editor
3. Go to Authentication → Providers and enable Email auth
4. Create your own user account

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` and log in with your Supabase account.

### 4. Deploy to Netlify

1. Push to GitHub
2. Connect your repo to Netlify
3. Set the same env vars in Netlify settings
4. Deploy!

## Pipeline Stages

- **Cold** → **Contacted** → **Interested** → **Meeting** → **Closed** → **Building** → **Built** → **Delivered**
- **Lost** — exit from any stage

MRR counts from Closed onward.

## Features

- **Kanban Board** — Drag leads between stages
- **Lead Detail** — Edit all lead info, add activity, track deliverables
- **Dashboard** — MRR tracking, win rate, pipeline distribution
- **Realtime Sync** — Changes sync instantly between devices
- **Mobile-First** — Thumb-friendly on phone, full power on desktop

## Design

Premium dark theme with Varo brand gold accents. Syne for headings, DM Sans for body.
