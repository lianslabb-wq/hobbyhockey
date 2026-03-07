import { useState } from 'react'
import { teams, goalies, requests as initialRequests } from '../lib/mockData'
import RequestCard from '../components/RequestCard'

export default function GoalieDashboard() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [requests, setRequests] = useState(initialRequests)
  const currentGoalie = goalies[0]

  function handleRespond(requestId, answer) {
    setRequests(
      requests.map((r) => {
        if (r.id !== requestId) return r
        const alreadyResponded = r.responses.some((resp) => resp.goalieId === currentGoalie.id)
        if (alreadyResponded) return r

        const updatedResponses = [...r.responses, { goalieId: currentGoalie.id, goalieName: currentGoalie.name, answer }]
        const isFirstYes = answer === 'yes' && !r.responses.some((resp) => resp.answer === 'yes')

        return {
          ...r,
          responses: updatedResponses,
          status: isFirstYes ? 'filled' : r.status,
        }
      })
    )
  }

  if (!loggedIn) {
    return (
      <div className="max-w-md mx-auto py-12">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-2">Logga in</h1>
        <p className="text-ice-muted mb-8">
          Se tillgängliga tider och hoppa in när det passar.
        </p>
        <div className="bg-rink-light border border-rink-border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-xs text-ice-muted/60 mb-1.5 uppercase tracking-wider">E-post</label>
            <input
              type="email"
              defaultValue="rikard@hobbyhockey.se"
              className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-ice-muted/60 mb-1.5 uppercase tracking-wider">Lösenord</label>
            <input
              type="password"
              defaultValue="demo1234"
              className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm"
            />
          </div>
          <button
            onClick={() => setLoggedIn(true)}
            className="w-full py-2.5 bg-goal-red text-white rounded font-semibold text-sm uppercase tracking-wider hover:bg-goal-red-light transition-colors cursor-pointer"
          >
            Logga in
          </button>
          <p className="text-center text-sm text-ice-muted/60">
            <a href="#" className="text-jersey-blue hover:text-jersey-blue-light transition-colors">Glömt lösenord?</a>
            {' '}&middot;{' '}
            <a href="#" className="text-jersey-blue hover:text-jersey-blue-light transition-colors">Registrera dig</a>
          </p>
        </div>
      </div>
    )
  }

  const openRequests = requests.filter((r) => r.status === 'open')
  const myResponses = requests.filter((r) => r.responses.some((resp) => resp.goalieId === currentGoalie.id))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
            Hej, {currentGoalie.name}!
          </h1>
          <p className="text-ice-muted">{currentGoalie.location} &middot; {currentGoalie.email}</p>
        </div>
        <button
          onClick={() => setLoggedIn(false)}
          className="px-4 py-2 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer"
        >
          Logga ut
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Öppna förfrågningar</h2>
          {openRequests.length === 0 ? (
            <p className="text-ice-muted/60">Inga lag söker målvakt just nu.</p>
          ) : (
            <div className="space-y-4">
              {openRequests.map((req) => {
                const team = teams.find((t) => t.id === req.teamId)
                const session = team?.sessions.find((s) => s.id === req.sessionId)
                return (
                  <RequestCard
                    key={req.id}
                    request={req}
                    session={session}
                    isGoalieView={true}
                    onRespond={handleRespond}
                  />
                )
              })}
            </div>
          )}

          {myResponses.length > 0 && (
            <>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4 mt-10">Mina svar</h2>
              <div className="space-y-4">
                {myResponses.map((req) => {
                  const team = teams.find((t) => t.id === req.teamId)
                  const session = team?.sessions.find((s) => s.id === req.sessionId)
                  return <RequestCard key={req.id} request={req} session={session} isGoalieView={false} />
                })}
              </div>
            </>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Min profil</h2>
          <div className="bg-rink-light border border-rink-border rounded-lg p-5 space-y-3">
            <div>
              <p className="text-xs text-ice-muted/60 uppercase tracking-wider">Namn</p>
              <p className="font-semibold text-white">{currentGoalie.name}</p>
            </div>
            <div>
              <p className="text-xs text-ice-muted/60 uppercase tracking-wider">E-post</p>
              <p className="font-semibold text-white">{currentGoalie.email}</p>
            </div>
            <div>
              <p className="text-xs text-ice-muted/60 uppercase tracking-wider">Telefon</p>
              <p className="font-semibold text-white">{currentGoalie.phone}</p>
            </div>
            <div>
              <p className="text-xs text-ice-muted/60 uppercase tracking-wider">Plats</p>
              <p className="font-semibold text-white">{currentGoalie.location}, {currentGoalie.region}</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${currentGoalie.available ? 'bg-goal-green' : 'bg-goal-red'}`} />
              <span className="text-sm font-medium">{currentGoalie.available ? 'Tillgänglig' : 'Inte tillgänglig'}</span>
            </div>
          </div>

          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4 mt-8">Notiser</h2>
          <div className="bg-rink-light border border-rink-border rounded-lg p-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 bg-goal-red rounded-full mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Solna Hockey söker målvakt</p>
                <p className="text-xs text-ice-muted/60">10 mar, 20:00 — Solnahallen</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 bg-jersey-blue rounded-full mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Hässelby Hockey — öppen förfrågan</p>
                <p className="text-xs text-ice-muted/60">11 mar, 19:00 — Hässelbyhallen</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
