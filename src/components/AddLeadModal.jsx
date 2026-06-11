import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

export default function AddLeadModal({ onClose, onLeadAdded }) {
  const [company, setCompany] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [monthlyValue, setMonthlyValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!company) return

    setLoading(true)
    setError('')

    try {
      const { error: err } = await supabase.from('leads').insert([
        {
          company,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          website,
          monthly_value: monthlyValue ? parseFloat(monthlyValue) : 0,
          stage: 'Cold',
        },
      ])

      if (err) throw err

      onLeadAdded()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-syne">Add Cold Lead</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gold-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Company *
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Contact Name
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Monthly Value (R)
            </label>
            <input
              type="number"
              step="0.01"
              value={monthlyValue}
              onChange={(e) => setMonthlyValue(e.target.value)}
              className="input w-full"
            />
          </div>

          {error && (
            <div className="p-2 bg-red-500 bg-opacity-10 border border-red-500 rounded text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button type="submit" disabled={loading} className="flex-1 btn-primary disabled:opacity-50">
              {loading ? 'Adding...' : 'Add Lead'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
