/**
 * SITRAC — API du planning des ressources (chauffeurs, guides, véhicules).
 * Fichier séparé de utils/api.js pour ne pas avoir à modifier ce dernier.
 */
import { api } from './api'

export const TYPES_RESSOURCE = [['chauffeur', 'Chauffeur'], ['guide', 'Guide'], ['vehicule', 'Véhicule']]

export const ressourcesAPI = {
  liste:     (type)         => api.get(`/ressources/${type ? `?type=${type}` : ''}`),
  creer:     (data)         => api.post('/ressources/', data),
  modifier:  (id, data)     => api.patch(`/ressources/${id}/`, data),
  supprimer: (id)           => api.delete(`/ressources/${id}/`),
  alias:     (id, textes)   => api.post(`/ressources/${id}/alias/`, { textes }),
  planning:  (debut, fin)   => api.get(`/ressources/planning/?debut=${debut}&fin=${fin}`),
  verifier:  ({ type, texte, debut, fin, exclurePc }) => api.get(
    `/ressources/verifier/?type=${type}&texte=${encodeURIComponent(texte)}&debut=${debut}&fin=${fin}`
    + (exclurePc ? `&exclure_pc=${exclurePc}` : '')),
}