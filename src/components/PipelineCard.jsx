import { Calendar, AlertCircle } from 'lucide-react'

export default function PipelineCard({ lead, onDragStart, onClick, isLost }) {
  const daysInStage = lead.stage_changed_at
    ? Math.floor((new Date() - new Date(lead.stage_changed_at)) / (1000 * 60 * 60 * 24))
    : 0

  const isOverdue = lead.next_action_date && new Date(lead.next_action_date) < new Date()

  return (
    <div
      draggable={!isLost}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-move transition-colors ${
        isLost
          ? 'bg-charcoal-700 border-charcoal-600 opacity-75 cursor-not-allowed'
          : isOverdue
          ? 'bg-red-900 bg-opacity-20 border-red-600 hover:border-red-500'
          : 'bg-charcoal-700 border-charcoal-600 hover:border-gold-500'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-bold text-gray-100 truncate">{lead.company}</h4>
          <p className="text-xs text-gray-400 truncate">{lead.contact_name}</p>
        </div>
        {isOverdue && <AlertCircle size={16} className="text-red-400 flex-shrink-0 ml-2" />}
      </div>

      {lead.monthly_value > 0 && (
        <div className="mb-2 text-sm font-semibold text-gold-400">
          R{lead.monthly_value.toLocaleString()}
        </div>
      )}

      {lead.next_action && (
        <div className="text-xs text-gray-300 bg-charcoal-600 rounded px-2 py-1 mb-2 truncate">
          {lead.next_action}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400">
        {lead.next_action_date && (
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(lead.next_action_date).toLocaleDateString()}
          </div>
        )}
        <div>{daysInStage}d in stage</div>
      </div>
    </div>
  )
}
