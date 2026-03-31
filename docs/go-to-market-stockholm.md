# Hobbyhockey — Go-to-Market Plan Stockholm
*2026-03-31*

## Sammanfattning

Hobbyhockey är en MVP som kopplar ihop veteranhockeylag med tillgängliga målvakter. Plattformen är live på hobbyhockey.vercel.app med riktiga användare. Det finns noll konkurrerande plattformar i Sverige. Marknaden i Stockholm omfattar 165-225 hobby/veteranlag och uppskattningsvis 200-400 potentiella målvakter.

---

## Marknad

### Stockholm — bekräftade siffror

| Segment | Antal lag | Källa |
|---------|-----------|-------|
| SVIF veteranserier | 65 | vetshockey.se |
| Division 4-5 (vuxen hobby) | 80-120 | stockholmhockey.se |
| Rekreationshockey (RHL) | 10-20 | stockholmhockey.se |
| Korpen ishockey | 10-20 | korpen.se |
| **Totalt ishockey** | **165-225** | |

- 67 ishallar i Stockholmsregionen
- 1 650+ registrerade veteranspelare i SVIF
- 45 klubbar anslutna till SVIF

### Målvaktsbristen — bekräftad

- 30-50% av lagen saknar regelbundet målvakt på matchdagen
- SVIF har en specialregel: målvakter får spela i ålderskategorier 5 år yngre — direkt bevis på brist
- Utrustningskostnad (25 000-50 000 kr) är en stor barriär
- I Kanada har samma problem skapat företag: GoalieUp (2 000 målvakter), MyPuck (70 000+ matchningar)

### Konkurrens

**Noll** konkurrerande plattformar i Sverige för målvaktsmatchning.

---

## Teknisk kapacitet

| Resurs | Gratis-plan | Räcker för |
|--------|------------|------------|
| Databas (Supabase) | 500 MB | ~10 000 användare |
| API-anrop | 500 000/mån | ~200 dagligt aktiva |
| E-postbekräftelse | 2/timme (~48/dag) | Stegvis onboarding |
| Hosting (Vercel) | Obegränsat | Hela marknaden |

**Hela Stockholms-marknaden ryms inom gratis-plattformarna.**

---

## Tillväxtplan

### Fas 1: Seed (vecka 1-2)
**Mål: 5 lag + 10 målvakter**

- Bjud in 2-3 lag ni redan känner via personligt meddelande i lagchatt
- Bjud in 5-10 målvakter via SMS/meddelande
- Testa hela flödet: lag skapar tid → målvakt ser och svarar → matchning
- Samla feedback, justera

### Fas 2: Nätverkseffekt (vecka 3-6)
**Mål: 15 lag + 30 målvakter**

- Kontakta SVIF:s 45 klubbar (kontakter finns på klubbar.vetshockey.se)
- Posta i hockeyforum och Facebook-grupper
- Be varje nytt lag bjuda in 2 målvakter (viral loop)
- Kontakta hallansvariga — de vet vilka lag som söker

### Fas 3: Tillväxt (månad 2-3)
**Mål: 50 lag + 100 målvakter**

- Kontakta Stockholms Ishockeyförbund för samarbete
- Bredda till Rekreationshockeyligan (RHL)
- Inkludera Division 4-5-lagen
- Ev. köpa domän (hobbyhockey.se) och koppla Resend för fler mejl

### Fas 4: Skalning (månad 4-6)
**Mål: 100+ lag + 200+ målvakter**

- Expandera till andra regioner (Göteborg, Malmö)
- Uppgradera Supabase Pro (~250 kr/mån) vid behov
- Utvärdera intäktsmodell

---

## Nyckelprincip: Målvakter först

Det viktigaste är inte att få in lag — det är att få in målvakter. Lag registrerar sig för att de har ett problem. Målvakter registrerar sig om de ser att det finns tider att välja.

**Fokusera 70% av er energi på att rekrytera målvakter.**

---

## Kostnader

| Fas | Kostnad |
|-----|---------|
| Fas 1-2 (0-30 användare) | 0 kr |
| Fas 3 (30-200 användare) | 0-100 kr/år (domän) |
| Fas 4 (200+ användare) | ~250 kr/mån (Supabase Pro) |

---

## Intäktsmodeller (framtida)

| Modell | Uppskattning Stockholm |
|--------|----------------------|
| Matchningsavgift (lag betalar per match) | 165 lag × 20 matcher × 300 kr = ~1 M kr/år |
| Lagsäsongsabonnemang | 165 lag × 3 500 kr = ~580 000 kr/år |
| Målvaktsabonnemang (gratis/låg avgift) | Volymspel — monetisera lagsidan |

*Intäktsmodell bör valideras först. Fokus nu: användning och nätverkseffekt.*

---

## Risker och åtgärder

| Risk | Åtgärd |
|------|--------|
| För få målvakter registrerar sig | Aktivt rekrytera via personliga kontakter |
| Lag slutar använda appen | Push-notiser (framtida), påminnelser |
| Supabase pausar vid inaktivitet | Besök sajten 1 gång/vecka |
| E-post rate limit | Koppla Resend.com (gratis 100/dag) |

---

## Kontakt och resurser

- **Sajt:** hobbyhockey.vercel.app
- **Admin:** hobbyhockey.vercel.app/admin
- **Analytics:** cloud.umami.is
- **Kod:** github.com/lianslabb-wq/hobbyhockey
- **SVIF klubbar:** klubbar.vetshockey.se
- **Stockholms Ishockeyförbund:** stockholmhockey.se
