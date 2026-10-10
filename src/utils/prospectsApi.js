/**
 * SITRAC — API des prospects (demandes de devis).
 * Fichier séparé de utils/api.js pour ne pas avoir à modifier ce dernier.
 */
import { api } from './api'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const STATUTS_PROSPECT = [
  ['nouveau', 'Nouveau'], ['contacte', 'Contacté'], ['devis_envoye', 'Devis envoyé'], ['gagne', 'Gagné'], ['perdu', 'Perdu'],
]
export const SOURCES_PROSPECT = [
  ['site_web', 'Formulaire du site web'], ['email', 'Email'], ['whatsapp', 'WhatsApp'], ['telephone', 'Téléphone'],
  ['salon', 'Salon / événement'], ['agence', 'Agence partenaire'], ['recommandation', 'Recommandation'], ['autre', 'Autre'],
]

export const prospectsAPI = {
  liste:        (params = '') => api.get(`/prospects/${params}`),
  creer:        (data)        => api.post('/prospects/', data),
  modifier:     (id, data)    => api.patch(`/prospects/${id}/`, data),
  supprimer:    (id)          => api.delete(`/prospects/${id}/`),
  note:         (id, data)    => api.post(`/prospects/${id}/note/`, data),
  statut:       (id, statut, motif = '') => api.post(`/prospects/${id}/statut/`, { statut, motif }),
  convertir:    (id, data)    => api.post(`/prospects/${id}/convertir/`, data),
  statistiques: ()            => api.get('/prospects/statistiques/'),
}

/** Appels publics du formulaire (sans connexion). Les erreurs de champ sont renvoyées telles quelles. */
async function publique(chemin, options = {}) {
  const rep = await fetch(`${BASE_URL}${chemin}`, {
    ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await rep.json().catch(() => ({}))
  if (!rep.ok) { const e = new Error(data.detail || `Erreur ${rep.status}`); e.champs = data; throw e }
  return data
}

export const devisPublicAPI = {
  programmes: ()     => publique('/public/devis/programmes/'),
  envoyer:    (data) => publique('/public/devis/', { method: 'POST', body: JSON.stringify(data) }),
}