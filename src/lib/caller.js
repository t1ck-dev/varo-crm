// Caller identity: name-only, no password. Stored per-device in localStorage.
// Logged activity is tagged with this name for attribution.
const CALLER_KEY = 'varo_crm_caller'

export function getCaller() {
  return localStorage.getItem(CALLER_KEY) || ''
}

export function setCaller(name) {
  const clean = (name || '').trim()
  if (!clean) return ''
  localStorage.setItem(CALLER_KEY, clean)
  return clean
}

export function clearCaller() {
  localStorage.removeItem(CALLER_KEY)
}
