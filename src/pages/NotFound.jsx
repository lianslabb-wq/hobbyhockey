import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <div className="font-display text-8xl font-bold text-goal-red mb-4">404</div>
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight mb-4">Sidan hittades inte</h1>
      <p className="text-ice-muted mb-8">Sidan du letar efter finns inte eller har flyttats.</p>
      <Link
        to="/"
        className="inline-block px-6 py-3 bg-goal-red text-white font-semibold rounded text-sm uppercase tracking-wider hover:bg-goal-red-light transition-colors no-underline"
      >
        Tillbaka till startsidan
      </Link>
    </div>
  )
}
