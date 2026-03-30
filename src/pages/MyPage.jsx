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
  const [loading, setLoading] = useState(true)

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
        const [sessRes, reqRes] = await Promise.all([
          supabase.from('sessions').select('*').eq('team_id', t.id).order('date'),
          supabase.from('requests').select('*, responses(*), sessions(*)').eq('team_id', t.id).order('created_at', { ascending: false }),
        ])
        setSessions(sessRes.data || [])
        setTeamRequests(reqRes.data || [])
      }

      if (g) {
        const { data: allReqs } = await supabase
          .from('requests')
          .select('*, teams(*), sessions(*), responses(*)')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
        setGoalieRequests(allReqs || [])
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-ice-muted">Laddar...</p>

  const upcomingSessions = sessions.filter(s => s.date >= new Date().toISOString().split('T')[0])
  const needsGoalie = upcomingSessions.filter(s => s.needs_goalie)
  const openTeamRequests = teamRequests.filter(r => r.status === 'open')
  const answeredRequests = goalieRequests.filter(r => r.responses?.some(resp => resp.goalie_id === goalie?.id))
  const unansweredRequests = goalieRequests.filter(r => !r.responses?.some(resp => resp.goalie_id === goalie?.id))

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-2">Min sida</h1>
      <p className="text-ice-muted mb-8">Översikt av dina roller på Hobbyhockey.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team card */}
        {team ? (
          <Link to="/team" className="bg-rink-light border border-rink-border rounded-lg p-6 no-underline hover:border-jersey-blue/40 transition-colors group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-jersey-blue/20 rounded flex items-center justify-center text-jersey-blue text-lg">
                🏒
              </div>
              <div>
                <h2 className="font-display text-xl font-bold uppercase tracking-tight text-white group-hover:text-jersey-blue transition-colors">{team.name}</h2>
                <p className="text-ice-muted text-sm">{team.type} &middot; {team.location}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-ice-muted">Kommande tider</span>
                <span className="text-white font-semibold">{upcomingSessions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ice-muted">Saknar målvakt</span>
                <span className={`font-semibold ${needsGoalie.length > 0 ? 'text-goal-red' : 'text-goal-green'}`}>{needsGoalie.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ice-muted">Öppna förfrågningar</span>
                <span className="text-white font-semibold">{openTeamRequests.length}</span>
              </div>
            </div>
            <p className="text-jersey-blue text-xs uppercase tracking-wider mt-4 font-semibold group-hover:text-jersey-blue-light">Gå till lagtider →</p>
          </Link>
        ) : (
          <Link to="/team" className="bg-rink-light border border-rink-border border-dashed rounded-lg p-6 no-underline hover:border-jersey-blue/40 transition-colors text-center">
            <div className="text-3xl mb-3">🏒</div>
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-white mb-2">Registrera ett lag</h2>
            <p className="text-ice-muted text-sm">Registrera ditt lag för att söka målvakter.</p>
          </Link>
        )}

        {/* Goalie card */}
        {goalie ? (
          <Link to="/goalie" className="bg-rink-light border border-rink-border rounded-lg p-6 no-underline hover:border-jersey-blue/40 transition-colors group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-goal-green/20 rounded flex items-center justify-center text-goal-green text-lg">
                🥅
              </div>
              <div>
                <h2 className="font-display text-xl font-bold uppercase tracking-tight text-white group-hover:text-jersey-blue transition-colors">{goalie.name}</h2>
                <p className="text-ice-muted text-sm">{goalie.location} &middot; {goalie.available ? 'Tillgänglig' : 'Inte tillgänglig'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-ice-muted">Status</span>
                <span className={`font-semibold ${goalie.available ? 'text-goal-green' : 'text-goal-red'}`}>
                  {goalie.available ? 'Tillgänglig' : 'Inte tillgänglig'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ice-muted">Nya förfrågningar</span>
                <span className={`font-semibold ${unansweredRequests.length > 0 ? 'text-stick-gold' : 'text-white'}`}>{unansweredRequests.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ice-muted">Besvarade</span>
                <span className="text-white font-semibold">{answeredRequests.length}</span>
              </div>
            </div>
            <p className="text-jersey-blue text-xs uppercase tracking-wider mt-4 font-semibold group-hover:text-jersey-blue-light">Gå till målvaktstider →</p>
          </Link>
        ) : (
          <Link to="/goalie" className="bg-rink-light border border-rink-border border-dashed rounded-lg p-6 no-underline hover:border-jersey-blue/40 transition-colors text-center">
            <div className="text-3xl mb-3">🥅</div>
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-white mb-2">Bli målvakt</h2>
            <p className="text-ice-muted text-sm">Registrera dig som målvakt och ta emot förfrågningar.</p>
          </Link>
        )}
      </div>

      {/* Upcoming sessions overview */}
      {upcomingSessions.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Kommande tider</h2>
          <div className="space-y-2">
            {upcomingSessions.slice(0, 5).map(s => (
              <div key={s.id} className={`rounded-lg p-3 text-sm border ${s.needs_goalie ? 'bg-goal-red/10 border-goal-red/30' : 'bg-rink-light border-rink-border'}`}>
                <p className="font-semibold text-white">{s.date} {s.time?.slice(0, 5)}</p>
                <p className="text-ice-muted">{s.type} @ {s.rink}</p>
                {s.needs_goalie && <p className="text-goal-red text-xs mt-1 font-semibold uppercase tracking-wider">Saknar målvakt</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
