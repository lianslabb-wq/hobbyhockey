import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUser } from '../lib/auth'

export default function About() {
  const navigate = useNavigate()

  async function handleSupportClick(e) {
    e.preventDefault()
    const user = await getUser()
    await supabase.from('support_clicks').insert({
      user_email: user?.email || null,
    })
    navigate('/tack')
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="font-display text-4xl font-bold uppercase tracking-tight mb-8">Om Hobbyhockey</h1>

      <div className="space-y-8 text-ice-muted leading-relaxed">
        <section>
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-3">Problemet</h2>
          <p>
            Du känner till det: det är tisdag eftermiddag och Robban inser att ingen av lagets två målvakter
            kan komma till träningen ikväll. Nu börjar den stressiga jakten — sms, samtal, meddelanden i
            gruppchatter. Ibland hittar man någon, ibland står laget utan målvakt.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-3">Lösningen</h2>
          <p>
            Hobbyhockey är en enkel plattform som kopplar ihop veteranhockeylag med tillgängliga målvakter.
            När ditt lag saknar en målvakt, skicka ut en förfrågan — till dina favoriter eller till hela nätverket.
            Först till kvarn får platsen, övriga blir standby.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-3">För vem?</h2>
          <p>
            Vi riktar oss till veteran- och rekreationshockey i Sverige. Organiserad hockey har
            spelarregistrering som binder spelare till lag över en hel säsong. I veteranhockeyn är
            det friare — och behovet av ad hoc-målvakter är stort.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-3">Vilka är vi?</h2>
          <p>
            Hobbyhockey är ett projekt som föddes ur ett riktigt behov på isen. Vi bygger det
            här för att göra det enklare för alla att spela hockey — utan stress.
          </p>
        </section>

        <section className="bg-rink-light border border-rink-border rounded-lg p-6">
          <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-3">Kontakt</h2>
          <p className="mb-2">
            Har du frågor, feedback eller vill testa med ditt lag?
          </p>
          <a href="mailto:lianslabb@gmail.com" className="text-jersey-blue hover:text-jersey-blue-light transition-colors">
            lianslabb@gmail.com
          </a>
        </section>

        <section className="text-center pt-6 border-t border-rink-border">
          <p className="text-ice-muted text-sm mb-4 font-semibold uppercase tracking-wider">Gillar du vad vi bygger?</p>
          <button
            onClick={handleSupportClick}
            className="px-6 py-3 bg-goal-red text-white font-semibold rounded text-sm uppercase tracking-wider hover:bg-goal-red-light transition-colors cursor-pointer"
          >
            Stöd oss med en kaffe
          </button>
        </section>
      </div>
    </div>
  )
}
