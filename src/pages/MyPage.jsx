import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUser } from '../lib/auth'

export default function MyPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [team, setTeam] = useState(null)
  const [goalie, setGoalie] = useState(null)
  const [sessions, setSessions] = useState([])
  const [teamRequests, setTeamRequests] = useState([])
  const [goalieRequests, setGoalieRequests] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { navigate('/team'); return }
      setUser(u)

      const [teamRes, goalieRes] = await Promise.all([
        supabase.from('teams').select('*').eq('user_id', u.id),
        supabase.from('goalies').select('*').eq('user_id', u.id),
      ])

      const t = teamRes.data?.[0] || null
      const g = goalieRes.data?.[0] || null
      setTeam(t)
      setGoalie(g)

      if (t) {
        const [sessRes, reqRes, favRes] = await Promise.all([
          supabase.from('sessions').select('*').eq('team_id', t.id).order('date'),
          supabase.from('requests').select('*, responses(*), sessions(*)').eq('team_id', t.id).order('created_at', { ascending: false }),
          supabase.from('favorites').select('id, goalie_id').eq('team_id', t.id),
        ])
        setSessions(sessRes.data || [])
        setTeamRequests(reqRes.data || [])
        // Load goalie names for favorites
        if (favRes.data?.length > 0) {
          const goalieIds = favRes.data.map(f => f.goalie_id)
          const { data: goalieData } = await supabase.from('goalie_directory').select('*').in('id', goalieIds)
          setFavorites(favRes.data.map(f => ({
            ...f,
            goalies: goalieData?.find(g => g.id === f.goalie_id) || null
          })))
        }
      }

      if (g) {
        const { data: allReqs } = await supabase
          .from('requests')
          .select('*, teams(*), sessions(*), responses(*)')
          .order('created_at', { ascending: false })
        setGoalieRequests(allReqs || [])
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-ice-muted">Laddar...</p>

  const upcomingSessions = sessions.filter(s => s.date >= today)
  const pastSessions = sessions.filter(s => s.date < today)
  const openTeamRequests = teamRequests.filter(r => r.status === 'open')

  // Goalie: requests I responded "yes" to
  const acceptedRequests = goalieRequests.filter(r =>
    r.responses?.some(resp => resp.goalie_id === goalie?.id && resp.answer === 'yes')
  )
  // Goalie: requests I responded "no" to or haven't responded
  const pendingGoalieRequests = goalieRequests.filter(r =>
    r.status === 'open' && !r.responses?.some(resp => resp.goalie_id === goalie?.id)
  )
  // Goalie: upcoming accepted
  const upcomingGoalieGigs = acceptedRequests.filter(r => r.sessions?.date >= today)
  const pastGoalieGigs = acceptedRequests.filter(r => r.sessions?.date < today)

  function SessionCard({ s }) {
    return (
      <div className={`rounded-lg p-3 text-sm border ${s.needs_goalie ? 'bg-goal-red/10 border-goal-red/30' : 'bg-rink-light border-rink-border'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">{s.date} {s.time?.slice(0, 5)}</p>
            <p className="text-ice-muted">{s.type} @ {s.rink}</p>
          </div>
          {s.needs_goalie && <span className="text-goal-red text-xs font-semibold uppercase tracking-wider">Saknar målvakt</span>}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-2">Min sida</h1>
      <p className="text-ice-muted mb-8">Översikt av dina aktiviteter på Hobbyhockey.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: Lagtider */}
        <div>
          {team ? (
            <>
              <Link to="/team" className="bg-rink-light border border-rink-border rounded-lg p-5 no-underline hover:border-jersey-blue/40 transition-colors group flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-jersey-blue/20 rounded flex items-center justify-center text-jersey-blue text-lg shrink-0">
                  🏒
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold uppercase tracking-tight text-white group-hover:text-jersey-blue transition-colors">{team.name}</h2>
                  <p className="text-ice-muted text-sm">{team.type} &middot; {team.location}</p>
                </div>
                <span className="text-jersey-blue text-xs uppercase tracking-wider font-semibold">→</span>
              </Link>

              <h3 className="font-display text-lg font-bold uppercase tracking-wider mb-3">Lagtider</h3>

              <h4 className="text-xs text-ice-muted/80 uppercase tracking-wider mb-2 font-semibold">Kommande tider ({upcomingSessions.length})</h4>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-2 mb-6">
                  {upcomingSessions.map(s => <SessionCard key={s.id} s={s} />)}
                </div>
              ) : (
                <p className="text-ice-muted/60 text-sm mb-6">Inga kommande tider.</p>
              )}

              <h4 className="text-xs text-ice-muted/80 uppercase tracking-wider mb-2 font-semibold">Förfrågningar ({openTeamRequests.length} öppna)</h4>
              {openTeamRequests.length > 0 ? (
                <div className="space-y-2 mb-6">
                  {openTeamRequests.map(r => (
                    <div key={r.id} className="bg-rink-light border border-rink-border rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{r.sessions?.date} {r.sessions?.time?.slice(0, 5)} — {r.sessions?.rink}</p>
                          <p className="text-ice-muted">{r.sessions?.type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-ice-muted/70 text-xs">Svar: {r.responses?.length || 0}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${r.status === 'open' ? 'bg-goal-red/15 text-goal-red' : 'bg-goal-green/15 text-goal-green'}`}>
                            {r.status === 'open' ? 'Söker' : 'Tillsatt'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-ice-muted/60 text-sm mb-6">Inga öppna förfrågningar.</p>
              )}

              <h4 className="text-xs text-ice-muted/80 uppercase tracking-wider mb-2 font-semibold">Passerade tider ({pastSessions.length})</h4>
              {pastSessions.length > 0 ? (
                <div className="space-y-2 mb-6">
                  {pastSessions.slice(0, 3).map(s => (
                    <div key={s.id} className="bg-rink-light/50 border border-rink-border rounded-lg p-3 text-sm opacity-60">
                      <p className="font-semibold text-white">{s.date} {s.time?.slice(0, 5)}</p>
                      <p className="text-ice-muted">{s.type} @ {s.rink}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-ice-muted/60 text-sm mb-6">Ingen historik ännu.</p>
              )}

              {favorites.length > 0 && (
                <>
                  <h4 className="text-xs text-ice-muted/80 uppercase tracking-wider mb-2 font-semibold">Favoritmålvakter ({favorites.length})</h4>
                  <div className="space-y-1 mb-6">
                    {favorites.map(f => (
                      <div key={f.id} className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-goal-green" />
                        <span className="text-white">{f.goalies?.name}</span>
                        <span className="text-ice-muted">{f.goalies?.location}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <Link to="/team" className="bg-rink-light border border-rink-border border-dashed rounded-lg p-6 no-underline hover:border-jersey-blue/40 transition-colors text-center block">
              <div className="text-3xl mb-3">🏒</div>
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-white mb-2">Registrera ett lag</h2>
              <p className="text-ice-muted text-sm">Registrera ditt lag för att söka målvakter.</p>
            </Link>
          )}
        </div>

        {/* RIGHT COLUMN: Målvaktstider */}
        <div>
          {goalie ? (
            <>
              <Link to="/goalie" className="bg-rink-light border border-rink-border rounded-lg p-5 no-underline hover:border-jersey-blue/40 transition-colors group flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-goal-green/20 rounded flex items-center justify-center text-goal-green text-lg shrink-0">
                  🥅
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold uppercase tracking-tight text-white group-hover:text-jersey-blue transition-colors">{goalie.name}</h2>
                  <p className="text-ice-muted text-sm">{goalie.location} &middot; {goalie.available ? 'Tillgänglig' : 'Inte tillgänglig'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${goalie.available ? 'bg-goal-green/20 text-goal-green' : 'bg-goal-red/20 text-goal-red'}`}>
                  {goalie.available ? 'Tillgänglig' : 'Ej tillgänglig'}
                </span>
              </Link>

              <h3 className="font-display text-lg font-bold uppercase tracking-wider mb-3">Målvaktstider</h3>

              <h4 className="text-xs text-ice-muted/80 uppercase tracking-wider mb-2 font-semibold">Bokade kommande ({upcomingGoalieGigs.length})</h4>
              {upcomingGoalieGigs.length > 0 ? (
                <div className="space-y-2 mb-6">
                  {upcomingGoalieGigs.map(r => (
                    <div key={r.id} className="bg-goal-green/10 border border-goal-green/30 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{r.sessions?.date} {r.sessions?.time?.slice(0, 5)}</p>
                          <p className="text-ice-muted">{r.sessions?.type} @ {r.sessions?.rink}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm font-semibold">{r.teams?.name}</p>
                          <span className="text-goal-green text-xs font-semibold uppercase">Accepterad</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-ice-muted/60 text-sm mb-6">Inga bokade tider.</p>
              )}

              <h4 className="text-xs text-ice-muted/80 uppercase tracking-wider mb-2 font-semibold">Öppna förfrågningar ({pendingGoalieRequests.length})</h4>
              {pendingGoalieRequests.length > 0 ? (
                <div className="space-y-2 mb-6">
                  {pendingGoalieRequests.map(r => (
                    <div key={r.id} className="bg-stick-gold/10 border border-stick-gold/30 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{r.sessions?.date} {r.sessions?.time?.slice(0, 5)}</p>
                          <p className="text-ice-muted">{r.sessions?.type} @ {r.sessions?.rink}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm font-semibold">{r.teams?.name}</p>
                          <span className="text-stick-gold text-xs font-semibold uppercase">Väntar på svar</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-ice-muted/60 text-sm mb-6">Inga öppna förfrågningar.</p>
              )}

              <h4 className="text-xs text-ice-muted/80 uppercase tracking-wider mb-2 font-semibold">Passerade tider ({pastGoalieGigs.length})</h4>
              {pastGoalieGigs.length > 0 ? (
                <div className="space-y-2 mb-6">
                  {pastGoalieGigs.slice(0, 3).map(r => (
                    <div key={r.id} className="bg-rink-light/50 border border-rink-border rounded-lg p-3 text-sm opacity-60">
                      <p className="font-semibold text-white">{r.sessions?.date} {r.sessions?.time?.slice(0, 5)}</p>
                      <p className="text-ice-muted">{r.sessions?.type} @ {r.sessions?.rink} — {r.teams?.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-ice-muted/60 text-sm mb-6">Ingen historik ännu.</p>
              )}

              <h4 className="text-xs text-ice-muted/80 uppercase tracking-wider mb-2 font-semibold">Favoritlag (0)</h4>
              <p className="text-ice-muted/60 text-sm mb-6">Inga favoritlag tillagda ännu.</p>
            </>
          ) : (
            <Link to="/goalie" className="bg-rink-light border border-rink-border border-dashed rounded-lg p-6 no-underline hover:border-jersey-blue/40 transition-colors text-center block">
              <div className="text-3xl mb-3">🥅</div>
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-white mb-2">Bli målvakt</h2>
              <p className="text-ice-muted text-sm">Registrera dig som målvakt och ta emot förfrågningar.</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
