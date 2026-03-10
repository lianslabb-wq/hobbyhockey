import { Link } from 'react-router-dom'

export default function Thanks() {
  return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <div className="w-16 h-16 bg-goal-red/20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
        ❤️
      </div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-4">
        Tack — det värmer!
      </h1>
      <p className="text-ice-muted leading-relaxed mb-4">
        Bara att du tryckte på den knappen gör oss glada. Just nu finns inte möjligheten
        att donera, men vi jobbar på det.
      </p>
      <p className="text-ice-muted leading-relaxed mb-8">
        Hobbyhockey byggs på fritiden av folk som älskar hockey och vill lösa ett riktigt
        problem. Att veta att fler bryr sig ger oss energi att fortsätta bygga.
      </p>
      <div className="bg-rink-light border border-rink-border rounded-lg p-5 mb-8">
        <p className="text-white font-semibold mb-1">Vill du hjälpa till på riktigt?</p>
        <p className="text-ice-muted text-sm">
          Tipsa ett lag eller en målvakt om Hobbyhockey — det är det bästa stödet vi kan få just nu.
        </p>
      </div>
      <Link
        to="/"
        className="inline-block px-6 py-3 bg-goal-red text-white font-semibold rounded text-sm uppercase tracking-wider hover:bg-goal-red-light transition-colors no-underline"
      >
        Tillbaka till startsidan
      </Link>
    </div>
  )
}
