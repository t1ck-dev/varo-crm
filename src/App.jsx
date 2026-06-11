import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Pipeline from './components/Pipeline'
import LeadDetail from './components/LeadDetail'
import Dashboard from './components/Dashboard'
import { Menu, X } from 'lucide-react'

function App() {
  const [session, setSession] = useState(null)
  const [currentView, setCurrentView] = useState('pipeline')
  const [selectedLead, setSelectedLead] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSelectLead = (lead) => {
    setSelectedLead(lead)
    setCurrentView('detail')
  }

  const handleBackToBoard = () => {
    setSelectedLead(null)
    setCurrentView('pipeline')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-charcoal-900">
      {/* Header */}
      <header className="bg-charcoal-800 border-b border-charcoal-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-syne text-gold-500">Varo CRM</h1>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-4">
            <button
              onClick={() => setCurrentView('pipeline')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentView === 'pipeline'
                  ? 'bg-gold-500 text-charcoal-900'
                  : 'text-gray-200 hover:bg-charcoal-700'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-gold-500 text-charcoal-900'
                  : 'text-gray-200 hover:bg-charcoal-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-charcoal-700 text-gray-200 rounded-lg hover:bg-charcoal-600 transition-colors"
            >
              Logout
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gold-500 p-2"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <nav className="md:hidden bg-charcoal-700 border-t border-charcoal-600 px-4 py-3 flex flex-col gap-2">
            <button
              onClick={() => {
                setCurrentView('pipeline')
                setMenuOpen(false)
              }}
              className={`px-4 py-2 rounded-lg transition-colors text-left ${
                currentView === 'pipeline'
                  ? 'bg-gold-500 text-charcoal-900'
                  : 'text-gray-200 hover:bg-charcoal-600'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => {
                setCurrentView('dashboard')
                setMenuOpen(false)
              }}
              className={`px-4 py-2 rounded-lg transition-colors text-left ${
                currentView === 'dashboard'
                  ? 'bg-gold-500 text-charcoal-900'
                  : 'text-gray-200 hover:bg-charcoal-600'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-charcoal-600 text-gray-200 rounded-lg hover:bg-charcoal-500 transition-colors text-left"
            >
              Logout
            </button>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'pipeline' && (
          <Pipeline onSelectLead={handleSelectLead} />
        )}
        {currentView === 'detail' && selectedLead && (
          <LeadDetail lead={selectedLead} onBack={handleBackToBoard} />
        )}
        {currentView === 'dashboard' && <Dashboard />}
      </main>
    </div>
  )
}

export default App
