import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Receipt, Plus, Trash2 } from 'lucide-react'
import { useProgrammeClients } from '../../hooks/useApi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeAPI } from '../../utils/api'
import { useConfirm } from '../../hooks/useConfirm'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import ChampPrestataire from '../../components/Prestataires/ChampPrestataire'
import { Modal, Badge, SearchInput, StatCard } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate, fmt, today } from '../../utils/storage'

export default function Recu() {
  const { data: pcs = [], isLoading, error, refetch } = useProgrammeClients()
  const qc = useQueryClient()
  const { confirmDelete } = useConfirm()
  const [modal,  setModal]  = useState(false)
  const [curPCId, setCurPCId] = useState(null)
  const [search, setSearch] = useState('')

  const { register, handleSubmit, reset, watch, setValue } = useForm()

  const { data: recusData } = useQuery({
    queryKey: ['recus', curPCId],
    queryFn:  () => financeAPI.getRecus(`?programme_client=${curPCId}`).then(r => r.results||r),
    enabled:  !!curPCId,
  })
  const recus = recusData || []

  // Nouvelle fonctionnalité RG 26 : liste des paiements du dossier, pour
  // pouvoir lier un reçu à un paiement précis (auparavant impossible —
  // le modèle Recu n'avait aucun lien vers PaiementClient).
  const { data: paiementsData } = useQuery({
    queryKey: ['paiements-pour-recu', curPCId],
    queryFn:  () => financeAPI.getPaiements(`?programme_client=${curPCId}`).then(r => r.results||r),
    enabled:  !!curPCId,
  })
  const paiements = paiementsData || []

  const addMut = useMutation({
    mutationFn: data => financeAPI.createRecu({
      ...data,
      programme_client: curPCId,
      montant: +data.montant,
      paiement: data.paiement || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recus', curPCId] })
      toast.success('Reçu ajouté')
      reset({ prestataire:'', date_recu: today(), montant:'', description:'', paiement:'' })
    },
    onError: e => toast.error(e.message),
  })

  // BUG CORRIGÉ : le bouton "Supprimer" ne supprimait rien du tout — il
  // rappelait juste getRecus() (sans même exploiter le résultat) et
  // affichait un faux message de succès. deleteRecu() n'existait même
  // pas dans financeAPI.
  const delMut = useMutation({
    mutationFn: (id) => financeAPI.deleteRecu(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recus', curPCId] })
      toast.success('Reçu supprimé')
    },
    onError: e => toast.error(e.message),
  })

  const filtered   = pcs.filter(p => !search || (p.client_nom||'').toLowerCase().includes(search.toLowerCase()))
  const curPC      = pcs.find(p => p.id === curPCId)

  const open = (pcId) => {
    setCurPCId(pcId)
    reset({ prestataire:'', date_recu: today(), montant:'', description:'', paiement:'' })
    setModal(true)
  }

  return (
    <Layout breadcrumb={['SITRAC','Finance','Dossier Finance','Reçus']}>
      <div className="mb-5">
        <h1 className="page-title"><Receipt size={22} className="text-orange"/> Reçus Prestataires</h1>
        <p className="page-sub">Gestion des reçus de paiement aux prestataires</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Receipt} value={pcs.length} label="Total dossiers" color="orange"/>
        <StatCard icon={Receipt} value={pcs.filter(p=>p.a_facture_pro).length} label="Avec FP" color="blue"/>
        <StatCard icon={Receipt} value={pcs.filter(p=>p.a_cotation).length} label="Avec cotation" color="green"/>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Dossiers Clients</h3>
          <SearchInput value={search} onChange={setSearch}/>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Client</th><th>Programme</th><th>PAX</th><th>Date vente</th><th className="text-center">Reçus</th></tr></thead>
              <tbody>
                {filtered.length===0
                  ? <tr><td colSpan={5} className="py-10 text-center text-gray-400">Aucun dossier</td></tr>
                  : filtered.map(p=>(
                    <tr key={p.id}>
                      <td><strong className="text-gray-900 dark:text-white">{p.client_nom}</strong></td>
                      <td><Badge variant="info">{p.programme_nom}</Badge></td>
                      <td>{p.nb_pax}</td>
                      <td className="text-sm text-gray-500">{fmtDate(p.date_vente)}</td>
                      <td className="text-center"><button className="btn btn-info btn-sm" onClick={()=>open(p.id)}><Receipt size={13}/> Voir / Ajouter</button></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </ApiState>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title={`Reçus — ${curPC?.client_nom||''}`} icon={Receipt} size="lg"
        footer={<button className="btn btn-ghost" onClick={()=>setModal(false)}>Fermer</button>}>
        {/* Liste */}
        <div className="overflow-x-auto mb-4">
          <table className="tbl text-xs">
            <thead><tr><th>Prestataire</th><th>Date</th><th>Montant</th><th>Paiement lié</th><th>Description</th><th className="text-center">Sup.</th></tr></thead>
            <tbody>
              {recus.length===0
                ? <tr><td colSpan={6} className="py-6 text-center text-gray-400">Aucun reçu</td></tr>
                : recus.map(r=>(
                  <tr key={r.id}>
                    <td><strong>{r.prestataire}</strong></td>
                    <td>{fmtDate(r.date_recu)}</td>
                    <td><strong className="text-brand-green">{fmt(r.montant)}</strong></td>
                    <td className="text-gray-500">
                      {r.paiement_info
                        ? <Badge variant="info">{r.paiement_info}</Badge>
                        : <span className="text-gray-300 italic">Aucun</span>}
                    </td>
                    <td className="max-w-[120px] truncate text-gray-400">{r.description||'—'}</td>
                    <td className="text-center">
                      <button className="btn btn-danger btn-xs" disabled={delMut.isPending}
                        onClick={()=>confirmDelete(`le reçu de ${r.prestataire}`, ()=>delMut.mutate(r.id))}>
                        <Trash2 size={10}/>
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {/* Formulaire ajout */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="font-title font-bold text-sm text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"><Plus size={14} className="text-orange"/> Ajouter un reçu</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group mb-2"><label className="form-label">Prestataire <span className="form-req">*</span></label><ChampPrestataire form={{ register, watch, setValue }} name="prestataire" champMontant="montant" required className="form-control py-2 text-sm"/></div>
            <div className="form-group mb-2"><label className="form-label">Date <span className="form-req">*</span></label><input type="date" className="form-control py-2 text-sm" {...register('date_recu',{required:true})}/></div>
            <div className="form-group mb-2"><label className="form-label">Montant (€) <span className="form-req">*</span></label><input type="number" step="0.01" className="form-control py-2 text-sm" {...register('montant',{required:true,min:0.01})}/></div>
            {/* Nouvelle fonctionnalité RG 26 : lier le reçu à un paiement précis du dossier */}
            <div className="form-group mb-2">
              <label className="form-label">Paiement lié</label>
              <select className="form-control py-2 text-sm" {...register('paiement')}>
                <option value="">— Aucun —</option>
                {paiements.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.type_paiement} — {fmt(p.montant)} du {fmtDate(p.date_paiement)}
                  </option>
                ))}
              </select>
              {paiements.length === 0 && (
                <p className="text-[11px] text-gray-400 mt-1">Aucun paiement enregistré pour ce dossier pour l'instant.</p>
              )}
            </div>
            <div className="form-group mb-2 col-span-2"><label className="form-label">Description</label><input className="form-control py-2 text-sm" {...register('description')}/></div>
          </div>
          <button className="btn btn-success btn-sm mt-1" onClick={handleSubmit(d=>addMut.mutate(d))} disabled={addMut.isPending}>
            {addMut.isPending ? 'Enregistrement...' : <><Plus size={13}/> Enregistrer</>}
          </button>
        </div>
      </Modal>
    </Layout>
  )
}