// Fixed niche list + hand-written pitch per niche.
// Each lead is tagged with a niche id; Call Mode shows the matching pitch.
// Edit the `pitch` text freely — it's read-only in the app.

export const NICHES = [
  {
    id: 'cosmetic_dentistry',
    label: 'Cosmetic Dentistry',
    color: '#94aec9',
    pitch: `Hi, am I speaking with the practice? My name is {caller} from Varo.

I work with cosmetic dental practices like {company} to fill more high-value chairs — veneers, implants, whitening — without you lifting a finger on the admin.

Most practices lose enquiries because nobody answers fast enough or follows up. We put an AI setter on your line and WhatsApp that replies in seconds, qualifies the patient, and books them straight into your diary — 24/7.

Quick question: when a new patient enquiry comes in after hours, who's handling it right now?`,
  },
  {
    id: 'aesthetics_clinic',
    label: 'Aesthetics Clinic',
    color: '#c994b4',
    pitch: `Hi, this is {caller} from Varo.

We help aesthetics clinics like {company} turn Instagram and ad enquiries into booked appointments — Botox, fillers, skin — automatically.

Right now most of those DMs and form fills go cold because the front desk is busy. We add an AI setter that answers instantly, screens the lead, quotes, and books them in — so you stop leaking R-thousands in missed bookings.

Out of interest, roughly how many enquiries a week are you getting from social and ads at the moment?`,
  },
  {
    id: 'restaurants',
    label: 'Restaurants',
    color: '#d4a574',
    pitch: `Hi, {caller} here from Varo.

We work with restaurants like {company} to handle bookings, large-group enquiries and functions without tying up your floor staff on the phone.

Our AI answers WhatsApp and your line instantly, takes reservations, handles the menu and function questions, and only passes the big jobs to you. You capture more covers, especially on busy nights.

Quick one — are you taking bookings mostly by phone right now, or through something online?`,
  },
  {
    id: 'ecommerce',
    label: 'E-commerce',
    color: '#93c2a2',
    pitch: `Hi, this is {caller} from Varo.

We help online stores like {company} recover abandoned carts and answer buyer questions instantly on WhatsApp — the questions that decide whether someone checks out or leaves.

Our AI replies in seconds, handles sizing, shipping and "is this in stock", and nudges people back to finish the purchase. Stores we work with see a real lift in conversion without more ad spend.

What are you using right now to handle customer questions — is it you, a team, or nothing automated yet?`,
  },
  {
    id: 'real_estate',
    label: 'Real Estate',
    color: '#c9bd94',
    pitch: `Hi, am I speaking with {company}? It's {caller} from Varo.

We help agents and agencies respond to property enquiries the instant they come in — because the first agent to reply usually wins the lead.

Our AI setter answers Property24, ads and WhatsApp enquiries in seconds, qualifies the buyer or seller, and books the viewing or valuation straight into your calendar — even when you're in a showing.

How are you handling new enquiries right now when you're out with a client?`,
  },
  {
    id: 'other',
    label: 'Other',
    color: '#a8a195',
    pitch: `Hi, my name is {caller} from Varo.

We help businesses like {company} stop losing leads by answering every enquiry instantly — on WhatsApp, your phone line, and your website — and booking them in automatically.

Most businesses lose work simply because nobody replied fast enough. Our AI setter fixes that 24/7, so you only deal with people ready to buy.

Just to understand your setup — how are new enquiries being handled at the moment?`,
  },
]

export const NICHE_IDS = NICHES.map((n) => n.id)

export function getNiche(id) {
  return NICHES.find((n) => n.id === id) || null
}

// Fill {caller} / {company} placeholders in a pitch.
export function renderPitch(niche, { caller, company } = {}) {
  if (!niche) return ''
  return niche.pitch
    .replaceAll('{caller}', caller?.trim() || 'me')
    .replaceAll('{company}', company?.trim() || 'your business')
}
