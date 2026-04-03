import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { signUp, signIn, signOut, getUser, resetPassword } from '../lib/auth'
import RequestCard from '../components/RequestCard'

function MessageInput({ requestId, onSend }) {
  const [text, setText] = useState('')
  return (
    <div className="mt-3 pt-3 border-t border-rink-border flex gap-2">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Skriv ett meddelande till målvakten..."
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
  const [goalieInfo, setGoalieInfo] = useState({})
  const [messages, setMessages] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [mode, setMode] = useState('login')

  // Auth form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [consent, setConsent] = useState(false)
  const [forgotPassword, setForgotPassword] = useState(false)
  const [forgotMessage, setForgotMessage] = useState('')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [visibleCount, setVisibleCount] = useState(3)

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
      loadMessages()
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
      localStorage.setItem('hh_role', 'team')
      localStorage.setItem('hh_registered_team', 'true')
    } else {
      // Pre-fill from auth email + goalie profile name if available
      const prefill = { contactEmail: user.email || '' }
      const { data: goalieData } = await supabase.from('goalies').select('name').eq('user_id', user.id)
      if (goalieData?.length > 0) {
        prefill.contactName = goalieData[0].name
      }
      setTeamForm(prev => ({ ...prev, ...prefill }))
    }
  }

  async function loadSessions() {
    const { data, error: err } = await supabase.from('sessions').select('*').eq('team_id', team.id).order('date')
    if (err) { setError('Kunde inte ladda tider.'); return }
    setSessions(data || [])
  }

  async function loadRequests() {
    const { data } = await supabase.from('requests').select('*, responses(*)').eq('team_id', team.id).order('created_at', { ascending: false })
    // Get goalie info - names for all, contact details for those who said yes
    const goalieIds = [...new Set((data || []).flatMap(r =>
      (r.responses || []).map(resp => resp.goalie_id)
    ).filter(Boolean))]
    let gi = {}
    if (goalieIds.length > 0) {
      const { data: gd } = await supabase.from('goalies').select('id, name, email, phone').in('id', goalieIds)
      gi = Object.fromEntries((gd || []).map(g => [g.id, g]))
    }
    setGoalieInfo(gi)
    // Attach goalie info to responses - include contact for those who said yes
    setRequests((data || []).map(req => ({
      ...req,
      responses: (req.responses || []).map(r => {
        const g = gi[r.goalie_id]
        return {
          ...r,
          goalies: { name: g?.name || 'Okänd' },
          goalieEmail: r.answer === 'yes' ? g?.email : null,
          goaliePhone: r.answer === 'yes' ? g?.phone : null,
        }
      })
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
    const { data } = await supabase.from('goalie_directory').select('*').eq('available', true)
    setAllGoalies(data || [])
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

  async function addFavorite(goalieId) {
    const goalieName = allGoalies.find(g => g.id === goalieId)?.name || 'Målvakt'
    const { error: err } = await supabase.from('favorites').insert({ team_id: team.id, goalie_id: goalieId })
    if (!err) {
      setGoalieSearch('')
      setSuccessMsg(`${goalieName} tillagd som favoritmålvakt!`)
      setTimeout(() => setSuccessMsg(''), 5000)
      loadFavorites()
    }
  }

  async function removeFavorite(favoriteId) {
    await supabase.from('favorites').delete().eq('id', favoriteId)
    setSuccessMsg('Favoritmålvakt borttagen.')
    setTimeout(() => setSuccessMsg(''), 5000)
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
      if (err.message?.includes('rate') || err.message?.includes('limit') || err.message?.includes('too many')) {
        setError('Vad roligt att du vill vara med på HopInHockey! Just nu är det många som registrerar sig samtidigt. Vänta ungefär en timme och försök igen.')
      } else if (err.message?.includes('already registered') || err.message?.includes('already been registered')) {
        setError('Det finns redan ett konto med den här e-postadressen. Prova att logga in istället.')
      } else {
        setError(err.message)
      }
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
      localStorage.setItem('hh_registered_team', 'true')
      localStorage.setItem('hh_role', 'team')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCreateSession(e) {
    e.preventDefault()
    setError('')
    const form = e.target
    const { data: sessionData, error: err } = await supabase.from('sessions').insert({
      team_id: team.id,
      date: form.date.value,
      time: form.time.value,
      type: form.type.value,
      rink: form.rink.value,
      rink_address: form.rink_address.value || null,
      needs_goalie: true,
    }).select().single()
    if (err) { setError('Kunde inte lägga till tid. Försök igen.'); return }
    // Auto-create request so goalies can see it immediately
    await supabase.from('requests').insert({
      team_id: team.id,
      session_id: sessionData.id,
      type: 'open',
      status: 'open',
    })
    setSuccessMsg(`Tid tillagd och förfrågan skickad! Målvakter kan nu se ${form.date.value} ${form.time.value}`)
    setTimeout(() => setSuccessMsg(''), 5000)
    form.reset()
    loadSessions()
    loadRequests()
  }

  async function handleCreateRequest() {
    if (!newRequest.sessionId) return
    setError('')
    const { error: err } = await supabase.from('requests').insert({
      team_id: team.id,
      session_id: newRequest.sessionId,
      type: newRequest.type,
      status: 'open',
    })
    if (err) { setError('Kunde inte skapa förfrågan. Försök igen.'); return }
    setSuccessMsg('Förfrågan skickad! Målvakter kan nu se och svara.')
    setTimeout(() => setSuccessMsg(''), 5000)
    setShowNewRequest(false)
    setNewRequest({ sessionId: '', type: 'open' })
    loadRequests()
  }

  function handleLogout() {
    localStorage.removeItem('hh_role')
    localStorage.removeItem('hh_registered_team')
    localStorage.removeItem('hh_registered_goalie')
    signOut()
    setUser(null)
    setTeam(null)
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

  async function handleUpdateTeam(e) {
    e.preventDefault()
    const { error: err } = await supabase.from('teams').update({
      name: editForm.name,
      type: editForm.type,
      location: editForm.location,
      contact_name: editForm.contact_name,
      contact_email: editForm.contact_email,
      calendar_url: editForm.calendar_url || null,
    }).eq('id', team.id)
    if (err) { setError('Kunde inte uppdatera. Försök igen.'); return }
    setTeam({ ...team, ...editForm })
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
    const data = { team, sessions, requests, favorites }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hopinhockey-${team.name}-data.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDeleteAccount() {
    if (!confirm('Är du säker? Alla dina uppgifter, tider och förfrågningar raderas permanent.')) return
    await supabase.from('teams').delete().eq('id', team.id)
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
                  className="px-4 py-2 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
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

  // Logged in but no team — register team
  if (!team) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Registrera ditt lag</h1>
          <button onClick={handleLogout}
            className="px-4 py-2 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
            Logga ut
          </button>
        </div>
        <p className="text-ice-muted mb-8">Fyll i uppgifterna nedan för att komma igång.</p>
        {error && <p className="text-goal-red mb-4 text-sm">{error}</p>}
        <form onSubmit={handleRegisterTeam} className="bg-rink-light border border-rink-border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Lagnamn</label>
            <input type="text" value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} required placeholder="T.ex. Solna Hockey"
              className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Typ</label>
              <select value={teamForm.type} onChange={e => setTeamForm({...teamForm, type: e.target.value})}
                className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm">
                <option>Veteran</option>
                <option>Korpen/Motion</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Ort</label>
              <input type="text" value={teamForm.location} onChange={e => setTeamForm({...teamForm, location: e.target.value})} required placeholder="T.ex. Solna"
                className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Kontaktperson</label>
              <input type="text" value={teamForm.contactName} onChange={e => setTeamForm({...teamForm, contactName: e.target.value})} required placeholder="T.ex. Robban"
                className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Kontakt e-post</label>
              <input type="email" value={teamForm.contactEmail} onChange={e => setTeamForm({...teamForm, contactEmail: e.target.value})} required placeholder="T.ex. namn@exempel.se"
                className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Följkalender-URL (valfritt)</label>
            <input type="url" value={teamForm.calendarUrl} onChange={e => setTeamForm({...teamForm, calendarUrl: e.target.value})} placeholder="https://sportadmin.se/cal/..."
              className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
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
            Registrera lag
          </button>
        </form>
      </div>
    )
  }

  // Team dashboard
  const sessionsNeedingGoalie = sessions.filter(s => s.needs_goalie)
  const visibleSessions = sessions.slice(0, visibleCount)
  const hasMore = visibleCount < sessions.length
  const canShowLess = visibleCount > 3

  return (
    <div>
      {error && <p className="text-goal-red mb-4 text-sm bg-goal-red/10 border border-goal-red/30 rounded-lg px-4 py-3">{error}</p>}
      {successMsg && <p className="text-goal-green mb-4 text-sm bg-goal-green/10 border border-goal-green/30 rounded-lg px-4 py-3">{successMsg}</p>}
      {editing && (
        <form onSubmit={handleUpdateTeam} className="bg-rink-light border border-rink-border rounded-lg p-6 mb-6 space-y-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider">Redigera lag</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Lagnamn</label>
              <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} required
                className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Typ</label>
              <select value={editForm.type || ''} onChange={e => setEditForm({...editForm, type: e.target.value})}
                className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm">
                <option>Veteran</option><option>Korpen/Motion</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Ort</label>
              <input type="text" value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} required
                className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Kontaktperson</label>
              <input type="text" value={editForm.contact_name || ''} onChange={e => setEditForm({...editForm, contact_name: e.target.value})} required
                className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Kontakt e-post</label>
              <input type="email" value={editForm.contact_email || ''} onChange={e => setEditForm({...editForm, contact_email: e.target.value})} required
                className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider">Kalender-URL</label>
              <input type="url" value={editForm.calendar_url || ''} onChange={e => setEditForm({...editForm, calendar_url: e.target.value})}
                className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-5 py-2.5 bg-goal-red text-white rounded font-semibold text-sm uppercase tracking-wider hover:bg-goal-red-light transition-colors cursor-pointer">Spara</button>
            <button type="button" onClick={() => setEditing(false)} className="px-5 py-2.5 bg-rink-lighter text-ice-muted rounded font-semibold text-sm uppercase tracking-wider hover:text-white transition-colors cursor-pointer">Avbryt</button>
          </div>
        </form>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight">{team.name}</h1>
          <p className="text-ice-muted text-sm">{team.type} &middot; {team.location} &middot; {team.contact_name}</p>
        </div>
        <button onClick={() => { setEditForm({...team}); setEditing(!editing) }}
          className="px-4 py-2.5 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer self-start">
          Redigera
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Tider ({sessions.length})</h2>
          {sessions.length === 0 ? (
            <p className="text-ice-muted">Inga tider tillagda. Lägg till din första tid till höger.</p>
          ) : (
            <div className="space-y-3">
              {visibleSessions.map(s => {
                const req = requests.find(r => r.session_id === s.id)
                const yesResponses = (req?.responses || []).filter(r => r.answer === 'yes')
                const allResponses = req?.responses || []
                const isFilled = req?.status === 'filled' || yesResponses.length > 0

                return (
                  <div key={s.id} className={`rounded-lg p-4 text-sm border ${
                    isFilled ? 'bg-goal-green/10 border-goal-green/30' : 'bg-rink-light border-rink-border'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{s.date} {s.time?.slice(0, 5)}</p>
                        <p className="text-ice-muted">{s.type} @ {s.rink}</p>
                        {s.rink_address && <p className="text-ice-muted text-xs">{s.rink_address}</p>}
                      </div>
                      <span className={`text-xs font-semibold uppercase tracking-wider shrink-0 ${
                        isFilled ? 'text-goal-green' : 'text-goal-red'
                      }`}>
                        {isFilled ? 'Tillsatt' : 'Söker målvakt'}
                      </span>
                    </div>
                    {/* Show accepted goalie with contact info */}
                    {yesResponses.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-goal-green/20">
                        {yesResponses.map((r, i) => {
                          const gi = goalieInfo[r.goalie_id]
                          return (
                            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-goal-green" />
                                <span className="text-white font-semibold">{r.goalies?.name || gi?.name || 'Okänd'}</span>
                              </div>
                              {(r.goalieEmail || gi?.email) && (
                                <div className="flex gap-3 ml-4 sm:ml-0">
                                  <a href={`mailto:${r.goalieEmail || gi?.email}`} className="text-jersey-blue hover:text-jersey-blue-light text-sm no-underline">{r.goalieEmail || gi?.email}</a>
                                  {(r.goaliePhone || gi?.phone) && (
                                    <a href={`tel:${r.goaliePhone || gi?.phone}`} className="text-jersey-blue hover:text-jersey-blue-light text-sm no-underline">{r.goaliePhone || gi?.phone}</a>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {/* Messages for confirmed matches */}
                    {isFilled && req && (messages[req.id] || []).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-goal-green/20 space-y-2">
                        <p className="text-xs text-ice-muted uppercase tracking-wide font-semibold">Meddelanden</p>
                        {(messages[req.id] || []).map(m => (
                          <div key={m.id} className={`text-sm rounded-lg p-2 ${m.sender_id === user?.id ? 'bg-jersey-blue/10 border border-jersey-blue/20 ml-4' : 'bg-rink-lighter border border-rink-border mr-4'}`}>
                            <p className="text-white">{m.body}</p>
                            <p className="text-ice-muted text-xs mt-1">{new Date(m.created_at).toLocaleString('sv-SE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {isFilled && req && <MessageInput requestId={req.id} onSend={handleSendMessage} />}
                    {/* Show response count if searching */}
                    {!isFilled && req && (
                      <div className="mt-2 pt-2 border-t border-rink-border">
                        <p className="text-ice-muted text-xs">Svar: {allResponses.length} — {allResponses.length === 0 ? 'Väntar på svar' : `${yesResponses.length} ja, ${allResponses.length - yesResponses.length} nej`}</p>
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="flex gap-2">
                {hasMore && (
                  <button onClick={() => setVisibleCount(c => Math.min(c + 5, sessions.length))}
                    className="flex-1 py-3 bg-rink-lighter text-ice-muted rounded-lg text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer border border-rink-border">
                    Visa fler tider
                  </button>
                )}
                {canShowLess && (
                  <button onClick={() => setVisibleCount(3)}
                    className="flex-1 py-3 bg-rink-lighter text-ice-muted rounded-lg text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer border border-rink-border">
                    Visa färre
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Lägg till tid</h2>
          <form onSubmit={handleCreateSession} className="bg-rink-light border border-rink-border rounded-lg p-4 space-y-3 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} min={new Date().toISOString().split('T')[0]} className="bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
              <input name="time" type="time" required className="bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select name="type" className="bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm">
                <option>Träning</option>
                <option>Match</option>
              </select>
              <input name="rink" type="text" required placeholder="Hallnamn" className="bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
            </div>
            <input name="rink_address" type="text" placeholder="Adress till ishallen (valfritt)" className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
            <button type="submit"
              className="w-full py-2 bg-goal-red/80 text-white rounded text-sm font-semibold uppercase tracking-wider hover:bg-goal-red transition-colors cursor-pointer">
              Lägg till
            </button>
          </form>

          <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Favoritmålvakter</h2>
          {favorites.length === 0 ? (
            <p className="text-ice-muted text-sm mb-2">Inga favoriter tillagda än. Sök och lägg till nedan.</p>
          ) : (
            <div className="space-y-2">
              {favorites.map(f => (
                <div key={f.id} className="bg-rink-light border border-rink-border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{f.goalies?.name}</p>
                    <p className="text-sm text-ice-muted">{f.goalies?.location}</p>
                  </div>
                  <button onClick={() => removeFavorite(f.id)}
                    className="text-ice-muted hover:text-goal-red text-xs uppercase tracking-wider bg-transparent border-none cursor-pointer transition-colors">
                    Ta bort
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3">
            <input
              type="text"
              value={goalieSearch}
              onChange={e => setGoalieSearch(e.target.value)}
              placeholder="Sök målvakt..."
              className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm"
            />
            {goalieSearch.length >= 2 && (() => {
              const favoriteGoalieIds = favorites.map(f => f.goalie_id)
              const filtered = allGoalies.filter(g =>
                !favoriteGoalieIds.includes(g.id) &&
                g.name.toLowerCase().includes(goalieSearch.toLowerCase())
              )
              if (filtered.length === 0) return <p className="text-ice-muted text-xs mt-2">Inga träffar.</p>
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
        </div>
      </div>

      <div className="mt-12 border-t border-rink-border pt-8">
        <h2 className="font-display text-lg font-bold uppercase tracking-wider mb-4">Hantera konto</h2>
        {passwordMsg && <p className={`text-sm mb-3 ${passwordMsg.includes('ändrats') ? 'text-goal-green' : 'text-goal-red'}`}>{passwordMsg}</p>}
        {changingPassword && (
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
        )}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setChangingPassword(!changingPassword)}
            className="px-5 py-2.5 bg-rink-lighter text-ice-muted rounded font-semibold text-sm uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
            Byt lösenord
          </button>
          <button onClick={handleExportData}
            className="px-5 py-2.5 bg-rink-lighter text-ice-muted rounded font-semibold text-sm uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
            Exportera min data
          </button>
          <button onClick={handleDeleteAccount}
            className="px-5 py-2.5 bg-goal-red/20 text-goal-red rounded font-semibold text-sm uppercase tracking-wider hover:bg-goal-red/40 transition-colors cursor-pointer">
            Radera mitt konto
          </button>
        </div>
        <p className="text-xs text-ice-muted mt-3">Vid radering tas alla dina uppgifter, tider och förfrågningar bort permanent.</p>
      </div>
    </div>
  )
}
