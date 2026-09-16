import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Settings, Plus, Pencil, Save, TrendingUp } from 'lucide-react'
import { useConstantes } from '../../hooks/useApi'
import { superviseurAPI } from '../../utils/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useConfirm } from '../../hooks/useConfirm'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import { Modal, StatCard } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate } from '../../utils/storage'

const CATEGORIES = {
  'taux_change':    '💱 Financier',
  'tva_rate':       '💱 Financier',
  'devise_locale':  '💱 Financier',
  'devise_intl':    '💱 Financier',
  'nom_societe':    '🏢 Société',
  'adresse':        '🏢 Société',
  'version_app':    '⚙️ Système',
}

export default function Constantes() {
  const { data: constantes = [], isLoading, error, refetch } = useConstantes()
  const { confirmSave } = useConfirm()
  const qc = useQueryClient()
  const [modal,    setModal]    = useState(false)
  const [editItem, setEditItem] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const saveMut = useMutation({
    mutationFn: ({ id, data }) => id
      ? superviseurAPI.updateConstante(id, data)
      : superviseurAPI.createConstante(data),
    onSuccess: () => { qc.invalidateQueries(['constantes']); toast.success('Constante enregistrée'); setModal(false) },
    onError: e => toast.error(e.message),
  })

  const openAdd  = () => { setEditItem(null); reset({ cle:'', valeur:'', description:'' }); setModal(true) }
  const openEdit = (c) => { setEditItem(c); reset({ cle:c.cle, valeur:c.valeur, description:c.description||'' }); setModal(true) }

  const onSubmit = (data) => {
    confirmSave(() => saveMut.mutate({ id: editItem?.id, data }))
  }

  const grouped = constantes.reduce((acc, c) => {
    const cat = CATEGORIES[c.cle] || '⚙️ Système'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(c)
    return acc
  }, {})

  // ── Nouvelle fonctionnalité RG 35 : historique des taux de change ──
  const { data: tauxList = [], isLoading: tauxLoading, refetch: refetchTaux } = useQuery({
    queryKey: ['taux-change-historique'],
    queryFn:  () => superviseurAPI.getTauxChangeHistorique().then(r => r.results || r),
  })
  const [tauxModal, setTauxModal] = useState(false)
  const tauxForm = useForm()
  const tauxMut = useMutation({
    mutationFn: (data) => superviseurAPI.createTauxChange(data),
    onSuccess: () => { qc.invalidateQueries(['taux-change-historique']); toast.success('Taux de change enregistré'); setTauxModal(false) },
    onError: e => toast.error(e.message),
  })
  const openAddTaux = () => { tauxForm.reset({ taux:'', date_effet:'', observation:'' }); setTauxModal(true) }
  const onSubmitTaux = (data) => confirmSave(() => tauxMut.mutate({ ...data, taux: +data.taux }))

  return (
    <Layout breadcrumb={['SITRAC','Administration','Constantes Système']}>
      <div className="mb-5">
        <h1 className="page-title"><Settings size={22} className="text-orange"/> Constantes Système</h1>
        <p className="page-sub">Paramètres globaux configurables du système SITRAC (RG 35)</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Settings} value={constantes.length} label="Constantes définies" color="orange"/>
        <StatCard icon={Settings} value={Object.keys(grouped).length} label="Catégories" color="blue"/>
        <StatCard icon={Settings} value={constantes.filter(c=>c.modifie_par).length} label="Modifiées" color="green"/>
      </div>

      <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement des constantes...">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="card mb-5">
            <div className="card-header">
              <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">{cat}</h3>
              <span className="text-xs text-gray-400">{items.length} paramètre{items.length>1?'s':''}</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map(c => (
                <div key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-bold text-brand-blue">{c.cle}</span>
                      {c.description && <span className="text-xs text-gray-400">— {c.description}</span>}
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">{c.valeur}</div>
                    {c.modifie_par && <div className="text-[10px] text-gray-400 mt-0.5">Modifié par {c.modifie_par}</div>}
                  </div>
                  <button className="btn btn-ghost btn-sm flex-shrink-0" onClick={() => openEdit(c)}>
                    <Pencil size={13}/> Modifier
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {constantes.length === 0 && !isLoading && (
          <div className="card p-12 text-center">
            <Settings size={40} className="mx-auto mb-4 text-gray-300"/>
            <p className="text-gray-500 font-medium">Aucune constante définie</p>
            <p className="text-sm text-gray-400 mb-4">Démarrez le backend Django et exécutez : <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">python manage.py seed</code></p>
          </div>
        )}
      </ApiState>

      {/* RG 35 — Historique des taux de change */}
      <div className="card mb-5">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <TrendingUp size={14} className="text-orange"/> Historique des taux de change
          </h3>
          <button className="btn btn-primary btn-sm" onClick={openAddTaux}><Plus size={13}/> Nouveau taux</button>
        </div>
        <ApiState isLoading={tauxLoading} onRetry={refetchTaux} loadingText="Chargement...">
          <div className="overflow-x-auto">
            <table className="tbl text-sm">
              <thead><tr><th>Date d'effet</th><th>Taux (Ar/€)</th><th>Observation</th><th>Défini par</th></tr></thead>
              <tbody>
                {tauxList.length === 0
                  ? <tr><td colSpan={4} className="py-8 text-center text-gray-400">Aucun taux de change enregistré</td></tr>
                  : tauxList.map(t => (
                    <tr key={t.id}>
                      <td>{fmtDate(t.date_effet)}</td>
                      <td><strong className="text-brand-green">{(+t.taux).toLocaleString('fr-FR')} Ar</strong></td>
                      <td className="text-gray-500">{t.observation || '—'}</td>
                      <td className="text-xs text-gray-400">{t.defini_par_nom || '—'}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </ApiState>
      </div>

      <div className="flex justify-end">
        <button className="btn btn-primary" onClick={openAdd}><Plus size={14}/> Ajouter une constante</button>
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editItem ? `Modifier — ${editItem.cle}` : 'Ajouter une Constante'} icon={Settings}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Annuler</button>
          <button className="btn btn-success" onClick={handleSubmit(onSubmit)} disabled={saveMut.isPending}>
            <Save size={14}/> {saveMut.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </>}
      >
        <div className="form-group">
          <label className="form-label">Clé <span className="form-req">*</span></label>
          <input className={`form-control font-mono ${editItem ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
            placeholder="ex: taux_change" readOnly={!!editItem}
            {...register('cle', { required: true })}/>
          <p className="form-hint">Identifiant unique, pas d'espace ni de majuscule</p>
        </div>
        <div className="form-group">
          <label className="form-label">Valeur <span className="form-req">*</span></label>
          <input className="form-control" placeholder="Valeur de la constante"
            {...register('valeur', { required: true })}/>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-control" placeholder="Explication de cette constante"
            {...register('description')}/>
        </div>
        {editItem && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-brand-blue">
            ℹ️ La clé ne peut pas être modifiée. Pour changer la clé, supprimez et recréez la constante.
          </div>
        )}
      </Modal>

      {/* RG 35 — Modal ajout taux de change */}
      <Modal open={tauxModal} onClose={() => setTauxModal(false)}
        title="Nouveau taux de change" icon={TrendingUp}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setTauxModal(false)}>Annuler</button>
          <button className="btn btn-success" onClick={tauxForm.handleSubmit(onSubmitTaux)} disabled={tauxMut.isPending}>
            <Save size={14}/> {tauxMut.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </>}
      >
        <div className="form-group">
          <label className="form-label">Taux (Ar pour 1 €) <span className="form-req">*</span></label>
          <input type="number" step="0.01" className="form-control" placeholder="ex: 4900"
            {...tauxForm.register('taux', { required: true, min: 0 })}/>
        </div>
        <div className="form-group">
          <label className="form-label">Date d'effet <span className="form-req">*</span></label>
          <input type="date" className="form-control" {...tauxForm.register('date_effet', { required: true })}/>
        </div>
        <div className="form-group">
          <label className="form-label">Observation</label>
          <input className="form-control" placeholder="ex: Ajustement suite dévaluation"
            {...tauxForm.register('observation')}/>
        </div>
      </Modal>
    </Layout>
  )
}