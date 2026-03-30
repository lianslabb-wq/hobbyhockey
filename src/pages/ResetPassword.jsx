import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('ready') // ready, saving, done, error
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('saving')
    setError('')

    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message)
      setStatus('error')
      return
    }
    setStatus('done')
    setTimeout(() => navigate('/me'), 3000)
  }

  if (status === 'done') {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 bg-goal-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-goal-green text-2xl">✓</span>
        </div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight mb-2">Lösenord ändrat!</h1>
        <p className="text-ice-muted">Du skickas vidare till Min sida...</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight mb-2">Välj nytt lösenord</h1>
      <p className="text-ice-muted mb-6">Skriv in ditt nya lösenord nedan.</p>

      {error && <p className="text-goal-red mb-4 text-sm bg-goal-red/10 border border-goal-red/30 rounded-lg px-4 py-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-ice-muted mb-1.5 uppercase tracking-wider font-semibold">Nytt lösenord</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Minst 6 tecken"
            className="w-full bg-rink-lighter rounded border border-rink-border px-3 py-3 text-white text-sm"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={status === 'saving'}
          className="w-full py-3 bg-goal-red text-white rounded text-sm font-semibold uppercase tracking-wider hover:bg-goal-red-light transition-colors cursor-pointer disabled:opacity-50"
        >
          {status === 'saving' ? 'Sparar...' : 'Spara nytt lösenord'}
        </button>
      </form>
    </div>
  )
}
