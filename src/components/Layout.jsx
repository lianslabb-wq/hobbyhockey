import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [hasTeam, setHasTeam] = useState(false)
  const [hasGoalie, setHasGoalie] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
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
            <div className="w-10 h-10 bg-goal-red rounded flex items-center justify-center text-white font-display font-bold text-xl tracking-tight group-hover:bg-goal-red-light transition-colors">
              H
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white uppercase tracking-wide leading-tight">
                Hobbyhockey
              </h1>
              <p className="text-[10px] text-ice-muted font-semibold uppercase tracking-[0.2em] leading-tight">
                Hitta en målvakt
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <nav className="flex gap-0.5">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-4 py-2 text-sm font-medium uppercase tracking-wider no-underline transition-colors ${
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
                className="ml-3 px-4 py-2 bg-goal-red text-white rounded text-sm font-semibold uppercase tracking-wider no-underline hover:bg-goal-red-light transition-colors"
              >
                Logga in
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="ml-3 px-4 py-2 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer border-none"
              >
                Logga ut
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {children}
      </main>
      <footer className="border-t border-rink-border py-6 text-center">
        <p className="text-xs text-ice-muted/80 font-semibold uppercase tracking-widest mb-2">Hobbyhockey</p>
        <Link to="/integritet" className="text-xs text-ice-muted/70 hover:text-white no-underline transition-colors">
          Integritetspolicy
        </Link>
      </footer>
    </div>
  )
}
