/**
 * SITRAC — API du questionnaire de satisfaction.
 * Fichier séparé de utils/api.js pour ne pas avoir à modifier ce dernier.
 */
import { api } from './api'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const satisfactionAPI = {
  resultats: (annee) => api.get(`/satisfaction/resultats/${annee ? `?annee=${annee}` : ''}`),
  enquetes:  ()      => api.get('/satisfaction/enquetes/'),
  aEnvoyer:  ()      => api.get('/satisfaction/a-envoyer/'),
  envoyer:   (pcId)  => api.post(`/satisfaction/dossiers/${pcId}/envoyer/`, {}),
}

/** Questionnaire public (lien personnel, sans connexion). */
async function publique(chemin, options = {}) {
  const rep = await fetch(`${BASE_URL}${chemin}`, { ...options, headers: { 'Content-Type': 'application/json' } })
  const data = await rep.json().catch(() => ({}))
  if (!rep.ok) { const e = new Error(data.detail || `Erreur ${rep.status}`); e.status = rep.status; throw e }
  return data
}

export const avisPublicAPI = {
  lire:     (jeton)        => publique(`/public/avis/${encodeURIComponent(jeton)}/`),
  repondre: (jeton, data)  => publique(`/public/avis/${encodeURIComponent(jeton)}/`, { method: 'POST', body: JSON.stringify(data) }),
}