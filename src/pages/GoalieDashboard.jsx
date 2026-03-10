import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { signUp, signIn, signOut, getUser } from '../lib/auth'
import RequestCard from '../components/RequestCard'

export default function GoalieDashboard() {
  const [user, setUser] = useState(null)
  const [goalie, setGoalie] = useState(null)
  const [requests, setRequests] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login')

  // Auth form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [consent, setConsent] = useState(false)

  // Goalie registration form
  const [goalieForm, setGoalieForm] = useState({
    name: '', email: '', phone: '', location: '', region: '', address: ''
  })

  useEffect(() => {
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) loadGoalie()
  }, [user])

  useEffect(() => {
    if (goalie) loadRequests()
  }, [goalie])

  async function checkUser() {
    const u = await getUser()
    setUser(u)
    setLoading(false)
  }

  async function loadGoalie() {
    const { data } = await supabase.from('goalies').select('*').eq('user_id', user.id)
    if (data?.length > 0) {
      setGoalie(data[0])
    } else {
      // Don't pre-fill — let goalie enter their own details
    }
  }

  async function loadRequests() {
    // Load all open requests with team and session info
    const { data: allRequests } = await supabase
      .from('requests')
      .select('*, teams(*), sessions(*), responses(*)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    setRequests(allRequests || [])

    const { data: allTeams } = await supabase.from('teams').select('*')
    setTeams(allTeams || [])
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

  async function handleRegisterGoalie(e) {
    e.preventDefault()
    setError('')
    try {
      const { data, error: err } = await supabase.from('goalies').insert({
        name: goalieForm.name,
        email: goalieForm.email,
        phone: goalieForm.phone || null,
        location: goalieForm.location,
        region: goalieForm.region,
        address: goalieForm.address || null,
        available: true,
        user_id: user.id,
        privacy_consent: true,
        privacy_consent_at: new Date().toISOString(),
      }).select().single()
      if (err) throw err
      setGoalie(data)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRespond(requestId, answer) {
    const { error: err } = await supabase.from('responses').insert({
      request_id: requestId,
      goalie_id: goalie.id,
      answer,
    })
    if (!err) {
      // If first "yes", mark request as filled
      if (answer === 'yes') {
        const req = requests.find(r => r.id === requestId)
        const hasOtherYes = req?.responses?.some(r => r.answer === 'yes')
        if (!hasOtherYes) {
          await supabase.from('requests').update({ status: 'filled' }).eq('id', requestId)
        }
      }
      loadRequests()
    }
  }

  async function toggleAvailable() {
    const { error: err } = await supabase.from('goalies').update({ available: !goalie.available }).eq('id', goalie.id)
    if (!err) setGoalie({ ...goalie, available: !goalie.available })
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

  // Not logged in
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-2">
          {mode === 'login' ? 'Logga in som målvakt' : 'Registrera dig som målvakt'}
        </h1>
        <p className="text-ice-muted mb-8">
          {mode === 'login' ? 'Se tillgängliga tider och hoppa in när det passar.' : 'Skapa ett konto för att börja ta emot förfrågningar.'}
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

  // Logged in but no goalie profile
  if (!goalie) {
    return (
      <div className="max-w-md mx-auto py-12">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-2">Skapa målvaktsprofil</h1>
        <p className="text-ice-muted mb-8">Fyll i dina uppgifter så att lag kan hitta dig.</p>
        {error && <p className="text-goal-red mb-4 text-sm">{error}</p>}
        <form onSubmit={handleRegisterGoalie} className="bg-rink-light border border-rink-border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">Namn</label>
            <input type="text" value={goalieForm.name} onChange={e => setGoalieForm({...goalieForm, name: e.target.value})} required placeholder="T.ex. Rikard"
              className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">E-post</label>
            <input type="email" value={goalieForm.email} onChange={e => setGoalieForm({...goalieForm, email: e.target.value})} required placeholder="T.ex. namn@exempel.se"
              className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">Telefon</label>
            <input type="tel" value={goalieForm.phone} onChange={e => setGoalieForm({...goalieForm, phone: e.target.value})} placeholder="070-123 45 67"
              className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">Ort</label>
              <input type="text" value={goalieForm.location} onChange={e => setGoalieForm({...goalieForm, location: e.target.value})} required placeholder="T.ex. Solna"
                className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">Region</label>
              <input type="text" value={goalieForm.region} onChange={e => setGoalieForm({...goalieForm, region: e.target.value})} required placeholder="T.ex. Stockholm"
                className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ice-muted/80 mb-1.5 uppercase tracking-wider">Hemadress (valfritt)</label>
            <input type="text" value={goalieForm.address} onChange={e => setGoalieForm({...goalieForm, address: e.target.value})} placeholder="T.ex. Storgatan 1, 171 45 Solna"
              className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            <p className="text-xs text-ice-muted mt-1.5">Används för att visa avstånd till ishallar. Visas aldrig för andra.</p>
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
            Skapa profil
          </button>
        </form>
      </div>
    )
  }

  // Goalie dashboard
  const myResponses = requests.filter(r => r.responses?.some(resp => resp.goalie_id === goalie.id))
  const openRequests = requests.filter(r => r.status === 'open' && !r.responses?.some(resp => resp.goalie_id === goalie.id))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Hej, {goalie.name}!</h1>
          <p className="text-ice-muted">{goalie.location} &middot; {goalie.email}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleAvailable}
            className={`px-4 py-2.5 rounded text-sm font-semibold uppercase tracking-wider cursor-pointer transition-colors ${goalie.available ? 'bg-goal-green text-white hover:bg-goal-green/80' : 'bg-rink-lighter text-ice-muted hover:text-white'}`}>
            {goalie.available ? 'Tillgänglig' : 'Inte tillgänglig'}
          </button>
          <button onClick={async () => { await signOut(); setUser(null); setGoalie(null) }}
            className="px-4 py-2.5 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
            Logga ut
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Öppna förfrågningar</h2>
          {openRequests.length === 0 ? (
            <p className="text-ice-muted/80">Inga lag söker målvakt just nu.</p>
          ) : (
            <div className="space-y-4">
              {openRequests.map(req => {
                const session = req.sessions
                const team = req.teams
                if (!session || !team) return null
                const mapped = {
                  ...req,
                  teamId: req.team_id,
                  sessionId: req.session_id,
                  responses: (req.responses || []).map(r => ({
                    goalieId: r.goalie_id,
                    goalieName: 'Målvakt',
                    answer: r.answer,
                  })),
                }
                const mappedSession = { ...session, rink: session.rink }
                return (
                  <RequestCard key={req.id} request={mapped} session={mappedSession}
                    isGoalieView={true} onRespond={handleRespond} />
                )
              })}
            </div>
          )}

          {myResponses.length > 0 && (
            <>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4 mt-10">Mina svar</h2>
              <div className="space-y-4">
                {myResponses.map(req => {
                  const session = req.sessions
                  const mapped = {
                    ...req,
                    teamId: req.team_id,
                    sessionId: req.session_id,
                    responses: (req.responses || []).map(r => ({
                      goalieId: r.goalie_id,
                      goalieName: r.goalie_id === goalie.id ? goalie.name : 'Målvakt',
                      answer: r.answer,
                    })),
                  }
                  return <RequestCard key={req.id} request={mapped} session={session} isGoalieView={false} />
                })}
              </div>
            </>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Min profil</h2>
          <div className="bg-rink-light border border-rink-border rounded-lg p-5 space-y-3">
            <div>
              <p className="text-xs text-ice-muted/80 uppercase tracking-wider">Namn</p>
              <p className="font-semibold text-white">{goalie.name}</p>
            </div>
            <div>
              <p className="text-xs text-ice-muted/80 uppercase tracking-wider">E-post</p>
              <p className="font-semibold text-white">{goalie.email}</p>
            </div>
            {goalie.phone && (
              <div>
                <p className="text-xs text-ice-muted/80 uppercase tracking-wider">Telefon</p>
                <p className="font-semibold text-white">{goalie.phone}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-ice-muted/80 uppercase tracking-wider">Plats</p>
              <p className="font-semibold text-white">{goalie.location}, {goalie.region}</p>
            </div>
            {goalie.address && (
              <div>
                <p className="text-xs text-ice-muted/80 uppercase tracking-wider">Adress</p>
                <p className="font-semibold text-white">{goalie.address}</p>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${goalie.available ? 'bg-goal-green' : 'bg-goal-red'}`} />
              <span className="text-sm font-medium">{goalie.available ? 'Tillgänglig' : 'Inte tillgänglig'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
