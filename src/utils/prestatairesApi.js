/**
 * SITRAC — API du référentiel des prestataires.
 * Fichier séparé de utils/api.js pour ne pas avoir à modifier ce dernier.
 */
import { api } from './api'

export const CATEGORIES = [
  ['hebergement',  'Hébergement'],
  ['transport',    'Transport terrestre'],
  ['aerien',       'Compagnie aérienne'],
  ['guide',        'Guide / accompagnateur'],
  ['restauration', 'Restauration'],
  ['activite',     'Activité / excursion'],
  ['parc',         'Parc / site / entrée'],
  ['autre',        'Autre'],
]
export const UNITES = [
  ['nuit',          'par nuit (chambre)'],
  ['personne',      'par personne'],
  ['nuit_personne', 'par nuit et par personne'],
  ['jour',          'par jour'],
  ['trajet',        'par trajet'],
  ['repas',         'par repas'],
  ['forfait',       'forfait'],
]
export const SAISONS = [['toute_annee', "Toute l'année"], ['haute', 'Haute saison'], ['basse', 'Basse saison']]
export const MODES_PAIEMENT = ['Virement', 'Espèces', 'Mobile Money', 'Chèque', 'Carte bancaire']

export const prestatairesAPI = {
  liste:        (params = '')  => api.get(`/prestataires/${params}`),
  fiche:        (id)           => api.get(`/prestataires/${id}/`),
  creer:        (data)         => api.post('/prestataires/', data),
  modifier:     (id, data)     => api.patch(`/prestataires/${id}/`, data),
  supprimer:    (id)           => api.delete(`/prestataires/${id}/`),
  basculer:     (id)           => api.post(`/prestataires/${id}/basculer/`, {}),
  statistiques: (id, annee)    => api.get(`/prestataires/${id}/statistiques/${annee ? `?annee=${annee}` : ''}`),
  alias:        (id, textes)   => api.post(`/prestataires/${id}/alias/`, { textes }),
  suggestions:  ()             => api.get('/prestataires/suggestions/'),
  selection:    ()             => api.get('/prestataires/selection/'),
}