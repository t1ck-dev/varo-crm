import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { NICHES } from '../lib/niches'
import { X, Upload } from 'lucide-react'

// Parse pasted text into { company, phone } rows.
// One lead per line; fields split on tab or comma. Company-only lines are ok.
// Returns { rows, skipped } — skipped counts blank lines only.
function parseRows(text) {
  const lines = text.split('\n')
  const rows = []
  let skipped = 0
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      skipped += 1
      continue
    }
    const parts = trimmed.split(/\t|,/).map((p) => p.trim())
    const company = parts[0] || ''
    const phone = parts[1] || ''
    rows.push({ company, phone })
  }
  return { rows, skipped }
}

export default function ImportLeadsModal({ token, onClose, onImported }) {
  const [niche, setNiche] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { rows } = useMemo(() => parseRows(text), [text])
  const validRows = rows.filter((r) => r.company || r.phone)

  const handleImport = async () => {
    if (!validRows.length) return
    setLoading(true)
    setError('')
    try {
      const payload = validRows.map((r) => ({
        sync_token: token,
        company: r.company || null,
        contact_phone: r.phone || null,
        niche: niche || null,
        stage: 'Cold',
      }))
      const { error: err } = await supabase.from('leads').insert(payload)
      if (err) throw err
      onImported()
      onClose()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-xl">Import cold leads</h3>
          <button onClick={onClose} className="text-faint hover:text-cream transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-stone text-sm mb-5">
          Paste one lead per line as <span className="data text-cream">Company, Phone</span>.
          They&rsquo;ll be added as <span className="text-cream">Cold</span> leads.
        </p>

        <div className="space-y-3">
          <div>
            <label className="label-caps mb-1.5">Niche for this batch</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="field"
            >
              <option value="">— none —</option>
              {NICHES.map((n) => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-caps mb-1.5">Leads</label>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'Bright Smile Dental, 082 555 1234\nGlow Aesthetics, 071 222 3344\nSeaside Bistro'}
              className="field data resize-none h-40 text-sm leading-relaxed"
            />
          </div>

          <p className="text-faint text-xs data">
            {validRows.length
              ? `${validRows.length} lead${validRows.length === 1 ? '' : 's'} ready`
              : 'Nothing to import yet'}
          </p>

          {error && (
            <div className="text-rust text-xs border border-rust/40 bg-rust-dim rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleImport}
              disabled={loading || !validRows.length}
              className="btn-gold flex-1"
            >
              <Upload size={15} />
              {loading ? 'Importing…' : `Import ${validRows.length || ''}`.trim()}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
