import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { STAGE_IDS, SERVICE_TYPES } from '../lib/stages'
import { NICHES } from '../lib/niches'
import { daysSince } from '../lib/format'
import {
  ArrowLeft, Plus, Check, Trash2, ExternalLink,
  StickyNote, Phone, Mail, MessageCircle, Users,
} from 'lucide-react'

const ACTIVITY_TYPES = [
  { id: 'note', label: 'Note', Icon: StickyNote },
  { id: 'call', label: 'Call', Icon: Phone },
  { id: 'email', label: 'Email', Icon: Mail },
  { id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
  { id: 'meeting', label: 'Meeting', Icon: Users },
]

const FIELDS = [
  { key: 'contact_name', label: 'Contact name', type: 'text' },
  { key: 'contact_phone', label: 'Phone', type: 'tel' },
  { key: 'contact_email', label: 'Email', type: 'email' },
  { key: 'website', label: 'Website', type: 'text', placeholder: 'https://' },
  { key: 'monthly_value', label: 'Monthly value (R)', type: 'number', mono: true },
  { key: 'next_action', label: 'Next action', type: 'text' },
  { key: 'next_action_date', label: 'Next action date', type: 'date', mono: true },
  { key: 'deadline', label: 'Delivery deadline', type: 'date', mono: true },
]

export default function LeadDetail({ token, lead, onBack }) {
  const [editedLead, setEditedLead] = useState(lead)
  const [activities, setActivities] = useState([])
  const [newActivity, setNewActivity] = useState({ type: 'note', note: '' })
  const [newDeliverable, setNewDeliverable] = useState('')
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error

  const fetchActivities = useCallback(async () => {
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('lead_id', lead.id)
      .eq('sync_token', token)
      .order('created_at', { ascending: false })

    setActivities(data || [])
  }, [lead.id, token])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const handleChange = (field, value) => {
    setEditedLead((prev) => ({ ...prev, [field]: value }))
    setSaveState('idle')
  }

  const persist = async (patch) => {
    const { error } = await supabase
      .from('leads')
      .update(patch)
      .eq('id', lead.id)
      .eq('sync_token', token)
    return error
  }

  const handleSave = async () => {
    setSaveState('saving')
    const patch = {
      company: editedLead.company?.trim() || null,
      contact_name: editedLead.contact_name?.trim() || null,
      contact_email: editedLead.contact_email?.trim() || null,
      contact_phone: editedLead.contact_phone?.trim() || null,
      website: editedLead.website?.trim() || null,
      monthly_value:
        editedLead.monthly_value === '' || editedLead.monthly_value == null
          ? null
          : Number(editedLead.monthly_value),
      service_interests: editedLead.service_interests || [],
      niche: editedLead.niche || null,
      next_action: editedLead.next_action?.trim() || null,
      next_action_date: editedLead.next_action_date || null,
      deadline: editedLead.deadline || null,
    }
    const error = await persist(patch)
    setSaveState(error ? 'error' : 'saved')
  }

  const handleStageChange = async (stage) => {
    setEditedLead((prev) => ({ ...prev, stage }))
    await persist({ stage, stage_changed_at: new Date().toISOString() })
  }

  const handleDeleteLead = async () => {
    if (!confirm('Delete this lead and its full history? This cannot be undone.')) return
    await supabase.from('leads').delete().eq('id', lead.id).eq('sync_token', token)
    onBack()
  }

  const handleAddActivity = async () => {
    if (!newActivity.note.trim()) return
    await supabase.from('activity_log').insert([
      {
        lead_id: lead.id,
        sync_token: token,
        activity_type: newActivity.type,
        note: newActivity.note.trim(),
      },
    ])
    setNewActivity((prev) => ({ ...prev, note: '' }))
    fetchActivities()
  }

  const updateDeliverables = async (updated) => {
    setEditedLead((prev) => ({ ...prev, deliverables: updated }))
    await persist({ deliverables: updated })
  }

  const handleAddDeliverable = async () => {
    if (!newDeliverable.trim()) return
    const updated = [
      ...(editedLead.deliverables || []),
      { id: Date.now(), text: newDeliverable.trim(), done: false },
    ]
    await updateDeliverables(updated)
    setNewDeliverable('')
  }

  const metaUrl = `https://adlibrary.facebook.com/ads/?active_status=all&ad_type=all&country=ZA&media_type=all&search_type=keyword_unordered&q=${encodeURIComponent(editedLead.company || '')}`

  const websiteUrl = editedLead.website
    ? editedLead.website.startsWith('http')
      ? editedLead.website
      : `https://${editedLead.website}`
    : null

  const saveLabel = {
    idle: 'Save changes',
    saving: 'Saving…',
    saved: 'Saved ✓',
    error: 'Save failed — retry',
  }[saveState]

  return (
    <div className="space-y-5 reveal">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-stone hover:text-gold transition-colors"
        >
          <ArrowLeft size={16} /> Pipeline
        </button>
        <div className="flex items-center gap-2">
          <span className="data text-faint text-xs hidden sm:inline">
            {daysSince(editedLead.stage_changed_at)}d in stage
          </span>
          <select
            value={editedLead.stage}
            onChange={(e) => handleStageChange(e.target.value)}
            className="field data !w-auto text-xs py-1.5"
          >
            {[...STAGE_IDS, 'Lost'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Main column */}
        <div className="md:col-span-2 space-y-4">
          <div className="panel">
            <label className="label-caps mb-1.5">Company</label>
            <input
              value={editedLead.company || ''}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="Unnamed lead"
              className="field !text-xl !font-semibold mb-5"
              style={{ fontFamily: 'var(--font-display)' }}
            />

            <div className="mb-3">
              <label className="label-caps mb-1.5">Niche</label>
              <select
                value={editedLead.niche || ''}
                onChange={(e) => handleChange('niche', e.target.value)}
                className="field"
              >
                <option value="">— none —</option>
                {NICHES.map((n) => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
              {FIELDS.map(({ key, label, type, placeholder, mono }) => (
                <div key={key}>
                  <label className="label-caps mb-1.5">{label}</label>
                  <input
                    type={type}
                    step={type === 'number' ? '0.01' : undefined}
                    min={type === 'number' ? '0' : undefined}
                    value={editedLead[key] ?? ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    className={`field ${mono ? 'data' : ''}`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-edge">
              <label className="label-caps mb-2.5">Service interests</label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map(({ id, label }) => {
                  const active = editedLead.service_interests?.includes(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        const current = editedLead.service_interests || []
                        const updated = active
                          ? current.filter((s) => s !== id)
                          : [...current, id]
                        handleChange('service_interests', updated)
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        active
                          ? 'border-gold/60 bg-gold-dim text-gold-bright'
                          : 'border-edge text-stone hover:border-edge-strong'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saveState === 'saving'}
              className="btn-gold mt-5"
            >
              {saveLabel}
            </button>
          </div>

          {/* Deliverables */}
          <div className="panel">
            <label className="label-caps mb-3">Deliverables</label>
            <div className="space-y-1.5 mb-3">
              {(editedLead.deliverables || []).map((d) => (
                <div
                  key={d.id}
                  className="group flex items-center gap-2.5 px-3 py-2 bg-black/20 border border-edge rounded-lg"
                >
                  <button
                    onClick={() =>
                      updateDeliverables(
                        editedLead.deliverables.map((x) =>
                          x.id === d.id ? { ...x, done: !x.done } : x
                        )
                      )
                    }
                    className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      d.done ? 'bg-gold border-gold' : 'border-edge-strong hover:border-gold'
                    }`}
                  >
                    {d.done && <Check size={12} className="text-ink" />}
                  </button>
                  <span
                    className={`flex-1 text-sm ${d.done ? 'line-through text-faint' : 'text-cream'}`}
                  >
                    {d.text}
                  </span>
                  <button
                    onClick={() =>
                      updateDeliverables(editedLead.deliverables.filter((x) => x.id !== d.id))
                    }
                    className="text-faint hover:text-rust transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {!(editedLead.deliverables || []).length && (
                <p className="text-faint text-xs py-1">Nothing promised yet.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDeliverable()}
                placeholder="Add a deliverable…"
                className="field flex-1"
              />
              <button onClick={handleAddDeliverable} className="btn-ghost !px-3">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <button onClick={handleDeleteLead} className="btn-danger text-xs">
            <Trash2 size={13} /> Delete lead
          </button>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="panel">
            <label className="label-caps mb-3">Quick links</label>
            <div className="space-y-1.5">
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 bg-black/20 border border-edge rounded-lg hover:border-gold/50 transition-colors text-sm text-cream"
                >
                  Website <ExternalLink size={13} className="text-faint" />
                </a>
              )}
              <a
                href={metaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 bg-black/20 border border-edge rounded-lg hover:border-gold/50 transition-colors text-sm text-cream"
              >
                Meta Ad Library <ExternalLink size={13} className="text-faint" />
              </a>
            </div>
          </div>

          {/* Activity */}
          <div className="panel">
            <label className="label-caps mb-3">Activity</label>

            <div className="flex gap-1 mb-2">
              {ACTIVITY_TYPES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  title={label}
                  onClick={() => setNewActivity((prev) => ({ ...prev, type: id }))}
                  className={`flex-1 flex items-center justify-center py-2 rounded-lg border transition-colors ${
                    newActivity.type === id
                      ? 'border-gold/60 bg-gold-dim text-gold-bright'
                      : 'border-edge text-faint hover:text-stone'
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
            <textarea
              value={newActivity.note}
              onChange={(e) => setNewActivity((prev) => ({ ...prev, note: e.target.value }))}
              placeholder={`Log a ${newActivity.type}…`}
              className="field resize-none h-16 text-sm mb-2"
            />
            <button onClick={handleAddActivity} className="btn-ghost w-full text-xs mb-4">
              <Plus size={14} /> Add activity
            </button>

            <div className="space-y-3 max-h-80 overflow-y-auto scroll-thin">
              {activities.map((a) => {
                const meta = ACTIVITY_TYPES.find((t) => t.id === a.activity_type)
                const Icon = meta?.Icon || StickyNote
                return (
                  <div key={a.id} className="flex gap-2.5 text-sm">
                    <Icon size={14} className="text-gold flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-cream/90 break-words">{a.note}</p>
                      <p className="data text-faint text-[11px] mt-0.5">
                        {new Date(a.created_at).toLocaleDateString('en-ZA', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        &middot; {meta?.label || a.activity_type}
                        {a.caller && <> &middot; by {a.caller}</>}
                      </p>
                    </div>
                  </div>
                )
              })}
              {!activities.length && (
                <p className="text-faint text-xs">No touchpoints logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
