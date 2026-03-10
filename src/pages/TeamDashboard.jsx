import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { signUp, signIn, signOut, getUser } from '../lib/auth'
import RequestCard from '../components/RequestCard'

export default function TeamDashboard() {
  const [user, setUser] = useState(null)
  const [team, setTeam] = useState(null)
  const [teams, setTeams] = useState([])
  const [sessions, setSessions] = useState([])
  const [requests, setRequests] = useState([])
  const [favorites, setFavorites] = useState([])
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [newRequest, setNewRequest] = useState({ sessionId: '', type: 'open' })
  const [allGoalies, setAllGoalies] = useState([])
  const [goalieSearch, setGoalieSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login')

  // Auth form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [consent, setConsent] = useState(false)

  // Team registration form state
  const [teamForm, setTeamForm] = useState({
    name: '', type: 'Veteran', location: '', region: '',
    contactName: '', contactEmail: '', calendarUrl: ''
  })

  useEffect(() => {
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) loadTeam()
  }, [user])

  useEffect(() => {
    if (team) {
      loadSessions()
      loadRequests()
      loadFavorites()
      loadAllGoalies()
    }
  }, [team])

  async function checkUser() {
    const u = await getUser()
    setUser(u)
    setLoading(false)
  }

  async function loadTeam() {
    const { data } = await supabase.from('teams').select('*').eq('user_id', user.id)
    if (data?.length > 0) {
      setTeam(data[0])
    } else {
      // Don't pre-fill contact email — let each team fill in their own
      setTeamForm(prev => prev)
    }
  }

  async function loadSessions() {
    const { data } = await supabase.from('sessions').select('*').eq('team_id', team.id).order('date')
    setSessions(data || [])
  }

  async function loadRequests() {
    const { data } = await supabase.from('requests').select('*, responses(*)').eq('team_id', team.id).order('created_at', { ascending: false })
    // Get goalie names from safe directory
    const goalieIds = [...new Set((data || []).flatMap(r =>
      (r.responses || []).map(resp => resp.goalie_id)
    ).filter(Boolean))]
    let goalieNames = {}
    if (goalieIds.length > 0) {
      const { data: gd } = await supabase.from('goalie_directory').select('id, name').in('id', goalieIds)
      goalieNames = Object.fromEntries((gd || []).map(g => [g.id, g.name]))
    }
    // Attach safe goalie names to responses
    setRequests((data || []).map(req => ({
      ...req,
      responses: (req.responses || []).map(r => ({
        ...r,
        goalies: { name: goalieNames[r.goalie_id] || 'Okänd' }
      }))
    })))
  }

  async function loadFavorites() {
    const { data: favData } = await supabase.from('favorites').select('id, goalie_id').eq('team_id', team.id)
    if (!favData?.length) { setFavorites([]); return }
    const goalieIds = favData.map(f => f.goalie_id)
    const { data: goalieData } = await supabase.from('goalie_directory').select('*').in('id', goalieIds)
    setFavorites(favData.map(f => ({
      ...f,
      goalies: goalieData?.find(g => g.id === f.goalie_id) || null
    })))
  }

  async function loadAllGoalies() {
    const { data } = await supabase.from('goalie_directory').select('*')
    setAllGoalies(data || [])
  }

  async function addFavorite(goalieId) {
    const { error: err } = await supabase.from('favorites').insert({ team_id: team.id, goalie_id: goalieId })
    if (!err) {
      setGoalieSearch('')
      loadFavorites()
    }
  }

  async function removeFavorite(favoriteId) {
    await supabase.from('favorites').delete().eq('id', favoriteId)
    loadFavorites()
  }

  async function handleAuth(e) {
    e.preventDefault()
    setError('')
    try {
      if (mode === 'register') {
        await signUp(email, password)
        setMode('check-email')
        return
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRegisterTeam(e) {
    e.preventDefault()
    setError('')
    try {
      const { data, error: err } = await supabase.from('teams').insert({
        name: teamForm.name,
        type: teamForm.type,
        location: teamForm.location,
        region: teamForm.region,
        contact_name: teamForm.contactName,
        contact_email: teamForm.contactEmail,
        calendar_url: teamForm.calendarUrl || null,
        user_id: user.id,
        privacy_consent: true,
        privacy_consent_at: new Date().toISOString(),
      }).select().single()
      if (err) throw err
      setTeam(data)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCreateSession(e) {
    e.preventDefault()
    const form = e.target
    const { error: err } = await supabase.from('sessions').insert({
      team_id: team.id,
      date: form.date.value,
      time: form.time.value,
      type: form.type.value,
      rink: form.rink.value,
      rink_address: form.rink_address.value || null,
      needs_goalie: true,
    })
    if (!err) {
      form.reset()
      loadSessions()
    }
  }

  async function handleCreateRequest() {
    if (!newRequest.sessionId) return
    const { error: err } = await supabase.from('requests').insert({
      team_id: team.id,
      session_id: newRequest.sessionId,
      type: newRequest.type,
      status: 'open',
    })
    if (!err) {
      setShowNewRequest(false)
      setNewRequest({ sessionId: '', type: 'open' })
      loadRequests()
    }
  }

  if (loading) return <p className="text-ice-muted">Laddar...</p>

  // Check email confirmation screen
  if (mode === 'check-email') {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="w-16 h-16 bg-jersey-blue/20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          ✉
        </div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-4">Kolla din e-post</h1>
        <p className="text-ice-muted mb-2 leading-relaxed">
          Vi har skickat ett bekräftelsemejl till <span className="text-white font-semibold">{email}</span>.
        </p>
        <p className="text-ice-muted mb-8 leading-relaxed">
          Klicka på länken i mejlet för att aktivera ditt konto. Kolla även skräpposten om du inte hittar det.
        </p>
        <div className="bg-rink-light border border-rink-border rounded-lg p-4 mb-6">
          <p className="text-sm text-ice-muted/80">När du har bekräftat din e-post, kom tillbaka hit och logga in.</p>
        </div>
        <button onClick={() => setMode('login')}
          className="px-6 py-2.5 bg-goal-red text-white rounded font-semibold text-sm uppercase tracking-wider hover:bg-goal-red-light transition-colors cursor-pointer">
          Jag har bekräftat — logga in
        </button>
      </div>
    )
  }

  // Not logged in — show login/register
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-2">
          {mode === 'login' ? 'Logga in som lag' : 'Registrera nytt lag'}
        </h1>
        <p className="text-ice-muted mb-8">
          {mode === 'login' ? 'Logga in för att hantera ditt lag och söka målvakter.' : 'Skapa ett konto för att registrera ditt lag.'}
        </p>
        {error && <p className="text-goal-red mb-4 text-sm">{error}</p>}
        <form onSubmit={handleAuth} className="bg-rink-light border border-rink-border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">E-post</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">Lösenord</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
          </div>
          <button type="submit"
            className="w-full py-2.5 bg-goal-red text-white rounded font-semibold text-sm uppercase tracking-wider hover:bg-goal-red-light transition-colors cursor-pointer">
            {mode === 'login' ? 'Logga in' : 'Skapa konto'}
          </button>
          <p className="text-center text-sm text-ice-muted/80">
            {mode === 'login' ? (
              <>Inget konto? <button type="button" onClick={() => setMode('register')} className="text-jersey-blue hover:text-jersey-blue-light bg-transparent border-none cursor-pointer">Registrera dig</button></>
            ) : (
              <>Har redan konto? <button type="button" onClick={() => setMode('login')} className="text-jersey-blue hover:text-jersey-blue-light bg-transparent border-none cursor-pointer">Logga in</button></>
            )}
          </p>
        </form>
      </div>
    )
  }

  // Logged in but no team — register team
  if (!team) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-2">Registrera ditt lag</h1>
        <p className="text-ice-muted mb-8">Fyll i uppgifterna nedan för att komma igång.</p>
        {error && <p className="text-goal-red mb-4 text-sm">{error}</p>}
        <form onSubmit={handleRegisterTeam} className="bg-rink-light border border-rink-border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">Lagnamn</label>
            <input type="text" value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} required placeholder="T.ex. Solna Hockey"
              className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">Typ</label>
              <select value={teamForm.type} onChange={e => setTeamForm({...teamForm, type: e.target.value})}
                className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm">
                <option>Veteran</option>
                <option>Korpen/Motion</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">Ort</label>
              <input type="text" value={teamForm.location} onChange={e => setTeamForm({...teamForm, location: e.target.value})} required placeholder="T.ex. Solna"
                className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">Kontaktperson</label>
              <input type="text" value={teamForm.contactName} onChange={e => setTeamForm({...teamForm, contactName: e.target.value})} required placeholder="T.ex. Robban"
                className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">Kontakt e-post</label>
              <input type="email" value={teamForm.contactEmail} onChange={e => setTeamForm({...teamForm, contactEmail: e.target.value})} required placeholder="T.ex. namn@exempel.se"
                className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">Följkalender-URL (valfritt)</label>
            <input type="url" value={teamForm.calendarUrl} onChange={e => setTeamForm({...teamForm, calendarUrl: e.target.value})} placeholder="https://sportadmin.se/cal/..."
              className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-rink-border accent-goal-red cursor-pointer" />
            <span className="text-sm text-ice-muted">
              Jag har läst och godkänner{' '}
              <a href="/integritet" target="_blank" className="text-jersey-blue hover:text-jersey-blue-light">integritetspolicyn</a>.
            </span>
          </label>
          <button type="submit" disabled={!consent}
            className={`w-full py-2.5 rounded font-semibold text-sm uppercase tracking-wider transition-colors cursor-pointer ${
              consent ? 'bg-goal-red text-white hover:bg-goal-red-light' : 'bg-rink-lighter text-ice-muted/70 cursor-not-allowed'
            }`}>
            Registrera lag
          </button>
        </form>
      </div>
    )
  }

  // Team dashboard
  const sessionsNeedingGoalie = sessions.filter(s => s.needs_goalie)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">{team.name}</h1>
          <p className="text-ice-muted">{team.type} &middot; {team.location} &middot; Ansvarig: {team.contact_name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowNewRequest(!showNewRequest)}
            className="px-5 py-2.5 bg-goal-red text-white rounded font-semibold text-sm uppercase tracking-wider hover:bg-goal-red-light transition-colors cursor-pointer">
            + Sök målvakt
          </button>
          <button onClick={async () => { await signOut(); setUser(null); setTeam(null) }}
            className="px-4 py-2.5 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
            Logga ut
          </button>
        </div>
      </div>

      {showNewRequest && (
        <div className="bg-rink-light border border-goal-red/30 rounded-lg p-6 mb-6">
          <h3 className="font-display text-lg font-bold uppercase tracking-wide mb-4">Ny förfrågan</h3>
          {sessionsNeedingGoalie.length === 0 ? (
            <p className="text-ice-muted">Lägg till en tid först (se "Lägg till tid" nedan).</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">Tillfälle</label>
                  <select value={newRequest.sessionId} onChange={e => setNewRequest({...newRequest, sessionId: e.target.value})}
                    className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm">
                    <option value="">Välj tillfälle...</option>
                    {sessionsNeedingGoalie.map(s => (
                      <option key={s.id} value={s.id}>{s.date} {s.time} — {s.type} @ {s.rink}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">Skicka till</label>
                  <select value={newRequest.type} onChange={e => setNewRequest({...newRequest, type: e.target.value})}
                    className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm">
                    <option value="favorites">Mina favoriter ({favorites.length} st)</option>
                    <option value="open">Alla målvakter (öppen förfrågan)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateRequest}
                  className="px-5 py-2.5 bg-goal-red text-white rounded font-semibold text-sm uppercase tracking-wider hover:bg-goal-red-light transition-colors cursor-pointer">
                  Skicka förfrågan
                </button>
                <button onClick={() => setShowNewRequest(false)}
                  className="px-5 py-2.5 bg-rink-lighter text-ice-muted rounded font-semibold text-sm uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
                  Avbryt
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Förfrågningar</h2>
          {requests.length === 0 ? (
            <p className="text-ice-muted/80">Inga aktiva förfrågningar.</p>
          ) : (
            <div className="space-y-4">
              {requests.map(req => {
                const session = sessions.find(s => s.id === req.session_id)
                if (!session) return null
                const mapped = {
                  ...req,
                  teamId: req.team_id,
                  sessionId: req.session_id,
                  responses: (req.responses || []).map(r => ({
                    goalieId: r.goalie_id,
                    goalieName: r.goalies?.name || 'Okänd',
                    answer: r.answer,
                  })),
                }
                return <RequestCard key={req.id} request={mapped} session={session} isGoalieView={false} />
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Favoritmålvakter</h2>
          {favorites.length === 0 ? (
            <p className="text-ice-muted/80 text-sm">Inga favoriter tillagda än.</p>
          ) : (
            <div className="space-y-2">
              {favorites.map(f => (
                <div key={f.id} className="bg-rink-light border border-rink-border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{f.goalies?.name}</p>
                    <p className="text-sm text-ice-muted">{f.goalies?.location}</p>
                  </div>
                  <button onClick={() => removeFavorite(f.id)}
                    className="text-ice-muted/70 hover:text-goal-red text-xs uppercase tracking-wider bg-transparent border-none cursor-pointer transition-colors">
                    Ta bort
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search and add goalie as favorite */}
          <div className="mt-3">
            <input
              type="text"
              value={goalieSearch}
              onChange={e => setGoalieSearch(e.target.value)}
              placeholder="Sök målvakt..."
              className="w-full bg-rink rounded border border-rink-border px-3 py-2 text-white text-sm"
            />
            {goalieSearch.length >= 2 && (() => {
              const favoriteGoalieIds = favorites.map(f => f.goalie_id)
              const filtered = allGoalies.filter(g =>
                !favoriteGoalieIds.includes(g.id) &&
                g.name.toLowerCase().includes(goalieSearch.toLowerCase())
              )
              if (filtered.length === 0) return <p className="text-ice-muted/70 text-xs mt-2">Inga träffar.</p>
              return (
                <div className="mt-2 space-y-1">
                  {filtered.map(g => (
                    <button key={g.id} onClick={() => addFavorite(g.id)}
                      className="w-full text-left bg-rink-light border border-rink-border rounded px-3 py-2 text-sm hover:border-jersey-blue/60 transition-colors cursor-pointer flex items-center justify-between">
                      <span>
                        <span className="text-white font-semibold">{g.name}</span>
                        <span className="text-ice-muted ml-2">{g.location}</span>
                      </span>
                      <span className="text-jersey-blue text-xs uppercase tracking-wider">+ Lägg till</span>
                    </button>
                  ))}
                </div>
              )
            })()}
          </div>

          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4 mt-8">Kommande tider</h2>
          {sessions.length === 0 ? (
            <p className="text-ice-muted/80 text-sm">Inga tider tillagda.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className={`rounded-lg p-3 text-sm border ${s.needs_goalie ? 'bg-goal-red/10 border-goal-red/30' : 'bg-rink-light border-rink-border'}`}>
                  <p className="font-semibold text-white">{s.date} {s.time}</p>
                  <p className="text-ice-muted">{s.type} @ {s.rink}</p>
                  {s.rink_address && <p className="text-ice-muted/80 text-xs">{s.rink_address}</p>}
                  {s.needs_goalie && <p className="text-goal-red text-xs mt-1 font-semibold uppercase tracking-wider">Saknar målvakt</p>}
                </div>
              ))}
            </div>
          )}

          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4 mt-8">Lägg till tid</h2>
          <form onSubmit={handleCreateSession} className="bg-rink-light border border-rink-border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input name="date" type="date" required className="bg-rink rounded border border-rink-border px-3 py-2 text-white text-sm" />
              <input name="time" type="time" required className="bg-rink rounded border border-rink-border px-3 py-2 text-white text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select name="type" className="bg-rink rounded border border-rink-border px-3 py-2 text-white text-sm">
                <option>Träning</option>
                <option>Match</option>
              </select>
              <input name="rink" type="text" required placeholder="Hallnamn" className="bg-rink rounded border border-rink-border px-3 py-2 text-white text-sm" />
            </div>
            <input name="rink_address" type="text" placeholder="Adress till ishallen (valfritt)" className="w-full bg-rink rounded border border-rink-border px-3 py-2 text-white text-sm" />
            <button type="submit"
              className="w-full py-2 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
              Lägg till
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
