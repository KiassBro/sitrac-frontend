import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Route, Plus, Pencil, Trash2 } from 'lucide-react'
import { useConfirm } from '../../hooks/useConfirm'
import { useProgrammes, useProgrammeMutations, useDestinations } from '../../hooks/useApi'
import Layout from '../../components/Layout/Layout'
import { Modal, Toggle, StatCard, Pagination, SearchInput, Badge } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'

export default function Programmes() {
  const { data: progs = [], isLoading, error, refetch } = useProgrammes()
  const { data: dests = [] } = useDestinations()
  const { create, update, remove, toggle } = useProgrammeMutations()
  const { confirmDelete, confirmSave, confirmToggle } = useConfirm()

  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)
  const [modal,  setModal]  = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [allerSel,   setAllerSel]   = useState([])
  const [retourSel,  setRetourSel]  = useState([])
  const PER = 8

  const { register, handleSubmit, reset } = useForm()
  const filteredDests = dests.filter(d => d.actif)
  const computedCode  = [...allerSel, ...retourSel].join('-')

  const filtered  = progs.filter(p => !search || p.nom.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()))
  const paginated = filtered.slice((page-1)*PER, page*PER)

  const openAdd  = () => { setEditItem(null); setAllerSel([]); setRetourSel([]); reset({ nom:'', type_prog:'', prix:'', description:'' }); setModal(true) }
  const openEdit = (p) => {
    setEditItem(p); setAllerSel(p.destinations_aller||[]); setRetourSel(p.destinations_retour||[])
    reset({ nom:p.nom, type_prog:p.type_prog, prix:p.prix, description:p.description||'' }); setModal(true)
  }

  const toggleDest = (code, side) => {
    if (side==='aller') setAllerSel(prev => prev.includes(code) ? prev.filter(c=>c!==code) : [...prev,code])
    else setRetourSel(prev => prev.includes(code) ? prev.filter(c=>c!==code) : [...prev,code])
  }

  const onSubmit = (data) => {
    if (!allerSel.length) return
    const payload = { ...data, prix:+data.prix, code:computedCode, destinations_aller:allerSel, destinations_retour:retourSel }
    const doSave  = () => {
      const opts = { onSuccess: () => setModal(false) }
      if (editItem) update.mutate({ id:editItem.id, data:payload }, opts)
      else          create.mutate(payload, opts)
    }
    if (editItem) confirmSave(doSave); else doSave()
  }

  return (
    <Layout breadcrumb={['SITRAC','Sales','Base de données','Programmes']}>
      <div className="mb-5">
        <h1 className="page-title"><Route size={22} className="text-orange"/> Programmes</h1>
        <p className="page-sub">Produits touristiques à vendre aux clients (RG 04, 05, 06)</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Route} value={progs.length}               label="Total"    color="orange"/>
        <StatCard icon={Route} value={progs.filter(p=>p.actif).length} label="Actifs" color="green"/>
        <StatCard icon={Route} value={progs.filter(p=>!p.actif).length} label="Inactifs" color="red"/>
        <StatCard icon={Route} value={[...new Set(progs.flatMap(p=>[...(p.destinations_aller||[]),...(p.destinations_retour||[])]))].length} label="Destinations" color="blue"/>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200"><Route size={15} className="text-orange"/>Programmes</h3>
          <div className="flex gap-2">
            <SearchInput value={search} onChange={v=>{setSearch(v);setPage(1)}}/>
            <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14}/> Ajouter</button>
          </div>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement des programmes...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Nom</th><th>Code</th><th>Type</th><th>Prix</th><th>Description</th><th>État</th><th className="text-center">Actions</th></tr></thead>
              <tbody>
                {paginated.length===0
                  ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Aucun programme</td></tr>
                  : paginated.map(p=>(
                    <tr key={p.id}>
                      <td><strong className="text-gray-900 dark:text-white">{p.nom}</strong></td>
                      <td><span className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-brand-blue px-2 py-0.5 rounded font-bold">{p.code}</span></td>
                      <td><Badge variant="info">{p.type_prog}</Badge></td>
                      <td><strong>{(+p.prix).toLocaleString('fr-FR')} €</strong></td>
                      <td className="max-w-[160px] truncate text-xs text-gray-400">{p.description||'—'}</td>
                      <td><Toggle checked={p.actif} onChange={()=>confirmToggle(p.nom,p.actif,()=>toggle.mutate(p.id))}/></td>
                      <td className="text-center">
                        <button className="btn btn-ghost btn-xs mr-1.5" onClick={()=>openEdit(p)}><Pencil size={12}/></button>
                        <button className="btn btn-danger btn-xs" onClick={()=>confirmDelete(p.nom,()=>remove.mutate(p.id))}><Trash2 size={12}/></button>
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

      <Modal open={modal} onClose={()=>setModal(false)} title={editItem?'Modifier un Programme':'Ajouter un Programme'} icon={Route} size="lg"
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setModal(false)}>Annuler</button>
          <button className="btn btn-success" onClick={handleSubmit(onSubmit)} disabled={create.isPending||update.isPending}>
            {create.isPending||update.isPending?'Enregistrement...':'Enregistrer'}
          </button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="form-label">Nom <span className="form-req">*</span></label><input className="form-control" {...register('nom',{required:true})}/></div>
          <div className="form-group">
            <label className="form-label">Type <span className="form-req">*</span></label>
            <select className="form-control" {...register('type_prog',{required:true})}>
              <option value="">-- Sélectionner --</option>
              {['Grand Sud','Nord','Est','Ouest','Côte','Mixte','Spécial','Île'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Prix par personne (€) <span className="form-req">*</span></label><input type="number" className="form-control" step="0.01" {...register('prix',{required:true,min:1})}/></div>
          <div className="form-group"><label className="form-label">Description</label><input className="form-control" {...register('description')}/></div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-brand-blue mb-4">
          ℹ️ Double-cliquer sur une destination pour la sélectionner. Le code est généré automatiquement.
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[['aller','Chemin Aller *'],['retour','Chemin Retour']].map(([side,label])=>(
            <div key={side}>
              <label className="form-label">{label}</label>
              <div className="min-h-[90px] p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-wrap content-start">
                {filteredDests.map(d=>{
                  const sel = side==='aller' ? allerSel.includes(d.code) : retourSel.includes(d.code)
                  return (
                    <span key={d.code} onDoubleClick={()=>toggleDest(d.code,side)}
                      className={`inline-flex items-center m-1 px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer border transition-all select-none
                        ${sel ? (side==='aller'?'bg-orange-light border-orange text-orange-dark':'bg-blue-50 border-brand-blue text-brand-blue')
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 hover:border-orange hover:text-orange'}`}>
                      {d.code}
                    </span>
                  )
                })}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1 min-h-[28px]">
                {(side==='aller'?allerSel:retourSel).map((c,i)=>(
                  <span key={c} className="flex items-center gap-1 bg-orange-light border border-orange text-orange-dark text-xs font-bold px-2 py-0.5 rounded">
                    {i+1}. {c}
                    <button className="text-brand-red ml-0.5" onClick={()=>toggleDest(c,side)}>✕</button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="form-group">
          <label className="form-label">Code généré</label>
          <div className={`px-4 py-2.5 rounded-lg border-2 border-dashed font-mono font-black text-center text-base transition-colors ${computedCode?'border-orange bg-orange-light text-orange-dark':'border-gray-200 text-gray-400'}`}>
            {computedCode || 'Sélectionnez des destinations...'}
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
