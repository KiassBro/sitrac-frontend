/**
 * SITRAC — API d'annulation des dossiers (RG 34).
 * Fichier séparé de utils/api.js pour ne pas avoir à modifier ce dernier.
 */
import { api } from './api'

export const annulationsAPI = {
  etat: (pcId, taux, frais) => {
    const q = new URLSearchParams()
    if (taux !== undefined && taux !== '') q.set('taux', taux)
    if (frais !== undefined && frais !== '') q.set('frais', frais)
    const s = q.toString()
    return api.get(`/annulations/dossiers/${pcId}/${s ? `?${s}` : ''}`)
  },
  annuler:   (pcId, data) => api.post(`/annulations/dossiers/${pcId}/annuler/`, data),
  reactiver: (pcId, motif) => api.post(`/annulations/dossiers/${pcId}/reactiver/`, { motif }),
}