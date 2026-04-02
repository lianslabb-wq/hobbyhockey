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
            WhatsApp-grupper och Facebook-grupper. Ibland hittar man någon, ibland står laget utan målvakt.
          </p>
          <p className="mt-3">
            Det finns inga målvaktsgrupper på Facebook som löser problemet. SMS-kedjor når bara de
            kontakter man redan har. Veteranhockeylag i hela Sverige står inför samma utmaning varje vecka.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-3">Lösningen</h2>
          <p>
            Hobbyhockey är en gratis plattform som kopplar ihop veteranhockeylag och korphockeylag med
            tillgängliga målvakter. När ditt lag saknar en målvakt till nästa träning eller match, skicka ut
            en förfrågan — till dina favoritmålvakter eller till hela nätverket. Först till kvarn får platsen.
            Många förfrågningar löses inom ett par minuter.
          </p>
          <p className="mt-3">
            Istället för att jaga i SMS-trådar och gruppchatter samlar Hobbyhockey allt på ett ställe.
            Du når fler målvakter snabbare, och målvakter kan själva välja vilka lag de vill spela med.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-3">För vem?</h2>
          <p>
            Hobbyhockey riktar sig till veteran- och rekreationshockey i Sverige — veteranlag, korplag,
            hobbylag och alla som spelar ishockey för nöjes skull. Organiserad hockey har spelarregistrering
            som binder spelare till lag över en hel säsong. I veteranhockeyn är det friare — och behovet
            av att hitta en målvakt med kort varsel är stort.
          </p>
          <p className="mt-3">
            Är du målvakt och vill hitta istid? Registrera dig och se vilka lag i ditt område som behöver dig.
            Är du lagledare och söker målvakt? Skapa en förfrågan och nå alla tillgängliga målvakter direkt.
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
