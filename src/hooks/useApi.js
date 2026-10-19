/**
 * SITRAC — Hooks React Query pour les appels API
 * Chaque hook gère loading, error, cache et invalidation
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { salesAPI, authAPI, superviseurAPI, financeAPI } from '../utils/api'

// ─── DESTINATIONS ──────────────────────────────────────────────
export function useDestinations(params = '') {
  return useQuery({
    queryKey: ['destinations', params],
    queryFn:  () => salesAPI.getDestinations(params),
    select:   d => d.results ?? d,
  })
}
export function useDestinationMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['destinations'] })

  const create = useMutation({ mutationFn: salesAPI.createDest,
    onSuccess: () => { inv(); toast.success('Destination ajoutée') },
    onError:   e  => toast.error(e.message) })

  const update = useMutation({ mutationFn: ({ id, data }) => salesAPI.updateDest(id, data),
    onSuccess: () => { inv(); toast.success('Destination modifiée') },
    onError:   e  => toast.error(e.message) })

  const remove = useMutation({ mutationFn: salesAPI.deleteDest,
    onSuccess: () => { inv(); toast.success('Destination supprimée') },
    onError:   e  => toast.error(e.message) })

  const toggle = useMutation({ mutationFn: salesAPI.toggleDest,
    onSuccess: () => { inv() },
    onError:   e  => toast.error(e.message) })

  return { create, update, remove, toggle }
}

// ─── PROGRAMMES ────────────────────────────────────────────────
export function useProgrammes(params = '') {
  return useQuery({
    queryKey: ['programmes', params],
    queryFn:  () => salesAPI.getProgrammes(params),
    select:   d => d.results ?? d,
  })
}
export function useProgrammeMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['programmes'] })

  const create = useMutation({ mutationFn: salesAPI.createProg,
    onSuccess: () => { inv(); toast.success('Programme ajouté') },
    onError:   e  => toast.error(e.message) })

  const update = useMutation({ mutationFn: ({ id, data }) => salesAPI.updateProg(id, data),
    onSuccess: () => { inv(); toast.success('Programme modifié') },
    onError:   e  => toast.error(e.message) })

  const remove = useMutation({ mutationFn: salesAPI.deleteProg,
    onSuccess: () => { inv(); toast.success('Programme supprimé') },
    onError:   e  => toast.error(e.message) })

  const toggle = useMutation({ mutationFn: salesAPI.toggleProg,
    onSuccess: () => { inv() },
    onError:   e  => toast.error(e.message) })

  return { create, update, remove, toggle }
}

// ─── CLIENTS ───────────────────────────────────────────────────
export function useClients(params = '') {
  return useQuery({
    queryKey: ['clients', params],
    queryFn:  () => salesAPI.getClients(params),
    select:   d => d.results ?? d,
  })
}
export function useClientMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['clients'] })

  const create  = useMutation({ mutationFn: salesAPI.createClient,
    onSuccess: () => { inv(); toast.success('Client ajouté') },
    onError:   e  => toast.error(e.message) })

  const update  = useMutation({ mutationFn: ({ id, data }) => salesAPI.updateClient(id, data),
    onSuccess: () => { inv(); toast.success('Client modifié') },
    onError:   e  => toast.error(e.message) })

  const remove  = useMutation({ mutationFn: salesAPI.deleteClient,
    onSuccess: () => { inv(); toast.success('Client supprimé') },
    onError:   e  => toast.error(e.message) })

  const addPax  = useMutation({ mutationFn: ({ clientId, data }) => salesAPI.addPax(clientId, data),
    onSuccess: () => { inv(); toast.success('PAX ajouté') },
    onError:   e  => toast.error(e.message) })

  const delPax  = useMutation({ mutationFn: ({ clientId, paxId }) => salesAPI.deletePax(clientId, paxId),
    onSuccess: () => { inv(); toast.success('PAX supprimé') },
    onError:   e  => toast.error(e.message) })

  return { create, update, remove, addPax, delPax }
}

// ─── PROGRAMME CLIENTS ─────────────────────────────────────────
// RG 34 : les dossiers annulés sont masqués partout (cotation, facture, booking,
// finance, tableaux de bord…), sauf là où on les demande explicitement
// (page Programme Client : useProgrammeClients('', { inclureAnnules: true })).
export function useProgrammeClients(params = '', { inclureAnnules = false } = {}) {
  return useQuery({
    queryKey: ['pcs', params],
    queryFn:  () => salesAPI.getPCs(params),
    select:   d => {
      const liste = d.results ?? d
      return inclureAnnules ? liste : liste.filter(p => !p.annule)
    },
  })
}
export function usePCMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['pcs'] })

  const create = useMutation({ mutationFn: salesAPI.createPC,
    onSuccess: () => { inv(); toast.success('Programme Client créé') },
    onError:   e  => toast.error(e.message) })

  const update = useMutation({ mutationFn: ({ id, data }) => salesAPI.updatePC(id, data),
    onSuccess: () => { inv(); toast.success('Dossier modifié') },
    onError:   e  => toast.error(e.message) })

  const remove = useMutation({ mutationFn: salesAPI.deletePC,
    onSuccess: () => { inv(); toast.success('Dossier supprimé') },
    onError:   e  => toast.error(e.message) })

  return { create, update, remove }
}

// ─── COTATION ──────────────────────────────────────────────────
export function useCotation(pcId) {
  return useQuery({
    queryKey: ['cotation', pcId],
    queryFn:  () => salesAPI.getCotation(pcId),
    enabled:  !!pcId,
    retry:    false,
  })
}
export function useCotationMutation(pcId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ data, exists }) => salesAPI.saveCotation(pcId, data, exists),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotation', pcId] })
      qc.invalidateQueries({ queryKey: ['pcs'] })
      toast.success('Cotation enregistrée')
    },
    onError: e => toast.error(e.message),
  })
}

// ─── UTILISATEURS (Admin) ──────────────────────────────────────
export function useUtilisateurs(params = '') {
  return useQuery({
    queryKey: ['utilisateurs', params],
    queryFn:  () => authAPI.getUtilisateurs(params),
    select:   d => d.results ?? d,
  })
}
export function useUtilisateurMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['utilisateurs'] })

  const create = useMutation({ mutationFn: authAPI.createUser,
    onSuccess: () => { inv(); toast.success('Utilisateur créé') },
    onError:   e  => toast.error(e.message) })

  const update = useMutation({ mutationFn: ({ id, data }) => authAPI.updateUser(id, data),
    onSuccess: () => { inv(); toast.success('Utilisateur modifié') },
    onError:   e  => toast.error(e.message) })

  const remove = useMutation({ mutationFn: authAPI.deleteUser,
    onSuccess: () => { inv(); toast.success('Utilisateur supprimé') },
    onError:   e  => toast.error(e.message) })

  const toggle = useMutation({ mutationFn: authAPI.toggleUserActif,
    onSuccess: (_, id) => { inv() },
    onError:   e  => toast.error(e.message) })

  return { create, update, remove, toggle }
}

// ─── PAIEMENTS (Finance) ───────────────────────────────────────
export function usePaiements(pcId) {
  return useQuery({
    queryKey: ['paiements', pcId],
    queryFn:  () => financeAPI.getPaiements(`?programme_client=${pcId}`),
    select:   d => d.results ?? d,
    enabled:  !!pcId,
  })
}
export function useResumePaiements(pcId) {
  return useQuery({
    queryKey: ['paiements-resume', pcId],
    queryFn:  () => financeAPI.getResumePaiements(pcId),
    enabled:  !!pcId,
  })
}

// ─── AUDIT LOGS (Superviseur) ──────────────────────────────────
export function useAuditLogs(params = '') {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn:  () => superviseurAPI.getLogs(params),
    refetchInterval: 30000, // auto-refresh toutes les 30s
  })
}
export function useAuditStats() {
  return useQuery({
    queryKey: ['audit-stats'],
    queryFn:  superviseurAPI.getStats,
    refetchInterval: 60000,
  })
}

// ─── CONSTANTES ────────────────────────────────────────────────
export function useConstantes() {
  return useQuery({
    queryKey: ['constantes'],
    queryFn:  superviseurAPI.getConstantes,
    select:   d => d.results ?? d,
  })
}