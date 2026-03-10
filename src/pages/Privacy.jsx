export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="font-display text-4xl font-bold uppercase tracking-tight mb-8">Integritetspolicy</h1>

      <div className="space-y-8 text-ice-muted leading-relaxed">
        <section>
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-3">Vem ansvarar för dina uppgifter?</h2>
          <p>
            Hobbyhockey är ett ideellt projekt utan organisationsnummer. Ansvarig för behandlingen av
            personuppgifter är projektets grundare. Vid frågor, kontakta oss på{' '}
            <a href="mailto:lianslabb@gmail.com" className="text-jersey-blue hover:text-jersey-blue-light transition-colors">
              lianslabb@gmail.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-3">Vilka uppgifter samlar vi in?</h2>
          <p className="mb-3">Vi samlar bara in det som behövs för att tjänsten ska fungera:</p>
          <div className="bg-rink-light border border-rink-border rounded-lg p-5 space-y-3">
            <div>
              <p className="text-white font-semibold">Lag</p>
              <p className="text-sm">Lagnamn, typ, ort, kontaktperson, kontakt-e-post</p>
            </div>
            <div>
              <p className="text-white font-semibold">Målvakter</p>
              <p className="text-sm">Namn, e-post, telefon (valfritt), ort, hemadress (valfritt)</p>
            </div>
            <div>
              <p className="text-white font-semibold">Konto</p>
              <p className="text-sm">E-post och lösenord (krypterat) vid registrering</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-3">Varför samlar vi in det?</h2>
          <p>
            Syftet är att koppla ihop lag som saknar målvakt med tillgängliga målvakter.
            Vi använder dina uppgifter enbart för att tjänsten ska fungera — aldrig för
            marknadsföring, aldrig för att sälja vidare, aldrig för att dela med tredje part.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-3">Vem kan se dina uppgifter?</h2>
          <div className="bg-rink-light border border-rink-border rounded-lg p-5 space-y-3">
            <div>
              <p className="text-white font-semibold">Din fullständiga profil</p>
              <p className="text-sm">Bara du själv ser alla dina uppgifter (e-post, telefon, adress).</p>
            </div>
            <div>
              <p className="text-white font-semibold">Andra inloggade användare</p>
              <p className="text-sm">Ser bara ditt namn och ort — aldrig e-post, telefon eller adress.</p>
            </div>
            <div>
              <p className="text-white font-semibold">Utan inloggning</p>
              <p className="text-sm">Ingen data är tillgänglig alls. Allt kräver inloggning.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-3">Var lagras dina uppgifter?</h2>
          <p>
            All data lagras hos Supabase på servrar inom EU (Irland). Lösenord krypteras
            och lagras aldrig i klartext. Vi har aldrig tillgång till ditt lösenord.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-3">Hur länge sparar vi dina uppgifter?</h2>
          <p>
            Så länge du har ett aktivt konto. Om du vill att vi raderar allt, kontakta oss
            så tar vi bort dina uppgifter inom 30 dagar.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-3">Dina rättigheter</h2>
          <p>Enligt GDPR har du rätt att:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Få veta vilka uppgifter vi har om dig</li>
            <li>Rätta felaktiga uppgifter</li>
            <li>Begära att vi raderar alla dina uppgifter</li>
            <li>Återkalla ditt samtycke när som helst</li>
          </ul>
          <p className="mt-3">
            Kontakta{' '}
            <a href="mailto:lianslabb@gmail.com" className="text-jersey-blue hover:text-jersey-blue-light transition-colors">
              lianslabb@gmail.com
            </a>{' '}
            så hjälper vi dig.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider mb-3">Kakor</h2>
          <p>
            Vi använder inga tredjepartskakor och spårar dig inte. Den enda kakan som
            sätts är för din inloggningssession — den försvinner när du loggar ut.
          </p>
        </section>

        <section className="bg-rink-light border border-rink-border rounded-lg p-5">
          <p className="text-ice-muted/80 text-sm">
            Senast uppdaterad: mars 2026. Vi meddelar registrerade användare om policyn ändras väsentligt.
          </p>
        </section>
      </div>
    </div>
  )
}
