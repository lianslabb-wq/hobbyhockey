import { Link } from 'react-router-dom'
import { usePageMeta } from '../lib/usePageMeta'

export default function Home() {
  usePageMeta('HopInHockey — Hitta en målvakt till ditt veteranhockeylag', 'Saknar ditt lag en målvakt? HopInHockey kopplar ihop veteranhockeylag med tillgängliga målvakter — snabbt och enkelt.')
  return (
    <div className="flex flex-col items-center py-6 sm:py-12">
      {/* Hero */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center mb-10 sm:mb-16">
        <div className="text-left">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-7xl font-bold uppercase tracking-tight mb-4 sm:mb-6">
            Hitta en{' '}
            <span className="text-goal-red">målvakt</span>
          </h1>
          <p className="text-ice-muted text-base sm:text-lg max-w-lg leading-relaxed">
            Saknar ditt lag en målvakt till nästa träning eller match?
            Vi kopplar ihop veteranhockeylag med tillgängliga målvakter — snabbt och enkelt.
          </p>
        </div>
        <div className="hidden lg:block relative">
          <img src="/hero.jpg" alt="Ishockey" className="w-full h-96 object-cover rounded-r-lg" />
          <div className="absolute inset-0 bg-gradient-to-r from-rink via-rink/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-rink via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-rink/40 to-transparent" />
        </div>
      </div>

      {/* CTA cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl mb-10 sm:mb-16">
        <Link
          to="/team"
          className="bg-rink-light border border-rink-border rounded-lg p-5 sm:p-8 text-left no-underline hover:border-goal-red/60 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-goal-red opacity-0 group-hover:opacity-100 transition-opacity" />
          <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide mb-2 text-white group-hover:text-goal-red-light transition-colors">
            Vi saknar målvakt
          </h2>
          <p className="text-sm text-ice-muted mb-4 sm:mb-6 leading-relaxed">
            Registrera ditt lag och hitta en målvakt till nästa istid — på några klick.
          </p>
          <span className="inline-block px-5 py-3 bg-goal-red text-white rounded text-sm font-semibold uppercase tracking-wider group-hover:bg-goal-red-light transition-colors">
            Registrera lag
          </span>
        </Link>

        <Link
          to="/goalie"
          className="bg-rink-light border border-rink-border rounded-lg p-5 sm:p-8 text-left no-underline hover:border-jersey-blue/60 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-jersey-blue opacity-0 group-hover:opacity-100 transition-opacity" />
          <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide mb-2 text-white group-hover:text-jersey-blue-light transition-colors">
            Jag vill vakta
          </h2>
          <p className="text-sm text-ice-muted mb-4 sm:mb-6 leading-relaxed">
            Sugen på att spela? Se vilka lag som behöver dig och svara direkt.
          </p>
          <span className="inline-block px-5 py-3 bg-jersey-blue text-puck rounded text-sm font-semibold uppercase tracking-wider group-hover:bg-jersey-blue-light transition-colors">
            Hitta istid
          </span>
        </Link>
      </div>

      {/* How it works */}
      <div className="w-full max-w-2xl text-center">
        <h3 className="font-display text-xl font-bold uppercase tracking-wider mb-6 sm:mb-8 text-ice-muted">
          Så här funkar det
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 relative">
          <div className="hidden sm:block absolute top-5 left-[calc(16.67%+20px)] w-[calc(33.33%-40px)] h-0.5 bg-goal-red" />
          <div className="hidden sm:block absolute top-5 left-[calc(50%+20px)] w-[calc(33.33%-40px)] h-0.5 bg-goal-red" />
          <div className="relative flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-rink border-2 border-goal-red flex items-center justify-center font-display text-lg font-bold text-goal-red mb-3 relative z-10">1</div>
            <p className="text-sm text-ice-muted leading-relaxed px-4">
              Laget skapar en förfrågan med tid och plats
            </p>
          </div>
          <div className="relative flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-rink border-2 border-goal-red flex items-center justify-center font-display text-lg font-bold text-goal-red mb-3 relative z-10">2</div>
            <p className="text-sm text-ice-muted leading-relaxed px-4">
              Målvakter får en notis och svarar om de kan
            </p>
          </div>
          <div className="relative flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-rink border-2 border-goal-red flex items-center justify-center font-display text-lg font-bold text-goal-red mb-3 relative z-10">3</div>
            <p className="text-sm text-ice-muted leading-relaxed px-4">
              Först till kvarn — bekräftelse skickas direkt
            </p>
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <div className="w-full max-w-sm mt-10 sm:mt-16">
        <div className="bg-rink-light border border-rink-border rounded-lg p-4 sm:p-5 text-center relative">
          <span className="text-goal-red text-2xl font-display leading-none absolute top-3 left-4">"</span>
          <blockquote className="text-ice-muted text-sm italic leading-relaxed pt-3">
            <p className="font-display text-base font-bold uppercase tracking-wide text-white not-italic mb-1">ÄNTLIGEN!!!!!</p>
            <p className="mb-1">Jag har väntat på att någon ska ordna detta!</p>
            <p className="text-lg mb-1">👍👍👍</p>
            <p>Har sökt efter målvaktsgrupper på Facebook, men det verkar inte finnas något där heller. 😅</p>
          </blockquote>
          <p className="mt-3 text-xs text-ice-muted font-semibold tracking-wide">— Max, HKHC</p>
        </div>
      </div>
    </div>
  )
}
