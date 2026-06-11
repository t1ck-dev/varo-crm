import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, Users, Target, AlertCircle, Copy, Check } from 'lucide-react'

export default function Dashboard() {
  const [leads, setLeads] = useState([])
  const [settings, setSettings] = useState({ mrr_goal: 10000 })
  const [loading, setLoading] = useState(true)
  const [syncCode, setSyncCode] = useState(null)
  const [copied, setCopied] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')

    const { data: settingsData } = await supabase
      .from('settings')
      .select('*')
      .single()

    setLeads(leadsData || [])
    if (settingsData) setSettings(settingsData)
    setLoading(false)
  }

  const mrrStages = ['Closed', 'Building', 'Built', 'Delivered']
  const totalMRR = leads
    .filter((l) => mrrStages.includes(l.stage))
    .reduce((sum, l) => sum + (l.monthly_value || 0), 0)

  const closedLeads = leads.filter((l) => mrrStages.includes(l.stage)).length
  const lostLeads = leads.filter((l) => l.stage === 'Lost').length
  const winRate = closedLeads + lostLeads > 0
    ? ((closedLeads / (closedLeads + lostLeads)) * 100).toFixed(1)
    : 0

  const avgDaysToClose = (() => {
    const closedWithDates = leads
      .filter((l) => mrrStages.includes(l.stage) && l.stage_changed_at)
      .map((l) => (new Date() - new Date(l.stage_changed_at)) / (1000 * 60 * 60 * 24))

    return closedWithDates.length > 0
      ? (closedWithDates.reduce((a, b) => a + b, 0) / closedWithDates.length).toFixed(0)
      : 0
  })()

  const stageDistribution = {
    Cold: leads.filter((l) => l.stage === 'Cold').length,
    Contacted: leads.filter((l) => l.stage === 'Contacted').length,
    Interested: leads.filter((l) => l.stage === 'Interested').length,
    Meeting: leads.filter((l) => l.stage === 'Meeting').length,
    Closed: leads.filter((l) => l.stage === 'Closed').length,
    Building: leads.filter((l) => l.stage === 'Building').length,
    Built: leads.filter((l) => l.stage === 'Built').length,
    Delivered: leads.filter((l) => l.stage === 'Delivered').length,
  }

  const overdueLeads = leads.filter(
    (l) => l.next_action_date && new Date(l.next_action_date) < new Date() && !['Delivered', 'Lost'].includes(l.stage)
  )

  const mrrGoalPercent = ((totalMRR / settings.mrr_goal) * 100).toFixed(1)

  const generateSyncCode = async () => {
    setGeneratingCode(true)
    try {
      // Generate cryptographically secure code
      const bytes = new Uint8Array(12)
      crypto.getRandomValues(bytes)
      const code = Array.from(bytes, (b) => b.toString(36)).join('').substring(0, 16).toUpperCase()

      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // Valid for 24 hours

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from('sync_codes').insert([
        {
          user_id: user.id,
          code,
          expires_at: expiresAt.toISOString(),
        },
      ])

      if (error) throw error
      setSyncCode(code)
    } catch (err) {
      console.error('Error generating sync code:', err)
    } finally {
      setGeneratingCode(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(syncCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-syne text-gold-500">Dashboard</h2>
        <button
          onClick={generateSyncCode}
          disabled={generatingCode || syncCode}
          className="btn-secondary text-sm disabled:opacity-50"
        >
          {syncCode ? `Code: ${syncCode}` : 'Generate Sync Code'}
        </button>
      </div>

      {syncCode && (
        <div className="card border-gold-500">
          <p className="text-sm text-gray-400 mb-2">Sync Code (valid 24h)</p>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-mono font-bold text-gold-400 tracking-widest">
              {syncCode}
            </div>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-charcoal-700 rounded transition-colors"
            >
              {copied ? (
                <Check size={20} className="text-gold-500" />
              ) : (
                <Copy size={20} className="text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            On your phone, go to Varo CRM, tap "Sync Phone" and paste this code.
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total MRR</span>
            <TrendingUp size={20} className="text-gold-500" />
          </div>
          <p className="text-2xl font-bold text-gold-400">R{totalMRR.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">
            {mrrGoalPercent}% of R{settings.mrr_goal.toLocaleString()} goal
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active Clients</span>
            <Users size={20} className="text-gold-500" />
          </div>
          <p className="text-2xl font-bold text-gold-400">{closedLeads}</p>
          <p className="text-xs text-gray-400 mt-1">Closed or beyond</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Win Rate</span>
            <Target size={20} className="text-gold-500" />
          </div>
          <p className="text-2xl font-bold text-gold-400">{winRate}%</p>
          <p className="text-xs text-gray-400 mt-1">
            {closedLeads + lostLeads} outcomes
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Avg Days to Close</span>
            <TrendingUp size={20} className="text-gold-500" />
          </div>
          <p className="text-2xl font-bold text-gold-400">{avgDaysToClose}</p>
          <p className="text-xs text-gray-400 mt-1">days</p>
        </div>
      </div>

      {/* MRR Progress */}
      <div className="card">
        <h3 className="text-lg font-syne mb-4 text-gold-500">MRR Progress</h3>
        <div className="relative h-8 bg-charcoal-700 rounded-lg overflow-hidden">
          <div
            className="h-full bg-gold-500 transition-all"
            style={{ width: `${Math.min(parseFloat(mrrGoalPercent), 100)}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-charcoal-900 font-bold text-sm">
            R{totalMRR.toLocaleString()} / R{settings.mrr_goal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Stage Distribution */}
      <div className="card">
        <h3 className="text-lg font-syne mb-4 text-gold-500">Pipeline Distribution</h3>
        <div className="grid md:grid-cols-4 gap-3">
          {Object.entries(stageDistribution).map(([stage, count]) => (
            <div key={stage} className="bg-charcoal-700 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">{stage}</p>
              <p className="text-2xl font-bold text-gold-400">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue Actions */}
      {overdueLeads.length > 0 && (
        <div className="card border-red-600">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-red-400" />
            <h3 className="text-lg font-syne text-red-400">
              Overdue Actions ({overdueLeads.length})
            </h3>
          </div>
          <div className="space-y-2">
            {overdueLeads.map((lead) => (
              <div key={lead.id} className="p-3 bg-red-900 bg-opacity-20 border border-red-600 rounded-lg text-sm">
                <p className="font-bold text-red-300">{lead.company}</p>
                <p className="text-red-200">{lead.next_action}</p>
                <p className="text-xs text-red-400 mt-1">
                  Due: {new Date(lead.next_action_date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
