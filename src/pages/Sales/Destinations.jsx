import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react'
import { useConfirm } from '../../hooks/useConfirm'
import { useDestinations, useDestinationMutations } from '../../hooks/useApi'
import Layout from '../../components/Layout/Layout'
import { Modal, Toggle, StatCard, Pagination, SearchInput } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'

export default function Destinations() {
  const { data: dests = [], isLoading, error, refetch } = useDestinations()
  const { create, update, remove, toggle } = useDestinationMutations()
  const { confirmDelete, confirmSave, confirmToggle } = useConfirm()

  const [search, setSearch] = useState('')
  const [fVille, setFVille] = useState('')
  const [fCode,  setFCode]  = useState('')
  const [page,   setPage]   = useState(1)
  const [modal,  setModal]  = useState(false)
  const [editItem, setEditItem] = useState(null)
  const PER = 8

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const filtered  = dests.filter(d =>
    (!search || d.ville.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())) &&
    (!fVille || d.ville.toLowerCase().includes(fVille.toLowerCase())) &&
    (!fCode  || d.code.toLowerCase().includes(fCode.toLowerCase()))
  )
  const paginated = filtered.slice((page-1)*PER, page*PER)
  const actives   = dests.filter(d => d.actif).length

  const openAdd  = () => { setEditItem(null); reset({ ville:'', code:'', description:'' }); setModal(true) }
  const openEdit = (d) => { setEditItem(d); reset({ ville:d.ville, code:d.code, description:d.description||'' }); setModal(true) }

  const onSubmit = (data) => {
    const payload = { ...data, code: data.code.trim().toUpperCase() }
    const doSave  = () => {
      const opts = { onSuccess: () => setModal(false) }
      if (editItem) update.mutate({ id: editItem.id, data: payload }, opts)
      else          create.mutate(payload, opts)
    }
    if (editItem) confirmSave(doSave); else doSave()
  }

  return (
    <Layout breadcrumb={['SITRAC','Sales','Base de données','Destinations']}>
      <div className="mb-5">
        <h1 className="page-title"><MapPin size={22} className="text-orange"/> Destinations</h1>
        <p className="page-sub">Gestion des destinations géographiques disponibles</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={MapPin} value={dests.length}           label="Total"     color="orange"/>
        <StatCard icon={MapPin} value={actives}                label="Actives"   color="green"/>
        <StatCard icon={MapPin} value={dests.length - actives} label="Inactives" color="red"/>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <MapPin size={15} className="text-orange"/> Liste des Destinations
          </h3>
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={v=>{setSearch(v);setPage(1)}}/>
            <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14}/> Ajouter</button>
          </div>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement des destinations...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr>
                <th>
                  <div>Ville</div>
                  <input className="mt-1 w-full text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:border-orange"
                    placeholder="Filtrer..." value={fVille} onChange={e=>{setFVille(e.target.value);setPage(1)}}/>
                </th>
                <th>
                  <div>Code</div>
                  <input className="mt-1 w-full text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:border-orange"
                    placeholder="Filtrer..." value={fCode} onChange={e=>{setFCode(e.target.value);setPage(1)}}/>
                </th>
                <th>Description</th><th>État</th><th className="text-center">Actions</th>
              </tr></thead>
              <tbody>
                {paginated.length === 0
                  ? <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-sm">Aucune destination</td></tr>
                  : paginated.map(d => (
                    <tr key={d.id}>
                      <td><strong className="text-gray-900 dark:text-white">{d.ville}</strong></td>
                      <td><span className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-brand-blue px-2 py-0.5 rounded font-bold">{d.code}</span></td>
                      <td className="max-w-[200px] truncate text-gray-500 text-xs">{d.description||'—'}</td>
                      <td>
                        <Toggle checked={d.actif} onChange={() =>
                          confirmToggle(d.ville, d.actif, () => toggle.mutate(d.id))}/>
                      </td>
                      <td className="text-center">
                        <button className="btn btn-ghost btn-xs mr-1.5" onClick={()=>openEdit(d)}><Pencil size={12}/></button>
                        <button className="btn btn-danger btn-xs" onClick={() =>
                          confirmDelete(d.ville, () => remove.mutate(d.id))}><Trash2 size={12}/></button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage}/>
        </ApiState>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)}
        title={editItem ? 'Modifier une Destination' : 'Ajouter une Destination'} icon={MapPin}
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setModal(false)}>Annuler</button>
          <button className="btn btn-success" onClick={handleSubmit(onSubmit)}
            disabled={create.isPending || update.isPending}>
            {create.isPending || update.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </>}
      >
        <div className="form-group">
          <label className="form-label">Ville <span className="form-req">*</span></label>
          <input className={`form-control ${errors.ville?'border-brand-red':''}`}
            placeholder="Nom de la ville" {...register('ville',{required:true})}/>
          {errors.ville && <p className="text-xs text-brand-red mt-1">La ville est obligatoire</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Code <span className="form-req">*</span></label>
          <input className="form-control font-mono uppercase" placeholder="Ex: TNR, TLR..."
            maxLength={10} {...register('code',{required:true})}/>
          <p className="form-hint">Code unique 2–5 lettres majuscules</p>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-control" rows={3} placeholder="Description..." {...register('description')}/>
        </div>
      </Modal>
    </Layout>
  )
}
