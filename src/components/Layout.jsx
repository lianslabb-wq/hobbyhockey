import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [hasTeam, setHasTeam] = useState(false)
  const [hasGoalie, setHasGoalie] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) { setHasTeam(false); setHasGoalie(false); return }
    Promise.all([
      supabase.from('teams').select('id').eq('user_id', user.id),
      supabase.from('goalies').select('id').eq('user_id', user.id),
    ]).then(([teamRes, goalieRes]) => {
      setHasTeam(teamRes.data?.length > 0)
      setHasGoalie(goalieRes.data?.length > 0)
    })
  }, [user, location.pathname])

  // Close mobile menu on navigation
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  function handleLogout() {
    localStorage.removeItem('hh_role')
    localStorage.removeItem('hh_registered_team')
    localStorage.removeItem('hh_registered_goalie')
    supabase.auth.signOut()
    setUser(null)
    navigate('/')
  }

  const nav = [
    { to: '/', label: 'Hem' },
    ...(user ? [{ to: '/me', label: 'Min sida' }] : []),
    { to: '/team', label: user && hasTeam ? 'Lagtider' : 'Lag' },
    { to: '/goalie', label: user && hasGoalie ? 'Målvaktstider' : 'Målvakt' },
    { to: '/about', label: 'Om oss' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-puck border-b border-rink-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 no-underline group">
            <div className="w-10 h-10 bg-goal-red rounded flex items-center justify-center text-white font-display font-bold text-xl tracking-tight group-hover:bg-goal-red-light transition-colors shrink-0">
              H
            </div>
            <div className="hidden sm:inline-flex sm:flex-col">
              <h1 className="font-display text-xl font-bold uppercase tracking-tight text-white leading-none">
                HOP<span className="text-goal-red">IN</span>HOCKEY
              </h1>
              <p className="text-ice-muted font-semibold uppercase leading-none mt-1" style={{fontSize: '7.5px', display: 'flex', justifyContent: 'space-between'}}>
                {'HITTA EN MÅLVAKT'.split('').map((ch, i) => <span key={i}>{ch === ' ' ? '\u00A0' : ch}</span>)}
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <nav className="flex gap-0.5">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 lg:px-4 py-2 text-sm font-medium uppercase tracking-wider no-underline transition-colors ${
                    location.pathname === item.to
                      ? 'text-white border-b-2 border-goal-red'
                      : 'text-ice-muted hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {!user ? (
              <Link
                to={localStorage.getItem('hh_role') === 'goalie' ? '/goalie' : '/team'}
                className="ml-2 px-4 py-2.5 bg-goal-red text-white rounded text-sm font-semibold uppercase tracking-wider no-underline hover:bg-goal-red-light transition-colors"
              >
                Logga in
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="ml-2 px-4 py-2.5 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer border-none"
              >
                Logga ut
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-ice-muted hover:text-white bg-transparent border-none cursor-pointer"
            aria-label="Meny"
          >
            {menuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-rink-border bg-puck">
            <nav className="flex flex-col px-4 py-2">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-3 text-sm font-medium uppercase tracking-wider no-underline transition-colors border-b border-rink-border ${
                    location.pathname === item.to
                      ? 'text-white'
                      : 'text-ice-muted hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {!user ? (
                <Link
                  to={localStorage.getItem('hh_role') === 'goalie' ? '/goalie' : '/team'}
                  className="mt-2 mb-2 px-4 py-3 bg-goal-red text-white rounded text-sm font-semibold uppercase tracking-wider no-underline hover:bg-goal-red-light transition-colors text-center"
                >
                  Logga in
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="mt-2 mb-2 px-4 py-3 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer border-none text-center"
                >
                  Logga ut
                </button>
              )}
            </nav>
          </div>
        )}
      </header>
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 sm:py-8 w-full">
        {children}
      </main>
      <footer className="border-t border-rink-border py-6 text-center">
        <p className="text-xs text-ice-muted font-semibold uppercase tracking-widest mb-2">HopInHockey</p>
        <Link to="/integritet" className="text-xs text-ice-muted hover:text-white no-underline transition-colors">
          Integritetspolicy
        </Link>
      </footer>
    </div>
  )
}
