// ─────────────────────────────────────────────────────────────────
// SITRAC — Référentiel pays / nationalités / indicatifs téléphoniques
// Source : GET /api/v1/referentiels/pays/ (liste ISO 3166, chargée une fois)
// ─────────────────────────────────────────────────────────────────
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from './api'

// Forme de comparaison : sans accents, minuscules, lettres et chiffres seulement
export const cle = (texte) => String(texte ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9+]/g, '')

export function usePays() {
  const requete = useQuery({
    queryKey: ['referentiels', 'pays'],
    queryFn: () => api.get('/referentiels/pays/'),
    staleTime: Infinity,
    gcTime: Infinity,
  })
  const liste = requete.data || []

  const index = useMemo(() => {
    const parCode = {}, parNom = {}, parNationalite = {}
    for (const p of liste) {
      parCode[p.code] = p
      parNom[cle(p.nom)] = p
      if (p.nationalite) parNationalite[cle(p.nationalite)] = p
    }
    return { parCode, parNom, parNationalite }
  }, [liste])

  return {
    ...requete,
    liste,
    parCode: (code) => index.parCode[(code || '').toUpperCase()] || null,
    // Pays correspondant à un nom de pays enregistré (« Madagascar »)
    depuisPays: (nom) => (nom ? index.parNom[cle(nom)] || null : null),
    // Pays correspondant à une nationalité enregistrée (« Malgache »)
    depuisNationalite: (nat) => (nat ? index.parNationalite[cle(nat)] || null : null),
  }
}

// Vérifie un numéro auprès du serveur (libphonenumber) : { valide, e164, international, pays, message }
export const verifierTelephone = (numero, pays) =>
  api.get(`/referentiels/telephone/?numero=${encodeURIComponent(numero)}&pays=${encodeURIComponent(pays || '')}`)
