// No-login sync model: a secret capability token identifies the workspace.
// Same model as the life dashboard — privacy rests on keeping the code private.
const TOKEN_KEY = 'varo_crm_sync_token'
const TOKEN_PATTERN = /^[a-f0-9]{16,64}$/

export function getToken() {
  const fromLink = (window.location.hash || '').match(/sync=([a-f0-9]{16,64})/i)
  if (fromLink) {
    localStorage.setItem(TOKEN_KEY, fromLink[1].toLowerCase())
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
  return localStorage.getItem(TOKEN_KEY)
}

export function createToken() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  localStorage.setItem(TOKEN_KEY, token)
  return token
}

export function adoptToken(code) {
  const clean = (code || '').trim().toLowerCase()
  if (!TOKEN_PATTERN.test(clean)) return null
  localStorage.setItem(TOKEN_KEY, clean)
  return clean
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function syncLink(token) {
  return `${window.location.origin}${window.location.pathname}#sync=${token}`
}
