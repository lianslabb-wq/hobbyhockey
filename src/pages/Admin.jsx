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
  const [tab, setTab] = useState('teams')
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({})

  const [teams, setTeams] = useState([])
  const [goalies, setGoalies] = useState([])
  const [requests, setRequests] = useState([])
  const [supportClicks, setSupportClicks] = useState([])
  const [supportCount, setSupportCount] = useState(0)

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
    const [t, g, r, s] = await Promise.all([
      supabase.from('teams').select('*').order('created_at', { ascending: false }),
      supabase.from('goalies').select('*').order('created_at', { ascending: false }),
      supabase.from('requests').select('*, teams(name), sessions(date, time, rink), responses(count)').order('created_at', { ascending: false }),
      supabase.from('support_clicks').select('*').order('created_at', { ascending: false }),
    ])
    setTeams(t.data || [])
    setGoalies(g.data || [])
    setRequests(r.data || [])
    setSupportClicks(s.data || [])
    setSupportCount(s.data?.length || 0)
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

  const tabs = [
    { key: 'teams', label: `Lag (${teams.length})` },
    { key: 'goalies', label: `Målvakter (${goalies.length})` },
    { key: 'requests', label: `Förfrågningar (${requests.length})` },
    { key: 'support', label: `Stöd (${supportCount})` },
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
    </div>
  )
}
