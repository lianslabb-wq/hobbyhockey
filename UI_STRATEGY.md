# Hobbyhockey — UI/UX-strategi

## Designprinciper
- Mörk, professionell hockeykänsla
- Enkel och intuitiv — minsta möjliga steg till mål
- Konsekvent visuellt språk över alla sidor
- WCAG AA-tillgänglighet som minimum

---

## Färghierarki

| Syfte | Färg | Hex | Användning |
|-------|------|-----|------------|
| **Primär CTA** | `goal-red` | #c8102e | Huvudknappar: Registrera, Logga in, Sök målvakt, Skapa profil |
| **Sekundär CTA** | `jersey-blue` | #00b4d8 | Mjukare actions: Stöd oss, Hitta istid, textlänkar |
| **Status: positiv** | `goal-green` | #00c853 | Enbart statusindikering: "Tillgänglig"-prick, "Tillsatt"-badge |
| **Bakgrund** | `rink` | #0a0a0a | Huvudbakgrund |
| **Kort/ytor** | `rink-light` | #141414 | Kort, formulär, sektioner |
| **Hover/sekundär yta** | `rink-lighter` | #222222 | Sekundära knappar, hover-states |
| **Ramar** | `rink-border` | #2a2a2a | Alla borders |

### Färgregler
- **Röd = handling** — "gör detta nu" (registrera, logga in, sök, skapa)
- **Blå = mjuk inbjudan** — "om du vill" (stöd oss, hitta istid, info-länkar)
- **Grön = aldrig som knapp** — enbart som statussignal (prickar, badges)
- **Guld/orange** — reserverad för framtida användning

---

## Typografi

| Element | Font | Stil |
|---------|------|------|
| Logo, rubriker, badges, stegnummer | Oswald (`font-display`) | Bold, uppercase, tight tracking |
| Brödtext, formulär, knappar, labels | Inter (`font-sans`) | Regular/semibold |
| Formulärlabels | Inter | xs, uppercase, tracking-wider, semibold |

### Regler
- Rubriker är ALLTID uppercase + Oswald
- Brödtext är ALLTID normal case + Inter
- Knappar: uppercase + Inter + semibold + tracking-wider

---

## Textkontrast (WCAG AA mot #0a0a0a)

| Nivå | Klass | Användning |
|------|-------|------------|
| Primär | `text-white` | Rubriker, data, knapptext, viktiga värden |
| Sekundär | `text-ice-muted` | Brödtext, beskrivningar, undertitlar |
| Tertiär | `text-ice-muted/80` | Labels, hjälptext, metadata, timestamps |
| Lägsta tillåtna | `text-ice-muted/70` | Enbart icke-essentiell info (t.ex. ID-nummer i admin) |

**Aldrig under /70** — klarar inte WCAG AA.

---

## Knappar

| Typ | Stil | Hover | Exempel |
|-----|------|-------|---------|
| Primär | `bg-goal-red text-white` | `bg-goal-red-light` | Registrera lag, Skapa profil, Sök målvakt, Logga in |
| Sekundär (inbjudan) | `bg-jersey-blue text-puck` | `bg-jersey-blue-light` | Stöd oss, Hitta istid |
| Tertiär | `bg-rink-lighter text-ice-muted` | `text-white` | Logga ut, Avbryt, Lägg till |
| Destruktiv (admin) | `bg-goal-red/20 text-goal-red` | `bg-goal-red/40` | Radera |
| Statusknapp (aktiv) | `bg-goal-green text-white` | `bg-goal-green/80` | Tillgänglig (toggle) |

### Knappformat
- Padding: `px-5 py-2.5` (standard), `px-6 py-3` (stor CTA)
- Text: `text-sm font-semibold uppercase tracking-wider`
- Rundning: `rounded`
- Alltid: `cursor-pointer transition-colors`

---

## Kort

- Bakgrund: `bg-rink-light`
- Ram: `border border-rink-border`
- Rundning: `rounded-lg`
- Padding: `p-4` (kompakt) till `p-6` (rymlig)
- Hover: `hover:border-rink-lighter` (subtil feedback)
- CTA-kort på startsidan: hover med färgad vänsterkant + border-highlight

---

## Formulär

- Input-fält: `bg-rink border-rink-border text-white rounded px-3 py-2.5 text-sm`
- Labels: `text-xs text-ice-muted/80 uppercase tracking-wider mb-1.5 block`
- Hjälptext: `text-xs text-ice-muted mt-1.5`
- Felmeddelande: `text-goal-red text-sm`
- Container: `bg-rink-light border border-rink-border rounded-lg p-6 space-y-4`

---

## Layout

| Kontext | Max bredd | Grid |
|---------|-----------|------|
| Dashboards (lag/målvakt) | `max-w-6xl` | `lg:grid-cols-3` (2+1) |
| Formulär, registrering | `max-w-md` / `max-w-lg` | Enkel kolumn |
| Info-sidor (Om oss) | `max-w-2xl` | Enkel kolumn |
| Startsida hero | `max-w-5xl` | `lg:grid-cols-2` |

### Spacing
- Mellan kort: `space-y-4`
- Grid-gap: `gap-6`
- Sektioner: `mb-16` (stor), `mb-8` (medium)
- Sida-padding: `px-4 py-8`

---

## Statusbadges

| Status | Stil |
|--------|------|
| Söker (open) | `bg-goal-red/15 text-goal-red-light border-goal-red/30` |
| Tillsatt (filled) | `bg-goal-green/15 text-goal-green border-goal-green/30` |
| Avbokad (cancelled) | `bg-rink-lighter text-ice-muted border-rink-border` |
| Typ: Riktad | `bg-jersey-blue/10 text-jersey-blue border-jersey-blue/30` |
| Typ: Öppen | `bg-jersey-blue/10 text-jersey-blue border-jersey-blue/30` |

---

## Navigering

- Aktiv sida: `text-white border-b-2 border-goal-red`
- Inaktiv: `text-ice-muted hover:text-white`
- Logo: Oswald bold + röd "H"-ikon
- Subtitel under logo: `text-[10px] font-semibold uppercase tracking-[0.2em] text-ice-muted`

---

## Sidspecifika mönster

### Startsidan
- Hero: text vänster, bild höger med fade-to-black
- Två CTA-kort: röd (lag) + blå (målvakt) med vänsterkant-accent
- "Så här funkar det": 01/02/03 i goal-red

### Dashboards (lag/målvakt)
- Header: Namn + metadata vänster, action-knappar höger
- Huvudinnehåll (2/3) + sidopanel (1/3)
- Sidopanel: profil, favoriter, tider

### Om oss
- Rent textinnehåll med sektionsrubriker
- Kontaktruta med kort-styling
- Stöd-CTA i jersey-blue (mjuk inbjudan, inte påträngande)

### Admin
- Dold sida (/admin, ej i nav)
- Flik-navigering: Lag / Målvakter / Förfrågningar
- Varje rad: data + radera-knapp
