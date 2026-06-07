import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FileText, Plus, Pencil, Trash2, ArrowLeft, Save } from 'lucide-react'
import { useProgrammeClients, useCotation, useCotationMutation } from '../../hooks/useApi'
import { useConfirm } from '../../hooks/useConfirm'
import Layout from '../../components/Layout/Layout'
import { Modal, Badge, SearchInput } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate, fmt, fmtAr } from '../../utils/storage'

// ─── Sous-composant : formulaire de cotation ──────────────────
function CotationForm({ pc, onBack }) {
  const { data: cot, isLoading, error, refetch } = useCotation(pc.id)
  const save = useCotationMutation(pc.id)
  const { confirmDelete, confirmSave } = useConfirm()

  const [lignes,    setLignes]    = useState(() => cot?.lignes || [])
  const [fix,       setFix]       = useState(() => ({ car:cot?.car||0, fuel:cot?.fuel||0, tax:cot?.tax||0, guide:cot?.guide||0, comm:cot?.comm||0, fee:cot?.fee||0, flight:cot?.flight||0, remise:cot?.remise||0 }))
  const [taux,      setTaux]      = useState(() => cot?.taux_change || 4800)
  const [lgModal,   setLgModal]   = useState(false)
  const [editLigne, setEditLigne] = useState(null)
  const [initialized, setInit]    = useState(false)

  const { register, handleSubmit, reset } = useForm()

  // Init lignes once data arrives
  if (cot && !initialized) {
    setLignes(cot.lignes || [])
    setFix({ car:cot.car||0, fuel:cot.fuel||0, tax:cot.tax||0, guide:cot.guide||0, comm:cot.comm||0, fee:cot.fee||0, flight:cot.flight||0, remise:cot.remise||0 })
    setTaux(cot.taux_change || 4800)
    setInit(true)
  }

  const tot1 = lignes.reduce((s,l)=>s+(+l.dbl||0)+(+l.bf||0)+(+l.lunch||0)+(+l.diner||0)+(+l.tsf||0)+(+l.parking||0)+(+l.guide||0),0)
  const tot2 = +fix.car+(+fix.fuel)+(+fix.tax)+(+fix.guide)
  const tot3 = tot1+tot2
  const tot4 = tot3+(+fix.comm)+(+fix.fee)
  const tot5 = tot4+(+fix.flight)-(+fix.remise)

  const openAddLigne  = () => { setEditLigne(null); reset({ jour:'',date:'',route:'',hotels:'',dbl:0,bf:0,lunch:0,diner:0,tsf:0,parking:0,guide:0,observation:'' }); setLgModal(true) }
  const openEditLigne = (i) => { setEditLigne(i); reset({ ...lignes[i] }); setLgModal(true) }

  const saveLigne = (data) => {
    const lg = { ...data, dbl:+data.dbl||0,bf:+data.bf||0,lunch:+data.lunch||0,diner:+data.diner||0,tsf:+data.tsf||0,parking:+data.parking||0,guide:+data.guide||0,ordre:editLigne!==null?editLigne:lignes.length }
    setLignes(prev => editLigne!==null ? prev.map((l,i)=>i===editLigne?lg:l) : [...prev,lg])
    setLgModal(false)
  }
  const deleteLigne = (i) => confirmDelete(`ligne ${i+1}`, () => setLignes(prev => prev.filter((_,j)=>j!==i)))

  const saveCot = () => {
    confirmSave(() => {
      const payload = {
        programme_client: pc.id,
        taux_change: +taux,
        ...Object.fromEntries(Object.entries(fix).map(([k,v])=>[k,+v])),
        lignes: lignes.map((l,i)=>({ ...l, ordre:i })),
      }
      save.mutate({ data: payload, exists: !!cot }, { onSuccess: () => onBack() })
    })
  }

  if (isLoading) return <div className="text-center py-8 text-gray-400">Chargement de la cotation...</div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={14}/> Retour</button>
        <h1 className="page-title text-xl"><FileText size={20} className="text-orange"/> Cotation — {pc.client_nom}</h1>
      </div>

      {/* Info dossier */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Informations du dossier</h3>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Taux Ar/€</label>
            <input type="number" className="form-control w-28 py-1.5 text-sm" value={taux} onChange={e=>setTaux(e.target.value)}/>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {[['Client',pc.client_nom],['Programme',pc.programme_nom],['PAX',pc.nb_pax],['Période',`${fmtDate(pc.date_debut)} → ${fmtDate(pc.date_fin)}`],['Date vente',fmtDate(pc.date_vente)]].map(([k,v])=>(
              <div key={k}><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{k}</div><div className="font-semibold text-gray-800 dark:text-gray-200">{v}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* Lignes */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Lignes de Cotation</h3>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={openAddLigne}><Plus size={13}/> Ajout Manuel</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl text-xs">
            <thead><tr><th>Jour</th><th>Date</th><th>Route</th><th>Hôtels</th><th>Dbl</th><th>Bf</th><th>L</th><th>D</th><th>TSF</th><th>Park</th><th>Guide</th><th>Obs</th><th className="text-center">Actions</th></tr></thead>
            <tbody>
              {lignes.length===0
                ? <tr><td colSpan={13} className="py-6 text-center text-gray-400">Aucune ligne — cliquer sur "Ajout Manuel"</td></tr>
                : lignes.map((lg,i)=>(
                  <tr key={i}>
                    <td>{lg.jour||'—'}</td><td>{fmtDate(lg.date)}</td><td>{lg.route||'—'}</td><td>{lg.hotels||'—'}</td>
                    <td>{lg.dbl||0}</td><td>{lg.bf||0}</td><td>{lg.lunch||0}</td><td>{lg.diner||0}</td>
                    <td>{lg.tsf||0}</td><td>{lg.parking||0}</td><td>{lg.guide||0}</td>
                    <td className="max-w-[80px] truncate text-gray-400">{lg.observation||'—'}</td>
                    <td className="text-center">
                      <button className="btn btn-ghost btn-xs mr-1" onClick={()=>openEditLigne(i)}><Pencil size={10}/></button>
                      <button className="btn btn-danger btn-xs" onClick={()=>deleteLigne(i)}><Trash2 size={10}/></button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Éléments fixes */}
      <div className="card mb-4">
        <div className="card-header"><h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Éléments Fixes</h3></div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[['car','CAR'],['fuel','FUEL'],['tax','TAX'],['guide','GUIDE'],['comm','COMM'],['fee','FILE FEE'],['flight','FLIGHT'],['remise','REMISE']].map(([k,l])=>(
              <div key={k} className="form-group mb-0">
                <label className="form-label">{l} (€)</label>
                <input type="number" step="0.01" className="form-control py-2" value={fix[k]}
                  onChange={e=>setFix(f=>({...f,[k]:e.target.value}))}/>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Totaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="card">
          <div className="card-header"><h3 className="font-title font-bold text-sm">Récapitulatif</h3></div>
          <div className="card-body space-y-2">
            {[['TOTAL 1 (lignes)',tot1,false],['TOTAL 2 (CAR+FUEL+TAX+GUIDE)',tot2,false],['TOTAL 3 (T1+T2)',tot3,true],['TOTAL 4 (T3+COMM+FEE)',tot4,false],['TOTAL 5 — PRICE PER PAX',tot5,'grand']].map(([label,val,hl])=>(
              <div key={label} className={`flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 ${hl==='grand'?'font-black text-base text-brand-green':hl?'font-bold text-orange':'text-sm'}`}>
                <span>{label}</span><strong>{fmt(val)}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="font-title font-bold text-sm">Conversion Ariary</h3></div>
          <div className="card-body space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Taux de change</span><strong>{(+taux).toLocaleString('fr-FR')} Ar/€</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">TOTAL 5 en Ariary</span><strong>{fmtAr(tot5*(+taux))}</strong></div>
            <div className="flex justify-between font-black text-base text-brand-green pt-2 border-t border-gray-100 dark:border-gray-800">
              <span>TOTAL × {pc.nb_pax} PAX</span><strong>{fmt(tot5*(pc.nb_pax||1))}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="btn btn-ghost" onClick={onBack}>Annuler</button>
        <button className="btn btn-success btn-lg" onClick={saveCot} disabled={save.isPending}>
          <Save size={16}/> {save.isPending?'Enregistrement...':'Tout Enregistrer'}
        </button>
      </div>

      {/* Ligne Modal */}
      <Modal open={lgModal} onClose={()=>setLgModal(false)} title={editLigne!==null?'Modifier une Ligne':'Ajouter une Ligne'} icon={FileText} size="lg"
        footer={<><button className="btn btn-ghost" onClick={()=>setLgModal(false)}>Annuler</button><button className="btn btn-success" onClick={handleSubmit(saveLigne)}>Enregistrer</button></>}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="form-label">Jour</label><input className="form-control" placeholder="Lun, Mar..." {...register('jour')}/></div>
          <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" {...register('date')}/></div>
          <div className="form-group"><label className="form-label">Route</label><input className="form-control" {...register('route')}/></div>
          <div className="form-group"><label className="form-label">Hôtels</label><input className="form-control" {...register('hotels')}/></div>
        </div>
        <div className="grid grid-cols-4 lg:grid-cols-7 gap-3 mt-2">
          {[['dbl','DBL'],['bf','BF'],['lunch','L'],['diner','D'],['tsf','TSF'],['parking','Park'],['guide','Guide']].map(([k,l])=>(
            <div key={k} className="form-group">
              <label className="form-label text-[10px]">{l} (€)</label>
              <input type="number" step="0.01" className="form-control py-2 text-sm" defaultValue={0} {...register(k)}/>
            </div>
          ))}
        </div>
        <div className="form-group mt-2">
          <label className="form-label">Observation</label>
          <input className="form-control" {...register('observation')}/>
        </div>
      </Modal>
    </div>
  )
}

// ─── Page principale Cotation ─────────────────────────────────
export default function Cotation() {
  const { data: pcs = [], isLoading, error, refetch } = useProgrammeClients()
  const [curPC,  setCurPC]  = useState(null)
  const [search, setSearch] = useState('')

  const filtered = pcs.filter(p => !search || (p.client_nom||'').toLowerCase().includes(search.toLowerCase()))

  if (curPC) {
    return (
      <Layout breadcrumb={['SITRAC','Sales','Dossier Client','Cotation']}>
        <CotationForm pc={curPC} onBack={()=>setCurPC(null)}/>
      </Layout>
    )
  }

  return (
    <Layout breadcrumb={['SITRAC','Sales','Dossier Client','Cotation']}>
      <div className="mb-5">
        <h1 className="page-title"><FileText size={22} className="text-orange"/> Cotation</h1>
        <p className="page-sub">Cotations par dossier client (RG 10, 11, 12)</p>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Programmes Clients</h3>
          <SearchInput value={search} onChange={setSearch}/>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement des dossiers...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Client</th><th>Programme</th><th>Nb PAX</th><th>Prix</th><th>Date vente</th><th>Cotation</th><th className="text-center">Action</th></tr></thead>
              <tbody>
                {filtered.length===0
                  ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Aucun dossier</td></tr>
                  : filtered.map(pc=>(
                    <tr key={pc.id}>
                      <td><strong className="text-gray-900 dark:text-white">{pc.client_nom}</strong></td>
                      <td><Badge variant="info">{pc.programme_nom}</Badge></td>
                      <td>{pc.nb_pax}</td>
                      <td><strong>{(+pc.prix_vente).toLocaleString('fr-FR')} €</strong></td>
                      <td className="text-sm text-gray-500">{fmtDate(pc.date_vente)}</td>
                      <td>{pc.a_cotation ? <Badge variant="active">Oui</Badge> : <Badge variant="inactive">Non</Badge>}</td>
                      <td className="text-center">
                        <button className={`btn btn-sm ${pc.a_cotation?'btn-info':'btn-primary'}`} onClick={()=>setCurPC(pc)}>
                          {pc.a_cotation ? <><Pencil size={13}/> Modifier</> : <><Plus size={13}/> Créer</>}
                        </button>
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
