import { useState } from 'react'
import { syncLink } from '../lib/sync'
import { X, Copy, Check, Link2, Unplug } from 'lucide-react'

export default function SyncModal({ token, onClose, onDisconnect }) {
  const [copied, setCopied] = useState(null) // 'code' | 'link'

  const copy = async (text, which) => {
    await navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 1600)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-xl">Sync devices</h3>
          <button onClick={onClose} className="text-faint hover:text-cream transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-stone text-sm mb-5">
          Open the link below on your phone — or paste the code on the welcome
          screen — and both devices share the same pipeline.
        </p>

        <label className="label-caps mb-2">Your sync code</label>
        <div className="data text-gold text-sm break-all bg-black/25 border border-edge rounded-xl px-4 py-3 mb-3">
          {token}
        </div>

        <div className="space-y-2">
          <button onClick={() => copy(token, 'code')} className="btn-gold w-full">
            {copied === 'code' ? <Check size={15} /> : <Copy size={15} />}
            {copied === 'code' ? 'Copied' : 'Copy sync code'}
          </button>
          <button onClick={() => copy(syncLink(token), 'link')} className="btn-ghost w-full">
            {copied === 'link' ? <Check size={15} /> : <Link2 size={15} />}
            {copied === 'link' ? 'Copied' : 'Copy sync link'}
          </button>
        </div>

        <p className="text-faint text-xs leading-relaxed mt-4 mb-5">
          Anyone with this code can see and edit your pipeline — keep it
          private. Save it somewhere safe: it's the only way back into this
          data if you clear your browser.
        </p>

        <div className="border-t border-edge pt-4">
          <button
            onClick={() => {
              if (confirm('Disconnect this device? The data stays in the cloud — reconnect anytime with your sync code.')) {
                onDisconnect()
              }
            }}
            className="btn-danger w-full"
          >
            <Unplug size={15} /> Disconnect this device
          </button>
        </div>
      </div>
    </div>
  )
}
