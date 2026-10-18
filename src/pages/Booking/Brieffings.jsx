import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { ClipboardList, Plus, Pencil, Trash2, ArrowLeft, Save, AlertCircle, Download, Upload, Ticket, BookOpenText } from 'lucide-react'
import { useProgrammeClients } from '../../hooks/useApi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingAPI, downloadFile } from '../../utils/api'
import { useConfirm } from '../../hooks/useConfirm'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import ChampPrestataire from '../../components/Prestataires/ChampPrestataire'
import VouchersDossier from '../../components/Vouchers/VouchersDossier'
import ChampRessource from '../../components/Ressources/ChampRessource'
import { Modal, Badge, SearchInput, StatCard, Alert } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate, today } from '../../utils/storage'

const ETATS = ['NOK','OK_PHONE','OK_MAIL']
const ETAT_LABEL = { NOK:'Non confirmé', OK_PHONE:'OK Téléphone', OK_MAIL:'OK Mail' }
const ETAT_VARIANT = { NOK:'inactive', OK_PHONE:'pending', OK_MAIL:'active' }

function BrieffingForm({ pc, onBack }) {
  const qc = useQueryClient()
  const { confirmDelete, confirmSave } = useConfirm()
  const [lgModal, setLgModal] = useState(false)
  const [editIdx, setEditIdx] = useState(null)
  const [lignes,  setLignes]  = useState([])
  const [inited,  setInited]  = useState(false)
  const [csvBusy, setCsvBusy] = useState(false)
  const [vouchersOpen, setVouchersOpen] = useState(false)
  const fileInputRef = useRef(null)

  const { register: regForm, handleSubmit: subForm, reset: resetForm,
          register: regLg, handleSubmit: subLg, reset: resetLg } = useForm()
  const formMethods = useForm()
  const lgMethods   = useForm()

  const { data: brf, isLoading } = useQuery({
    queryKey: ['brieffing', pc.id],
    queryFn:  () => bookingAPI.getBrieffings(`?programme_client=${pc.id}`).then(r => (r.results||r)[0] || null),
    retry: false,
  })

  if (brf && !inited) {
    setLignes(brf.lignes || [])
    setInited(true)
    formMethods.reset({
      responsable_finance: brf.responsable_finance||'',
      chauffeur: brf.chauffeur||'', guide: brf.guide||'', voiture: brf.voiture||'',
      vols_internationaux: brf.vols_internationaux||'',
      date_programme: brf.date_programme||'',
      nb_pax: brf.nb_pax||pc.nb_pax||1,
      nb_adultes: brf.nb_adultes||1, nb_enfants: brf.nb_enfants||0, nb_bebes: brf.nb_bebes||0,
    })
  }

  const saveMut = useMutation({
    mutationFn: (data) => brf
      ? bookingAPI.updateBrieffing(brf.id, data)
      : bookingAPI.createBrieffing(data),
    onSuccess: () => { qc.invalidateQueries(['brieffing', pc.id]); qc.invalidateQueries(['pcs']); toast.success('Brieffing enregistré'); onBack() },
    onError: e => toast.error(e.message),
  })

  const onSave = formMethods.handleSubmit(data => {
    confirmSave(() => saveMut.mutate({ ...data, programme_client: pc.id, lignes: lignes.map((l,i)=>({...l,ordre:i})) }))
  })

  const openAddLg  = () => { setEditIdx(null); lgMethods.reset({ date:'', itineraire:'', prestataire:'', etat:'NOK', observation:'', facture_type:'Proforma', tarif_paiement:0, zone_paiement:'' }); setLgModal(true) }
  const openEditLg = (i) => { setEditIdx(i); lgMethods.reset({...lignes[i]}); setLgModal(true) }
  const saveLg = lgMethods.handleSubmit(data => {
    const lg = { ...data, tarif_paiement: +data.tarif_paiement||0 }
    setLignes(prev => editIdx!==null ? prev.map((l,i)=>i===editIdx?lg:l) : [...prev, lg])
    setLgModal(false)
    toast.success(editIdx!==null ? 'Ligne modifiée' : 'Ligne ajoutée')
  })

  const ok    = lignes.filter(l=>l.etat!=='NOK').length
  const total = lignes.reduce((s,l)=>s+(+l.tarif_paiement||0),0)

  // ── RG 31/32 : Export/Import CSV des lignes de brieffing ────────
  // Nécessite que le brieffing existe déjà côté serveur (brf non null) :
  // les endpoints agissent sur les lignes réellement enregistrées.
  const exportCsv = async () => {
    if (!brf) return
    setCsvBusy(true)
    try {
      await bookingAPI.exportBrieffingCsv(brf.id)
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
    if (!file || !brf) return
    setCsvBusy(true)
    try {
      const result = await bookingAPI.importBrieffingCsv(brf.id, file)
      setLignes(result.brieffing.lignes || [])
      qc.invalidateQueries(['brieffing', pc.id])
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
        <h1 className="page-title text-xl"><ClipboardList size={20} className="text-orange"/> Brieffing — {pc.client_nom}</h1>
        {/* Carnet de route du voyageur (PDF, sans prix) : FR pour le guide, EN/FR pour le client */}
        <div className="ml-auto flex gap-2">
          {['fr','en'].map(l => (
            <button key={l} className="btn btn-ghost btn-sm" disabled={!brf}
              title={!brf ? "Enregistrez d'abord le brieffing" : `Carnet de route en ${l === 'fr' ? 'français' : 'anglais'} (PDF)`}
              onClick={() => downloadFile(`/carnet/dossiers/${pc.id}/pdf/?langue=${l}`, `carnet-de-route-PC${pc.id}-${l}.pdf`).catch(e => toast.error(e.message))}>
              <BookOpenText size={14}/> Carnet {l.toUpperCase()}
            </button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" disabled={!brf} onClick={()=>setVouchersOpen(true)}
          title={!brf ? "Enregistrez d'abord le brieffing" : 'Générer et envoyer les vouchers aux prestataires'}>
          <Ticket size={14}/> Vouchers
        </button>
      </div>

      {isLoading && <div className="text-center py-8 text-gray-400">Chargement du brieffing...</div>}

      {!isLoading && (
        <>
          {/* Info dossier */}
          <div className="card mb-4">
            <div className="card-header"><h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Dossier client (lecture seule — Sales)</h3></div>
            <div className="card-body">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                {[['Client', pc.client_nom],['Programme', pc.programme_nom],['PAX', pc.nb_pax],['Période', `${fmtDate(pc.date_debut)} → ${fmtDate(pc.date_fin)}`]].map(([k,v])=>(
                  <div key={k}><div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{k}</div><div className="font-semibold text-gray-800 dark:text-gray-200">{v}</div></div>
                ))}
              </div>
            </div>
          </div>

          {/* Infos Booking */}
          <div className="card mb-4">
            <div className="card-header"><h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Informations Booking</h3></div>
            <div className="card-body">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Planning des ressources : propose les fiches et signale les doubles affectations */}
                <div className="form-group"><label className="form-label">Chauffeur</label>
                  <ChampRessource form={formMethods} name="chauffeur" type="chauffeur" debut={pc.date_debut} fin={pc.date_fin} exclurePc={pc.id} placeholder="Choisir ou saisir"/></div>
                <div className="form-group"><label className="form-label">Guide</label>
                  <ChampRessource form={formMethods} name="guide" type="guide" debut={pc.date_debut} fin={pc.date_fin} exclurePc={pc.id} placeholder="Choisir ou saisir"/></div>
                <div className="form-group"><label className="form-label">Voiture</label>
                  <ChampRessource form={formMethods} name="voiture" type="vehicule" debut={pc.date_debut} fin={pc.date_fin} exclurePc={pc.id} placeholder="Choisir ou saisir"/></div>
                <div className="form-group"><label className="form-label">Responsable Finance</label><input className="form-control" {...formMethods.register('responsable_finance')}/></div>
                <div className="form-group"><label className="form-label">Date du programme</label><input type="date" className="form-control" {...formMethods.register('date_programme')}/></div>
              </div>
              <div className="form-group"><label className="form-label">Vols Internationaux</label><textarea className="form-control" rows={2} placeholder="Numéros de vol, compagnies..." {...formMethods.register('vols_internationaux')}/></div>
              <div className="grid grid-cols-4 gap-3 mt-2">
                {[['nb_pax','Nb PAX'],['nb_adultes','Adultes'],['nb_enfants','Enfants'],['nb_bebes','Bébés']].map(([k,l])=>(
                  <div key={k} className="form-group mb-0"><label className="form-label">{l}</label><input type="number" min={0} className="form-control" defaultValue={0} {...formMethods.register(k)}/></div>
                ))}
              </div>
            </div>
          </div>

          {/* Lignes prestataires */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Prestataires & Services</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{ok}/{lignes.length} confirmés</span>
                <button className="btn btn-primary btn-sm" onClick={openAddLg}><Plus size={13}/> Ajouter</button>
                <button className="btn btn-ghost btn-sm" disabled={!brf || csvBusy} onClick={exportCsv}
                  title={!brf ? "Enregistrez d'abord le brieffing pour pouvoir exporter" : ''}>
                  <Download size={13}/> Exporter
                </button>
                <button className="btn btn-ghost btn-sm" disabled={!brf || csvBusy} onClick={triggerImport}
                  title={!brf ? "Enregistrez d'abord le brieffing pour pouvoir importer" : ''}>
                  <Upload size={13}/> Importer
                </button>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile}/>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl text-xs">
                <thead><tr><th>Date</th><th>Itinéraire</th><th>Prestataire</th><th>État</th><th>Tarif</th><th>Zone Paiement</th><th>Observation</th><th className="text-center">Actions</th></tr></thead>
                <tbody>
                  {lignes.length===0
                    ? <tr><td colSpan={8} className="py-6 text-center text-gray-400">Aucun prestataire</td></tr>
                    : lignes.map((l,i)=>(
                      <tr key={i}>
                        <td>{fmtDate(l.date)}</td><td>{l.itineraire||'—'}</td>
                        <td><strong className="text-gray-900 dark:text-white">{l.prestataire}</strong></td>
                        <td><Badge variant={ETAT_VARIANT[l.etat]||'inactive'}>{ETAT_LABEL[l.etat]||l.etat}</Badge></td>
                        <td>{(+l.tarif_paiement||0).toLocaleString('fr-FR')} €</td>
                        <td>{l.zone_paiement||'—'}</td>
                        <td className="max-w-[80px] truncate text-gray-400">{l.observation||'—'}</td>
                        <td className="text-center">
                          <button className="btn btn-ghost btn-xs mr-1" onClick={()=>openEditLg(i)}><Pencil size={10}/></button>
                          <button className="btn btn-danger btn-xs" onClick={()=>confirmDelete(`prestataire ${i+1}`,()=>setLignes(p=>p.filter((_,j)=>j!==i)))}><Trash2 size={10}/></button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            {lignes.length>0 && (
              <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <div className="text-sm font-black text-brand-green">Total prestataires : {total.toLocaleString('fr-FR')} €</div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button className="btn btn-ghost" onClick={onBack}>Annuler</button>
            <button className="btn btn-success btn-lg" onClick={onSave} disabled={saveMut.isPending}>
              <Save size={15}/> {saveMut.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </>
      )}

      {/* Vouchers prestataires */}
      <VouchersDossier pc={pc} open={vouchersOpen} onClose={()=>setVouchersOpen(false)}/>

      {/* Modal ligne */}
      <Modal open={lgModal} onClose={()=>setLgModal(false)} title={editIdx!==null?'Modifier':'Ajouter un prestataire'} icon={ClipboardList} size="lg"
        footer={<><button className="btn btn-ghost" onClick={()=>setLgModal(false)}>Annuler</button><button className="btn btn-success" onClick={saveLg}>Enregistrer</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" {...lgMethods.register('date')}/></div>
          <div className="form-group"><label className="form-label">Itinéraire</label><input className="form-control" {...lgMethods.register('itineraire')}/></div>
          <div className="form-group col-span-2"><label className="form-label">Prestataire <span className="form-req">*</span></label><ChampPrestataire form={lgMethods} name="prestataire" champMontant="tarif_paiement" required/></div>
          <div className="form-group"><label className="form-label">État</label>
            <select className="form-control" {...lgMethods.register('etat')}>
              {ETATS.map(e=><option key={e} value={e}>{ETAT_LABEL[e]}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Type Facture</label>
            <select className="form-control" {...lgMethods.register('facture_type')}>
              <option value="Proforma">Proforma</option><option value="Définitive">Définitive</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Tarif (€)</label><input type="number" step="0.01" className="form-control" defaultValue={0} {...lgMethods.register('tarif_paiement')}/></div>
          <div className="form-group"><label className="form-label">Zone Paiement</label><input className="form-control" {...lgMethods.register('zone_paiement')}/></div>
        </div>
        <div className="form-group"><label className="form-label">Observation</label><textarea className="form-control" rows={2} {...lgMethods.register('observation')}/></div>
      </Modal>
    </div>
  )
}

export default function Brieffings() {
  const { data: pcs = [], isLoading, error, refetch } = useProgrammeClients()
  const [curPC, setCurPC] = useState(null)
  const [search, setSearch] = useState('')

  // RG 16 : seuls les dossiers dont la facture pro est VALIDÉE peuvent passer au Booking
  const eligible = pcs.filter(p => p.facture_pro_validee && !p.annule)
  const filtered  = eligible.filter(p => !search || (p.client_nom||'').toLowerCase().includes(search.toLowerCase()))

  if (curPC) return (
    <Layout breadcrumb={['SITRAC','Booking','Dossier Booking','Brieffing']}>
      <BrieffingForm pc={curPC} onBack={()=>setCurPC(null)}/>
    </Layout>
  )

  return (
    <Layout breadcrumb={['SITRAC','Booking','Dossier Booking','Brieffing']}>
      <div className="mb-5">
        <h1 className="page-title"><ClipboardList size={22} className="text-orange"/> Brieffing</h1>
        <p className="page-sub">Gestion des brieffings — prestataires, hébergements, transports (RG 16, 17, 18)</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={ClipboardList} value={eligible.length} label="Dossiers éligibles" color="orange"/>
        <StatCard icon={ClipboardList} value={pcs.filter(p=>p.a_facture_pro && !p.facture_pro_validee).length} label="FP en brouillon" color="blue"/>
        <StatCard icon={ClipboardList} value={pcs.filter(p=>!p.a_facture_pro).length} label="En attente FP" color="red"/>
      </div>
      {pcs.length > 0 && eligible.length === 0 && (
        <Alert type="warning">⚠️ Aucun dossier avec une Facture Pro validée. La Facture Pro doit être créée et validée par le département Sales (RG 16).</Alert>
      )}
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Choisir un dossier client</h3>
          <SearchInput value={search} onChange={setSearch}/>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Client</th><th>Programme</th><th>PAX</th><th>Période</th><th>Facture Pro</th><th className="text-center">Brieffing</th></tr></thead>
              <tbody>
                {filtered.length===0
                  ? <tr><td colSpan={6} className="py-10 text-center text-gray-400">Aucun dossier éligible</td></tr>
                  : filtered.map(p=>(
                    <tr key={p.id}>
                      <td><strong className="text-gray-900 dark:text-white">{p.client_nom}</strong></td>
                      <td><Badge variant="info">{p.programme_nom}</Badge></td>
                      <td>{p.nb_pax}</td>
                      <td className="text-xs text-gray-500">{fmtDate(p.date_debut)} → {fmtDate(p.date_fin)}</td>
                      <td><Badge variant="active">✓ Validée</Badge></td>
                      <td className="text-center">
                        <button className="btn btn-primary btn-sm" onClick={()=>setCurPC(p)}>
                          <ClipboardList size={13}/> Gérer
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