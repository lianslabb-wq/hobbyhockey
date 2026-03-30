export default function RequestCard({ request, session, team: teamProp, onRespond, isGoalieView }) {
  if (!session) return null

  const teamName = teamProp?.name || request.teams?.name || 'Lag'
  const teamLocation = teamProp?.location || request.teams?.location || ''

  const statusStyles = {
    open: 'bg-goal-red/15 text-goal-red-light border-goal-red/30',
    filled: 'bg-goal-green/15 text-goal-green border-goal-green/30',
    cancelled: 'bg-rink-lighter text-ice-muted border-rink-border',
  }

  const typeLabels = {
    favorites: 'Riktad',
    open: 'Öppen',
  }

  return (
    <div className="bg-rink-light border border-rink-border rounded-lg p-4 sm:p-5 hover:border-rink-lighter transition-colors">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div>
          <h3 className="font-display text-base sm:text-lg font-bold uppercase tracking-wide">{teamName}</h3>
          <p className="text-ice-muted text-sm">{teamLocation}</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 shrink-0 ml-2">
          <span className={`px-2 py-1 rounded border text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${statusStyles[request.status]}`}>
            {request.status === 'open' ? 'Söker' : request.status === 'filled' ? 'Tillsatt' : 'Avbokad'}
          </span>
          <span className="px-2 py-1 rounded border border-jersey-blue/30 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-jersey-blue bg-jersey-blue/10">
            {typeLabels[request.type] || 'Öppen'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4 text-sm">
        <div>
          <p className="text-ice-muted mb-1 text-xs uppercase tracking-wide font-semibold">Datum</p>
          <p className="font-semibold text-white">{session.date}</p>
        </div>
        <div>
          <p className="text-ice-muted mb-1 text-xs uppercase tracking-wide font-semibold">Tid</p>
          <p className="font-semibold text-white">{session.time?.slice(0, 5)}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-ice-muted mb-1 text-xs uppercase tracking-wide font-semibold">Plats</p>
          <p className="font-semibold text-white">{session.rink}</p>
          {session.rink_address && <p className="text-ice-muted text-xs mt-0.5">{session.rink_address}</p>}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <p className="text-sm text-ice-muted font-semibold uppercase tracking-wider">{session.type}</p>
        {isGoalieView && request.status === 'open' && (
          <div className="flex gap-2">
            <button
              onClick={() => onRespond?.(request.id, 'yes')}
              className="flex-1 sm:flex-none px-5 py-3 bg-goal-green text-white rounded text-sm font-semibold uppercase tracking-wider hover:bg-goal-green/80 transition-colors cursor-pointer"
            >
              Jag kan!
            </button>
            <button
              onClick={() => onRespond?.(request.id, 'no')}
              className="flex-1 sm:flex-none px-5 py-3 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer"
            >
              Kan inte
            </button>
          </div>
        )}
      </div>
      {!isGoalieView && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-rink-border">
          <p className="text-xs text-ice-muted mb-2 uppercase tracking-wide font-semibold">Svar ({request.responses?.length || 0})</p>
          {request.responses?.length > 0 ? request.responses.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${r.answer === 'yes' ? 'bg-goal-green' : 'bg-goal-red'}`} />
              <span className="text-white font-medium">{r.goalieName}</span>
              <span className="text-ice-muted">{r.answer === 'yes' ? 'Tillgänglig' : 'Kan inte'}</span>
            </div>
          )) : (
            <p className="text-ice-muted text-sm">Inga svar ännu</p>
          )}
        </div>
      )}
    </div>
  )
}
