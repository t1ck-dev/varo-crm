import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

const EMPTY_FORM = {
  company: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  website: '',
  monthly_value: '',
}

export default function AddLeadModal({ token, onClose, onLeadAdded }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: err } = await supabase.from('leads').insert([
        {
          sync_token: token,
          company: form.company.trim() || null,
          contact_name: form.contact_name.trim() || null,
          contact_email: form.contact_email.trim() || null,
          contact_phone: form.contact_phone.trim() || null,
          website: form.website.trim() || null,
          monthly_value: form.monthly_value ? parseFloat(form.monthly_value) : null,
          stage: 'Cold',
        },
      ])
      if (err) throw err

      onLeadAdded()
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
          <h3 className="text-xl">New lead</h3>
          <button onClick={onClose} className="text-faint hover:text-cream transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-stone text-sm mb-5">
          Everything is optional — add what you know, fill in the rest later.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label-caps mb-1.5">Company</label>
            <input
              autoFocus
              value={form.company}
              onChange={(e) => setField('company', e.target.value)}
              placeholder="e.g. Bright Smile Dental"
              className="field"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs text-stone hover:text-cream transition-colors py-1"
          >
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            More details (optional)
          </button>

          {showDetails && (
            <div className="space-y-3 reveal">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-caps mb-1.5">Contact name</label>
                  <input
                    value={form.contact_name}
                    onChange={(e) => setField('contact_name', e.target.value)}
                    className="field"
                  />
                </div>
                <div>
                  <label className="label-caps mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={form.contact_phone}
                    onChange={(e) => setField('contact_phone', e.target.value)}
                    className="field"
                  />
                </div>
              </div>
              <div>
                <label className="label-caps mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setField('contact_email', e.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label className="label-caps mb-1.5">Website</label>
                <input
                  value={form.website}
                  onChange={(e) => setField('website', e.target.value)}
                  placeholder="https://"
                  className="field"
                />
              </div>
              <div>
                <label className="label-caps mb-1.5">Monthly value (R)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.monthly_value}
                  onChange={(e) => setField('monthly_value', e.target.value)}
                  className="field data"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-rust text-xs border border-rust/40 bg-rust-dim rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-gold flex-1">
              {loading ? 'Adding…' : 'Add to pipeline'}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
