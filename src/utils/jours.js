// SITRAC — Jours du voyage calculés à partir des dates (aucune saisie manuelle).
// Les dates arrivent au format « AAAA-MM-JJ » : elles sont lues en UTC pour
// éviter tout décalage d'un jour selon le fuseau horaire du poste.

const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const enDate = (s) => {
  if (!s) return null
  const [a, m, j] = String(s).slice(0, 10).split('-').map(Number)
  if (!a || !m || !j) return null
  return new Date(Date.UTC(a, m - 1, j))
}
const enTexte = (d) => d.toISOString().slice(0, 10)

/** « J3 · Mer » : numéro du jour dans le voyage + jour de la semaine (« Mer » seul sans date de début). */
export function libelleJour(date, debut) {
  const d = enDate(date)
  if (!d) return ''
  const semaine = JOURS[d.getUTCDay()]
  const d0 = enDate(debut)
  if (!d0) return semaine
  const n = Math.round((d - d0) / 86400000) + 1
  return n >= 1 ? `J${n} · ${semaine}` : semaine
}

/** Liste des dates du voyage, de la date de début à la date de fin incluses. */
export function datesDuVoyage(debut, fin) {
  const d0 = enDate(debut), d1 = enDate(fin)
  if (!d0 || !d1 || d1 < d0) return []
  const out = []
  for (let d = new Date(d0); d <= d1 && out.length < 120; d.setUTCDate(d.getUTCDate() + 1)) out.push(enTexte(d))
  return out
}
