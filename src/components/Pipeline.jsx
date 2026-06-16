import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { STAGES } from '../lib/stages'
import { fmtMoney, isPast } from '../lib/format'
import { Plus, AlertCircle, Upload } from 'lucide-react'
import PipelineCard from './PipelineCard'
import AddLeadModal from './AddLeadModal'
import ImportLeadsModal from './ImportLeadsModal'

export default function Pipeline({ token, onSelectLead }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [draggedLead, setDraggedLead] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const [lostReason, setLostReason] = useState('')
  const [lostLeadId, setLostLeadId] = useState(null)

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('sync_token', token)
      .order('created_at', { ascending: false })

    if (!error) setLeads(data || [])
    setLoading(false)
  }, [token])

  useEffect(() => {
    fetchLeads()
    const channel = supabase
      .channel(`leads-${token}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `sync_token=eq.${token}` },
        fetchLeads
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [token, fetchLeads])

  const moveLead = async (leadId, stage, extra = {}) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage, ...extra } : l))
    )
    await supabase
      .from('leads')
      .update({ stage, stage_changed_at: new Date().toISOString(), ...extra })
      .eq('id', leadId)
      .eq('sync_token', token)
  }

  const handleDrop = (e, stage) => {
    e.preventDefault()
    setDragOverStage(null)
    if (!draggedLead || draggedLead.stage === stage) return

    if (stage === 'Lost') {
      setLostLeadId(draggedLead.id)
    } else {
      moveLead(draggedLead.id, stage)
    }
    setDraggedLead(null)
  }

  const handleConfirmLost = async () => {
    if (!lostLeadId) return
    await moveLead(lostLeadId, 'Lost', { lost_reason: lostReason || null })
    setLostLeadId(null)
    setLostReason('')
  }

  const byStage = (stage) => leads.filter((l) => l.stage === stage)

  const stageValue = (stage) =>
    byStage(stage).reduce((sum, l) => sum + (Number(l.monthly_value) || 0), 0)

  const overdueCount = (stage) =>
    byStage(stage).filter((l) => isPast(l.next_action_date)).length

  if (loading) {
    return (
      <div className="text-center py-20 text-faint text-sm animate-pulse">
        Loading pipeline…
      </div>
    )
  }

  const columns = [...STAGES, { id: 'Lost', color: '#e07a6a', isLost: true }]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between reveal">
        <div>
          <h2 className="text-3xl">Pipeline</h2>
          <p className="text-faint text-xs mt-1">
            {leads.length} lead{leads.length === 1 ? '' : 's'} &middot; drag cards between stages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImportModal(true)} className="btn-ghost">
            <Upload size={15} /> Import
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-gold">
            <Plus size={16} /> Add lead
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 -mx-4 px-4 scroll-thin">
        <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
          {columns.map((stage, i) => {
            const items = byStage(stage.id)
            const value = stageValue(stage.id)
            const overdue = stage.isLost ? 0 : overdueCount(stage.id)
            return (
              <div
                key={stage.id}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverStage(stage.id)
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`kanban-col reveal flex-shrink-0 w-64 p-3 ${
                  dragOverStage === stage.id ? 'drag-over' : ''
                } ${stage.isLost ? 'opacity-70' : ''}`}
                style={{ animationDelay: `${i * 35}ms` }}
              >
                <div className="flex items-center justify-between mb-1 px-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: stage.color }}
                    />
                    <span className="text-sm font-semibold truncate">{stage.id}</span>
                    <span className="data text-faint text-xs">{items.length}</span>
                  </div>
                  {overdue > 0 && (
                    <span className="flex items-center gap-1 text-rust text-xs">
                      <AlertCircle size={12} /> {overdue}
                    </span>
                  )}
                </div>
                <div className="data text-faint text-[11px] px-1 mb-3 h-4">
                  {value > 0 ? `${fmtMoney(value)} /mo` : ''}
                </div>

                <div className="space-y-2.5 min-h-16">
                  {items.map((lead) => (
                    <PipelineCard
                      key={lead.id}
                      lead={lead}
                      isLost={stage.isLost}
                      onDragStart={(e) => {
                        setDraggedLead(lead)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onClick={() => onSelectLead(lead)}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="border border-dashed border-edge rounded-xl py-6 text-center text-faint text-xs">
                      empty
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {lostLeadId && (
        <div className="modal-backdrop" onClick={() => setLostLeadId(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl mb-1">Mark as lost</h3>
            <p className="text-stone text-sm mb-4">What happened? (optional)</p>
            <textarea
              autoFocus
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="e.g. went with a competitor, no budget…"
              className="field h-24 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={handleConfirmLost} className="btn-gold flex-1">
                Mark lost
              </button>
              <button onClick={() => setLostLeadId(null)} className="btn-ghost flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddLeadModal
          token={token}
          onClose={() => setShowAddModal(false)}
          onLeadAdded={fetchLeads}
        />
      )}

      {showImportModal && (
        <ImportLeadsModal
          token={token}
          onClose={() => setShowImportModal(false)}
          onImported={fetchLeads}
        />
      )}
    </div>
  )
}
