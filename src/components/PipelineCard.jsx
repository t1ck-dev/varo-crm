import { Calendar } from 'lucide-react'
import { fmtMoney, fmtDate, daysSince, isPast } from '../lib/format'
import { getNiche } from '../lib/niches'

export default function PipelineCard({ lead, onDragStart, onClick, isLost }) {
  const days = daysSince(lead.stage_changed_at)
  const overdue = !isLost && isPast(lead.next_action_date)
  const niche = getNiche(lead.niche)

  return (
    <div
      draggable={!isLost}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`lead-card ${overdue ? 'overdue' : ''} ${isLost ? 'is-lost' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-cream truncate">
            {lead.company || <span className="text-faint italic">Unnamed lead</span>}
          </p>
          {lead.contact_name && (
            <p className="text-xs text-stone truncate">{lead.contact_name}</p>
          )}
        </div>
        {Number(lead.monthly_value) > 0 && (
          <span className="data text-gold text-xs font-medium whitespace-nowrap pt-0.5">
            {fmtMoney(lead.monthly_value)}
          </span>
        )}
      </div>

      {niche && (
        <span
          className="inline-flex items-center gap-1.5 text-[10px] mt-2 px-2 py-0.5 rounded-full border border-edge text-stone"
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: niche.color }}
          />
          {niche.label}
        </span>
      )}

      {lead.next_action && (
        <p className="text-xs text-stone bg-black/25 border border-edge rounded-md px-2 py-1 mt-2 truncate">
          {lead.next_action}
        </p>
      )}

      <div className="flex items-center justify-between mt-2.5 text-[11px]">
        <span
          className={`data flex items-center gap-1 ${overdue ? 'text-rust' : 'text-faint'}`}
        >
          {lead.next_action_date && (
            <>
              <Calendar size={11} /> {fmtDate(lead.next_action_date)}
            </>
          )}
        </span>
        <span className="data text-faint">{days}d</span>
      </div>
    </div>
  )
}
