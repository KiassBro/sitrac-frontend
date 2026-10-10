/**
 * SITRAC — Taux de change euro → ariary de référence (RG 35).
 * Fichier séparé de utils/api.js pour ne pas avoir à modifier ce dernier.
 */
import { api } from './api'

export const tauxAPI = {
  actuel:     ()               => api.get('/taux-change/actuel/'),
  actualiser: (forcer = false) => api.post('/taux-change/actualiser/', { forcer }),
}