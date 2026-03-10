import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
  const location = useLocation()

  const nav = [
    { to: '/', label: 'Hem' },
    { to: '/team', label: 'Lag' },
    { to: '/goalie', label: 'Målvakt' },
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
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {children}
      </main>
      <footer className="border-t border-rink-border py-6 text-center">
        <p className="text-xs text-ice-muted/80 font-semibold uppercase tracking-widest">Hobbyhockey</p>
      </footer>
    </div>
  )
}
