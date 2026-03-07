import { useState } from 'react'
import { teams, goalies, requests as initialRequests } from '../lib/mockData'
import RequestCard from '../components/RequestCard'

export default function TeamDashboard() {
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [requests, setRequests] = useState(initialRequests)
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [newRequest, setNewRequest] = useState({ sessionId: '', type: 'favorites' })

  if (!selectedTeam) {
    return (
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-2">Välj ditt lag</h1>
        <p className="text-ice-muted mb-8">Logga in som lagansvarig för att hantera förfrågningar.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className="bg-rink-light border border-rink-border rounded-lg p-6 text-left hover:border-goal-red/50 transition-colors cursor-pointer group"
            >
              <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-1 group-hover:text-goal-red-light transition-colors">{team.name}</h2>
              <p className="text-sm text-ice-muted">{team.type} &middot; {team.location}</p>
              <p className="text-sm text-ice-muted/60 mt-2">Kontakt: {team.contact}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const teamRequests = requests.filter((r) => r.teamId === selectedTeam.id)
  const sessionsNeedingGoalie = selectedTeam.sessions.filter((s) => s.needsGoalie)
  const teamFavorites = goalies.filter((g) => selectedTeam.favoriteGoalies.includes(g.id))

  function handleCreateRequest() {
    if (!newRequest.sessionId) return
    const req = {
      id: `r${Date.now()}`,
      teamId: selectedTeam.id,
      sessionId: newRequest.sessionId,
      type: newRequest.type,
      status: 'open',
      createdAt: new Date().toISOString(),
      responses: [],
    }
    setRequests([req, ...requests])
    setShowNewRequest(false)
    setNewRequest({ sessionId: '', type: 'favorites' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => setSelectedTeam(null)} className="text-sm text-ice-muted/60 hover:text-white mb-1 cursor-pointer bg-transparent border-none transition-colors">
            ← Alla lag
          </button>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">{selectedTeam.name}</h1>
          <p className="text-ice-muted">{selectedTeam.type} &middot; {selectedTeam.location} &middot; Ansvarig: {selectedTeam.contact}</p>
        </div>
        <button
          onClick={() => setShowNewRequest(!showNewRequest)}
          className="px-5 py-2.5 bg-goal-red text-white rounded font-semibold text-sm uppercase tracking-wider hover:bg-goal-red-light transition-colors cursor-pointer"
        >
          + Sök målvakt
        </button>
      </div>

      {showNewRequest && (
        <div className="bg-rink-light border border-goal-red/30 rounded-lg p-6 mb-6">
          <h3 className="font-display text-lg font-bold uppercase tracking-wide mb-4">Ny förfrågan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-ice-muted/60 mb-1.5 uppercase tracking-wider">Tillfälle</label>
              <select
                value={newRequest.sessionId}
                onChange={(e) => setNewRequest({ ...newRequest, sessionId: e.target.value })}
                className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm"
              >
                <option value="">Välj tillfälle...</option>
                {sessionsNeedingGoalie.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.date} {s.time} — {s.type} @ {s.rink}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-ice-muted/60 mb-1.5 uppercase tracking-wider">Skicka till</label>
              <select
                value={newRequest.type}
                onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
                className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm"
              >
                <option value="favorites">Mina favoriter ({teamFavorites.length} st)</option>
                <option value="open">Alla målvakter (öppen förfrågan)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateRequest}
              className="px-5 py-2.5 bg-goal-red text-white rounded font-semibold text-sm uppercase tracking-wider hover:bg-goal-red-light transition-colors cursor-pointer"
            >
              Skicka förfrågan
            </button>
            <button
              onClick={() => setShowNewRequest(false)}
              className="px-5 py-2.5 bg-rink-lighter text-ice-muted rounded font-semibold text-sm uppercase tracking-wider hover:text-white transition-colors cursor-pointer"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Förfrågningar</h2>
          {teamRequests.length === 0 ? (
            <p className="text-ice-muted/60">Inga aktiva förfrågningar.</p>
          ) : (
            <div className="space-y-4">
              {teamRequests.map((req) => {
                const session = selectedTeam.sessions.find((s) => s.id === req.sessionId)
                return <RequestCard key={req.id} request={req} session={session} isGoalieView={false} />
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Favoritmålvakter</h2>
          {teamFavorites.length === 0 ? (
            <p className="text-ice-muted/60 text-sm">Inga favoriter tillagda än.</p>
          ) : (
            <div className="space-y-2">
              {teamFavorites.map((g) => (
                <div key={g.id} className="bg-rink-light border border-rink-border rounded-lg p-4">
                  <p className="font-semibold text-white">{g.name}</p>
                  <p className="text-sm text-ice-muted">{g.location}</p>
                  <p className="text-sm text-ice-muted/60">{g.phone}</p>
                </div>
              ))}
            </div>
          )}

          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4 mt-8">Kommande tider</h2>
          <div className="space-y-2">
            {selectedTeam.sessions.map((s) => (
              <div key={s.id} className={`rounded-lg p-3 text-sm border ${s.needsGoalie ? 'bg-goal-red/10 border-goal-red/30' : 'bg-rink-light border-rink-border'}`}>
                <p className="font-semibold text-white">{s.date} {s.time}</p>
                <p className="text-ice-muted">{s.type} @ {s.rink}</p>
                {s.needsGoalie && <p className="text-goal-red text-xs mt-1 font-semibold uppercase tracking-wider">Saknar målvakt</p>}
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Kalender</h2>
            <div className="bg-rink-light border border-rink-border rounded-lg p-4">
              <p className="text-sm text-ice-muted mb-2">Klistra in länken till lagets följkalender (iCal):</p>
              <input
                type="url"
                placeholder="https://sportadmin.se/cal/..."
                className="w-full bg-rink rounded border border-rink-border px-3 py-2 text-white text-sm placeholder:text-ice-muted/40"
              />
              <button className="mt-2 px-4 py-1.5 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
                Spara
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
