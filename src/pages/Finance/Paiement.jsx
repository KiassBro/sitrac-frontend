import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { CreditCard, Plus, Trash2, Eye } from 'lucide-react'
import { useProgrammeClients } from '../../hooks/useApi'
import { financeAPI } from '../../utils/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useConfirm } from '../../hooks/useConfirm'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import { Modal, StatCard, Badge, SearchInput } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate, fmt } from '../../utils/storage'

const TYPES_PMT = ['Espèces','Virement','Chèque','Mobile Money','Transfert','Carte bancaire']

// ─── Formulaire d'ajout de paiement (composant isolé) ─────────
// Isoler dans son propre composant garantit que useForm est
// réinitialisé proprement à chaque ouverture du modal
function PaiementForm({ pcId, onSuccess, resume }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      date:           new Date().toISOString().split('T')[0],
      montant:        '',
      receptionneur:  '',
      remettant:      '',
      num_assurance:  '',
      type_paiement:  '',
    },
  })

  const addMut = useMutation({
    mutationFn: (data) => financeAPI.createPaiement({
      programme_client: pcId,
      date_paiement:    data.date,
      montant:          +data.montant,
      type_paiement:    data.type_paiement,
      receptionneur:    data.receptionneur || null,
      remettant:        data.remettant     || null,
      num_assurance:    data.num_assurance  || null,
    }),
    onSuccess: () => {
      toast.success('Paiement enregistré')
      reset({
        date:           new Date().toISOString().split('T')[0],
        montant:        '',
        receptionneur:  '',
        remettant:      '',
        num_assurance:  '',
        type_paiement:  '',
      })
      onSuccess()
    },
    onError: (e) => toast.error(e.message || 'Erreur lors de l\'enregistrement'),
  })

  const onSubmit = (data) => addMut.mutate(data)

  // Reste dû et nom du client déjà connus : proposés d'office (modifiables)
  useEffect(() => {
    if (!resume) return
    if (!getValues('montant') && resume.restant > 0) setValue('montant', resume.restant)
    if (!getValues('remettant') && resume.client_nom) setValue('remettant', resume.client_nom)
  }, [resume])

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
      <p className="font-title font-bold text-sm text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
        <Plus size={14} className="text-orange"/> Ajouter un paiement
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Date */}
        <div className="form-group mb-2">
          <label className="form-label">Date <span className="form-req">*</span></label>
          <input
            type="date"
            className={`form-control py-2 text-sm ${errors.date ? 'border-brand-red' : ''}`}
            {...register('date', { required: 'La date est obligatoire' })}
          />
          {errors.date && <p className="text-xs text-brand-red mt-1">{errors.date.message}</p>}
        </div>

        {/* Montant */}
        <div className="form-group mb-2">
          <label className="form-label">Montant (€) <span className="form-req">*</span></label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={`form-control py-2 text-sm ${errors.montant ? 'border-brand-red' : ''}`}
            placeholder="0.00"
            {...register('montant', {
              required:  'Le montant est obligatoire',
              min:       { value: 0.01, message: 'Le montant doit être supérieur à 0' },
              valueAsNumber: true,
            })}
          />
          {errors.montant && <p className="text-xs text-brand-red mt-1">{errors.montant.message}</p>}
        </div>

        {/* Type de paiement */}
        <div className="form-group mb-2 col-span-2">
          <label className="form-label">Type de paiement <span className="form-req">*</span></label>
          <select
            className={`form-control py-2 text-sm ${errors.type_paiement ? 'border-brand-red' : ''}`}
            {...register('type_paiement', { required: 'Le type de paiement est obligatoire' })}
          >
            <option value="">-- Sélectionner le type --</option>
            {TYPES_PMT.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.type_paiement && <p className="text-xs text-brand-red mt-1">{errors.type_paiement.message}</p>}
        </div>

        {/* Réceptionneur */}
        <div className="form-group mb-2">
          <label className="form-label">Réceptionneur</label>
          <input
            className="form-control py-2 text-sm"
            placeholder="Nom du réceptionneur"
            {...register('receptionneur')}
          />
        </div>

        {/* Remettant */}
        <div className="form-group mb-2">
          <label className="form-label">Remettant</label>
          <input
            className="form-control py-2 text-sm"
            placeholder="Nom du remettant"
            {...register('remettant')}
          />
        </div>

        {/* N° Assurance */}
        <div className="form-group mb-2 col-span-2">
          <label className="form-label">N° Assurance</label>
          <input
            className="form-control py-2 text-sm"
            placeholder="Numéro d'assurance (optionnel)"
            {...register('num_assurance')}
          />
        </div>
      </div>

      <button
        className="btn btn-success btn-sm mt-2"
        onClick={handleSubmit(onSubmit)}
        disabled={addMut.isPending}
      >
        {addMut.isPending ? (
          'Enregistrement...'
        ) : (
          <><Plus size={13}/> Enregistrer le paiement</>
        )}
      </button>
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────────
export default function Paiement() {
  const { data: pcs = [], isLoading, error, refetch } = useProgrammeClients()
  const qc = useQueryClient()
  const { confirmDelete } = useConfirm()

  const [search,  setSearch]  = useState('')
  const [modal,   setModal]   = useState(false)
  const [curPCId, setCurPCId] = useState(null)

  // Paiements du PC courant
  const { data: pmtsData, refetch: refetchPmts } = useQuery({
    queryKey: ['paiements', curPCId],
    queryFn:  () => financeAPI.getPaiements(`?programme_client=${curPCId}`),
    select:   d => d.results ?? d,
    enabled:  !!curPCId,
  })
  const pmts = pmtsData || []

  // Résumé
  const { data: resume } = useQuery({
    queryKey: ['paiements-resume', curPCId],
    queryFn:  () => financeAPI.getResumePaiements(curPCId),
    enabled:  !!curPCId,
  })

  const delMut = useMutation({
    mutationFn: (id) => financeAPI.deletePaiement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paiements', curPCId] })
      qc.invalidateQueries({ queryKey: ['paiements-resume', curPCId] })
      toast.success('Paiement supprimé')
    },
    onError: e => toast.error(e.message),
  })

  const openModal = (pcId) => {
    setCurPCId(pcId)
    setModal(true)
  }

  const handlePmtSuccess = () => {
    qc.invalidateQueries({ queryKey: ['paiements', curPCId] })
    qc.invalidateQueries({ queryKey: ['paiements-resume', curPCId] })
  }

  const filtered = pcs.filter(p =>
    !search || (p.client_nom||'').toLowerCase().includes(search.toLowerCase())
  )
  const curPC = pcs.find(p => p.id === curPCId)

  return (
    <Layout breadcrumb={['SITRAC','Finance','Dossier Finance','Paiement Client']}>
      <div className="mb-5">
        <h1 className="page-title"><CreditCard size={22} className="text-orange"/> Paiement Client</h1>
        <p className="page-sub">Gestion des paiements liés aux factures définitives</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={CreditCard} value={pcs.length}                        label="Total dossiers"  color="orange"/>
        <StatCard icon={CreditCard} value={pcs.filter(p=>p.a_facture_pro).length} label="Avec Facture Pro" color="blue"/>
        <StatCard icon={CreditCard} value={pcs.filter(p=>p.a_cotation).length}    label="Avec cotation"   color="green"/>
        <StatCard icon={CreditCard} value={pcs.length}                        label="Total clients"   color="purple"/>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
            Programmes Clients
          </h3>
          <SearchInput value={search} onChange={setSearch}/>
        </div>

        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Client</th><th>Programme</th><th>Nb PAX</th><th>Prix vente</th>
                  <th>Date vente</th><th className="text-center">Paiements</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-400">Aucun dossier</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id}>
                    <td><strong className="text-gray-900 dark:text-white">{p.client_nom}</strong></td>
                    <td><Badge variant="info">{p.programme_nom}</Badge></td>
                    <td>{p.nb_pax}</td>
                    <td><strong>{(+p.prix_vente).toLocaleString('fr-FR')} €</strong></td>
                    <td className="text-xs text-gray-500">{fmtDate(p.date_vente)}</td>
                    <td className="text-center">
                      <button className="btn btn-info btn-sm" onClick={() => openModal(p.id)}>
                        <Eye size={13}/> Voir / Ajouter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ApiState>
      </div>

      {/* Modal Paiements */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`Paiements — ${curPC?.client_nom || ''}`}
        icon={CreditCard}
        size="lg"
        footer={<button className="btn btn-ghost" onClick={() => setModal(false)}>Fermer</button>}
      >
        {/* Résumé financier */}
        {resume && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              ['Montant facturé', fmt(resume.montant_facture), ''],
              ['Total payé',      fmt(resume.total_paye),      'text-brand-green'],
              ['Reste à payer',   fmt(resume.restant),         resume.restant > 0 ? 'text-brand-red' : 'text-brand-green'],
            ].map(([label, val, cls]) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-xs text-gray-400 mb-1">{label}</div>
                <div className={`font-black text-base ${cls}`}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Liste des paiements */}
        <div className="overflow-x-auto mb-2">
          <table className="tbl text-xs">
            <thead>
              <tr>
                <th>Date</th><th>Montant</th><th>Type</th>
                <th>Réceptionneur</th><th>Remettant</th>
                <th className="text-center">Sup.</th>
              </tr>
            </thead>
            <tbody>
              {pmts.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-gray-400">Aucun paiement enregistré</td></tr>
              ) : pmts.map(p => (
                <tr key={p.id}>
                  <td>{fmtDate(p.date_paiement)}</td>
                  <td><strong className="text-brand-green">{fmt(p.montant)}</strong></td>
                  <td><Badge variant="info">{p.type_paiement}</Badge></td>
                  <td>{p.receptionneur || '—'}</td>
                  <td>{p.remettant || '—'}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-danger btn-xs"
                      onClick={() => confirmDelete(
                        `ce paiement de ${fmt(p.montant)}`,
                        () => delMut.mutate(p.id)
                      )}
                    >
                      <Trash2 size={10}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Formulaire — composant isolé avec son propre useForm */}
        {modal && curPCId && (
          <PaiementForm
            key={curPCId}  // force remount si on change de dossier
            pcId={curPCId}
            resume={resume}
            onSuccess={handlePmtSuccess}
          />
        )}
      </Modal>
    </Layout>
  )
}
