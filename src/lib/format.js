export function fmtMoney(value) {
  const n = Number(value) || 0
  return `R${n.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
}

export function fmtDate(value) {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

export function daysSince(value) {
  if (!value) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000))
}

export function isPast(dateString) {
  if (!dateString) return false
  return new Date(dateString) < new Date()
}
