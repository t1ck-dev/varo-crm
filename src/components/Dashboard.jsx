import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { STAGES, WON_STAGES } from '../lib/stages'
import { fmtMoney, fmtDate, isPast } from '../lib/format'
import { TrendingUp, Users, Target, Clock, AlertCircle, Pencil } from 'lucide-react'

const DEFAULT_MRR_GOAL = 10000

export default function Dashboard({ token }) {
  const [leads, setLeads] = useState([])
  const [mrrGoal, setMrrGoal] = useState(DEFAULT_MRR_GOAL)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalDraft, setGoalDraft] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const [{ data: leadsData }, { data: settingsData }] = await Promise.all([
      supabase.from('leads').select('*').eq('sync_token', token),
      supabase.from('settings').select('*').eq('sync_token', token).maybeSingle(),
    ])

    setLeads(leadsData || [])
    if (settingsData?.mrr_goal) setMrrGoal(Number(settingsData.mrr_goal))
    setLoading(false)
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const saveGoal = async () => {
    const value = Number(goalDraft)
    setEditingGoal(false)
    if (!value || value <= 0) return
    setMrrGoal(value)
    await supabase
      .from('settings')
      .upsert({ sync_token: token, mrr_goal: value }, { onConflict: 'sync_token' })
  }

  const won = leads.filter((l) => WON_STAGES.includes(l.stage))
  const lost = leads.filter((l) => l.stage === 'Lost')
  const totalMRR = won.reduce((sum, l) => sum + (Number(l.monthly_value) || 0), 0)
  const winRate =
    won.length + lost.length > 0
      ? Math.round((won.length / (won.length + lost.length)) * 100)
      : null

  const pipelineValue = leads
    .filter((l) => !WON_STAGES.includes(l.stage) && l.stage !== 'Lost')
    .reduce((sum, l) => sum + (Number(l.monthly_value) || 0), 0)

  const overdueLeads = leads.filter(
    (l) => isPast(l.next_action_date) && !['Delivered', 'Lost'].includes(l.stage)
  )

  const distribution = STAGES.map((s) => ({
    ...s,
    count: leads.filter((l) => l.stage === s.id).length,
  }))
  const maxCount = Math.max(1, ...distribution.map((d) => d.count))

  const goalPercent = Math.min(100, (totalMRR / mrrGoal) * 100)

  if (loading) {
    return (
      <div className="text-center py-20 text-faint text-sm animate-pulse">
        Loading dashboard…
      </div>
    )
  }

  const metrics = [
    { label: 'Monthly revenue', value: fmtMoney(totalMRR), sub: 'closed & beyond', Icon: TrendingUp },
    { label: 'Active clients', value: won.length, sub: 'won deals', Icon: Users },
    { label: 'Win rate', value: winRate == null ? '—' : `${winRate}%`, sub: `${won.length + lost.length} outcomes`, Icon: Target },
    { label: 'In pipeline', value: fmtMoney(pipelineValue), sub: 'potential /mo', Icon: Clock },
  ]

  return (
    <div className="space-y-4">
      <div className="reveal">
        <h2 className="text-3xl">Dashboard</h2>
        <p className="text-faint text-xs mt-1">The state of the book, at a glance</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(({ label, value, sub, Icon }, i) => (
          <div key={label} className="panel reveal" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="label-caps">{label}</span>
              <Icon size={15} className="text-gold/70" />
            </div>
            <p className="data text-2xl font-medium text-cream">{value}</p>
            <p className="text-faint text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* MRR goal */}
      <div className="panel reveal" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="label-caps">MRR goal</span>
          {editingGoal ? (
            <input
              autoFocus
              type="number"
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              onBlur={saveGoal}
              onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
              className="field data !w-32 !py-1 text-xs"
            />
          ) : (
            <button
              onClick={() => {
                setGoalDraft(String(mrrGoal))
                setEditingGoal(true)
              }}
              className="flex items-center gap-1.5 data text-xs text-stone hover:text-gold transition-colors"
            >
              {fmtMoney(mrrGoal)} <Pencil size={11} />
            </button>
          )}
        </div>
        <div className="h-2 bg-black/35 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${goalPercent}%`,
              background: 'linear-gradient(90deg, var(--color-gold), var(--color-gold-bright))',
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="data text-gold text-sm">{fmtMoney(totalMRR)}</span>
          <span className="data text-faint text-xs">{goalPercent.toFixed(0)}% of goal</span>
        </div>
      </div>

      {/* Distribution */}
      <div className="panel reveal" style={{ animationDelay: '260ms' }}>
        <span className="label-caps mb-4 block">Pipeline distribution</span>
        <div className="space-y-2.5">
          {distribution.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <span className="text-xs text-stone w-20 flex-shrink-0">{s.id}</span>
              <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(s.count / maxCount) * 100}%`,
                    background: s.color,
                    opacity: 0.85,
                  }}
                />
              </div>
              <span className="data text-faint text-xs w-6 text-right">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue */}
      {overdueLeads.length > 0 && (
        <div className="panel reveal !border-rust/40" style={{ animationDelay: '320ms' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={15} className="text-rust" />
            <span className="label-caps !text-rust">
              Overdue actions ({overdueLeads.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {overdueLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between gap-3 px-3 py-2 bg-rust-dim border border-rust/25 rounded-lg"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cream truncate">
                    {lead.company || 'Unnamed lead'}
                  </p>
                  {lead.next_action && (
                    <p className="text-xs text-stone truncate">{lead.next_action}</p>
                  )}
                </div>
                <span className="data text-rust text-xs whitespace-nowrap">
                  {fmtDate(lead.next_action_date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
