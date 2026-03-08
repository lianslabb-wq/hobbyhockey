import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="flex flex-col items-center py-12">
      {/* Hero — text left, image right (image placeholder for now) */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-16">
        <div className="text-left">
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold uppercase tracking-tight mb-6">
            Hitta en{' '}
            <span className="text-goal-red">målvakt</span>
          </h1>
          <p className="text-ice-muted text-lg max-w-lg leading-relaxed">
            Saknar ditt lag en målvakt till nästa träning eller match?
            Vi kopplar ihop veteranhockeylag med tillgängliga målvakter — snabbt och enkelt.
          </p>
        </div>
        {/* Hero image — replace src with your generated image */}
        <div className="hidden lg:flex items-center justify-end">
          <div className="w-full h-80 rounded-lg bg-gradient-to-br from-rink-light via-rink to-puck flex items-center justify-center border border-rink-border">
            <p className="text-ice-muted/30 font-display uppercase tracking-widest text-sm">Hero-bild kommer här</p>
          </div>
        </div>
      </div>

      {/* CTA cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mb-16">
        <Link
          to="/team"
          className="bg-rink-light border border-rink-border rounded-lg p-8 text-left no-underline hover:border-goal-red/60 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-goal-red opacity-0 group-hover:opacity-100 transition-opacity" />
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-2 text-white group-hover:text-goal-red-light transition-colors">
            Vi saknar målvakt
          </h2>
          <p className="text-sm text-ice-muted mb-6 leading-relaxed">
            Registrera ditt lag och hitta en målvakt till nästa istid — på några klick.
          </p>
          <span className="inline-block px-5 py-2.5 bg-goal-red text-white rounded text-sm font-semibold uppercase tracking-wider group-hover:bg-goal-red-light transition-colors">
            Registrera lag
          </span>
        </Link>

        <Link
          to="/goalie"
          className="bg-rink-light border border-rink-border rounded-lg p-8 text-left no-underline hover:border-jersey-blue/60 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-jersey-blue opacity-0 group-hover:opacity-100 transition-opacity" />
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-2 text-white group-hover:text-jersey-blue-light transition-colors">
            Jag vill vakta
          </h2>
          <p className="text-sm text-ice-muted mb-6 leading-relaxed">
            Sugen på att spela? Se vilka lag som behöver dig och svara direkt.
          </p>
          <span className="inline-block px-5 py-2.5 bg-jersey-blue text-puck rounded text-sm font-semibold uppercase tracking-wider group-hover:bg-jersey-blue-light transition-colors">
            Hitta istid
          </span>
        </Link>
      </div>

      {/* How it works */}
      <div className="w-full max-w-2xl text-center">
        <h3 className="font-display text-xl font-bold uppercase tracking-wider mb-8 text-ice-muted">
          Så här funkar det
        </h3>
        <div className="grid grid-cols-3 gap-8">
          <div>
            <div className="font-display text-4xl font-bold text-goal-red mb-3">01</div>
            <p className="text-sm text-ice-muted leading-relaxed">
              Laget skapar en förfrågan med tid och plats
            </p>
          </div>
          <div>
            <div className="font-display text-4xl font-bold text-goal-red mb-3">02</div>
            <p className="text-sm text-ice-muted leading-relaxed">
              Målvakter får en notis och svarar om de kan
            </p>
          </div>
          <div>
            <div className="font-display text-4xl font-bold text-goal-red mb-3">03</div>
            <p className="text-sm text-ice-muted leading-relaxed">
              Först till kvarn — bekräftelse skickas direkt
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
