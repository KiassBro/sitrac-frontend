import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Settings, Plus, Pencil, Save } from 'lucide-react'
import { useConstantes } from '../../hooks/useApi'
import { superviseurAPI } from '../../utils/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useConfirm } from '../../hooks/useConfirm'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import { Modal, StatCard } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'

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
    </Layout>
  )
}
