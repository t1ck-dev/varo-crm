// Time-bucketed stats for the caller dashboard.
// Close rate = deals won ÷ calls logged, bucketed over a time range.
const DAY = 86400000

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

// Returns buckets oldest → newest: { start, end, label }.
export function bucketsFor(range, now = new Date()) {
  const buckets = []
  if (range === 'day') {
    const today = startOfDay(now)
    for (let i = 13; i >= 0; i--) {
      const start = new Date(today.getTime() - i * DAY)
      const end = new Date(start.getTime() + DAY)
      buckets.push({ start, end, label: String(start.getDate()) })
    }
  } else if (range === 'month') {
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      buckets.push({
        start,
        end,
        label: start.toLocaleDateString('en-ZA', { month: 'short' }),
      })
    }
  } else {
    // week (default) — last 8 weeks, weeks starting Monday
    const today = startOfDay(now)
    const offset = (today.getDay() + 6) % 7 // 0 = Monday
    const thisWeekStart = new Date(today.getTime() - offset * DAY)
    for (let i = 7; i >= 0; i--) {
      const start = new Date(thisWeekStart.getTime() - i * 7 * DAY)
      const end = new Date(start.getTime() + 7 * DAY)
      buckets.push({
        start,
        end,
        label: start.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
      })
    }
  }
  return buckets
}

// calls: [{ created_at }], wonLeads: [{ stage_changed_at }]
// Returns each bucket annotated with { calls, closes, rate } (rate is %).
export function closeRateSeries(buckets, calls, wonLeads) {
  return buckets.map((b) => {
    const s = b.start.getTime()
    const e = b.end.getTime()
    const inBucket = (ts) => {
      if (!ts) return false
      const t = new Date(ts).getTime()
      return t >= s && t < e
    }
    const callCount = calls.filter((c) => inBucket(c.created_at)).length
    const closeCount = wonLeads.filter((l) => inBucket(l.stage_changed_at)).length
    const rate = callCount > 0 ? Math.round((closeCount / callCount) * 100) : 0
    return { ...b, calls: callCount, closes: closeCount, rate }
  })
}

export function countWithin(items, key, sinceMs, now = Date.now()) {
  return items.filter((it) => {
    const ts = it[key]
    if (!ts) return false
    return now - new Date(ts).getTime() <= sinceMs
  }).length
}

export const WEEK_MS = 7 * DAY
