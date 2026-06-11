export const STAGES = [
  { id: 'Cold', color: '#8a9099' },
  { id: 'Contacted', color: '#94aec9' },
  { id: 'Interested', color: '#c9bd94' },
  { id: 'Meeting', color: '#d4a574' },
  { id: 'Closed', color: '#93c2a2' },
  { id: 'Building', color: '#c994b4' },
  { id: 'Built', color: '#ab94c9' },
  { id: 'Delivered', color: '#6be3a4' },
]

export const STAGE_IDS = STAGES.map((s) => s.id)

// Stages that count toward MRR (deal is won or beyond)
export const WON_STAGES = ['Closed', 'Building', 'Built', 'Delivered']

export const SERVICE_TYPES = [
  { id: 'ads', label: 'Ads' },
  { id: 'caller', label: 'AI Caller' },
  { id: '3d_site', label: '3D Site' },
  { id: 'full_stack', label: 'Full Stack' },
  { id: 'other', label: 'Other' },
]
