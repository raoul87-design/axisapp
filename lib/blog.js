export const blogPosts = [
  {
    slug: "hoe-houd-je-klanten-accountable-tussen-sessies",
    title: "Hoe houd je als personal trainer je klanten accountable tussen sessies?",
    description: "De meeste klanten weten wat ze moeten doen. Het probleem is de opvolging tussen jouw sessies. Zo pak je dat aan als personal trainer.",
    date: "2026-05-11",
    readTime: "4 min",
    content: `
## Het probleem dat elke personal trainer kent

Je klant heeft een geweldige sessie. Motivatie hoog, plan helder. Drie dagen later hoor je niets meer — en bij de volgende sessie blijkt dat ze de helft niet hebben gedaan.

Dit is niet een motivatieprobleem. Het is een systeem probleem.

## Wat er gebeurt tussen sessies

Zonder dagelijkse structuur valt consistentie weg. Niet omdat je klant het niet wil, maar omdat er geen enkel mechanisme is dat hen eraan herinnert dat ze zich hebben gecommitteerd.

De meeste coaches sturen een WhatsApp-berichtje of hopen dat hun klant de app opent. Beide werken niet structureel.

## Wat wel werkt: dagelijkse micro-accountability

Onderzoek naar gedragsverandering laat consistent zien dat kleine dagelijkse check-ins effectiever zijn dan wekelijkse grote evaluaties. Het gaat niet om controle — het gaat om structuur.

Een dagelijkse commitment heeft drie elementen:
- **Concreet**: niet "gezond eten" maar "800 kcal lunch, geen snacks"
- **Geregistreerd**: ergens opgeschreven, bij voorkeur naar iemand gestuurd
- **Gevolgd**: aan het eind van de dag een eerlijk antwoord: gedaan of niet?

## WhatsApp als accountability tool

Bijna elke Nederlander heeft WhatsApp. Geen nieuwe app nodig, geen gedoe met inloggen. Als coach kun je je klanten vragen om elke ochtend één bericht te sturen: wat ga je vandaag doen?

Het nadeel: dit handmatig bijhouden voor 20+ klanten is niet schaalbaar.

## Automatisering zonder het menselijke te verliezen

De sleutel is een systeem dat de structuur levert, maar de coaching bij jou laat. Automatische ochtend check-ins, tracking van wie reageert en wie niet, en een dashboard zodat jij in één oogopslag ziet wie aandacht nodig heeft.

Zo besteed jij je tijd aan de klanten die het nodig hebben — niet aan het najagen van updates.

## Conclusie

Accountability tussen sessies is waar het verschil wordt gemaakt. Klanten die dagelijks inchecken presteren aantoonbaar beter. Als personal trainer kun je dat systeem zijn — of je kunt een systeem gebruiken dat het voor je doet.

AXIS is gebouwd voor precies dit probleem.
    `,
  },
]

export function getPostBySlug(slug) {
  return blogPosts.find((p) => p.slug === slug)
}
