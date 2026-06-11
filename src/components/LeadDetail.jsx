import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Plus, Check, Trash2, ExternalLink } from 'lucide-react'

const SERVICE_TYPES = ['ads', 'caller', '3d_site', 'full_stack', 'other']

export default function LeadDetail({ lead, onBack }) {
  const [editedLead, setEditedLead] = useState(lead)
  const [activities, setActivities] = useState([])
  const [newActivity, setNewActivity] = useState({ type: 'note', note: '' })
  const [newDeliverable, setNewDeliverable] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchActivities()
  }, [lead.id])

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })

    setActivities(data || [])
  }

  const handleChange = (field, value) => {
    setEditedLead((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    await supabase
      .from('leads')
      .update(editedLead)
      .eq('id', lead.id)
    setLoading(false)
  }

  const handleAddActivity = async () => {
    if (!newActivity.note.trim()) return

    await supabase.from('activity_log').insert([
      {
        lead_id: lead.id,
        activity_type: newActivity.type,
        note: newActivity.note,
      },
    ])

    setNewActivity({ type: 'note', note: '' })
    fetchActivities()
  }

  const handleAddDeliverable = async () => {
    if (!newDeliverable.trim()) return

    const deliverables = editedLead.deliverables || []
    const updated = [
      ...deliverables,
      { id: Date.now(), text: newDeliverable, done: false },
    ]

    setEditedLead((prev) => ({ ...prev, deliverables: updated }))
    await supabase
      .from('leads')
      .update({ deliverables: updated })
      .eq('id', lead.id)

    setNewDeliverable('')
  }

  const handleToggleDeliverable = async (id) => {
    const updated = editedLead.deliverables.map((d) =>
      d.id === id ? { ...d, done: !d.done } : d
    )

    setEditedLead((prev) => ({ ...prev, deliverables: updated }))
    await supabase
      .from('leads')
      .update({ deliverables: updated })
      .eq('id', lead.id)
  }

  const handleDeleteDeliverable = async (id) => {
    const updated = editedLead.deliverables.filter((d) => d.id !== id)
    setEditedLead((prev) => ({ ...prev, deliverables: updated }))
    await supabase
      .from('leads')
      .update({ deliverables: updated })
      .eq('id', lead.id)
  }

  const metaUrl = `https://adlibrary.facebook.com/ads/?active_status=all&ad_type=all&country=ZA&media_type=all&search_type=keyword_unordered&media_type=all&search_type=keyword_unordered&q=${encodeURIComponent(editedLead.company)}`

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gold-500 hover:text-gold-400 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Pipeline
      </button>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-4">
          <div className="card">
            <h2 className="text-2xl font-syne mb-4 text-gold-500">
              {editedLead.company}
            </h2>

            <div className="grid md:grid-cols-2 gap-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-300">
                  Contact Name
                </label>
                <input
                  value={editedLead.contact_name || ''}
                  onChange={(e) => handleChange('contact_name', e.target.value)}
                  className="input w-full mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={editedLead.contact_email || ''}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  className="input w-full mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300">
                  Contact Phone
                </label>
                <input
                  value={editedLead.contact_phone || ''}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  className="input w-full mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300">
                  Website
                </label>
                <input
                  value={editedLead.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="input w-full mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300">
                  Monthly Value (R)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editedLead.monthly_value || ''}
                  onChange={(e) => handleChange('monthly_value', parseFloat(e.target.value))}
                  className="input w-full mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300">
                  Next Action
                </label>
                <input
                  value={editedLead.next_action || ''}
                  onChange={(e) => handleChange('next_action', e.target.value)}
                  className="input w-full mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300">
                  Next Action Date
                </label>
                <input
                  type="date"
                  value={editedLead.next_action_date || ''}
                  onChange={(e) => handleChange('next_action_date', e.target.value)}
                  className="input w-full mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300">
                  Delivery Deadline
                </label>
                <input
                  type="date"
                  value={editedLead.deadline || ''}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  className="input w-full mt-1"
                />
              </div>
            </div>

            {/* Service Interests */}
            <div className="mt-4 pt-4 border-t border-charcoal-700">
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Service Interests
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map((service) => (
                  <label key={service} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editedLead.service_interests?.includes(service) || false}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...(editedLead.service_interests || []), service]
                          : editedLead.service_interests?.filter((s) => s !== service) || []
                        handleChange('service_interests', updated)
                      }}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{service.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="mt-4 btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Deliverables */}
          <div className="card">
            <h3 className="text-lg font-syne mb-4 text-gold-500">Deliverables</h3>
            <div className="space-y-2 mb-4">
              {(editedLead.deliverables || []).map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="flex items-center gap-2 p-2 bg-charcoal-700 rounded"
                >
                  <button
                    onClick={() => handleToggleDeliverable(deliverable.id)}
                    className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      deliverable.done
                        ? 'bg-gold-500 border-gold-500'
                        : 'border-charcoal-600'
                    }`}
                  >
                    {deliverable.done && <Check size={14} className="text-charcoal-900" />}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      deliverable.done
                        ? 'line-through text-gray-500'
                        : 'text-gray-200'
                    }`}
                  >
                    {deliverable.text}
                  </span>
                  <button
                    onClick={() => handleDeleteDeliverable(deliverable.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                placeholder="Add new deliverable..."
                className="input flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddDeliverable()}
              />
              <button onClick={handleAddDeliverable} className="btn-primary">
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Links */}
          <div className="card">
            <h3 className="text-lg font-syne mb-4 text-gold-500">Quick Links</h3>
            <div className="space-y-2">
              {editedLead.website && (
                <a
                  href={editedLead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-charcoal-700 rounded hover:bg-charcoal-600 transition-colors text-sm"
                >
                  Website <ExternalLink size={14} />
                </a>
              )}
              <a
                href={metaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-charcoal-700 rounded hover:bg-charcoal-600 transition-colors text-sm"
              >
                Meta Ad Library <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Activity Log */}
          <div className="card">
            <h3 className="text-lg font-syne mb-4 text-gold-500">Activity</h3>

            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {activities.map((activity) => (
                <div key={activity.id} className="text-xs">
                  <span className="inline-block px-2 py-1 bg-charcoal-700 rounded text-gold-400 mb-1">
                    {activity.activity_type}
                  </span>
                  <p className="text-gray-300">{activity.note}</p>
                  <p className="text-gray-500">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <select
                value={newActivity.type}
                onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
                className="input w-full text-sm"
              >
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="meeting">Meeting</option>
              </select>
              <textarea
                value={newActivity.note}
                onChange={(e) => setNewActivity({ ...newActivity, note: e.target.value })}
                placeholder="Add activity..."
                className="input w-full text-sm resize-none h-16"
              />
              <button
                onClick={handleAddActivity}
                className="w-full btn-primary text-sm"
              >
                <Plus size={16} className="inline mr-1" /> Add Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
