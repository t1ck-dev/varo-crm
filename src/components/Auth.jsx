import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [syncCode, setSyncCode] = useState('')
  const [mode, setMode] = useState('login') // 'login' or 'sync'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncCodeLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Get the user associated with this sync code
      const { data, error: fetchError } = await supabase
        .from('sync_codes')
        .select('user_id, expires_at')
        .eq('code', syncCode.toUpperCase())
        .single()

      if (fetchError) throw new Error('Invalid sync code')
      if (!data) throw new Error('Sync code not found')

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        throw new Error('Sync code expired')
      }

      // Sign in as that user using their ID
      // Note: This is a simplified approach - in production you'd use magic links or similar
      // For now, we'll create a session by having them use a test account
      setError('Sync code verified! Sign in with your email to confirm.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-3xl mb-6 text-gold-500">Varo CRM</h1>

        <div className="flex gap-2 mb-6 border-b border-charcoal-700">
          <button
            onClick={() => {
              setMode('login')
              setError('')
            }}
            className={`flex-1 py-2 px-4 transition-colors ${
              mode === 'login'
                ? 'text-gold-500 border-b-2 border-gold-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setMode('sync')
              setError('')
            }}
            className={`flex-1 py-2 px-4 transition-colors ${
              mode === 'sync'
                ? 'text-gold-500 border-b-2 border-gold-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Sync Phone
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSyncCodeLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sync Code (from desktop)
              </label>
              <input
                type="text"
                value={syncCode}
                onChange={(e) => setSyncCode(e.target.value.toUpperCase())}
                placeholder="e.g., ABC123XYZ"
                className="input w-full text-center text-lg font-mono tracking-widest"
                required
              />
            </div>

            <p className="text-xs text-gray-400 text-center">
              Open Varo CRM on your desktop, click "Generate Code" in settings, and enter it above.
            </p>

            {error && (
              <div className="p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Sync Device'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
