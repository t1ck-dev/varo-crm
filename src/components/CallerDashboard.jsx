import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { WON_STAGES } from '../lib/stages'
import { fmtMoney } from '../lib/format'
import { bucketsFor, closeRateSeries, countWithin, WEEK_MS } from '../lib/stats'
import { Phone, CalendarDays, TrendingUp, Pencil, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const DEFAULT_GOAL = 10000
const QUOTE = 'Don’t downgrade your dreams to fit your reality. Upgrade your reality to fit your dreams.'

const RANGES = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
]

// Simple inline area+line chart. series: [{ rate, label }]
function CloseRateChart({ series }) {
  const W = 100
  const H = 36
  const pad = 3
  const scaleMax = Math.max(100, ...series.map((s) => s.rate))
  const n = series.length
  const x = (i) => (n <= 1 ? W / 2 : pad + (i * (W - pad * 2)) / (n - 1))
  const y = (rate) => H - pad - (rate / scaleMax) * (H - pad * 2)

  const linePts = series.map((s, i) => `${x(i)},${y(s.rate)}`).join(' ')
  const areaPts = `${x(0)},${H} ${linePts} ${x(n - 1)},${H}`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full h-32"
    >
      <defs>
        <linearGradient id="crFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill="url(#crFill)" />
      <polyline
        points={linePts}
        fill="none"
        stroke="var(--color-gold-bright)"
        strokeWidth="0.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {series.map((s, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(s.rate)}
          r="0.9"
          fill="var(--color-gold-bright)"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}

export default function CallerDashboard({ token, caller }) {
  const [leads, setLeads] = useState([])
  const [calls, setCalls] = useState([])
  const [goal, setGoal] = useState(DEFAULT_GOAL)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalDraft, setGoalDraft] = useState('')
  const [range, setRange] = useState('week')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const [leadsRes, callsRes, settingsRes] = await Promise.all([
      supabase.from('leads').select('stage,monthly_value,stage_changed_at').eq('sync_token', token),
      supabase
        .from('activity_log')
        .select('created_at,caller')
        .eq('sync_token', token)
        .eq('activity_type', 'call'),
      supabase.from('settings').select('mrr_goal').eq('sync_token', token).maybeSingle(),
    ])
    setLeads(leadsRes.data || [])
    setCalls(callsRes.data || [])
    if (settingsRes.data?.mrr_goal) setGoal(Number(settingsRes.data.mrr_goal))
    setLoading(false)
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const saveGoal = async () => {
    const value = Number(goalDraft)
    setEditingGoal(false)
    if (!value || value <= 0) return
    setGoal(value)
    await supabase
      .from('settings')
      .upsert({ sync_token: token, mrr_goal: value }, { onConflict: 'sync_token' })
  }

  const myCalls = useMemo(() => calls.filter((c) => c.caller === caller), [calls, caller])
  const wonLeads = useMemo(() => leads.filter((l) => WON_STAGES.includes(l.stage)), [leads])

  const series = useMemo(
    () => closeRateSeries(bucketsFor(range), calls, wonLeads),
    [range, calls, wonLeads]
  )

  const income = wonLeads.reduce((sum, l) => sum + (Number(l.monthly_value) || 0), 0)
  const totalCalls = myCalls.length
  const callsThisWeek = countWithin(myCalls, 'created_at', WEEK_MS)
  const goalPercent = Math.min(100, (income / goal) * 100)

  // Headline close rate across the visible range + delta of last vs prior bucket.
  const totalC = series.reduce((s, b) => s + b.calls, 0)
  const totalW = series.reduce((s, b) => s + b.closes, 0)
  const closeRate = totalC > 0 ? Math.round((totalW / totalC) * 100) : 0
  const last = series[series.length - 1]?.rate ?? 0
  const prev = series[series.length - 2]?.rate ?? 0
  const delta = last - prev

  if (loading) {
    return (
      <div className="text-center py-16 text-faint text-sm animate-pulse">Loading…</div>
    )
  }

  const stats = [
    { label: 'Your calls', value: totalCalls, sub: 'all time', Icon: Phone },
    { label: 'This week', value: callsThisWeek, sub: 'calls logged', Icon: CalendarDays },
    { label: 'Income', value: fmtMoney(income), sub: 'won & beyond', Icon: TrendingUp },
  ]

  return (
    <div className="space-y-4">
      {/* Motivational quote */}
      <div
        className="panel reveal relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-raise), var(--color-surface))' }}
      >
        <span
          className="absolute -top-6 left-3 text-gold/15 select-none"
          style={{ fontFamily: 'var(--font-display)', fontSize: '6rem', lineHeight: 1 }}
        >
          &ldquo;
        </span>
        <p
          className="relative text-cream text-lg sm:text-xl leading-snug pl-6 pr-2"
          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
        >
          {QUOTE}
        </p>
      </div>

      {/* Close rate — hero graph card */}
      <div className="panel reveal" style={{ animationDelay: '60ms' }}>
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <span className="label-caps">Close rate</span>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="data text-3xl font-medium text-cream">{closeRate}%</p>
              {totalC > 0 && (
                <span
                  className={`flex items-center gap-0.5 text-xs data ${
                    delta >= 0 ? 'text-sage' : 'text-rust'
                  }`}
                >
                  {delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(delta)}%
                </span>
              )}
            </div>
            <p className="text-faint text-xs mt-1">
              {totalW} closed / {totalC} call{totalC === 1 ? '' : 's'} this period
            </p>
          </div>
          <nav className="seg">
            {RANGES.map((r) => (
              <button
                key={r.id}
                className={range === r.id ? 'active' : ''}
                onClick={() => setRange(r.id)}
              >
                {r.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-3">
          <CloseRateChart series={series} />
        </div>
      </div>

      {/* Stat cards + goal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, sub, Icon }, i) => (
          <div key={label} className="panel reveal" style={{ animationDelay: `${120 + i * 50}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="label-caps">{label}</span>
              <Icon size={15} className="text-gold/70" />
            </div>
            <p className="data text-2xl font-medium text-cream">{value}</p>
            <p className="text-faint text-xs mt-1">{sub}</p>
          </div>
        ))}

        {/* Goal income — editable */}
        <div className="panel reveal" style={{ animationDelay: '270ms' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="label-caps">Goal income</span>
            <button
              onClick={() => {
                setGoalDraft(String(goal))
                setEditingGoal(true)
              }}
              className="text-gold/70 hover:text-gold transition-colors"
              title="Edit goal"
            >
              <Pencil size={13} />
            </button>
          </div>
          {editingGoal ? (
            <input
              autoFocus
              type="number"
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              onBlur={saveGoal}
              onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
              className="field data !py-1 text-lg"
            />
          ) : (
            <p className="data text-2xl font-medium text-gold">{fmtMoney(goal)}</p>
          )}
          <div className="h-1.5 bg-black/35 rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${goalPercent}%`,
                background: 'linear-gradient(90deg, var(--color-gold), var(--color-gold-bright))',
              }}
            />
          </div>
          <p className="text-faint text-xs mt-1 data">{goalPercent.toFixed(0)}% reached</p>
        </div>
      </div>
    </div>
  )
}
