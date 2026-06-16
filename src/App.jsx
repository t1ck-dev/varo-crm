import { useState } from 'react'
import { getToken, clearToken } from './lib/sync'
import Welcome from './components/Welcome'
import SyncModal from './components/SyncModal'
import Pipeline from './components/Pipeline'
import LeadDetail from './components/LeadDetail'
import Dashboard from './components/Dashboard'
import CallMode from './components/CallMode'
import { RefreshCw } from 'lucide-react'

function App() {
  const [token, setToken] = useState(() => getToken())
  const [currentView, setCurrentView] = useState('pipeline')
  const [selectedLead, setSelectedLead] = useState(null)
  const [showSync, setShowSync] = useState(false)

  if (!token) {
    return <Welcome onReady={setToken} />
  }

  const handleSelectLead = (lead) => {
    setSelectedLead(lead)
    setCurrentView('detail')
  }

  const handleBackToBoard = () => {
    setSelectedLead(null)
    setCurrentView('pipeline')
  }

  const handleDisconnect = () => {
    clearToken()
    setShowSync(false)
    setSelectedLead(null)
    setCurrentView('pipeline')
    setToken(null)
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-edge backdrop-blur-md bg-ink/80">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <span
              className="text-gold text-2xl leading-none"
              style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500 }}
            >
              Varo
            </span>
            <span className="label-caps hidden sm:block">CRM</span>
          </div>

          <nav className="seg">
            <button
              className={currentView === 'pipeline' || currentView === 'detail' ? 'active' : ''}
              onClick={() => {
                setSelectedLead(null)
                setCurrentView('pipeline')
              }}
            >
              Pipeline
            </button>
            <button
              className={currentView === 'callmode' ? 'active' : ''}
              onClick={() => {
                setSelectedLead(null)
                setCurrentView('callmode')
              }}
            >
              Call mode
            </button>
            <button
              className={currentView === 'dashboard' ? 'active' : ''}
              onClick={() => setCurrentView('dashboard')}
            >
              Dashboard
            </button>
          </nav>

          <button
            onClick={() => setShowSync(true)}
            className="flex items-center gap-1.5 text-xs text-stone hover:text-cream border border-edge hover:border-edge-strong rounded-full px-3 py-1.5 transition-colors"
            title="Sync devices"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sage" />
            <RefreshCw size={12} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'pipeline' && (
          <Pipeline token={token} onSelectLead={handleSelectLead} />
        )}
        {currentView === 'detail' && selectedLead && (
          <LeadDetail token={token} lead={selectedLead} onBack={handleBackToBoard} />
        )}
        {currentView === 'callmode' && <CallMode token={token} />}
        {currentView === 'dashboard' && <Dashboard token={token} />}
      </main>

      {showSync && (
        <SyncModal
          token={token}
          onClose={() => setShowSync(false)}
          onDisconnect={handleDisconnect}
        />
      )}
    </div>
  )
}

export default App
