import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Package, Plus, Pencil, Trash2, ArrowLeft, Save, Download, Upload } from 'lucide-react'
import { useProgrammeClients } from '../../hooks/useApi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingAPI } from '../../utils/api'
import { useConfirm } from '../../hooks/useConfirm'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import ChampPrestataire from '../../components/Prestataires/ChampPrestataire'
import { Modal, Badge, SearchInput, StatCard, Alert } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate, fmt, today } from '../../utils/storage'

function ProvisionForm({ pc, onBack }) {
  const qc = useQueryClient()
  const { confirmDelete, confirmSave } = useConfirm()
  const [lgModal, setLgModal] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [lignes,  setLignes]  = useState([])
  const [obs,     setObs]     = useState('')
  const [dateProv,setDateProv] = useState(today())
  const [inited,  setInited]  = useState(false)
  const [csvBusy, setCsvBusy] = useState(false)
  const fileInputRef = useRef(null)

  const lgMethods = useForm()

  const { data: prov, isLoading } = useQuery({
    queryKey: ['provision', pc.id],
    queryFn:  () => bookingAPI.getProvisions(`?programme_client=${pc.id}`).then(r => (r.results||r)[0] || null),
    retry: false,
  })

  if (prov && !inited) {
    setLignes(prov.lignes || [])
    setObs(prov.observation || '')
    setDateProv(prov.date_provision || today())
    setInited(true)
  }

  const saveMut = useMutation({
    mutationFn: (data) => prov
      ? bookingAPI.updateProvision(prov.id, data)
      : bookingAPI.createProvision(data),
    onSuccess: () => { qc.invalidateQueries(['provision', pc.id]); toast.success('Provision enregistrée'); onBack() },
    onError: e => toast.error(e.message),
  })

  const total = lignes.reduce((s,l) => s + (+l.montant||0), 0)

  // Nouvelle provision : reprend les prestations du brieffing (RG 19) —
  // description, prestataire, date et tarif ; rien n'est ressaisi.
  const [reprise, setReprise] = useState(false)
  const reprendreBrieffing = async (silencieux = false) => {
    try {
      const brf = await bookingAPI.getBrieffings(`?programme_client=${pc.id}`).then(r => (r.results||r)[0] || null)
      const nouvelles = (brf?.lignes || []).map(l => ({
        description: l.itineraire ? `${l.itineraire} — ${l.prestataire}` : l.prestataire,
        prestataire: l.prestataire, montant: +l.tarif_paiement || 0, date: l.date || '',
      }))
      if (!nouvelles.length) { if (!silencieux) toast('Aucune ligne dans le brieffing'); return }
      setLignes(prev => {
        const deja = new Set(prev.map(l => `${l.date}|${(l.prestataire||'').toLowerCase()}`))
        return [...prev, ...nouvelles.filter(l => !deja.has(`${l.date}|${(l.prestataire||'').toLowerCase()}`))]
      })
      toast.success(`${nouvelles.length} ligne(s) reprise(s) du brieffing`)
    } catch { if (!silencieux) toast.error('Brieffing introuvable') }
  }
  useEffect(() => {
    if (isLoading || prov || reprise) return
    setReprise(true)
    if (lignes.length === 0) reprendreBrieffing(true)
  }, [isLoading, prov])

  const openAdd  = () => { setEditIdx(null); lgMethods.reset({ description:'', prestataire:'', montant:'', date:'' }); setLgModal(true) }
  const openEdit = (i) => { setEditIdx(i); lgMethods.reset({...lignes[i]}); setLgModal(true) }
  const saveLg   = lgMethods.handleSubmit(data => {
    const lg = { ...data, montant:+data.montant||0 }
    setLignes(prev => editIdx!==null ? prev.map((l,i)=>i===editIdx?lg:l) : [...prev, lg])
    setLgModal(false)
    toast.success(editIdx!==null ? 'Ligne modifiée' : 'Ligne ajoutée')
  })

  const save = () => confirmSave(() => saveMut.mutate({
    programme_client: pc.id,
    date_provision: dateProv,
    observation: obs,
    lignes: lignes.map((l,i) => ({ ...l, ordre:i })),
  }))

  // ── RG 31/32 : Export/Import CSV des lignes de provision ────────
  // Nécessite que la provision existe déjà côté serveur (prov non null).
  const exportCsv = async () => {
    if (!prov) return
    setCsvBusy(true)
    try {
      await bookingAPI.exportProvisionCsv(prov.id)
    } catch (e) {
      toast.error(`Échec de l'export CSV : ${e.message}`)
    } finally {
      setCsvBusy(false)
    }
  }

  const triggerImport = () => fileInputRef.current?.click()

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !prov) return
    setCsvBusy(true)
    try {
      const result = await bookingAPI.importProvisionCsv(prov.id, file)
      setLignes(result.provision.lignes || [])
      qc.invalidateQueries(['provision', pc.id])
      toast.success(result.detail)
    } catch (e) {
      toast.error(`Échec de l'import CSV : ${e.message}`)
    } finally {
      setCsvBusy(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={14}/> Retour</button>
        <h1 className="page-title text-xl"><Package size={20} className="text-orange"/> Provision — {pc.client_nom}</h1>
      </div>

      {/* Info */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Paramètres de la provision</h3>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Date provision</label>
            <input type="date" className="form-control w-44 py-1.5 text-sm" value={dateProv} onChange={e=>setDateProv(e.target.value)}/>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
            {[['Client', pc.client_nom],['Programme', pc.programme_nom],['PAX', pc.nb_pax],['Période', `${fmtDate(pc.date_debut)} → ${fmtDate(pc.date_fin)}`]].map(([k,v])=>(
              <div key={k}><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{k}</div><div className="font-semibold text-gray-800 dark:text-gray-200">{v}</div></div>
            ))}
          </div>
          <div className="form-group mb-0"><label className="form-label">Observation</label><textarea className="form-control" rows={2} value={obs} onChange={e=>setObs(e.target.value)} placeholder="Remarques générales..."/></div>
        </div>
      </div>

      {/* Lignes */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Lignes de Dépenses Prévisionnelles</h3>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => reprendreBrieffing(false)}
              title="Ajoute les prestations du brieffing qui ne sont pas encore provisionnées"><Plus size={13}/> Reprendre le brieffing</button>
            <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={13}/> Ajouter</button>
            <button className="btn btn-ghost btn-sm" disabled={!prov || csvBusy} onClick={exportCsv}
              title={!prov ? "Enregistrez d'abord la provision pour pouvoir exporter" : ''}>
              <Download size={13}/> Exporter
            </button>
            <button className="btn btn-ghost btn-sm" disabled={!prov || csvBusy} onClick={triggerImport}
              title={!prov ? "Enregistrez d'abord la provision pour pouvoir importer" : ''}>
              <Upload size={13}/> Importer
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile}/>
          </div>
        </div>
        {isLoading ? <div className="p-8 text-center text-gray-400">Chargement...</div> : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Description</th><th>Prestataire</th><th>Montant (€)</th><th className="text-center">Actions</th></tr></thead>
              <tbody>
                {lignes.length===0
                  ? <tr><td colSpan={5} className="py-8 text-center text-gray-400">Aucune dépense prévisionnelle</td></tr>
                  : lignes.map((l,i)=>(
                    <tr key={i}>
                      <td>{fmtDate(l.date)}</td>
                      <td><strong className="text-gray-900 dark:text-white">{l.description}</strong></td>
                      <td className="text-gray-500">{l.prestataire||'—'}</td>
                      <td><strong className="text-orange">{fmt(l.montant)}</strong></td>
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
        {lignes.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <div className="text-base font-black text-brand-green">Total Provisions : {fmt(total)}</div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button className="btn btn-ghost" onClick={onBack}>Annuler</button>
        <button className="btn btn-success btn-lg" onClick={save} disabled={saveMut.isPending}>
          <Save size={15}/> {saveMut.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <Modal open={lgModal} onClose={()=>setLgModal(false)} title={editIdx!==null?'Modifier':'Ajouter une dépense'} icon={Package}
        footer={<><button className="btn btn-ghost" onClick={()=>setLgModal(false)}>Annuler</button><button className="btn btn-success" onClick={saveLg}>Enregistrer</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" {...lgMethods.register('date')}/></div>
          <div className="form-group col-span-2"><label className="form-label">Description <span className="form-req">*</span></label><input className="form-control" placeholder="Ex: Hébergement Hôtel Ihosy..." {...lgMethods.register('description',{required:true})}/></div>
          <div className="form-group"><label className="form-label">Prestataire</label><ChampPrestataire form={lgMethods} name="prestataire" champMontant="montant"/></div>
          <div className="form-group"><label className="form-label">Montant (€) <span className="form-req">*</span></label><input type="number" step="0.01" className="form-control" placeholder="0.00" {...lgMethods.register('montant',{required:true,min:0})}/></div>
        </div>
      </Modal>
    </div>
  )
}

export default function Provision() {
  const { data: pcs = [], isLoading, error, refetch } = useProgrammeClients()
  const [curPC, setCurPC] = useState(null)
  const [search, setSearch] = useState('')

  const eligible = pcs.filter(p => p.a_facture_pro)
  const filtered  = eligible.filter(p => !search || (p.client_nom||'').toLowerCase().includes(search.toLowerCase()))

  if (curPC) return (
    <Layout breadcrumb={['SITRAC','Booking','Dossier Booking','Provision']}>
      <ProvisionForm pc={curPC} onBack={()=>setCurPC(null)}/>
    </Layout>
  )

  return (
    <Layout breadcrumb={['SITRAC','Booking','Dossier Booking','Provision']}>
      <div className="mb-5">
        <h1 className="page-title"><Package size={22} className="text-orange"/> Provision</h1>
        <p className="page-sub">Dépenses prévisionnelles par dossier client</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Package} value={eligible.length} label="Dossiers éligibles" color="orange"/>
        <StatCard icon={Package} value={eligible.length} label="Avec Facture Pro" color="blue"/>
        <StatCard icon={Package} value={0} label="Provisions créées" color="green"/>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Choisir un dossier client</h3>
          <SearchInput value={search} onChange={setSearch}/>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Client</th><th>Programme</th><th>PAX</th><th>Période</th><th className="text-center">Provision</th></tr></thead>
              <tbody>
                {filtered.length===0
                  ? <tr><td colSpan={5} className="py-10 text-center text-gray-400">Aucun dossier éligible (Facture Pro requise)</td></tr>
                  : filtered.map(p=>(
                    <tr key={p.id}>
                      <td><strong className="text-gray-900 dark:text-white">{p.client_nom}</strong></td>
                      <td><Badge variant="info">{p.programme_nom}</Badge></td>
                      <td>{p.nb_pax}</td>
                      <td className="text-xs text-gray-500">{fmtDate(p.date_debut)} → {fmtDate(p.date_fin)}</td>
                      <td className="text-center"><button className="btn btn-primary btn-sm" onClick={()=>setCurPC(p)}><Package size={13}/> Gérer</button></td>
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