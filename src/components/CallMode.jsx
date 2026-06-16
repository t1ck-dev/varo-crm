import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getCaller, setCaller, clearCaller } from '../lib/caller'
import { NICHES, getNiche, renderPitch } from '../lib/niches'
import CallerDashboard from './CallerDashboard'
import {
  Phone, ExternalLink, Copy, Check, LogOut, ArrowLeft, PhoneCall,
} from 'lucide-react'

// Stages a caller works through. Won/lost leads are hidden from the call list.
const CALLABLE_STAGES = ['Cold', 'Contacted', 'Interested', 'Meeting']

const OUTCOMES = [
  { id: 'connected', label: 'Connected' },
  { id: 'no_answer', label: 'No answer' },
  { id: 'callback', label: 'Callback' },
  { id: 'not_interested', label: 'Not interested' },
]

function LockIn({ onLockIn }) {
  const [name, setName] = useState('')
  return (
    <div className="max-w-sm mx-auto py-16 text-center reveal">
      <PhoneCall size={28} className="text-gold mx-auto mb-4" />
      <h2 className="text-2xl mb-1">Who&rsquo;s calling?</h2>
      <p className="text-faint text-sm mb-6">
        Lock in with your name so your calls are tracked to you.
      </p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && name.trim() && onLockIn(name)}
        placeholder="Your name"
        className="field text-center mb-3"
      />
      <button
        onClick={() => name.trim() && onLockIn(name)}
        disabled={!name.trim()}
        className="btn-gold w-full justify-center"
      >
        Lock in
      </button>
    </div>
  )
}

export default function CallMode({ token }) {
  const [caller, setCallerName] = useState(() => getCaller())
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [nicheFilter, setNicheFilter] = useState('all')
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)
  const [logState, setLogState] = useState('idle') // idle | saving | saved

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('sync_token', token)
      .in('stage', CALLABLE_STAGES)
      .order('created_at', { ascending: false })
    if (!error) setLeads(data || [])
    setLoading(false)
  }, [token])

  useEffect(() => {
    if (!caller) return
    fetchLeads()
  }, [caller, fetchLeads])

  if (!caller) {
    return <LockIn onLockIn={(n) => setCallerName(setCaller(n))} />
  }

  const filtered =
    nicheFilter === 'all'
      ? leads
      : leads.filter((l) => (l.niche || 'none') === nicheFilter)

  const selected = leads.find((l) => l.id === selectedId) || null
  const niche = selected ? getNiche(selected.niche) : null
  const pitch = niche
    ? renderPitch(niche, { caller, company: selected.company })
    : ''

  const phoneHref = selected?.contact_phone
    ? `tel:${selected.contact_phone.replace(/[^\d+]/g, '')}`
    : null

  const websiteUrl = selected?.website
    ? selected.website.startsWith('http')
      ? selected.website
      : `https://${selected.website}`
    : null

  const metaUrl = selected
    ? `https://adlibrary.facebook.com/ads/?active_status=all&ad_type=all&country=ZA&media_type=all&search_type=keyword_unordered&q=${encodeURIComponent(selected.company || '')}`
    : null

  const handleCopy = async () => {
    if (!pitch) return
    await navigator.clipboard.writeText(pitch)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleLog = async (outcome) => {
    if (!selected) return
    setLogState('saving')
    const label = OUTCOMES.find((o) => o.id === outcome)?.label || outcome
    const text = note.trim() ? `${label} — ${note.trim()}` : label
    await supabase.from('activity_log').insert([
      {
        lead_id: selected.id,
        sync_token: token,
        activity_type: 'call',
        note: text,
        caller,
      },
    ])
    setNote('')
    setLogState('saved')
    setTimeout(() => setLogState('idle'), 1500)
  }

  const handleSwitch = () => {
    clearCaller()
    setCallerName('')
    setSelectedId(null)
  }

  // Niches present in the current lead set, for filter chips.
  const presentNiches = NICHES.filter((n) =>
    leads.some((l) => l.niche === n.id)
  )

  return (
    <div className="space-y-5 reveal">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl">Call mode</h2>
          <p className="text-faint text-xs mt-1">
            {filtered.length} lead{filtered.length === 1 ? '' : 's'} to work
          </p>
        </div>
        <button
          onClick={handleSwitch}
          className="flex items-center gap-1.5 text-xs text-stone hover:text-cream border border-edge hover:border-edge-strong rounded-full px-3 py-1.5 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sage" />
          {caller}
          <LogOut size={12} className="ml-0.5" />
        </button>
      </div>

      {!selected && <CallerDashboard token={token} caller={caller} />}

      {/* Niche filter */}
      {!selected && presentNiches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setNicheFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              nicheFilter === 'all'
                ? 'border-gold/60 bg-gold-dim text-gold-bright'
                : 'border-edge text-stone hover:border-edge-strong'
            }`}
          >
            All
          </button>
          {presentNiches.map((n) => (
            <button
              key={n.id}
              onClick={() => setNicheFilter(n.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                nicheFilter === n.id
                  ? 'border-gold/60 bg-gold-dim text-gold-bright'
                  : 'border-edge text-stone hover:border-edge-strong'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: n.color }}
              />
              {n.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-faint text-sm animate-pulse">
          Loading leads…
        </div>
      ) : selected ? (
        /* ---- Call panel ---- */
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-1.5 text-sm text-stone hover:text-gold transition-colors"
            >
              <ArrowLeft size={16} /> Lead list
            </button>

            <div className="panel">
              <h3
                className="text-2xl text-cream"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {selected.company || <span className="text-faint italic">Unnamed lead</span>}
              </h3>
              {selected.contact_name && (
                <p className="text-stone text-sm mt-1">{selected.contact_name}</p>
              )}
              {niche && (
                <span className="inline-flex items-center gap-1.5 text-[11px] mt-3 px-2 py-0.5 rounded-full border border-edge text-stone">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: niche.color }} />
                  {niche.label}
                </span>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                {phoneHref && (
                  <a href={phoneHref} className="btn-gold">
                    <Phone size={15} /> {selected.contact_phone}
                  </a>
                )}
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                  >
                    Website <ExternalLink size={13} />
                  </a>
                )}
                {metaUrl && (
                  <a
                    href={metaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                  >
                    Meta Ads <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>

            {/* Pitch */}
            <div className="panel">
              <div className="flex items-center justify-between mb-3">
                <label className="label-caps">Pitch</label>
                {pitch && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-stone hover:text-gold transition-colors"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              {pitch ? (
                <p className="text-cream/90 text-sm whitespace-pre-line leading-relaxed">
                  {pitch}
                </p>
              ) : (
                <p className="text-faint text-sm">
                  No niche set for this lead — tag it in the pipeline to get a pitch.
                </p>
              )}
            </div>
          </div>

          {/* Log outcome */}
          <div className="space-y-4">
            <div className="panel">
              <label className="label-caps mb-3">Log this call</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note…"
                className="field resize-none h-16 text-sm mb-3"
              />
              <div className="grid grid-cols-2 gap-2">
                {OUTCOMES.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => handleLog(o.id)}
                    disabled={logState === 'saving'}
                    className="btn-ghost text-xs justify-center"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {logState === 'saved' && (
                <p className="text-sage text-xs mt-3 text-center">Logged ✓</p>
              )}
              <p className="text-faint text-[11px] mt-3 text-center data">
                tagged to {caller}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ---- Lead list ---- */
        <div className="space-y-2">
          <span className="label-caps block pt-1">Leads to call</span>
          {filtered.map((lead) => {
            const ln = getNiche(lead.niche)
            return (
              <button
                key={lead.id}
                onClick={() => setSelectedId(lead.id)}
                className="w-full text-left panel hover:border-gold/40 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-cream font-semibold truncate">
                    {lead.company || <span className="text-faint italic">Unnamed lead</span>}
                  </p>
                  <p className="text-stone text-xs truncate">
                    {[lead.contact_name, lead.contact_phone].filter(Boolean).join(' · ') ||
                      'No contact details'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {ln && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border border-edge text-stone">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: ln.color }} />
                      {ln.label}
                    </span>
                  )}
                  <span className="data text-faint text-[11px]">{lead.stage}</span>
                </div>
              </button>
            )
          })}
          {!filtered.length && (
            <div className="text-center py-16 text-faint text-sm">
              No leads to call here. Add or import some in the pipeline.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
