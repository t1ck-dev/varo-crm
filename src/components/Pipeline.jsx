import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, AlertCircle } from 'lucide-react'
import PipelineCard from './PipelineCard'
import AddLeadModal from './AddLeadModal'

const STAGES = ['Cold', 'Contacted', 'Interested', 'Meeting', 'Closed', 'Building', 'Built', 'Delivered']

export default function Pipeline({ onSelectLead }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [draggedLead, setDraggedLead] = useState(null)
  const [lostReason, setLostReason] = useState('')
  const [showLostPrompt, setShowLostPrompt] = useState(false)
  const [lostLeadId, setLostLeadId] = useState(null)

  useEffect(() => {
    fetchLeads()
    const subscription = supabase
      .channel('leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads()
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      setLeads(data || [])
    }
    setLoading(false)
  }

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, stage) => {
    e.preventDefault()
    if (!draggedLead) return

    if (stage === 'Lost') {
      setLostLeadId(draggedLead.id)
      setShowLostPrompt(true)
      setDraggedLead(null)
      return
    }

    await supabase
      .from('leads')
      .update({
        stage,
        stage_changed_at: new Date().toISOString(),
      })
      .eq('id', draggedLead.id)

    setDraggedLead(null)
  }

  const handleConfirmLost = async () => {
    if (!lostLeadId) return

    await supabase
      .from('leads')
      .update({
        stage: 'Lost',
        lost_reason: lostReason,
        stage_changed_at: new Date().toISOString(),
      })
      .eq('id', lostLeadId)

    setShowLostPrompt(false)
    setLostReason('')
    setLostLeadId(null)
  }

  const leadssByStage = (stage) => {
    return leads.filter((lead) => lead.stage === stage)
  }

  const overdueCounts = (stage) => {
    return leadssByStage(stage).filter(
      (lead) => lead.next_action_date && new Date(lead.next_action_date) < new Date() && stage !== 'Delivered' && stage !== 'Lost'
    ).length
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading pipeline...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-syne text-gold-500">Pipeline</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> Add cold lead
        </button>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
          {STAGES.map((stage) => (
            <div
              key={stage}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
              className="flex-shrink-0 w-80 bg-charcoal-800 rounded-lg p-4 border border-charcoal-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-syne font-bold text-gray-100">
                  {stage}
                  <span className="ml-2 text-sm text-gray-400">({leadssByStage(stage).length})</span>
                </h3>
                {overdueCounts(stage) > 0 && (
                  <div className="flex items-center gap-1 text-red-400 text-xs">
                    <AlertCircle size={14} />
                    {overdueCounts(stage)}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {leadssByStage(stage).map((lead) => (
                  <PipelineCard
                    key={lead.id}
                    lead={lead}
                    onDragStart={(e) => handleDragStart(e, lead)}
                    onClick={() => onSelectLead(lead)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Lost Column */}
          <div
            className="flex-shrink-0 w-80 bg-charcoal-800 rounded-lg p-4 border border-charcoal-700 opacity-50"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'Lost')}
          >
            <h3 className="font-syne font-bold text-gray-100 mb-4">
              Lost
              <span className="ml-2 text-sm text-gray-400">({leadssByStage('Lost').length})</span>
            </h3>
            <div className="space-y-3">
              {leadssByStage('Lost').map((lead) => (
                <PipelineCard
                  key={lead.id}
                  lead={lead}
                  onDragStart={(e) => handleDragStart(e, lead)}
                  onClick={() => onSelectLead(lead)}
                  isLost
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lost Reason Prompt */}
      {showLostPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="text-xl font-syne mb-4">Why was this lead lost?</h3>
            <textarea
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="Enter reason..."
              className="input w-full h-24 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmLost}
                className="flex-1 btn-primary"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowLostPrompt(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onLeadAdded={fetchLeads}
        />
      )}
    </div>
  )
}
