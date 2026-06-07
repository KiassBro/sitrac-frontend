import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FileCheck, Plus, Pencil, Trash2, ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { useProgrammeClients } from '../../hooks/useApi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeAPI } from '../../utils/api'
import { useConfirm } from '../../hooks/useConfirm'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import { Modal, Badge, SearchInput, StatCard } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate, fmt, today } from '../../utils/storage'

function FactureDefForm({ pc, onBack }) {
  const qc = useQueryClient()
  const { confirmDelete, confirmSave } = useConfirm()
  const [lgModal, setLgModal] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [lignes,  setLignes]  = useState([])
  const [remise,  setRemise]  = useState(0)
  const [dateFac, setDateFac] = useState(today())
  const [inited,  setInited]  = useState(false)

  const lgMethods = useForm()

  const { data: fd, isLoading } = useQuery({
    queryKey: ['facture-def', pc.id],
    queryFn:  () => financeAPI.getFacturesDef(`?programme_client=${pc.id}`).then(r => (r.results||r)[0] || null),
    retry: false,
  })

  if (fd && !inited) {
    setLignes(fd.lignes || [])
    setRemise(fd.remise || 0)
    setDateFac(fd.date_facture || today())
    setInited(true)
  }

  const saveMut = useMutation({
    mutationFn: (data) => fd
      ? financeAPI.updateFactureDef(fd.id, data)
      : financeAPI.createFactureDef(data),
    onSuccess: () => { qc.invalidateQueries(['facture-def', pc.id]); qc.invalidateQueries(['pcs']); toast.success('Facture Définitive enregistrée'); onBack() },
    onError: e => toast.error(e.message),
  })

  const totalHT  = lignes.reduce((s,l) => s + (+l.nombre||1)*(+l.prix_unitaire||0), 0)
  const totalTTC = totalHT - (+remise||0)

  const openAdd  = () => { setEditIdx(null); lgMethods.reset({ date:'', service:'', nombre:1, prix_unitaire:'' }); setLgModal(true) }
  const openEdit = (i) => { setEditIdx(i); lgMethods.reset({...lignes[i]}); setLgModal(true) }
  const saveLg   = lgMethods.handleSubmit(data => {
    const lg = { ...data, nombre:+data.nombre||1, prix_unitaire:+data.prix_unitaire||0 }
    setLignes(prev => editIdx!==null ? prev.map((l,i)=>i===editIdx?lg:l) : [...prev, lg])
    setLgModal(false)
    toast.success(editIdx!==null ? 'Ligne modifiée' : 'Ligne ajoutée')
  })

  const save = () => confirmSave(() => saveMut.mutate({
    programme_client: pc.id,
    date_facture: dateFac,
    remise: +remise || 0,
    lignes: lignes.map((l,i) => ({ ...l, ordre:i })),
  }))

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={14}/> Retour</button>
        <h1 className="page-title text-xl"><FileCheck size={20} className="text-orange"/> Facture Définitive — {pc.client_nom}</h1>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Informations du dossier</h3>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Date facture</label>
            <input type="date" className="form-control w-44 py-1.5 text-sm" value={dateFac} onChange={e=>setDateFac(e.target.value)}/>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {[['Client', pc.client_nom],['Programme', pc.programme_nom],['PAX', pc.nb_pax],['Période', `${fmtDate(pc.date_debut)} → ${fmtDate(pc.date_fin)}`]].map(([k,v])=>(
              <div key={k}><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{k}</div><div className="font-semibold text-gray-800 dark:text-gray-200">{v}</div></div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Lignes de Facturation</h3>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={13}/> Ajouter une ligne</button>
        </div>
        {isLoading ? <div className="p-8 text-center text-gray-400">Chargement...</div> : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Service / Description</th><th>Nombre</th><th>Prix unit. (€)</th><th>Total (€)</th><th className="text-center">Actions</th></tr></thead>
              <tbody>
                {lignes.length===0
                  ? <tr><td colSpan={6} className="py-8 text-center text-gray-400">Aucune ligne</td></tr>
                  : lignes.map((l,i)=>(
                    <tr key={i}>
                      <td>{fmtDate(l.date)}</td>
                      <td><strong className="text-gray-900 dark:text-white">{l.service}</strong></td>
                      <td>{l.nombre||1}</td>
                      <td>{fmt(l.prix_unitaire)}</td>
                      <td><strong className="text-brand-green">{fmt((+l.nombre||1)*(+l.prix_unitaire||0))}</strong></td>
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
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Total HT</span><strong>{fmt(totalHT)}</strong></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Remise (€)</span>
              <input type="number" step="0.01" className="form-control w-28 py-1 text-sm text-right" value={remise} onChange={e=>setRemise(e.target.value)}/>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-black text-base text-brand-green">
              <span>Total à Payer</span><strong>{fmt(totalTTC)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="btn btn-ghost" onClick={onBack}>Annuler</button>
        <button className="btn btn-success btn-lg" onClick={save} disabled={saveMut.isPending}>
          <Save size={15}/> {saveMut.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <Modal open={lgModal} onClose={()=>setLgModal(false)} title={editIdx!==null?'Modifier une ligne':'Ajouter une ligne'} icon={FileCheck}
        footer={<><button className="btn btn-ghost" onClick={()=>setLgModal(false)}>Annuler</button><button className="btn btn-success" onClick={saveLg}>Enregistrer</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" {...lgMethods.register('date')}/></div>
          <div className="form-group col-span-2"><label className="form-label">Service / Description <span className="form-req">*</span></label><input className="form-control" placeholder="Description du service..." {...lgMethods.register('service',{required:true})}/></div>
          <div className="form-group"><label className="form-label">Nombre</label><input type="number" min={1} defaultValue={1} className="form-control" {...lgMethods.register('nombre',{required:true,min:1})}/></div>
          <div className="form-group"><label className="form-label">Prix unitaire (€) <span className="form-req">*</span></label><input type="number" step="0.01" className="form-control" placeholder="0.00" {...lgMethods.register('prix_unitaire',{required:true,min:0})}/></div>
        </div>
      </Modal>
    </div>
  )
}

export default function FactureDefinitive() {
  const { data: pcs = [], isLoading, error, refetch } = useProgrammeClients()
  const [curPC, setCurPC] = useState(null)
  const [search, setSearch] = useState('')

  const eligible = pcs.filter(p => p.a_facture_pro)
  const filtered  = eligible.filter(p => !search || (p.client_nom||'').toLowerCase().includes(search.toLowerCase()))

  if (curPC) return (
    <Layout breadcrumb={['SITRAC','Finance','Dossier Finance','Facture Définitive']}>
      <FactureDefForm pc={curPC} onBack={()=>setCurPC(null)}/>
    </Layout>
  )

  return (
    <Layout breadcrumb={['SITRAC','Finance','Dossier Finance','Facture Définitive']}>
      <div className="mb-5">
        <h1 className="page-title"><FileCheck size={22} className="text-orange"/> Facture Définitive</h1>
        <p className="page-sub">Factures définitives remplaçant les factures proforma (RG 22, 27)</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={FileCheck} value={eligible.length} label="Dossiers éligibles" color="orange"/>
        <StatCard icon={FileCheck} value={pcs.filter(p=>p.a_facture_pro).length} label="Avec Facture Pro" color="blue"/>
        <StatCard icon={FileCheck} value={pcs.length} label="Total dossiers" color="green"/>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Choisir un dossier</h3>
          <SearchInput value={search} onChange={setSearch}/>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Client</th><th>Programme</th><th>PAX</th><th>Prix vente</th><th>Facture Pro</th><th className="text-center">Facture Déf.</th></tr></thead>
              <tbody>
                {filtered.length===0
                  ? <tr><td colSpan={6} className="py-10 text-center text-gray-400">Aucun dossier éligible</td></tr>
                  : filtered.map(p=>(
                    <tr key={p.id}>
                      <td><strong className="text-gray-900 dark:text-white">{p.client_nom}</strong></td>
                      <td><Badge variant="info">{p.programme_nom}</Badge></td>
                      <td>{p.nb_pax}</td>
                      <td><strong>{(+p.prix_vente).toLocaleString('fr-FR')} €</strong></td>
                      <td>{p.a_facture_pro ? <Badge variant="active">✓</Badge> : <Badge variant="inactive">Non</Badge>}</td>
                      <td className="text-center">
                        {!p.a_facture_pro
                          ? <span className="flex items-center justify-center gap-1 text-xs text-gray-400"><AlertCircle size={12}/> FP requise</span>
                          : <button className="btn btn-primary btn-sm" onClick={()=>setCurPC(p)}><FileCheck size={13}/> Gérer</button>
                        }
                      </td>
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
