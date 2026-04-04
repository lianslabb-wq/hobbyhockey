import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { signIn, signOut, getUser } from '../lib/auth'

const ADMIN_EMAILS = ['lianslabb@gmail.com']

export default function Admin() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState('dashboard')
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({})

  const [teams, setTeams] = useState([])
  const [goalies, setGoalies] = useState([])
  const [requests, setRequests] = useState([])
  const [supportClicks, setSupportClicks] = useState([])
  const [supportCount, setSupportCount] = useState(0)
  const [sessions, setSessions] = useState([])
  const [responses, setResponses] = useState([])
  const [favorites, setFavorites] = useState([])
  const [goalieFavorites, setGoalieFavorites] = useState([])

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user && ADMIN_EMAILS.includes(user.email)) {
      loadAll()
    }
  }, [user])

  async function checkUser() {
    const u = await getUser()
    setUser(u)
    setLoading(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    try {
      await signIn(email, password)
      const u = await getUser()
      setUser(u)
    } catch (err) {
      setError(err.message)
    }
  }

  async function loadAll() {
    const [t, g, r, s, sess, resp, fav, gfav] = await Promise.all([
      supabase.from('teams').select('*').order('created_at', { ascending: false }),
      supabase.from('goalies').select('*').order('created_at', { ascending: false }),
      supabase.from('requests').select('*, teams(name), sessions(date, time, rink), responses(count)').order('created_at', { ascending: false }),
      supabase.from('support_clicks').select('*').order('created_at', { ascending: false }),
      supabase.from('sessions').select('*'),
      supabase.from('responses').select('*'),
      supabase.from('favorites').select('*'),
      supabase.from('goalie_favorites').select('*'),
    ])
    setTeams(t.data || [])
    setGoalies(g.data || [])
    setRequests(r.data || [])
    setSupportClicks(s.data || [])
    setSupportCount(s.data?.length || 0)
    setSessions(sess.data || [])
    setResponses(resp.data || [])
    setFavorites(fav.data || [])
    setGoalieFavorites(gfav.data || [])
  }

  const [successMsg, setSuccessMsg] = useState('')

  async function tryDelete(table, filter) {
    const query = supabase.from(table).delete()
    const { error } = filter(query)
      ? await filter(query)
      : await query
    return error
  }

  async function deleteTeam(id) {
    if (!confirm('Radera laget och alla dess tider, förfrågningar och favoriter?')) return
    setError('')
    setSuccessMsg('')
    const errors = []

    let e
    e = (await supabase.from('favorites').delete().eq('team_id', id)).error
    if (e) errors.push(`favorites: ${e.message}`)
    e = (await supabase.from('goalie_favorites').delete().eq('team_id', id)).error
    if (e) errors.push(`goalie_favorites: ${e.message}`)

    const { data: sessions } = await supabase.from('sessions').select('id').eq('team_id', id)
    if (sessions?.length > 0) {
      const sessionIds = sessions.map(s => s.id)
      const { data: reqs } = await supabase.from('requests').select('id').in('session_id', sessionIds)
      if (reqs?.length > 0) {
        const reqIds = reqs.map(r => r.id)
        e = (await supabase.from('responses').delete().in('request_id', reqIds)).error
        if (e) errors.push(`responses: ${e.message}`)
        e = (await supabase.from('requests').delete().in('id', reqIds)).error
        if (e) errors.push(`requests: ${e.message}`)
      }
      e = (await supabase.from('sessions').delete().in('id', sessionIds)).error
      if (e) errors.push(`sessions: ${e.message}`)
    }

    e = (await supabase.from('teams').delete().eq('id', id)).error
    if (e) errors.push(`teams: ${e.message}`)

    if (errors.length > 0) setError(`Radering misslyckades: ${errors.join(' | ')}`)
    else setSuccessMsg('Lag raderat!')
    setTimeout(() => setSuccessMsg(''), 5000)
    loadAll()
  }

  async function deleteGoalie(id) {
    if (!confirm('Radera denna målvakt och alla dess svar och favoriter?')) return
    setError('')
    setSuccessMsg('')
    const errors = []

    let e
    e = (await supabase.from('responses').delete().eq('goalie_id', id)).error
    if (e) errors.push(`responses: ${e.message}`)
    e = (await supabase.from('favorites').delete().eq('goalie_id', id)).error
    if (e) errors.push(`favorites: ${e.message}`)
    e = (await supabase.from('goalie_favorites').delete().eq('goalie_id', id)).error
    if (e) errors.push(`goalie_favorites: ${e.message}`)
    e = (await supabase.from('goalies').delete().eq('id', id)).error
    if (e) errors.push(`goalies: ${e.message}`)

    if (errors.length > 0) setError(`Radering misslyckades: ${errors.join(' | ')}`)
    else setSuccessMsg('Målvakt raderad!')
    setTimeout(() => setSuccessMsg(''), 5000)
    loadAll()
  }

  async function deleteRequest(id) {
    if (!confirm('Radera denna förfrågan och alla svar?')) return
    setError('')
    setSuccessMsg('')

    let e
    e = (await supabase.from('responses').delete().eq('request_id', id)).error
    if (e) { setError(`responses: ${e.message}`); return }
    e = (await supabase.from('requests').delete().eq('id', id)).error
    if (e) { setError(`requests: ${e.message}`); return }

    setSuccessMsg('Förfrågan raderad!')
    setTimeout(() => setSuccessMsg(''), 5000)
    loadAll()
  }

  async function saveTeam() {
    const { error: err } = await supabase.from('teams').update({
      name: editForm.name, type: editForm.type, location: editForm.location,
      contact_name: editForm.contact_name, contact_email: editForm.contact_email,
    }).eq('id', editingItem)
    if (err) { setError(err.message); return }
    setEditingItem(null)
    setSuccessMsg('Lag uppdaterat!')
    setTimeout(() => setSuccessMsg(''), 5000)
    loadAll()
  }

  async function saveGoalie() {
    const { error: err } = await supabase.from('goalies').update({
      name: editForm.name, email: editForm.email, phone: editForm.phone,
      location: editForm.location, region: editForm.region, available: editForm.available,
    }).eq('id', editingItem)
    if (err) { setError(err.message); return }
    setEditingItem(null)
    setSuccessMsg('Målvakt uppdaterad!')
    setTimeout(() => setSuccessMsg(''), 5000)
    loadAll()
  }

  if (loading) return <p className="text-ice-muted">Laddar...</p>

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-2">Admin</h1>
        <p className="text-ice-muted mb-8">Logga in med ett administratörskonto.</p>
        {error && <p className="text-goal-red mb-4 text-sm">{error}</p>}
        <form onSubmit={handleLogin} className="bg-rink-light border border-rink-border rounded-lg p-6 space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="E-post"
            className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Lösenord"
            className="w-full bg-rink rounded border border-rink-border px-3 py-2.5 text-white text-sm" />
          <button type="submit"
            className="w-full py-2.5 bg-goal-red text-white rounded font-semibold text-sm uppercase tracking-wider hover:bg-goal-red-light transition-colors cursor-pointer">
            Logga in
          </button>
        </form>
      </div>
    )
  }

  if (!ADMIN_EMAILS.includes(user.email)) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-4">Ingen åtkomst</h1>
        <p className="text-ice-muted mb-6">Ditt konto har inte administratörsbehörighet.</p>
        <button onClick={async () => { await signOut(); setUser(null) }}
          className="px-6 py-2.5 bg-rink-lighter text-ice-muted rounded font-semibold text-sm uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
          Logga ut
        </button>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const openRequests = requests.filter(r => r.status === 'open')
  const filledRequests = requests.filter(r => r.status === 'filled')
  const availableGoalies = goalies.filter(g => g.available)
  const upcomingSessions = sessions.filter(s => s.date >= today)
  const pastSessions = sessions.filter(s => s.date < today)

  // Activity last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const newTeamsThisWeek = teams.filter(t => t.created_at >= weekAgo)
  const newGoaliesThisWeek = goalies.filter(g => g.created_at >= weekAgo)
  const newResponsesThisWeek = responses.filter(r => r.created_at >= weekAgo)

  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'teams', label: `Lag (${teams.length})` },
    { key: 'goalies', label: `Målvakter (${goalies.length})` },
    { key: 'requests', label: `Förfrågningar (${requests.length})` },
    { key: 'analytics', label: 'Dataanalys' },
    { key: 'support', label: `Stöd (${supportCount})` },
    { key: 'brand', label: 'Varumärke' },
    { key: 'drift', label: 'Drift' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Admin</h1>
          <p className="text-ice-muted text-sm">{user.email}</p>
        </div>
      </div>

      {error && <p className="text-goal-red mb-4 text-sm bg-goal-red/10 border border-goal-red/30 rounded-lg px-4 py-3">{error}</p>}
      {successMsg && <p className="text-goal-green mb-4 text-sm bg-goal-green/10 border border-goal-green/30 rounded-lg px-4 py-3">{successMsg}</p>}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded text-sm font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
              tab === t.key ? 'bg-goal-red text-white' : 'bg-rink-lighter text-ice-muted hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div>
          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-rink-light border border-rink-border rounded-lg p-4 text-center">
              <p className="font-display text-2xl sm:text-3xl font-bold text-white">{teams.length}</p>
              <p className="text-ice-muted text-xs uppercase tracking-wider font-semibold">Lag</p>
            </div>
            <div className="bg-rink-light border border-rink-border rounded-lg p-4 text-center">
              <p className="font-display text-2xl sm:text-3xl font-bold text-white">{goalies.length}</p>
              <p className="text-ice-muted text-xs uppercase tracking-wider font-semibold">Målvakter</p>
            </div>
            <div className="bg-rink-light border border-rink-border rounded-lg p-4 text-center">
              <p className="font-display text-2xl sm:text-3xl font-bold text-goal-red">{openRequests.length}</p>
              <p className="text-ice-muted text-xs uppercase tracking-wider font-semibold">Söker målvakt</p>
            </div>
            <div className="bg-rink-light border border-rink-border rounded-lg p-4 text-center">
              <p className="font-display text-2xl sm:text-3xl font-bold text-goal-green">{filledRequests.length}</p>
              <p className="text-ice-muted text-xs uppercase tracking-wider font-semibold">Tillsatta</p>
            </div>
          </div>

          {/* Detailed stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-rink-light border border-rink-border rounded-lg p-5">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4 text-ice-muted">Översikt</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ice-muted">Kommande tider</span>
                  <span className="text-white font-semibold">{upcomingSessions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ice-muted">Passerade tider</span>
                  <span className="text-white font-semibold">{pastSessions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ice-muted">Totalt svar från målvakter</span>
                  <span className="text-white font-semibold">{responses.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ice-muted">Favorit-kopplingar (lag→målvakt)</span>
                  <span className="text-white font-semibold">{favorites.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ice-muted">Favorit-kopplingar (målvakt→lag)</span>
                  <span className="text-white font-semibold">{goalieFavorites.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ice-muted">Tillgängliga målvakter</span>
                  <span className="text-goal-green font-semibold">{availableGoalies.length} av {goalies.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-rink-light border border-rink-border rounded-lg p-5">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4 text-ice-muted">Senaste 7 dagarna</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ice-muted">Nya lag</span>
                  <span className={`font-semibold ${newTeamsThisWeek.length > 0 ? 'text-goal-green' : 'text-white'}`}>{newTeamsThisWeek.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ice-muted">Nya målvakter</span>
                  <span className={`font-semibold ${newGoaliesThisWeek.length > 0 ? 'text-goal-green' : 'text-white'}`}>{newGoaliesThisWeek.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ice-muted">Nya svar</span>
                  <span className={`font-semibold ${newResponsesThisWeek.length > 0 ? 'text-goal-green' : 'text-white'}`}>{newResponsesThisWeek.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-3 text-ice-muted">Senaste registreringar</h3>
          <div className="space-y-2">
            {[...teams.map(t => ({ type: 'lag', name: t.name, location: t.location, date: t.created_at })),
              ...goalies.map(g => ({ type: 'målvakt', name: g.name, location: g.location, date: g.created_at }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8).map((item, i) => (
              <div key={i} className="bg-rink-light border border-rink-border rounded-lg p-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${item.type === 'lag' ? 'bg-jersey-blue/20 text-jersey-blue' : 'bg-goal-green/20 text-goal-green'}`}>
                    {item.type}
                  </span>
                  <span className="text-white font-medium">{item.name}</span>
                  <span className="text-ice-muted">{item.location}</span>
                </div>
                <span className="text-ice-muted text-xs">{new Date(item.date).toLocaleDateString('sv-SE')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'teams' && (
        <div className="space-y-3">
          {teams.map(t => (
            <div key={t.id} className="bg-rink-light border border-rink-border rounded-lg p-4">
              {editingItem === t.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Lagnamn"
                      className="bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
                    <input value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} placeholder="Ort"
                      className="bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
                    <input value={editForm.contact_name || ''} onChange={e => setEditForm({...editForm, contact_name: e.target.value})} placeholder="Kontaktperson"
                      className="bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
                    <input value={editForm.contact_email || ''} onChange={e => setEditForm({...editForm, contact_email: e.target.value})} placeholder="E-post"
                      className="bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveTeam} className="px-3 py-1.5 bg-goal-green text-white rounded text-xs font-semibold uppercase tracking-wider cursor-pointer">Spara</button>
                    <button onClick={() => setEditingItem(null)} className="px-3 py-1.5 bg-rink-lighter text-ice-muted rounded text-xs font-semibold uppercase tracking-wider cursor-pointer">Avbryt</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-sm text-ice-muted">{t.type} &middot; {t.location} &middot; {t.contact_name} ({t.contact_email})</p>
                    <p className="text-xs text-ice-muted mt-1 font-mono">ID: {t.id}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <button onClick={() => { setEditingItem(t.id); setEditForm({...t}) }}
                      className="px-3 py-1.5 bg-jersey-blue/20 text-jersey-blue rounded text-xs font-semibold uppercase tracking-wider hover:bg-jersey-blue/30 transition-colors cursor-pointer">
                      Redigera
                    </button>
                    <button onClick={() => deleteTeam(t.id)}
                      className="px-3 py-1.5 bg-goal-red/20 text-goal-red rounded text-xs font-semibold uppercase tracking-wider hover:bg-goal-red/40 transition-colors cursor-pointer">
                      Radera
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {teams.length === 0 && <p className="text-ice-muted">Inga lag registrerade.</p>}
        </div>
      )}

      {tab === 'goalies' && (
        <div className="space-y-3">
          {goalies.map(g => (
            <div key={g.id} className="bg-rink-light border border-rink-border rounded-lg p-4">
              {editingItem === g.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Namn"
                      className="bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
                    <input value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} placeholder="E-post"
                      className="bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
                    <input value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="Telefon"
                      className="bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
                    <input value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} placeholder="Ort"
                      className="bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
                    <input value={editForm.region || ''} onChange={e => setEditForm({...editForm, region: e.target.value})} placeholder="Region"
                      className="bg-rink-lighter rounded border border-rink-border px-3 py-2 text-white text-sm" />
                    <label className="flex items-center gap-2 text-sm text-ice-muted px-3 py-2">
                      <input type="checkbox" checked={editForm.available || false} onChange={e => setEditForm({...editForm, available: e.target.checked})} />
                      Tillgänglig
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveGoalie} className="px-3 py-1.5 bg-goal-green text-white rounded text-xs font-semibold uppercase tracking-wider cursor-pointer">Spara</button>
                    <button onClick={() => setEditingItem(null)} className="px-3 py-1.5 bg-rink-lighter text-ice-muted rounded text-xs font-semibold uppercase tracking-wider cursor-pointer">Avbryt</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      {g.name}
                      <span className={`ml-2 inline-block w-2 h-2 rounded-full ${g.available ? 'bg-goal-green' : 'bg-ice-muted/40'}`} />
                    </p>
                    <p className="text-sm text-ice-muted">{g.location} · {g.email}{g.phone && <> · {g.phone}</>}</p>
                    <p className="text-xs text-ice-muted mt-1 font-mono">ID: {g.id}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <button onClick={() => { setEditingItem(g.id); setEditForm({...g}) }}
                      className="px-3 py-1.5 bg-jersey-blue/20 text-jersey-blue rounded text-xs font-semibold uppercase tracking-wider hover:bg-jersey-blue/30 transition-colors cursor-pointer">
                      Redigera
                    </button>
                    <button onClick={() => deleteGoalie(g.id)}
                      className="px-3 py-1.5 bg-goal-red/20 text-goal-red rounded text-xs font-semibold uppercase tracking-wider hover:bg-goal-red/40 transition-colors cursor-pointer">
                      Radera
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {goalies.length === 0 && <p className="text-ice-muted">Inga målvakter registrerade.</p>}
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="bg-rink-light border border-rink-border rounded-lg p-4 flex items-start justify-between">
              <div>
                <p className="font-semibold text-white">
                  {r.teams?.name || 'Okänt lag'}
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                    r.status === 'open' ? 'bg-goal-red/15 text-goal-red-light' : r.status === 'filled' ? 'bg-goal-green/15 text-goal-green' : 'bg-rink-lighter text-ice-muted'
                  }`}>{r.status}</span>
                  <span className="ml-2 px-2 py-0.5 rounded text-xs bg-jersey-blue/10 text-jersey-blue">{r.type}</span>
                </p>
                <p className="text-sm text-ice-muted">
                  {r.sessions?.date} {r.sessions?.time} @ {r.sessions?.rink}
                  {r.responses?.[0]?.count > 0 && ` — ${r.responses[0].count} svar`}
                </p>
                <p className="text-xs text-ice-muted mt-1 font-mono">ID: {r.id}</p>
              </div>
              <button onClick={() => deleteRequest(r.id)}
                className="px-3 py-1.5 bg-goal-red/20 text-goal-red rounded text-xs font-semibold uppercase tracking-wider hover:bg-goal-red/40 transition-colors cursor-pointer">
                Radera
              </button>
            </div>
          ))}
          {requests.length === 0 && <p className="text-ice-muted">Inga förfrågningar.</p>}
        </div>
      )}

      {tab === 'analytics' && (
        <div>
          <a
            href="https://cloud.umami.is"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-jersey-blue text-puck rounded text-sm font-semibold uppercase tracking-wider hover:bg-jersey-blue-light transition-colors no-underline mb-8"
          >
            Öppna Umami Dashboard →
          </a>

          <div className="bg-rink-light border border-rink-border rounded-lg p-5 mb-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4 text-white">Vad ska jag titta på?</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-white font-semibold mb-1">1. Besökare per vecka — växer vi?</p>
                <p className="text-ice-muted">0-10: Sprid länken mer. 10-50: Bra start. 50+: Appen har dragkraft.</p>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">2. Vilka sidor besöks mest?</p>
                <p className="text-ice-muted">Många på Hem men få på /team? Startsidan övertygar inte. Många på /team men få på /goalie? Målvakterna hittar inte dit.</p>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">3. Mobil vs desktop</p>
                <p className="text-ice-muted">Om 80% är mobil — bra, vi har byggt mobile-first. Om 80% desktop — folk delar nog länken via dator.</p>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">4. Referrers — var kommer folk ifrån?</p>
                <p className="text-ice-muted">Direkt = de har länken. Google = folk söker. Instagram/Facebook = sociala medier funkar.</p>
              </div>
            </div>
          </div>

          <div className="bg-rink-light border border-rink-border rounded-lg p-5">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4 text-white">Veckorutin</h3>
            <div className="space-y-2 text-sm text-ice-muted">
              <p>1. Logga in på Umami en gång i veckan</p>
              <p>2. Kolla antal besökare — trend uppåt eller ner?</p>
              <p>3. Kolla populäraste sidorna — matchar det vad vi vill?</p>
              <p>4. Notera om något sticker ut — t.ex. plötslig ökning eller tapp</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'support' && (
        <div className="space-y-3">
          <div className="bg-rink-light border border-rink-border rounded-lg p-5 mb-4">
            <p className="text-white font-semibold text-lg">{supportCount} klick</p>
            <p className="text-ice-muted text-sm">på "Stöd oss med en kaffe"</p>
          </div>
          {supportClicks.map(s => (
            <div key={s.id} className="bg-rink-light border border-rink-border rounded-lg p-4">
              <p className="text-white font-semibold">{s.user_email || 'Anonym besökare'}</p>
              <p className="text-xs text-ice-muted">{new Date(s.created_at).toLocaleString('sv-SE')}</p>
            </div>
          ))}
          {supportClicks.length === 0 && <p className="text-ice-muted">Inga klick ännu.</p>}
        </div>
      )}

      {tab === 'brand' && (
        <div className="space-y-10">
          <p className="text-ice-muted text-sm">Intern sida — syns bara för admin. Jämför varumärkesförslag visuellt.</p>

          {/* Sida vid sida jämförelse */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ice-muted mb-4">Jämförelse</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-ice-muted text-xs uppercase tracking-wider mb-2 font-semibold">Nuvarande</p>
                <div className="bg-puck border border-rink-border rounded-lg p-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-goal-red rounded-lg flex items-center justify-center font-display text-xl font-bold text-white shrink-0">H</div>
                  <div>
                    <p className="font-display text-xl font-bold uppercase tracking-tight text-white leading-none">Hobbyhockey</p>
                    <p className="text-ice-muted text-[10px] font-semibold tracking-[0.18em] uppercase mt-1 leading-none">Hitta en målvakt</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-ice-muted text-xs uppercase tracking-wider mb-2 font-semibold">Förslag</p>
                <div className="bg-puck border border-goal-red/40 rounded-lg p-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-goal-red rounded-lg flex items-center justify-center font-display text-xl font-bold text-white shrink-0">H</div>
                  <div>
                    <p className="font-display text-xl font-bold uppercase tracking-tight text-white leading-none">HopInHockey</p>
                    <p className="text-ice-muted text-[10px] font-semibold tracking-[0.18em] uppercase mt-1 leading-none">Hitta en målvakt</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stor visning — favorit */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ice-muted mb-4">Förslag — stor visning</h3>
            <div className="bg-puck border border-rink-border rounded-lg p-8 sm:p-12 inline-flex items-center gap-5">
              <div className="w-12 h-12 bg-goal-red rounded-lg flex items-center justify-center font-display text-2xl font-bold text-white shrink-0">H</div>
              <div className="inline-flex flex-col">
                <p className="font-display text-[28px] sm:text-4xl font-bold uppercase text-white leading-none tracking-tight">HOP<span className="text-goal-red">IN</span>HOCKEY</p>
                <p className="text-ice-muted font-semibold uppercase leading-none mt-1.5 w-full text-justify" style={{fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 600}}>
                  <span style={{display: 'flex', justifyContent: 'space-between'}}>
                    {'HITTA EN MÅLVAKT'.split('').map((ch, i) => <span key={i}>{ch === ' ' ? '\u00A0' : ch}</span>)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Domän */}
          <div className="border-t border-rink-border pt-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ice-muted mb-3">Domän</h3>
            <p className="text-white font-semibold">hopinhockey.se</p>
            <p className="text-ice-muted text-sm mt-1">Kort, tydligt, hockey i namnet. H-ikonen behålls. "Hitta en målvakt" som tagline.</p>
          </div>
        </div>
      )}
      {tab === 'drift' && (
        <div className="space-y-8">
          <p className="text-ice-muted text-sm">Driftguide — allt du behöver för att sköta HopInHockey utan Claude Code.</p>

          {/* Tjänsteöversikt */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ice-muted mb-4">Externa tjänster</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="bg-rink-light border border-rink-border rounded-lg p-5">
                <h4 className="text-white font-semibold mb-1">Vercel</h4>
                <p className="text-ice-muted text-xs mb-3">Hosting och deployment. Auto-deploy vid push till main.</p>
                <a href="https://vercel.com/lianslabb-9090s-projects/hobbyhockey" target="_blank" rel="noopener" className="text-jersey-blue text-xs hover:text-jersey-blue-light transition-colors">Öppna dashboard →</a>
                <div className="mt-3 text-xs text-ice-muted space-y-1">
                  <p className="font-semibold text-white">Vanliga uppgifter:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Kolla deploy-status under Deployments</li>
                    <li>Domäninställningar under Settings → Domains</li>
                    <li>Env-variabler under Settings → Environment Variables</li>
                  </ol>
                </div>
              </div>

              <div className="bg-rink-light border border-rink-border rounded-lg p-5">
                <h4 className="text-white font-semibold mb-1">Supabase</h4>
                <p className="text-ice-muted text-xs mb-3">Databas, autentisering och Row Level Security.</p>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener" className="text-jersey-blue text-xs hover:text-jersey-blue-light transition-colors">Öppna dashboard →</a>
                <div className="mt-3 text-xs text-ice-muted space-y-1">
                  <p className="font-semibold text-white">Vanliga uppgifter:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Se/redigera användare: Authentication → Users</li>
                    <li>Köra SQL: SQL Editor (vänstermenyn)</li>
                    <li>Auth-inställningar: Authentication → URL Configuration</li>
                    <li>API-nycklar: Settings → API</li>
                  </ol>
                </div>
              </div>

              <div className="bg-rink-light border border-rink-border rounded-lg p-5">
                <h4 className="text-white font-semibold mb-1">GitHub</h4>
                <p className="text-ice-muted text-xs mb-3">Källkod och versionshantering.</p>
                <a href="https://github.com/lianslabb-wq/hobbyhockey" target="_blank" rel="noopener" className="text-jersey-blue text-xs hover:text-jersey-blue-light transition-colors">Öppna repo →</a>
                <div className="mt-3 text-xs text-ice-muted space-y-1">
                  <p className="font-semibold text-white">Viktigt:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Repo heter fortfarande "hobbyhockey" på GitHub</li>
                    <li>Push till main = auto-deploy till Vercel</li>
                    <li>All historik finns i git log</li>
                  </ol>
                </div>
              </div>

              <div className="bg-rink-light border border-rink-border rounded-lg p-5">
                <h4 className="text-white font-semibold mb-1">Loopia</h4>
                <p className="text-ice-muted text-xs mb-3">Domänregistrar för hopinhockey.se.</p>
                <a href="https://www.loopia.se/logiain/" target="_blank" rel="noopener" className="text-jersey-blue text-xs hover:text-jersey-blue-light transition-colors">Öppna kundzon →</a>
                <div className="mt-3 text-xs text-ice-muted space-y-1">
                  <p className="font-semibold text-white">Viktigt:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Namnservrar pekar till Vercel (ns1/ns2.vercel-dns.com)</li>
                    <li>Domänen förnyas årligen (~100-150 kr)</li>
                    <li>DNS hanteras av Vercel, inte Loopia</li>
                  </ol>
                </div>
              </div>

              <div className="bg-rink-light border border-rink-border rounded-lg p-5">
                <h4 className="text-white font-semibold mb-1">Umami</h4>
                <p className="text-ice-muted text-xs mb-3">Webbanalys — cookiefri besöksstatistik.</p>
                <a href="https://cloud.umami.is" target="_blank" rel="noopener" className="text-jersey-blue text-xs hover:text-jersey-blue-light transition-colors">Öppna dashboard →</a>
                <div className="mt-3 text-xs text-ice-muted space-y-1">
                  <p className="font-semibold text-white">Viktigt:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Script-ID: 1de76047-d4fe-4484-9d04-916929630f7e</li>
                    <li>Scriptet laddas i index.html</li>
                    <li>Ingen cookie-banner behövs (cookiefri)</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Env-variabler */}
          <div className="border-t border-rink-border pt-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ice-muted mb-4">Miljövariabler</h3>
            <div className="bg-rink-light border border-rink-border rounded-lg p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-rink-border">
                      <th className="text-left py-2 text-ice-muted font-semibold">Variabel</th>
                      <th className="text-left py-2 text-ice-muted font-semibold">Var den används</th>
                      <th className="text-left py-2 text-ice-muted font-semibold">Hittas i</th>
                    </tr>
                  </thead>
                  <tbody className="text-ice-muted">
                    <tr className="border-b border-rink-border/50">
                      <td className="py-2 text-white font-mono">VITE_SUPABASE_URL</td>
                      <td className="py-2">Supabase API-anslutning</td>
                      <td className="py-2">Supabase → Settings → API</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-white font-mono">VITE_SUPABASE_ANON_KEY</td>
                      <td className="py-2">Supabase publik nyckel</td>
                      <td className="py-2">Supabase → Settings → API</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-ice-muted text-xs mt-3">Uppdatera i Vercel: Settings → Environment Variables. Redeploy krävs efter ändring.</p>
            </div>
          </div>

          {/* Deploy-guide */}
          <div className="border-t border-rink-border pt-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ice-muted mb-4">Hur man deployar</h3>
            <div className="bg-rink-light border border-rink-border rounded-lg p-5 text-xs text-ice-muted space-y-2">
              <ol className="list-decimal list-inside space-y-2">
                <li>Gör ändringar i koden lokalt</li>
                <li><span className="text-white font-mono">git add .</span> → staga ändringarna</li>
                <li><span className="text-white font-mono">git commit -m "Beskrivning"</span> → committa</li>
                <li><span className="text-white font-mono">git push</span> → pushar till GitHub</li>
                <li>Vercel deployar automatiskt inom ~1 minut</li>
                <li>Kolla status på <a href="https://vercel.com/lianslabb-9090s-projects/hobbyhockey/deployments" target="_blank" rel="noopener" className="text-jersey-blue hover:text-jersey-blue-light transition-colors">Vercel Deployments</a></li>
              </ol>
            </div>
          </div>

          {/* Felsökning */}
          <div className="border-t border-rink-border pt-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ice-muted mb-4">Felsökning</h3>
            <div className="space-y-4">

              <div className="bg-rink-light border border-rink-border rounded-lg p-5">
                <h4 className="text-white font-semibold text-sm mb-2">Sidan visar gammal version / svart skärm</h4>
                <ol className="list-decimal list-inside text-xs text-ice-muted space-y-1">
                  <li>Tryck <span className="text-white">Cmd+Shift+R</span> (hård omladdning)</li>
                  <li>Rensa cache: Chrome → Inställningar → Rensa webbdata</li>
                  <li>Kolla att senaste deploy lyckades på <a href="https://vercel.com/lianslabb-9090s-projects/hobbyhockey/deployments" target="_blank" rel="noopener" className="text-jersey-blue hover:text-jersey-blue-light transition-colors">Vercel</a></li>
                </ol>
              </div>

              <div className="bg-rink-light border border-rink-border rounded-lg p-5">
                <h4 className="text-white font-semibold text-sm mb-2">Användare kan inte registrera sig / "Rate limit"</h4>
                <ol className="list-decimal list-inside text-xs text-ice-muted space-y-1">
                  <li>Supabase Free har limit på 2 auth-mejl per timme</li>
                  <li>Användaren behöver vänta ~1 timme och försöka igen</li>
                  <li>Onboarda max 2 nya användare i taget</li>
                  <li>Vid skalning: uppgradera till Supabase Pro ($25/mån) eller lägg till Resend</li>
                </ol>
              </div>

              <div className="bg-rink-light border border-rink-border rounded-lg p-5">
                <h4 className="text-white font-semibold text-sm mb-2">Lösenordsåterställning fungerar inte</h4>
                <ol className="list-decimal list-inside text-xs text-ice-muted space-y-1">
                  <li>Gå till <a href="https://supabase.com/dashboard" target="_blank" rel="noopener" className="text-jersey-blue hover:text-jersey-blue-light transition-colors">Supabase</a> → Authentication → URL Configuration</li>
                  <li>Kontrollera att Site URL är <span className="text-white">https://hopinhockey.se</span></li>
                  <li>Kontrollera att <span className="text-white">https://hopinhockey.se</span> finns under Redirect URLs</li>
                  <li>Spara och testa igen</li>
                </ol>
              </div>

              <div className="bg-rink-light border border-rink-border rounded-lg p-5">
                <h4 className="text-white font-semibold text-sm mb-2">hopinhockey.se laddas inte</h4>
                <ol className="list-decimal list-inside text-xs text-ice-muted space-y-1">
                  <li>Kolla <a href="https://vercel.com/lianslabb-9090s-projects/hobbyhockey/settings/domains" target="_blank" rel="noopener" className="text-jersey-blue hover:text-jersey-blue-light transition-colors">Vercel → Domains</a> — ska vara gröna bockar</li>
                  <li>Om "Invalid Configuration": DNS har inte propagerat ännu (vänta)</li>
                  <li>Kolla att Loopia namnservrar fortfarande pekar på ns1/ns2.vercel-dns.com</li>
                  <li>hobbyhockey.vercel.app fungerar alltid som backup</li>
                </ol>
              </div>

              <div className="bg-rink-light border border-rink-border rounded-lg p-5">
                <h4 className="text-white font-semibold text-sm mb-2">Behöver ta bort en användare / lag / målvakt</h4>
                <ol className="list-decimal list-inside text-xs text-ice-muted space-y-1">
                  <li>Gå till Lag- eller Målvakts-fliken här i admin</li>
                  <li>Klicka "Radera" på rätt post</li>
                  <li>Favoriter och förfrågningar rensas automatiskt (cascade delete)</li>
                  <li>Auth-kontot finns kvar i Supabase — ta bort under Authentication → Users om det behövs</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Arkitekturöversikt */}
          <div className="border-t border-rink-border pt-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ice-muted mb-4">Arkitektur</h3>
            <div className="bg-rink-light border border-rink-border rounded-lg p-5 text-xs text-ice-muted space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-white font-semibold">Frontend:</span> React 19 + Vite 7</div>
                <div><span className="text-white font-semibold">Styling:</span> Tailwind CSS 4</div>
                <div><span className="text-white font-semibold">Backend:</span> Supabase (PostgreSQL)</div>
                <div><span className="text-white font-semibold">Auth:</span> Supabase Auth</div>
                <div><span className="text-white font-semibold">Hosting:</span> Vercel</div>
                <div><span className="text-white font-semibold">Domän:</span> hopinhockey.se (Loopia)</div>
                <div><span className="text-white font-semibold">Analys:</span> Umami (cookiefri)</div>
                <div><span className="text-white font-semibold">Repo:</span> github.com/lianslabb-wq/hobbyhockey</div>
              </div>
            </div>
          </div>

          {/* Databastabeller */}
          <div className="border-t border-rink-border pt-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ice-muted mb-4">Databastabeller</h3>
            <div className="bg-rink-light border border-rink-border rounded-lg p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-rink-border">
                      <th className="text-left py-2 text-ice-muted font-semibold">Tabell</th>
                      <th className="text-left py-2 text-ice-muted font-semibold">Beskrivning</th>
                    </tr>
                  </thead>
                  <tbody className="text-ice-muted">
                    <tr className="border-b border-rink-border/50"><td className="py-1.5 text-white font-mono">teams</td><td className="py-1.5">Registrerade lag</td></tr>
                    <tr className="border-b border-rink-border/50"><td className="py-1.5 text-white font-mono">goalies</td><td className="py-1.5">Registrerade målvakter</td></tr>
                    <tr className="border-b border-rink-border/50"><td className="py-1.5 text-white font-mono">sessions</td><td className="py-1.5">Istider (datum, tid, rink)</td></tr>
                    <tr className="border-b border-rink-border/50"><td className="py-1.5 text-white font-mono">requests</td><td className="py-1.5">Förfrågningar (kopplade till sessions)</td></tr>
                    <tr className="border-b border-rink-border/50"><td className="py-1.5 text-white font-mono">responses</td><td className="py-1.5">Målvaktssvar på förfrågningar</td></tr>
                    <tr className="border-b border-rink-border/50"><td className="py-1.5 text-white font-mono">favorites</td><td className="py-1.5">Lag → målvakt favoriter</td></tr>
                    <tr className="border-b border-rink-border/50"><td className="py-1.5 text-white font-mono">goalie_favorites</td><td className="py-1.5">Målvakt → lag favoriter</td></tr>
                    <tr className="border-b border-rink-border/50"><td className="py-1.5 text-white font-mono">goalie_directory</td><td className="py-1.5">View — begränsad målvaktsinfo för lag</td></tr>
                    <tr><td className="py-1.5 text-white font-mono">support_clicks</td><td className="py-1.5">Klick på "Stöd oss"</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Kontakter */}
          <div className="border-t border-rink-border pt-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ice-muted mb-4">Kontakter</h3>
            <div className="bg-rink-light border border-rink-border rounded-lg p-5 text-xs text-ice-muted space-y-2">
              <p><span className="text-white font-semibold">Admin-mejl:</span> lianslabb@gmail.com (hardcodad i is_admin())</p>
              <p><span className="text-white font-semibold">Kontaktmejl (publik):</span> lianslabb@gmail.com</p>
              <p><span className="text-white font-semibold">GTM:</span> Rickard</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
