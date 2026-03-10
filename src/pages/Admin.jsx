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

  async function deleteTeam(id) {
    if (!confirm('Radera laget och alla dess tider, förfrågningar och favoriter?')) return
    await supabase.from('teams').delete().eq('id', id)
    loadAll()
  }

  async function deleteGoalie(id) {
    if (!confirm('Radera denna målvakt och alla dess svar?')) return
    await supabase.from('goalies').delete().eq('id', id)
    loadAll()
  }

  async function deleteRequest(id) {
    if (!confirm('Radera denna förfrågan?')) return
    await supabase.from('requests').delete().eq('id', id)
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
        <div className="flex gap-2">
          <button onClick={loadAll}
            className="px-4 py-2 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
            Uppdatera
          </button>
          <button onClick={async () => { await signOut(); setUser(null) }}
            className="px-4 py-2 bg-rink-lighter text-ice-muted rounded text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
            Logga ut
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
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
            <div key={t.id} className="bg-rink-light border border-rink-border rounded-lg p-4 flex items-start justify-between">
              <div>
                <p className="font-semibold text-white">{t.name}</p>
                <p className="text-sm text-ice-muted">{t.type} &middot; {t.location} &middot; {t.contact_name} ({t.contact_email})</p>
                <p className="text-xs text-ice-muted/80 mt-1 font-mono">ID: {t.id}</p>
              </div>
              <button onClick={() => deleteTeam(t.id)}
                className="px-3 py-1.5 bg-goal-red/20 text-goal-red rounded text-xs font-semibold uppercase tracking-wider hover:bg-goal-red/40 transition-colors cursor-pointer">
                Radera
              </button>
            </div>
          ))}
          {teams.length === 0 && <p className="text-ice-muted/80">Inga lag registrerade.</p>}
        </div>
      )}

      {tab === 'goalies' && (
        <div className="space-y-3">
          {goalies.map(g => (
            <div key={g.id} className="bg-rink-light border border-rink-border rounded-lg p-4 flex items-start justify-between">
              <div>
                <p className="font-semibold text-white">
                  {g.name}
                  <span className={`ml-2 inline-block w-2 h-2 rounded-full ${g.available ? 'bg-goal-green' : 'bg-ice-muted/40'}`} />
                </p>
                <p className="text-sm text-ice-muted">{g.location} · {g.email}{g.phone && <> · {g.phone}</>}</p>
                <p className="text-xs text-ice-muted/80 mt-1 font-mono">ID: {g.id}</p>
              </div>
              <button onClick={() => deleteGoalie(g.id)}
                className="px-3 py-1.5 bg-goal-red/20 text-goal-red rounded text-xs font-semibold uppercase tracking-wider hover:bg-goal-red/40 transition-colors cursor-pointer">
                Radera
              </button>
            </div>
          ))}
          {goalies.length === 0 && <p className="text-ice-muted/80">Inga målvakter registrerade.</p>}
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
                <p className="text-xs text-ice-muted/80 mt-1 font-mono">ID: {r.id}</p>
              </div>
              <button onClick={() => deleteRequest(r.id)}
                className="px-3 py-1.5 bg-goal-red/20 text-goal-red rounded text-xs font-semibold uppercase tracking-wider hover:bg-goal-red/40 transition-colors cursor-pointer">
                Radera
              </button>
            </div>
          ))}
          {requests.length === 0 && <p className="text-ice-muted/80">Inga förfrågningar.</p>}
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
              <p className="text-xs text-ice-muted/80">{new Date(s.created_at).toLocaleString('sv-SE')}</p>
            </div>
          ))}
          {supportClicks.length === 0 && <p className="text-ice-muted/80">Inga klick ännu.</p>}
        </div>
      )}
    </div>
  )
}
