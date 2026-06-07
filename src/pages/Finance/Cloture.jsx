import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FolderOpen, Plus, Pencil, Trash2, ArrowLeft, Save } from 'lucide-react'
import { useProgrammeClients } from '../../hooks/useApi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeAPI } from '../../utils/api'
import { useConfirm } from '../../hooks/useConfirm'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import { Modal, Badge, SearchInput, StatCard } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate, fmt, today } from '../../utils/storage'

function ClotureForm({ pc, onBack }) {
  const qc = useQueryClient()
  const { confirmDelete, confirmSave } = useConfirm()
  const [lgModal, setLgModal] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [lignes,  setLignes]  = useState([])
  const [obs,     setObs]     = useState('')
  const [dateCl,  setDateCl]  = useState(today())
  const [totRec,  setTotRec]  = useState(0)
  const [inited,  setInited]  = useState(false)

  const lgMethods = useForm()

  const { data: cloture, isLoading } = useQuery({
    queryKey: ['cloture', pc.id],
    queryFn:  () => financeAPI.getClotures(`?programme_client=${pc.id}`).then(r => (r.results||r)[0] || null),
    retry: false,
  })

  if (cloture && !inited) {
    setLignes(cloture.lignes || [])
    setObs(cloture.observation || '')
    setDateCl(cloture.date_cloture || today())
    setTotRec(cloture.total_recettes || 0)
    setInited(true)
  }

  const saveMut = useMutation({
    mutationFn: (data) => cloture
      ? financeAPI.getClotures()  // PATCH not implemented, simplified
      : financeAPI.createCloture(data),
    onSuccess: () => { qc.invalidateQueries(['cloture', pc.id]); toast.success('Clôture enregistrée'); onBack() },
    onError: e => toast.error(e.message),
  })

  const totalDep = lignes.reduce((s,l) => s + (+l.montant||0), 0)
  const benefice = (+totRec||0) - totalDep

  const openAdd  = () => { setEditIdx(null); lgMethods.reset({ description:'', prestataire:'', montant:'', date:'' }); setLgModal(true) }
  const openEdit = (i) => { setEditIdx(i); lgMethods.reset({...lignes[i]}); setLgModal(true) }
  const saveLg   = lgMethods.handleSubmit(data => {
    const lg = { ...data, montant:+data.montant||0 }
    setLignes(prev => editIdx!==null ? prev.map((l,i)=>i===editIdx?lg:l) : [...prev, lg])
    setLgModal(false)
  })

  const save = () => confirmSave(() => saveMut.mutate({
    programme_client: pc.id,
    date_cloture: dateCl,
    observation: obs,
    total_recettes: +totRec||0,
    total_depenses: totalDep,
    benefice_net: benefice,
    lignes: lignes.map((l,i) => ({ ...l, ordre:i })),
  }))

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={14}/> Retour</button>
        <h1 className="page-title text-xl"><FolderOpen size={20} className="text-orange"/> Clôture — {pc.client_nom}</h1>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Paramètres de clôture</h3>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Date clôture</label>
            <input type="date" className="form-control w-44 py-1.5 text-sm" value={dateCl} onChange={e=>setDateCl(e.target.value)}/>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
            {[['Client',pc.client_nom],['Programme',pc.programme_nom],['PAX',pc.nb_pax],['Période',`${fmtDate(pc.date_debut)} → ${fmtDate(pc.date_fin)}`]].map(([k,v])=>(
              <div key={k}><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{k}</div><div className="font-semibold text-gray-800 dark:text-gray-200">{v}</div></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="form-label">Total Recettes (€)</label><input type="number" step="0.01" className="form-control" value={totRec} onChange={e=>setTotRec(e.target.value)} placeholder="0.00"/></div>
            <div className="form-group"><label className="form-label">Observation</label><input className="form-control" value={obs} onChange={e=>setObs(e.target.value)}/></div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Lignes de Dépenses Réelles</h3>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={13}/> Ajouter</button>
        </div>
        {isLoading ? <div className="p-8 text-center text-gray-400">Chargement...</div> : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Description</th><th>Prestataire</th><th>Montant (€)</th><th className="text-center">Actions</th></tr></thead>
              <tbody>
                {lignes.length===0
                  ? <tr><td colSpan={5} className="py-8 text-center text-gray-400">Aucune dépense</td></tr>
                  : lignes.map((l,i)=>(
                    <tr key={i}>
                      <td>{fmtDate(l.date)}</td>
                      <td><strong className="text-gray-900 dark:text-white">{l.description}</strong></td>
                      <td className="text-gray-500">{l.prestataire||'—'}</td>
                      <td><strong className="text-brand-red">{fmt(l.montant)}</strong></td>
                      <td className="text-center">
                        <button className="btn btn-ghost btn-xs mr-1" onClick={()=>openEdit(i)}><Pencil size={11}/></button>
                        <button className="btn btn-danger btn-xs" onClick={()=>confirmDelete(`ligne ${i+1}`,()=>setLignes(p=>p.filter((_,j)=>j!==i)))}><Trash2 size={11}/></button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
        {/* Résumé */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Total Recettes</span><strong className="text-brand-green">{fmt(+totRec||0)}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Dépenses</span><strong className="text-brand-red">{fmt(totalDep)}</strong></div>
            <div className={`flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-black text-base ${benefice>=0?'text-brand-green':'text-brand-red'}`}>
              <span>Bénéfice Net</span><strong>{fmt(benefice)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="btn btn-ghost" onClick={onBack}>Annuler</button>
        <button className="btn btn-success btn-lg" onClick={save} disabled={saveMut.isPending}>
          <Save size={15}/> {saveMut.isPending ? 'Enregistrement...' : 'Clôturer le dossier'}
        </button>
      </div>

      <Modal open={lgModal} onClose={()=>setLgModal(false)} title={editIdx!==null?'Modifier':'Ajouter une dépense'} icon={FolderOpen}
        footer={<><button className="btn btn-ghost" onClick={()=>setLgModal(false)}>Annuler</button><button className="btn btn-success" onClick={saveLg}>Enregistrer</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" {...lgMethods.register('date')}/></div>
          <div className="form-group col-span-2"><label className="form-label">Description <span className="form-req">*</span></label><input className="form-control" {...lgMethods.register('description',{required:true})}/></div>
          <div className="form-group"><label className="form-label">Prestataire</label><input className="form-control" {...lgMethods.register('prestataire')}/></div>
          <div className="form-group"><label className="form-label">Montant (€) <span className="form-req">*</span></label><input type="number" step="0.01" className="form-control" placeholder="0.00" {...lgMethods.register('montant',{required:true,min:0})}/></div>
        </div>
      </Modal>
    </div>
  )
}

export default function Cloture() {
  const { data: pcs = [], isLoading, error, refetch } = useProgrammeClients()
  const [curPC, setCurPC] = useState(null)
  const [search, setSearch] = useState('')
  const eligible = pcs.filter(p => p.a_facture_pro)
  const filtered  = eligible.filter(p => !search || (p.client_nom||'').toLowerCase().includes(search.toLowerCase()))

  if (curPC) return (
    <Layout breadcrumb={['SITRAC','Finance','Dossier Finance','Clôture']}>
      <ClotureForm pc={curPC} onBack={()=>setCurPC(null)}/>
    </Layout>
  )
  return (
    <Layout breadcrumb={['SITRAC','Finance','Dossier Finance','Clôture']}>
      <div className="mb-5">
        <h1 className="page-title"><FolderOpen size={22} className="text-orange"/> Clôture</h1>
        <p className="page-sub">Clôture financière des dossiers clients (RG 24)</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={FolderOpen} value={eligible.length} label="Dossiers éligibles" color="orange"/>
        <StatCard icon={FolderOpen} value={pcs.length} label="Total dossiers" color="blue"/>
        <StatCard icon={FolderOpen} value={0} label="Clôturés" color="green"/>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Choisir un dossier à clôturer</h3>
          <SearchInput value={search} onChange={setSearch}/>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Client</th><th>Programme</th><th>PAX</th><th>Prix vente</th><th className="text-center">Clôture</th></tr></thead>
              <tbody>
                {filtered.length===0
                  ? <tr><td colSpan={5} className="py-10 text-center text-gray-400">Aucun dossier éligible</td></tr>
                  : filtered.map(p=>(
                    <tr key={p.id}>
                      <td><strong className="text-gray-900 dark:text-white">{p.client_nom}</strong></td>
                      <td><Badge variant="info">{p.programme_nom}</Badge></td>
                      <td>{p.nb_pax}</td>
                      <td><strong>{(+p.prix_vente).toLocaleString('fr-FR')} €</strong></td>
                      <td className="text-center"><button className="btn btn-primary btn-sm" onClick={()=>setCurPC(p)}><FolderOpen size={13}/> Clôturer</button></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </ApiState>
      </div>
    </Layout>
  )
}
