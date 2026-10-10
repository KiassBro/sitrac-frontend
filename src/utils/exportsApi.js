/**
 * SITRAC — API des exports comptables.
 * Fichier séparé de utils/api.js pour ne pas avoir à modifier ce dernier.
 */
import { api, downloadFile } from './api'

const periode = (debut, fin) => `debut=${debut}&fin=${fin}`

export const exportsAPI = {
  apercu:   (debut, fin) => api.get(`/exports-comptables/apercu/?${periode(debut, fin)}`),
  journal:  (cle, debut, fin, fichier = 'csv') => downloadFile(
    `/exports-comptables/${cle}/?${periode(debut, fin)}&fichier=${fichier}`,
    `SITRAC_${cle}_${debut}_${fin}.${fichier}`),
  classeur: (debut, fin) => downloadFile(
    `/exports-comptables/classeur/?${periode(debut, fin)}`, `SITRAC_comptabilite_${debut}_${fin}.xlsx`),
}