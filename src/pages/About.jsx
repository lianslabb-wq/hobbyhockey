import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUser } from '../lib/auth'
import { usePageMeta } from '../lib/usePageMeta'

const faq = [
  {
    q: 'Vad är HopInHockey?',
    a: 'HopInHockey är en gratis plattform som hjälper veteranhockeylag att hitta målvakt till träningar och matcher. Vi samlar lag och målvakter på ett ställe så att ni slipper jaga i SMS-trådar och gruppchatter.'
  },
  {
    q: 'Kostar det något att använda HopInHockey?',
    a: 'Nej, HopInHockey är helt gratis — både för lag och målvakter.'
  },
  {
    q: 'Varför inte bara använda SMS eller WhatsApp?',
    a: 'I en SMS-kedja eller WhatsApp-grupp når du bara de kontakter du redan har. Med HopInHockey når du alla registrerade målvakter i nätverket samtidigt. Du behöver inte veta vem som är ledig — de ser din förfrågan och svarar själva. Många förfrågningar löses inom ett par minuter. Dessutom kan lag spara favoritmålvakter och målvakter kan favoritmarkera lag — så bygger ni upp en relation över tid.'
  },
  {
    q: 'Hur snabbt kan jag hitta en målvakt?',
    a: 'Så fort en målvakt svarar på din förfrågan. Systemet bygger på först till kvarn — den första målvakten som svarar får platsen, och bekräftelse skickas direkt. Många förfrågningar löses inom ett par minuter.'
  },
  {
    q: 'Jag är målvakt — hur fungerar det för mig?',
    a: 'Registrera dig som målvakt och du ser direkt vilka lag som söker. Du kan favoritmarkera lag du gillar, och svara på förfrågningar med ett klick. Du väljer själv när och var du vill spela.'
  },
  {
    q: 'Vilka lag kan använda HopInHockey?',
    a: 'Alla veteranhockeylag och hobbylag som spelar ishockey i Sverige. Oavsett nivå, division eller ort — om ni ibland saknar en målvakt är HopInHockey till för er.'
  },
  {
    q: 'Finns det något liknande för ishockeymålvakter i Sverige?',
    a: 'Det finns inga dedikerade målvaktsgrupper på Facebook eller andra plattformar som löser det här problemet. HopInHockey är byggt specifikt för att koppla ihop veteranhockeylag med tillgängliga målvakter.'
  },
{
    q: 'Hur registrerar jag mitt lag?',
    a: 'Klicka på "Vi saknar målvakt" på startsidan, skapa ett konto och registrera ditt lag. Sedan kan du direkt börja skapa förfrågningar med tid och plats för era istider.'
  },
]

export default function About() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)
  usePageMeta('Om HopInHockey — Hitta målvakt till veteranhockey i Sverige', 'HopInHockey kopplar ihop veteranhockeylag med målvakter i Sverige. Läs om hur det fungerar, vanliga frågor och kontakt.')

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
      <h1 className="font-display text-4xl font-bold uppercase tracking-tight mb-8">Om HopInHockey</h1>

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
            HopInHockey är en enkel plattform som kopplar ihop veteranhockeylag med tillgängliga målvakter.
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
            HopInHockey är ett projekt som föddes ur ett riktigt behov på isen. Vi bygger det
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

        <section className="pt-6 border-t border-rink-border">
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-4">Vanliga frågor</h2>
          <div className="space-y-2">
            {faq.map((item, i) => (
              <div key={i} className="bg-rink-light border border-rink-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-4 py-3 flex justify-between items-center bg-transparent border-none cursor-pointer text-white text-sm font-semibold hover:text-jersey-blue transition-colors"
                >
                  {item.q}
                  <span className="text-ice-muted ml-2 shrink-0">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <p className="px-4 pb-3 text-sm text-ice-muted leading-relaxed">{item.a}</p>
                )}
              </div>
            ))}
          </div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': faq.map(item => ({
              '@type': 'Question',
              'name': item.q,
              'acceptedAnswer': { '@type': 'Answer', 'text': item.a }
            }))
          })}} />
        </section>
      </div>
    </div>
  )
}
