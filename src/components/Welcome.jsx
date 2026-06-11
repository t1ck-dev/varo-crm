import { useState } from 'react'
import { createToken, adoptToken } from '../lib/sync'
import { ArrowRight, Link2 } from 'lucide-react'

export default function Welcome({ onReady }) {
  const [mode, setMode] = useState('choose') // 'choose' | 'connect'
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleStartFresh = () => {
    onReady(createToken())
  }

  const handleConnect = (e) => {
    e.preventDefault()
    const token = adoptToken(code)
    if (!token) {
      setError("That doesn't look like a valid sync code.")
      return
    }
    onReady(token)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p
          className="reveal text-6xl text-gold"
          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500 }}
        >
          Varo
        </p>
        <p className="reveal label-caps mt-3 mb-1" style={{ animationDelay: '80ms' }}>
          Client Pipeline Ledger
        </p>
        <p className="reveal text-stone text-sm mb-10" style={{ animationDelay: '120ms' }}>
          No account, no password. Your pipeline lives behind a private sync code.
        </p>

        {mode === 'choose' ? (
          <div className="reveal space-y-3" style={{ animationDelay: '180ms' }}>
            <button onClick={handleStartFresh} className="btn-gold w-full py-3">
              Start a new pipeline <ArrowRight size={16} />
            </button>
            <button onClick={() => setMode('connect')} className="btn-ghost w-full py-3">
              <Link2 size={15} /> I have a sync code
            </button>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="reveal space-y-3 text-left">
            <label className="label-caps mb-2">Sync code from your other device</label>
            <input
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setError('')
              }}
              placeholder="paste sync code…"
              className="field data text-center tracking-wider"
            />
            {error && <p className="text-rust text-xs">{error}</p>}
            <button type="submit" className="btn-gold w-full py-3">
              Connect <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => setMode('choose')}
              className="btn-ghost w-full"
            >
              Back
            </button>
          </form>
        )}

        <p className="reveal text-faint text-xs mt-10" style={{ animationDelay: '240ms' }}>
          Find your code on a synced device under{' '}
          <span className="text-stone">Sync &rarr; Copy sync code</span>
        </p>
      </div>
    </div>
  )
}
