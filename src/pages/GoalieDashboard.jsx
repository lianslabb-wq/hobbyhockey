import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { signUp, signIn, signOut, getUser, resetPassword } from '../lib/auth'
import RequestCard from '../components/RequestCard'

function MessageInput({ requestId, onSend }) {
  const [text, setText] = useState('')
  return (
    <div className="mt-3 pt-3 border-t border-goal-green/20 flex gap-2">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Skriv ett meddelande..."
        className="flex-1 bg-rink-lighter border border-rink-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-ice-muted/50 focus:outline-none focus:border-jersey-blue/50"
        onKeyDown={e => { if (e.key === 'Enter' && text.trim()) { onSend(requestId, text.trim()); setText('') } }}
      />
      <button
        onClick={() => { if (text.trim()) { onSend(requestId, text.trim()); setText('') } }}
        className="px-4 py-2 bg-jersey-blue text-white rounded-lg text-sm font-semibold hover:bg-jersey-blue/80 transition-colors cursor-pointer"
      >
        Skicka
      </button>
    </div>
  )
}

export default function GoalieDashboard() {
  const [user, setUser] = useState(null)
  const [goalie, setGoalie] = useState(null)
  const [requests, setRequests] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [mode, setMode] = useState('login')

  // Auth form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [consent, setConsent] = useState(false)
  const [forgotPassword, setForgotPassword] = useState(false)
  const [forgotMessage, setForgotMessage] = useState('')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [goalieFavorites, setGoalieFavorites] = useState([])
  const [teamsWhoFavoritedMe, setTeamsWhoFavoritedMe] = useState([])
  const [allTeams, setAllTeams] = useState([])
  const [teamSearch, setTeamSearch] = useState('')
  const [messages, setMessages] = useState({})

  // Goalie registration form
  const [goalieForm, setGoalieForm] = useState({
    name: '', email: '', phone: '', location: '', region: ''
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
    if (goalie) { loadRequests(); loadMessages() }
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
      localStorage.setItem('hh_role', 'goalie')
      localStorage.setItem('hh_registered_goalie', 'true')
    } else {
      // Pre-fill from auth email + team profile name if available
      const prefill = { email: user.email || '' }
      const { data: teamData } = await supabase.from('teams').select('contact_name').eq('user_id', user.id)
      if (teamData?.length > 0 && teamData[0].contact_name) {
        prefill.name = teamData[0].contact_name
      }
      setGoalieForm(prev => ({ ...prev, ...prefill }))
    }
  }

  async function loadRequests() {
    // Load all requests (not just open) so we can show history
    const { data: allRequests } = await supabase
      .from('requests')
      .select('*, teams(*), sessions(*), responses(*)')
      .order('created_at', { ascending: false })
    setRequests(allRequests || [])

    const { data: allTeamsData } = await supabase.from('teams').select('id, name, location, type')
    setAllTeams(allTeamsData || [])

    // Load teams who have me as favorite
    if (goalie) {
      const { data: favData } = await supabase.from('favorites').select('team_id').eq('goalie_id', goalie.id)
      if (favData?.length > 0) {
        const teamIds = favData.map(f => f.team_id)
        const favTeams = (allTeamsData || []).filter(t => teamIds.includes(t.id))
        setTeamsWhoFavoritedMe(favTeams)
      }

      // Load my favorite teams
      const { data: myFavs, error: gfError } = await supabase.from('goalie_favorites').select('id, team_id').eq('goalie_id', goalie.id)
      if (!gfError && myFavs?.length > 0) {
        const myFavTeams = myFavs.map(f => ({
          ...f,
          team: (allTeamsData || []).find(t => t.id === f.team_id)
        }))
        setGoalieFavorites(myFavTeams)
      } else {
        setGoalieFavorites([])
      }
    }
  }

  async function addFavoriteTeam(teamId) {
    if (!goalie) return
    const teamName = allTeams.find(t => t.id === teamId)?.name || 'Lag'
    const { error: err } = await supabase.from('goalie_favorites').insert({ goalie_id: goalie.id, team_id: teamId })
    if (!err) {
      setTeamSearch('')
      setSuccessMsg(`${teamName} tillagt som favoritlag!`)
      setTimeout(() => setSuccessMsg(''), 5000)
      loadRequests()
    } else {
      setError(`Kunde inte lägga till favoritlag: ${err.message}`)
    }
  }

  async function removeFavoriteTeam(favId) {
    await supabase.from('goalie_favorites').delete().eq('id', favId)
    setSuccessMsg('Favoritlag borttaget.')
    setTimeout(() => setSuccessMsg(''), 5000)
    loadRequests()
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
      if (err.message?.includes('rate') || err.message?.includes('limit') || err.message?.includes('too many')) {
        setError('Vad roligt att du vill vara med på HopInHockey! Just nu är det många som registrerar sig samtidigt. Vänta ungefär en timme och försök igen.')
      } else if (err.message?.includes('already registered') || err.message?.includes('already been registered')) {
        setError('Det finns redan ett konto med den här e-postadressen. Prova att logga in istället.')
      } else {
        setError(err.message)
      }
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
        available: true,
        user_id: user.id,
        privacy_consent: true,
        privacy_consent_at: new Date().toISOString(),
      }).select().single()
      if (err) throw err
      setGoalie(data)
      localStorage.setItem('hh_registered_goalie', 'true')
      localStorage.setItem('hh_role', 'goalie')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRespond(requestId, answer, message) {
    setError('')
    setSuccessMsg('')
    const { error: err } = await supabase.from('responses').insert({
      request_id: requestId,
      goalie_id: goalie.id,
      answer,
    })
    if (err) { setError('Kunde inte skicka svar. Försök igen.'); return }
    // If first "yes", mark request as filled
    if (answer === 'yes') {
      const req = requests.find(r => r.id === requestId)
      const session = req?.sessions
      const hasOtherYes = req?.responses?.some(r => r.answer === 'yes')
      if (!hasOtherYes) {
        await supabase.from('requests').update({ status: 'filled' }).eq('id', requestId)
      }
      // Send optional message
      if (message) {
        await supabase.from('messages').insert({
          request_id: requestId,
          sender_id: user.id,
          body: message,
        })
      }
      setSuccessMsg(`Du har tackat ja till ${session?.type || 'tid'} ${session?.date || ''} ${session?.time?.slice(0, 5) || ''} @ ${session?.rink || ''}`)
    } else {
      setSuccessMsg('Svar skickat — du tackade nej.')
    }
    loadRequests()
    loadMessages()
    setTimeout(() => setSuccessMsg(''), 8000)
  }

  async function loadMessages() {
    const { data } = await supabase.from('messages').select('*').order('created_at')
    const grouped = {}
    for (const m of (data || [])) {
      if (!grouped[m.request_id]) grouped[m.request_id] = []
      grouped[m.request_id].push(m)
    }
    setMessages(grouped)
  }

  async function handleSendMessage(requestId, body) {
    await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: user.id,
      body,
    })
    loadMessages()
  }

  async function handleCancelBooking(requestId) {
    if (!confirm('Vill du avboka den här tiden? Förfrågan öppnas igen för andra målvakter.')) return
    setError('')
    // Delete my response
    await supabase.from('responses').delete().eq('request_id', requestId).eq('goalie_id', goalie.id)
    // Set request back to open
    await supabase.from('requests').update({ status: 'open' }).eq('id', requestId)
    setSuccessMsg('Tiden avbokad. Förfrågan är nu öppen igen.')
    setTimeout(() => setSuccessMsg(''), 5000)
    loadRequests()
  }

  async function toggleAvailable() {
    const newStatus = !goalie.available
    const { error: err } = await supabase.from('goalies').update({ available: newStatus }).eq('id', goalie.id)
    if (!err) {
      setGoalie({ ...goalie, available: newStatus })
      setSuccessMsg(newStatus ? 'Du är nu tillgänglig för förfrågningar!' : 'Du är nu markerad som inte tillgänglig.')
      setTimeout(() => setSuccessMsg(''), 5000)
    }
  }

  function handleLogout() {
    localStorage.removeItem('hh_role')
    localStorage.removeItem('hh_registered_team')
    localStorage.removeItem('hh_registered_goalie')
    signOut()
    setUser(null)
    setGoalie(null)
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    try {
      await resetPassword(email)
      setForgotMessage('Vi har skickat en länk till din e-post.')
    } catch (err) {
      setForgotMessage(err.message)
    }
  }

  async function handleUpdateGoalie(e) {
    e.preventDefault()
    const { error: err } = await supabase.from('goalies').update({
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone || null,
      location: editForm.location,
      region: editForm.region,
    }).eq('id', goalie.id)
    if (err) { setError('Kunde inte uppdatera. Försök igen.'); return }
    setGoalie({ ...goalie, ...editForm })
    setEditing(false)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordMsg('')
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPasswordMsg('Lösenordet har ändrats!')
      setNewPassword('')
      setChangingPassword(false)
      setTimeout(() => setPasswordMsg(''), 5000)
    } catch (err) {
      setPasswordMsg(err.message)
    }
  }

  function handleExportData() {
    const data = { goalie, requests: requests.filter(r => r.responses?.some(resp => resp.goalie_id === goalie.id)) }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hopinhockey-${goalie.name}-data.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDeleteAccount() {
    if (!confirm('Är du säker? Din profil och alla dina svar raderas permanent.')) return
    await supabase.from('goalies').delete().eq('id', goalie.id)
    handleLogout()
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
          <p className="text-sm text-ice-muted">När du har bekräftat din e-post, kom tillbaka hit och logga in.</p>
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
            <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">E-post</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Lösenord</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 pr-10 text-white text-sm" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ice-muted hover:text-white bg-transparent border-none cursor-pointer transition-colors">
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
          {mode === 'login' && !forgotPassword && (
            <button type="button" onClick={() => setForgotPassword(true)}
              className="text-xs text-jersey-blue hover:text-jersey-blue-light bg-transparent border-none cursor-pointer">
              Glömt lösenord?
            </button>
          )}
          {forgotPassword && (
            <div className="bg-rink rounded border border-rink-border p-4 space-y-3">
              <p className="text-sm text-ice-muted">Ange din e-post så skickar vi en återställningslänk.</p>
              {forgotMessage && <p className="text-sm text-jersey-blue">{forgotMessage}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={handleForgotPassword}
                  className="px-4 py-2 bg-jersey-blue text-puck rounded text-sm font-semibold uppercase tracking-wider hover:bg-jersey-blue-light transition-colors cursor-pointer">
                  Skicka länk
                </button>
                <button type="button" onClick={() => { setForgotPassword(false); setForgotMessage('') }}
                  className="px-4 py-2 bg-rink-lighter text-ice-muted rounded font-semibold text-sm uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
                  Avbryt
                </button>
              </div>
            </div>
          )}
          <button type="submit"
            className="w-full py-2.5 bg-goal-red text-white rounded font-semibold text-sm uppercase tracking-wider hover:bg-goal-red-light transition-colors cursor-pointer">
            {mode === 'login' ? 'Logga in' : 'Skapa konto'}
          </button>
          <p className="text-center text-sm text-ice-muted">
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
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Skapa målvaktsprofil</h1>
          <button onClick={handleLogout}
            className="px-4 py-2 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
            Logga ut
          </button>
        </div>
        <p className="text-ice-muted mb-8">Fyll i dina uppgifter så att lag kan hitta dig.</p>
        {error && <p className="text-goal-red mb-4 text-sm">{error}</p>}
        <form onSubmit={handleRegisterGoalie} className="bg-rink-light border border-rink-border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Namn</label>
            <input type="text" value={goalieForm.name} onChange={e => setGoalieForm({...goalieForm, name: e.target.value})} required placeholder="T.ex. Rikard"
              className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">E-post</label>
            <input type="email" value={goalieForm.email} onChange={e => setGoalieForm({...goalieForm, email: e.target.value})} required placeholder="T.ex. namn@exempel.se"
              className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Telefon</label>
            <input type="tel" value={goalieForm.phone} onChange={e => setGoalieForm({...goalieForm, phone: e.target.value})} placeholder="070-123 45 67"
              className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Ort</label>
              <input type="text" value={goalieForm.location} onChange={e => setGoalieForm({...goalieForm, location: e.target.value})} required placeholder="T.ex. Solna"
                className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Region</label>
              <input type="text" value={goalieForm.region} onChange={e => setGoalieForm({...goalieForm, region: e.target.value})} required placeholder="T.ex. Stockholm"
                className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            </div>
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
              consent ? 'bg-goal-red text-white hover:bg-goal-red-light' : 'bg-rink-lighter text-ice-muted cursor-not-allowed'
            }`}>
            Skapa profil
          </button>
        </form>
      </div>
    )
  }

  // Goalie dashboard
  const today = new Date().toISOString().split('T')[0]
  const myYesResponses = requests.filter(r => r.responses?.some(resp => resp.goalie_id === goalie.id && resp.answer === 'yes'))
  const myNoResponses = requests.filter(r => r.responses?.some(resp => resp.goalie_id === goalie.id && resp.answer === 'no'))
  // Exclude requests from teams the user owns (can't hire yourself)
  const openRequests = requests.filter(r =>
    r.status === 'open' &&
    !r.responses?.some(resp => resp.goalie_id === goalie.id) &&
    r.teams?.user_id !== user?.id
  )
  const upcomingBooked = myYesResponses.filter(r => r.sessions?.date >= today)
  const pastBooked = myYesResponses.filter(r => r.sessions?.date < today)

  return (
    <div>
      {error && <p className="text-goal-red mb-4 text-sm bg-goal-red/10 border border-goal-red/30 rounded-lg px-4 py-3">{error}</p>}
      {successMsg && <p className="text-goal-green mb-4 text-sm bg-goal-green/10 border border-goal-green/30 rounded-lg px-4 py-3">{successMsg}</p>}
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Bokade kommande tider */}
          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Bokade kommande tider ({upcomingBooked.length})</h2>
          {upcomingBooked.length > 0 ? (
            <div className="space-y-2 mb-8">
              {upcomingBooked.map(req => {
                const reqMessages = messages[req.id] || []
                return (
                  <div key={req.id} className="bg-goal-green/10 border border-goal-green/30 rounded-lg p-4 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-goal-green/20 text-goal-green px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Bekräftad</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{req.sessions?.date} {req.sessions?.time?.slice(0, 5)}</p>
                        <p className="text-ice-muted">{req.sessions?.type} @ {req.sessions?.rink}</p>
                        {req.sessions?.rink_address && <p className="text-ice-muted text-xs">{req.sessions.rink_address}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{req.teams?.name}</p>
                        <p className="text-ice-muted text-xs">{req.teams?.location}</p>
                      </div>
                    </div>
                    {/* Messages */}
                    {reqMessages.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-goal-green/20 space-y-2">
                        {reqMessages.map(m => (
                          <div key={m.id} className={`text-sm rounded-lg p-2 ${m.sender_id === user?.id ? 'bg-jersey-blue/10 border border-jersey-blue/20 ml-4' : 'bg-rink-lighter border border-rink-border mr-4'}`}>
                            <p className="text-white">{m.body}</p>
                            <p className="text-ice-muted text-xs mt-1">{new Date(m.created_at).toLocaleString('sv-SE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <MessageInput requestId={req.id} onSend={handleSendMessage} />
                    <div className="mt-2 pt-2 border-t border-goal-green/20">
                      <button onClick={() => handleCancelBooking(req.id)}
                        className="text-ice-muted hover:text-goal-red text-xs uppercase tracking-wider bg-transparent border-none cursor-pointer transition-colors">
                        Kan inte längre — avboka
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-ice-muted mb-8">Du har inga bokade tider ännu. Svara på förfrågningar nedan!</p>
          )}

          {/* Öppna förfrågningar */}
          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Öppna förfrågningar ({openRequests.length})</h2>
          {openRequests.length === 0 ? (
            <p className="text-ice-muted mb-8">Inga lag söker målvakt just nu.</p>
          ) : (
            <div className="space-y-4 mb-8">
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
                return (
                  <RequestCard key={req.id} request={mapped} session={session}
                    isGoalieView={true} onRespond={handleRespond}
                    messages={messages[req.id]} onSendMessage={handleSendMessage} currentUserId={user?.id} />
                )
              })}
            </div>
          )}

          {/* Tackade nej */}
          {myNoResponses.length > 0 && (
            <>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Tackade nej ({myNoResponses.length})</h2>
              <div className="space-y-2 mb-8">
                {myNoResponses.map(req => (
                  <div key={req.id} className="bg-rink-light border border-rink-border rounded-lg p-3 text-sm opacity-70">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{req.sessions?.date} {req.sessions?.time?.slice(0, 5)}</p>
                        <p className="text-ice-muted">{req.sessions?.type} @ {req.sessions?.rink}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm">{req.teams?.name}</p>
                        <span className="text-goal-red text-xs font-semibold uppercase">Avböjd</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Passerade tider */}
          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Passerade tider ({pastBooked.length})</h2>
          {pastBooked.length > 0 ? (
            <div className="space-y-2 mb-8">
              {pastBooked.map(req => (
                <div key={req.id} className="bg-rink-light/50 border border-rink-border rounded-lg p-3 text-sm opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{req.sessions?.date} {req.sessions?.time?.slice(0, 5)}</p>
                      <p className="text-ice-muted">{req.sessions?.type} @ {req.sessions?.rink}</p>
                    </div>
                    <p className="text-white text-sm">{req.teams?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ice-muted mb-8">Ingen historik ännu.</p>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Min profil</h2>
          {editing ? (
            <form onSubmit={handleUpdateGoalie} className="bg-rink-light border border-rink-border rounded-lg p-5 space-y-3">
              <div>
                <label className="block text-xs text-ice-muted mb-1 uppercase tracking-wider">Namn</label>
                <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} required
                  className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-ice-muted mb-1 uppercase tracking-wider">E-post</label>
                <input type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} required
                  className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-ice-muted mb-1 uppercase tracking-wider">Telefon</label>
                <input type="tel" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-ice-muted mb-1 uppercase tracking-wider">Ort</label>
                <input type="text" value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} required
                  className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-ice-muted mb-1 uppercase tracking-wider">Region</label>
                <input type="text" value={editForm.region || ''} onChange={e => setEditForm({...editForm, region: e.target.value})} required
                  className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 bg-goal-red text-white rounded text-sm font-semibold uppercase tracking-wider hover:bg-goal-red-light transition-colors cursor-pointer">Spara</button>
                <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer">Avbryt</button>
              </div>
            </form>
          ) : (
            <div className="bg-rink-light border border-rink-border rounded-lg p-5 space-y-3">
              <div>
                <p className="text-xs text-ice-muted uppercase tracking-wider">Namn</p>
                <p className="font-semibold text-white">{goalie.name}</p>
              </div>
              <div>
                <p className="text-xs text-ice-muted uppercase tracking-wider">E-post</p>
                <p className="font-semibold text-white">{goalie.email}</p>
              </div>
              {goalie.phone && (
                <div>
                  <p className="text-xs text-ice-muted uppercase tracking-wider">Telefon</p>
                  <p className="font-semibold text-white">{goalie.phone}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-ice-muted uppercase tracking-wider">Plats</p>
                <p className="font-semibold text-white">{goalie.location}, {goalie.region}</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${goalie.available ? 'bg-goal-green' : 'bg-goal-red'}`} />
                <span className="text-sm font-medium">{goalie.available ? 'Tillgänglig' : 'Inte tillgänglig'}</span>
              </div>
              <button onClick={() => { setEditForm({...goalie}); setEditing(true) }}
                className="text-jersey-blue hover:text-jersey-blue-light text-xs uppercase tracking-wider bg-transparent border-none cursor-pointer mt-2">
                Redigera profil
              </button>
            </div>
          )}

          {/* Favoritmålvakt hos */}
          {teamsWhoFavoritedMe.length > 0 && (
            <div className="mt-6">
              <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-3">Favoritmålvakt hos ({teamsWhoFavoritedMe.length})</h2>
              <div className="space-y-2">
                {teamsWhoFavoritedMe.map(t => (
                  <div key={t.id} className="bg-goal-green/10 border border-goal-green/30 rounded-lg p-3 flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-goal-green" />
                    <span className="text-white font-semibold">{t.name}</span>
                    <span className="text-ice-muted">{t.location}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mina favoritlag */}
          <div className="mt-6">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-3">Mina favoritlag ({goalieFavorites.length})</h2>
            {goalieFavorites.length > 0 ? (
              <div className="space-y-2">
                {goalieFavorites.map(f => (
                  <div key={f.id} className="bg-rink-light border border-rink-border rounded-lg p-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-white">{f.team?.name}</p>
                      <p className="text-ice-muted text-xs">{f.team?.location}</p>
                    </div>
                    <button onClick={() => removeFavoriteTeam(f.id)}
                      className="text-ice-muted hover:text-goal-red text-xs uppercase tracking-wider bg-transparent border-none cursor-pointer transition-colors">
                      Ta bort
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ice-muted text-sm mb-2">Inga favoritlag tillagda. Sök och lägg till nedan.</p>
            )}
            <div className="mt-3">
              <input
                type="text"
                value={teamSearch}
                onChange={e => setTeamSearch(e.target.value)}
                placeholder="Sök lag..."
                className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm"
              />
              {teamSearch.length >= 2 && (() => {
                const favTeamIds = goalieFavorites.map(f => f.team_id)
                const filtered = allTeams.filter(t =>
                  !favTeamIds.includes(t.id) &&
                  t.name.toLowerCase().includes(teamSearch.toLowerCase())
                )
                if (filtered.length === 0) return <p className="text-ice-muted text-xs mt-2">Inga träffar.</p>
                return (
                  <div className="mt-2 space-y-1">
                    {filtered.map(t => (
                      <button key={t.id} onClick={() => addFavoriteTeam(t.id)}
                        className="w-full text-left bg-rink-light border border-rink-border rounded px-3 py-2 text-sm hover:border-jersey-blue/60 transition-colors cursor-pointer flex items-center justify-between">
                        <span>
                          <span className="text-white font-semibold">{t.name}</span>
                          <span className="text-ice-muted ml-2">{t.location}</span>
                        </span>
                        <span className="text-jersey-blue text-xs uppercase tracking-wider">+ Lägg till</span>
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>

          <div className="mt-8 border-t border-rink-border pt-6">
            <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Hantera konto</h2>
            {passwordMsg && <p className={`text-sm mb-3 ${passwordMsg.includes('ändrats') ? 'text-goal-green' : 'text-goal-red'}`}>{passwordMsg}</p>}
            {changingPassword ? (
              <form onSubmit={handleChangePassword} className="bg-rink-light border border-rink-border rounded-lg p-4 space-y-3 mb-4">
                <div>
                  <label className="block text-xs text-ice-muted mb-1 uppercase tracking-wider">Nytt lösenord</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6}
                    placeholder="Minst 6 tecken"
                    className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-jersey-blue text-puck rounded text-sm font-semibold uppercase tracking-wider hover:bg-jersey-blue-light transition-colors cursor-pointer">Spara</button>
                  <button type="button" onClick={() => { setChangingPassword(false); setNewPassword('') }} className="px-4 py-2 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer">Avbryt</button>
                </div>
              </form>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setChangingPassword(!changingPassword)}
                className="px-4 py-2 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
                Byt lösenord
              </button>
              <button onClick={handleExportData}
                className="px-4 py-2 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
                Exportera min data
              </button>
              <button onClick={handleDeleteAccount}
                className="px-4 py-2 bg-goal-red/20 text-goal-red rounded text-sm font-semibold uppercase tracking-wider hover:bg-goal-red/40 transition-colors cursor-pointer">
                Radera mitt konto
              </button>
            </div>
            <p className="text-xs text-ice-muted mt-3">Vid radering tas din profil och alla svar bort permanent.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
