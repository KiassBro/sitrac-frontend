/**
 * SITRAC — Client HTTP de l'espace client.
 *
 * Volontairement séparé de utils/api.js : le jeton du portail n'est jamais
 * mélangé avec celui du personnel (clé de stockage différente, sessionStorage
 * — effacé à la fermeture de l'onglet — et aucune tentative de « refresh »).
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const CLE = 'sitrac_portail_session'

export const SessionPortail = {
  get() {
    try {
      const s = JSON.parse(sessionStorage.getItem(CLE) || 'null')
      if (!s || new Date(s.expire_le) <= new Date()) return null
      return s
    } catch { return null }
  },
  set(data) { sessionStorage.setItem(CLE, JSON.stringify(data)) },
  clear()   { sessionStorage.removeItem(CLE) },
}

export class ErreurApi extends Error {
  constructor(message, status, data) { super(message); this.status = status; this.data = data || {} }
}

async function requete(chemin, { methode = 'GET', corps, authentifie = true } = {}) {
  const session = authentifie ? SessionPortail.get() : null
  if (authentifie && !session) {
    window.location.assign('/portail/connexion')
    throw new ErreurApi('Session expirée', 401)
  }
  const rep = await fetch(`${BASE_URL}${chemin}`, {
    method: methode,
    headers: {
      ...(corps !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: corps !== undefined ? JSON.stringify(corps) : undefined,
  })
  if (rep.status === 401 && authentifie) {
    SessionPortail.clear()
    window.location.assign('/portail/connexion')
    throw new ErreurApi('Session expirée', 401)
  }
  const data = rep.status === 204 ? null : await rep.json().catch(() => ({}))
  if (!rep.ok) {
    const msg = data?.detail || Object.values(data || {}).flat().join(' ') || `HTTP ${rep.status}`
    throw new ErreurApi(msg, rep.status, data)
  }
  return data
}

async function ouvrirPdf(chemin, authentifie = true) {
  // Ouvre la fenêtre tout de suite (sinon bloquée comme pop-up sur mobile), puis y charge le PDF.
  const fenetre = window.open('', '_blank')
  const session = authentifie ? SessionPortail.get() : null
  const rep = await fetch(`${BASE_URL}${chemin}`, {
    headers: session ? { Authorization: `Bearer ${session.token}` } : {},
  })
  if (!rep.ok) { fenetre?.close(); throw new ErreurApi('Document indisponible', rep.status) }
  const url = URL.createObjectURL(await rep.blob())
  if (fenetre) fenetre.location.href = url
  else window.location.assign(url)
}

async function telecharger(chemin, nom) {
  const session = SessionPortail.get()
  const rep = await fetch(`${BASE_URL}${chemin}`, { headers: session ? { Authorization: `Bearer ${session.token}` } : {} })
  if (!rep.ok) throw new ErreurApi('Document indisponible', rep.status)
  const url = URL.createObjectURL(await rep.blob())
  const a = Object.assign(document.createElement('a'), { href: url, download: nom })
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export const portailAPI = {
  demanderCode: (email)       => requete('/public/portail/code/', { methode: 'POST', corps: { email }, authentifie: false }),
  connexion:    (email, code) => requete('/public/portail/connexion/', { methode: 'POST', corps: { email, code }, authentifie: false }),
  moi:          ()            => requete('/portail/moi/'),
  majMoi:       (data)        => requete('/portail/moi/', { methode: 'PATCH', corps: data }),
  dossiers:     ()            => requete('/portail/dossiers/'),
  dossier:      (id)          => requete(`/portail/dossiers/${id}/`),
  voyageurs:    (id)          => requete(`/portail/dossiers/${id}/voyageurs/`),
  majVoyageurs: (id, data)    => requete(`/portail/dossiers/${id}/voyageurs/`, { methode: 'PUT', corps: data }),
  payer:        (id, echeanceId) => requete(`/portail/dossiers/${id}/payer/`, { methode: 'POST', corps: { echeance_id: echeanceId } }),
  ouvrirPdf:    (id, quoi)    => ouvrirPdf(`/portail/dossiers/${id}/pdf/${quoi}/`),
  document:     (uuid, nom)   => telecharger(`/portail/documents/${uuid}/`, nom),
  transaction:  (uuid)        => requete(`/public/paiements/transactions/${uuid}/`, { authentifie: false }),
  simuler:      (uuid, resultat) => requete(`/public/paiements/simulation/${uuid}/`, { methode: 'POST', corps: { resultat }, authentifie: false }),
}

/**
 * Accès à une demande de confirmation de devis, soit par le lien reçu par
 * email (public, jeton), soit depuis l'espace client (connecté, UUID).
 * La page de confirmation ne connaît que cette interface.
 */
export function apiConfirmation({ jeton, uuid }) {
  const base = jeton ? `/public/confirmations/${jeton}` : `/portail/confirmations/${uuid}`
  const auth = !jeton
  return {
    lire:     ()     => requete(`${base}/`, { authentifie: auth }),
    consulte: ()     => requete(`${base}/consulte/`, { methode: 'POST', corps: {}, authentifie: auth }),
    code:     (canal)=> requete(`${base}/code/`, { methode: 'POST', corps: { canal }, authentifie: auth }),
    accepter: (data) => requete(`${base}/accepter/`, { methode: 'POST', corps: data, authentifie: auth }),
    refuser:  (motif)=> requete(`${base}/refuser/`, { methode: 'POST', corps: { motif }, authentifie: auth }),
    ouvrirPdf: ()    => ouvrirPdf(`${base}/pdf/`, auth),
  }
}
