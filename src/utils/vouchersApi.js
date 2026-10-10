/**
 * SITRAC — API des vouchers prestataires.
 * Fichier séparé de utils/api.js pour ne pas avoir à modifier ce dernier.
 */
import { api, downloadFile } from './api'

export const vouchersAPI = {
  dossier:   (pcId)        => api.get(`/vouchers/dossiers/${pcId}/`),
  generer:   (pcId)        => api.post(`/vouchers/dossiers/${pcId}/generer/`, {}),
  pdf:       (uuid, numero) => downloadFile(`/vouchers/${uuid}/pdf/`, `${numero}.pdf`),
  regenerer: (uuid)        => api.post(`/vouchers/${uuid}/regenerer/`, {}),
  envoyer:   (uuid, email) => api.post(`/vouchers/${uuid}/envoyer/`, email ? { email } : {}),
  publier:   (uuid, visible = true) => api.post(`/vouchers/${uuid}/publier/`, { visible }),
  annuler:   (uuid)        => api.post(`/vouchers/${uuid}/annuler/`, {}),
}