import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FileCheck, Plus, Pencil, Trash2, ArrowLeft, Save, AlertCircle, Printer, Lock, Unlock, HistoryIcon, Calculator } from 'lucide-react'
import { useProgrammeClients } from '../../hooks/useApi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesAPI, relationClientAPI } from '../../utils/api'
import { useNavigate } from 'react-router-dom'
import { Send } from 'lucide-react'
import { useConfirm } from '../../hooks/useConfirm'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import GenererDepuisCotation from '../../components/FacturePro/GenererDepuisCotation'
import { Modal, Badge, SearchInput, StatCard } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate, fmtDateTime, fmt, today } from '../../utils/storage'
import { Check } from 'lucide-react'

// ─── Modal impression Facture Pro ─────────────────────────────
function FactureProPrintModal({ pc, fp, open, onClose }) {
  const printRef = useRef()

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=960,height=750')
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Facture Proforma — ${pc?.client_nom}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1a1a1a;background:#fff}
    .page{width:210mm;min-height:297mm;padding:14mm 16mm;margin:0 auto}
    .header{display:flex;align-items:center;justify-content:space-between;
            padding-bottom:12px;border-bottom:2px solid #1a1a1a;margin-bottom:16px}
    .logo{width:54px;height:54px;object-fit:contain}
    .co-name{font-size:20px;font-weight:900;color:#1a1a1a;letter-spacing:1px}
    .co-sub{font-size:9px;color:#555;margin-top:3px}
    .doc-right{text-align:right}
    .doc-title{font-size:15px;font-weight:900;text-transform:uppercase;
               letter-spacing:2px;color:#1a1a1a;border-bottom:3px solid #F5A623;
               padding-bottom:4px;display:inline-block}
    .doc-ref{font-size:9px;color:#555;margin-top:5px}
    .banner{background:#1a1a1a;color:#fff;padding:10px 14px;
            margin-bottom:16px;display:flex;justify-content:space-between;align-items:center}
    .bn-name{font-size:14px;font-weight:900}
    .bn-sub{font-size:9px;color:#bbb;margin-top:2px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;
               gap:10px;margin-bottom:16px;padding:10px 12px;background:#f5f5f5}
    .fl{font-size:7.5px;color:#888;text-transform:uppercase;
        letter-spacing:.5px;margin-bottom:2px;font-weight:700}
    .fv{font-size:11px;font-weight:600;color:#1a1a1a}
    .st{font-size:9px;font-weight:900;text-transform:uppercase;
        letter-spacing:1.5px;color:#fff;background:#1a1a1a;
        padding:4px 10px;margin-bottom:8px;display:inline-block}
    table{width:100%;border-collapse:collapse;font-size:10px}
    thead tr{background:#1a1a1a}
    thead th{padding:7px 10px;text-align:left;font-size:8px;font-weight:700;
             text-transform:uppercase;letter-spacing:.5px;color:#fff}
    tbody tr{border-bottom:1px solid #e8e8e8}
    tbody tr:nth-child(even){background:#f5f5f5}
    tbody td{padding:7px 10px}
    .td-right{text-align:right}
    .mention{margin-top:20px;padding:10px 12px;background:#f5f5f5;
             font-size:9px;color:#555;line-height:1.7}
    .sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;
              margin-top:30px;padding-top:14px;border-top:2px solid #1a1a1a}
    .sig-line{border-bottom:1.5px solid #1a1a1a;height:40px;margin-bottom:6px}
    .sig-lbl{font-size:8px;color:#555;text-transform:uppercase;
             letter-spacing:.5px;font-weight:700;text-align:center}
    .footer{text-align:center;font-size:8px;color:#888;margin-top:20px;
            padding-top:8px;border-top:1px solid #ddd;line-height:1.6}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .page{padding:10mm 12mm}
    }
  </style>
</head>
<body>${printRef.current?.innerHTML || ''}</body>
</html>`)
    win.document.close()
    win.onload = () => { win.focus(); win.print() }
  }

  if (!pc || !fp) return null

  const today_str = new Date().toLocaleDateString('fr-FR',
    { day: '2-digit', month: 'long', year: 'numeric' })
  const refDoc  = `FP-${String(pc.id).padStart(4, '0')}-${new Date().getFullYear()}`
  const lignes  = fp.lignes || []
  const totalHT  = lignes.reduce((s, l) => s + (+l.nombre||1) * (+l.prix_unitaire||0), 0)
  const totalTTC = totalHT - (+fp.remise||0)

  const FRow = ({ label, value }) => (
    <div>
      <div style={{fontSize:'7.5px',color:'#888',textTransform:'uppercase',
        letterSpacing:'.5px',marginBottom:'2px',fontWeight:'700'}}>{label}</div>
      <div style={{fontSize:'11px',fontWeight:'600',color:'#1a1a1a'}}>{value || '—'}</div>
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} size="xl"
      title={`Facture Proforma — ${pc.client_nom}`} icon={FileCheck}
      footer={
        <div className="flex gap-3">
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={14}/> Imprimer / Enregistrer PDF
          </button>
        </div>
      }
    >
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 overflow-auto max-h-[74vh]">
        <div ref={printRef}>
          <div style={{background:'#fff',maxWidth:'794px',margin:'0 auto',
            padding:'28px 36px',fontFamily:'Arial,Helvetica,sans-serif',
            fontSize:'11px',color:'#1a1a1a'}}>

            {/* En-tête */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              paddingBottom:'12px',borderBottom:'2px solid #1a1a1a',marginBottom:'16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                <img src="/logo.jpg" alt="Ramartour"
                  style={{width:'54px',height:'54px',objectFit:'contain'}}/>
                <div>
                  <div style={{fontSize:'20px',fontWeight:'900',
                    color:'#1a1a1a',letterSpacing:'1px'}}>RAMARTOUR</div>
                  <div style={{fontSize:'9px',color:'#555',marginTop:'3px'}}>
                    Madagascar
                  </div>
                  <div style={{fontSize:'8px',color:'#888'}}>
                    Système de Traitement des Relations Clients
                  </div>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'15px',fontWeight:'900',textTransform:'uppercase',
                  letterSpacing:'2px',borderBottom:'3px solid #F5A623',
                  paddingBottom:'4px',display:'inline-block'}}>
                  Facture Proforma
                </div>
                <div style={{fontSize:'9px',color:'#555',marginTop:'5px'}}>
                  Réf. : <strong>{refDoc}</strong>
                </div>
                <div style={{fontSize:'9px',color:'#555'}}>
                  Date : {fp.date_facture || today_str}
                </div>
              </div>
            </div>

            {/* Bannière client */}
            <div style={{background:'#1a1a1a',color:'#fff',padding:'10px 14px',
              marginBottom:'16px',display:'flex',justifyContent:'space-between',
              alignItems:'center'}}>
              <div>
                <div style={{fontSize:'14px',fontWeight:'900'}}>{pc.client_nom}</div>
                <div style={{fontSize:'9px',color:'#bbb',marginTop:'2px'}}>
                  Programme : {pc.programme_nom}
                </div>
              </div>
              <span style={{padding:'3px 10px',fontSize:'10px',fontWeight:'700',
                background:'#F5A623',color:'#1a1a1a'}}>
                {pc.nb_pax} PAX
              </span>
            </div>

            {/* Infos dossier */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',
              gap:'10px',marginBottom:'16px',padding:'10px 12px',background:'#f5f5f5'}}>
              <FRow label="Programme"    value={pc.programme_nom}/>
              <FRow label="Nb PAX"       value={pc.nb_pax}/>
              <FRow label="Date début"   value={pc.date_debut ? fmtDate(pc.date_debut) : '—'}/>
              <FRow label="Date fin"     value={pc.date_fin   ? fmtDate(pc.date_fin)   : '—'}/>
            </div>

            {/* Titre */}
            <div style={{fontSize:'9px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1.5px',color:'#fff',background:'#1a1a1a',
              padding:'4px 10px',marginBottom:'8px',display:'inline-block'}}>
              Détail des Prestations
            </div>

            {/* Table */}
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'10px'}}>
              <thead>
                <tr style={{background:'#1a1a1a'}}>
                  {['#','Date','Service / Description','Qté',
                    'Prix unit. (€)','Total (€)'].map(h=>(
                    <th key={h} style={{padding:'7px 10px',textAlign:'left',
                      fontSize:'8px',fontWeight:'700',textTransform:'uppercase',
                      letterSpacing:'.5px',color:'#fff'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignes.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{padding:'12px',textAlign:'center',
                      color:'#aaa',fontStyle:'italic',fontSize:'9px'}}>
                      Aucune ligne de facturation
                    </td>
                  </tr>
                ) : lignes.map((l, i) => (
                  <tr key={i} style={{
                    background: i%2===0 ? '#fff' : '#f5f5f5',
                    borderBottom:'1px solid #e8e8e8'}}>
                    <td style={{padding:'7px 10px',color:'#888'}}>{i+1}</td>
                    <td style={{padding:'7px 10px',fontSize:'9px',color:'#555'}}>
                      {l.date ? fmtDate(l.date) : '—'}
                    </td>
                    <td style={{padding:'7px 10px',fontWeight:'600'}}>{l.service}</td>
                    <td style={{padding:'7px 10px',textAlign:'right'}}>{l.nombre||1}</td>
                    <td style={{padding:'7px 10px',textAlign:'right'}}>
                      {(+l.prix_unitaire||0).toLocaleString('fr-FR',
                        {minimumFractionDigits:2})} €
                    </td>
                    <td style={{padding:'7px 10px',textAlign:'right',fontWeight:'700'}}>
                      {((+l.nombre||1)*(+l.prix_unitaire||0)).toLocaleString('fr-FR',
                        {minimumFractionDigits:2})} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totaux */}
            <div style={{marginTop:'16px',marginLeft:'auto',width:'290px'}}>
              <div style={{display:'flex',justifyContent:'space-between',
                padding:'7px 0',borderBottom:'1px solid #e8e8e8',fontSize:'11px'}}>
                <span style={{color:'#555'}}>Total HT</span>
                <strong>
                  {totalHT.toLocaleString('fr-FR',{minimumFractionDigits:2})} €
                </strong>
              </div>
              {+fp.remise > 0 && (
                <div style={{display:'flex',justifyContent:'space-between',
                  padding:'7px 0',borderBottom:'1px solid #e8e8e8',
                  fontSize:'11px',color:'#888'}}>
                  <span>Remise accordée</span>
                  <span>
                    − {(+fp.remise).toLocaleString('fr-FR',
                      {minimumFractionDigits:2})} €
                  </span>
                </div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',
                background:'#F5A623',color:'#1a1a1a',fontWeight:'900',
                fontSize:'13px',padding:'9px 12px',marginTop:'4px'}}>
                <span>TOTAL À PAYER</span>
                <span>
                  {totalTTC.toLocaleString('fr-FR',{minimumFractionDigits:2})} €
                </span>
              </div>
            </div>

            {/* Mentions */}
            <div style={{marginTop:'20px',padding:'10px 12px',
              background:'#f5f5f5',fontSize:'9px',color:'#555',lineHeight:'1.7'}}>
              <strong>Conditions de paiement :</strong> Acompte de 50% à la commande,
              solde avant le départ.<br/>
              <strong>Validité :</strong> Cette facture proforma est valable 30 jours
              à compter de sa date d'émission.<br/>
              <strong>Note :</strong> Ce document est une facture proforma et ne
              constitue pas une facture définitive.
            </div>

            {/* Signatures */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'40px',
              marginTop:'30px',paddingTop:'14px',borderTop:'2px solid #1a1a1a'}}>
              {['Responsable Sales / Ramartour',
                'Client / Signature & Cachet'].map(sig=>(
                <div key={sig} style={{textAlign:'center'}}>
                  <div style={{borderBottom:'1.5px solid #1a1a1a',
                    height:'40px',marginBottom:'6px'}}/>
                  <div style={{fontSize:'8px',color:'#555',textTransform:'uppercase',
                    letterSpacing:'.5px',fontWeight:'700'}}>{sig}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{textAlign:'center',fontSize:'8px',color:'#888',
              marginTop:'20px',paddingTop:'8px',
              borderTop:'1px solid #ddd',lineHeight:'1.6'}}>
              <div style={{width:'30px',height:'2px',background:'#F5A623',
                margin:'0 auto 8px'}}/>
              SITRAC — Ramartour Madagascar &nbsp;|&nbsp;
              Réf. {refDoc} &nbsp;|&nbsp; {today_str}<br/>
              Document confidentiel — Usage interne uniquement
            </div>

          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── Formulaire Facture Pro ────────────────────────────────────
function FactureProForm({ pc, onBack }) {
  const qc = useQueryClient()
  const { confirmDelete, confirmSave, confirm } = useConfirm()
  const { user } = useAuthStore()
  const [lgModal,   setLgModal]   = useState(false)
  const [editIdx,   setEditIdx]   = useState(null)
  const [lignes,    setLignes]    = useState([])
  const [remise,    setRemise]    = useState(0)
  const [dateFac,   setDateFac]   = useState(today())
  const [inited,    setInited]    = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [printFP,   setPrintFP]   = useState(null)
  const [lockBusy,  setLockBusy]  = useState(false)
  const [histOpen,  setHistOpen]  = useState(false)
  const [genOpen,   setGenOpen]   = useState(false)

  const { register, handleSubmit, reset } = useForm()

  const { data: fp, isLoading, refetch } = useQuery({
    queryKey: ['facture-pro', pc.id],
    queryFn:  () => salesAPI.getFacturePro(pc.id),
    retry: false,
    onError: () => {},
  })

  const isLocked = !!fp?.is_locked

  const { data: historique = [], isLoading: histLoading } = useQuery({
    queryKey: ['facture-pro-historique', pc.id],
    queryFn:  () => salesAPI.getFactureProHistorique(pc.id),
    enabled:  histOpen && !!fp,
  })

  if (fp && !inited) {
    setLignes(fp.lignes || [])
    setRemise(fp.remise || 0)
    setDateFac(fp.date_facture || today())
    setInited(true)
  }

  const saveMut = useMutation({
    mutationFn: (data) => salesAPI.saveFacturePro(pc.id, data, !!fp),
    onSuccess: () => {
      qc.invalidateQueries(['pcs'])
      qc.invalidateQueries(['facture-pro', pc.id])
      toast.success('Facture Pro enregistrée')
      onBack()
    },
    onError: e => toast.error(e.message),
  })

  const totalHT  = lignes.reduce((s, l) => s + (+l.nombre||1)*(+l.prix_unitaire||0), 0)
  const totalTTC = totalHT - (+remise||0)

  // Nouvelle facture pro : la ligne du circuit est reprise du dossier
  // (programme, dates, nombre de PAX, prix par personne) — rien à ressaisir.
  const ligneDuDossier = () => ({
    date: pc.date_debut || '',
    service: `Circuit ${pc.programme_nom || ''} — du ${fmtDate(pc.date_debut)} au ${fmtDate(pc.date_fin)}`,
    nombre: +pc.nb_pax || 1,
    prix_unitaire: +pc.prix_vente || 0,
  })
  const [prerempli, setPrerempli] = useState(false)
  useEffect(() => {
    if (!isLoading && !fp && !prerempli && lignes.length === 0) {
      setPrerempli(true); setLignes([ligneDuDossier()])
    }
  }, [isLoading, fp])

  const openAdd  = () => {
    setEditIdx(null)
    reset({ date:pc.date_debut||'', service:'', nombre:+pc.nb_pax||1, prix_unitaire:'' })
    setLgModal(true)
  }
  const openEdit = (i) => {
    setEditIdx(i)
    reset({ ...lignes[i] })
    setLgModal(true)
  }
  const saveLigne = (data) => {
    const lg = { ...data, nombre:+data.nombre||1, prix_unitaire:+data.prix_unitaire||0 }
    setLignes(prev => editIdx!==null ? prev.map((l,i)=>i===editIdx?lg:l) : [...prev, lg])
    setLgModal(false)
    toast.success(editIdx!==null ? 'Ligne modifiée' : 'Ligne ajoutée')
  }

  // Lignes proposées par « Depuis la cotation » : remplacent ou complètent les lignes actuelles
  const appliquerCotation = (nouvelles, mode) => {
    setLignes(prev => mode === 'ajouter' ? [...prev, ...nouvelles] : nouvelles)
    setGenOpen(false)
    toast.success('Lignes proposées depuis la cotation — vérifiez puis « Tout enregistrer »')
  }

  const save = () => confirmSave(() => saveMut.mutate({
    programme_client: pc.id,
    date_facture:     dateFac,
    remise:           +remise || 0,
    lignes:           lignes.map((l, i) => ({ ...l, ordre: i })),
  }))

  const openPrint = () => {
    setPrintFP({
      date_facture: dateFac,
      remise:       remise,
      lignes:       lignes,
    })
    setPrintOpen(true)
  }

  // ── RG 15 : workflow de statut à 3 états (Brouillon → Validé → Verrouillé)
  const canValiderOuBrouillon = user?.dept === 'Sales' || user?.dept === 'Administration'
  const canVerrouiller        = user?.dept === 'Superviseur' || user?.dept === 'Administration'
  const canDeverrouiller      = user?.dept === 'Administration'

  const validerFP = () => confirm({
    icon:'verrouiller', type:'warning', title:'Valider la facture pro',
    msg:"Une fois validée, cette facture pro ne pourra plus être modifiée directement. "
        +"Vous pourrez la repasser en brouillon vous-même si besoin, tant qu'elle n'est pas verrouillée.",
    confirmText:'Oui, valider',
    onConfirm: async () => {
      setLockBusy(true)
      try { await salesAPI.validerFacturePro(pc.id); await refetch() }
      catch (e) { toast.error(`Échec de la validation : ${e.message}`) }
      finally { setLockBusy(false) }
    },
  })

  const repasserBrouillonFP = () => confirm({
    icon:'modifier', type:'warning', title:'Repasser en brouillon',
    msg:"Cette facture pro redeviendra modifiable. Vous pourrez la valider de nouveau ensuite.",
    confirmText:'Oui, repasser en brouillon',
    onConfirm: async () => {
      setLockBusy(true)
      try { await salesAPI.repasserBrouillonFacturePro(pc.id); await refetch() }
      catch (e) { toast.error(`Échec : ${e.message}`) }
      finally { setLockBusy(false) }
    },
  })

  const verrouillerFP = () => confirm({
    icon:'cle', type:'warning', title:'Verrouiller la facture pro',
    msg:"Verrouillage de gestion définitif : plus personne (y compris Sales) ne pourra la "
        +"repasser en brouillon — seul un administrateur pourra la déverrouiller. Continuer ?",
    confirmText:'Oui, verrouiller',
    onConfirm: async () => {
      setLockBusy(true)
      try { await salesAPI.verrouillerFacturePro(pc.id); await refetch() }
      catch (e) { toast.error(`Échec du verrouillage : ${e.message}`) }
      finally { setLockBusy(false) }
    },
  })

  const deverrouillerFP = () => confirm({
    icon:'deverrouiller', type:'warning', title:'Déverrouiller la facture pro',
    msg:"La facture pro repassera au statut 'Validée' — Sales pourra alors la repasser en brouillon si besoin.",
    confirmText:'Oui, déverrouiller',
    onConfirm: async () => {
      setLockBusy(true)
      try { await salesAPI.deverrouillerFacturePro(pc.id); await refetch() }
      catch (e) { toast.error(`Échec : ${e.message}`) }
      finally { setLockBusy(false) }
    },
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={14}/> Retour
        </button>
        <h1 className="page-title text-xl">
          <FileCheck size={20} className="text-orange"/>
          Facture Pro — {pc.client_nom}
        </h1>
      </div>

      {/* RG 15 : bannière de statut — workflow à 3 états */}
      {fp && fp.statut === 'verrouille' && (
        <div className="card mb-4 p-4 flex items-center justify-between gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-brand-green flex-shrink-0"/>
            <div className="text-sm text-brand-green">
              <strong>Facture pro verrouillée</strong> le {fmtDateTime(fp.verrouille_le)} par {fp.verrouille_par_nom || '—'}
              {' '}(validée le {fmtDateTime(fp.valide_le)} par {fp.valide_par_nom || '—'}). Verrouillage définitif.
            </div>
          </div>
          {canDeverrouiller && (
            <button className="btn btn-ghost btn-sm flex-shrink-0" disabled={lockBusy} onClick={deverrouillerFP}>
              <Unlock size={13}/> Déverrouiller
            </button>
          )}
        </div>
      )}
      {fp && fp.statut === 'valide' && (
        <div className="card mb-4 p-4 flex items-center justify-between gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-brand-blue flex-shrink-0"/>
            <div className="text-sm text-brand-blue">
              <strong>Facture pro validée</strong> le {fmtDateTime(fp.valide_le)} par {fp.valide_par_nom || '—'}.
              Elle ne peut plus être modifiée directement.
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {canValiderOuBrouillon && (
              <button className="btn btn-ghost btn-sm" disabled={lockBusy} onClick={repasserBrouillonFP}>
                <Unlock size={13}/> Repasser en brouillon
              </button>
            )}
            {canVerrouiller && (
              <button className="btn btn-primary btn-sm" disabled={lockBusy} onClick={verrouillerFP}>
                <Lock size={13}/> Verrouiller
              </button>
            )}
          </div>
        </div>
      )}
      {fp && fp.statut === 'brouillon' && (
        <div className="card mb-4 p-4 flex items-center justify-between gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3 text-sm text-orange-700 dark:text-orange-400">
            <Lock size={18} className="flex-shrink-0"/>
            Cette facture pro est en brouillon, encore modifiable. Validez-la une fois définitive.
          </div>
          {canValiderOuBrouillon && (
            <button className="btn btn-primary btn-sm flex-shrink-0" disabled={lockBusy} onClick={validerFP}>
              <Lock size={13}/> Valider
            </button>
          )}
        </div>
      )}

      {/* Client & Communication : envoi du devis au client pour confirmation / signature */}
      {fp && <EnvoiClient pcId={pc.id} fp={fp} peutEnvoyer={canValiderOuBrouillon} />}

      {/* Info dossier */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
            Informations du dossier
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Date facture
            </label>
            <input type="date" className="form-control w-44 py-1.5 text-sm" disabled={isLocked}
              value={dateFac} onChange={e => setDateFac(e.target.value)}/>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {[
              ['Client',   pc.client_nom],
              ['Programme',pc.programme_nom],
              ['PAX',      pc.nb_pax],
              ['Période',  `${fmtDate(pc.date_debut)} → ${fmtDate(pc.date_fin)}`],
            ].map(([k,v]) => (
              <div key={k}>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                  {k}
                </div>
                <div className="font-semibold text-gray-800 dark:text-gray-200">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lignes */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
            Lignes de Facture Pro
          </h3>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" disabled={isLocked} onClick={openAdd}>
              <Plus size={13}/> Ajouter une ligne
            </button>
            <button className="btn btn-ghost btn-sm" disabled={isLocked || !pc.a_cotation} onClick={()=>setGenOpen(true)}
              title={!pc.a_cotation ? 'Ce dossier n’a pas encore de cotation' : 'Proposer les lignes à partir de la cotation'}>
              <Calculator size={13}/> Depuis la cotation
            </button>
            <button className="btn btn-ghost btn-sm" disabled={!fp} onClick={()=>setHistOpen(true)}
              title={!fp ? "Enregistrez d'abord la facture pro" : ''}>
              <HistoryIcon size={13}/> Historique
            </button>
          </div>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th><th>Service / Description</th><th>Nombre</th>
                  <th>Prix unit. (€)</th><th>Total (€)</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lignes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Aucune ligne — cliquer sur "Ajouter une ligne"
                    </td>
                  </tr>
                ) : lignes.map((l, i) => (
                  <tr key={i}>
                    <td>{fmtDate(l.date)}</td>
                    <td className="font-medium text-gray-900 dark:text-white">
                      {l.service}
                    </td>
                    <td>{l.nombre||1}</td>
                    <td>{fmt(l.prix_unitaire)}</td>
                    <td>
                      <strong className="text-brand-green">
                        {fmt((+l.nombre||1)*(+l.prix_unitaire||0))}
                      </strong>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-ghost btn-xs mr-1" disabled={isLocked}
                        onClick={() => openEdit(i)}>
                        <Pencil size={11}/>
                      </button>
                      <button className="btn btn-danger btn-xs" disabled={isLocked}
                        onClick={() => confirmDelete(`ligne ${i+1}`,
                          () => setLignes(p => p.filter((_,j) => j!==i)))}>
                        <Trash2 size={11}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totaux */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total HT</span>
              <strong>{fmt(totalHT)}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Remise (€)</span>
              <input type="number" step="0.01"
                className="form-control w-28 py-1 text-sm text-right" disabled={isLocked}
                value={remise} onChange={e => setRemise(e.target.value)}/>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200
              dark:border-gray-700 font-black text-base text-brand-green">
              <span>Total à Payer</span>
              <strong>{fmt(totalTTC)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button className="btn btn-ghost" onClick={onBack}>Annuler</button>
        {lignes.length > 0 && (
          <button className="btn btn-ghost btn-lg" onClick={openPrint}>
            <Printer size={15}/> Aperçu PDF
          </button>
        )}
        <button className="btn btn-success btn-lg" onClick={save}
          disabled={saveMut.isPending || isLocked}
          title={isLocked ? `Facture pro ${fp?.statut === 'verrouille' ? 'verrouillée' : 'validée'} — modification bloquée` : ''}>
          <Save size={15}/>
          {saveMut.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* Modal PDF */}
      <FactureProPrintModal
        pc={pc}
        fp={printFP}
        open={printOpen}
        onClose={() => setPrintOpen(false)}
      />

      {/* Préremplissage depuis la cotation */}
      <GenererDepuisCotation pc={pc} open={genOpen} onClose={()=>setGenOpen(false)}
        onAppliquer={appliquerCotation} aDejaDesLignes={lignes.length > 0}/>

      {/* Nouvelle fonctionnalité : historique des versions de la facture pro */}
      <Modal open={histOpen} onClose={()=>setHistOpen(false)} title="Historique des modifications" icon={HistoryIcon} size="lg"
        footer={<button className="btn btn-ghost" onClick={()=>setHistOpen(false)}>Fermer</button>}
      >
        {histLoading ? (
          <div className="py-8 text-center text-gray-400">Chargement...</div>
        ) : historique.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <HistoryIcon size={32} className="mx-auto mb-3 opacity-30"/>
            Aucune modification enregistrée pour l'instant.
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {historique.map(v => (
              <div key={v.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    Version {v.numero}
                  </span>
                  <span className="text-xs text-gray-400">{fmtDateTime(v.modifie_le)} — {v.modifie_par_nom || 'Utilisateur supprimé'}</span>
                </div>
                <div className="text-xs text-gray-500">
                  État avant cette modification : <strong>{v.snapshot.lignes.length}</strong> ligne{v.snapshot.lignes.length>1?'s':''},
                  {' '}remise <strong>{(+v.snapshot.remise).toLocaleString('fr-FR')} €</strong>,
                  {' '}total TTC : <strong className="text-brand-green">{(+v.snapshot.total_ttc).toLocaleString('fr-FR')} €</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal ligne */}
      <Modal open={lgModal} onClose={() => setLgModal(false)}
        title={editIdx!==null ? 'Modifier une ligne' : 'Ajouter une ligne'}
        icon={FileCheck}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setLgModal(false)}>
            Annuler
          </button>
          <button className="btn btn-success" onClick={handleSubmit(saveLigne)}>
            Enregistrer
          </button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-control" {...register('date')}/>
          </div>
          <div className="form-group col-span-2">
            <label className="form-label">
              Service / Description <span className="form-req">*</span>
            </label>
            <input className="form-control" placeholder="Description du service..."
              {...register('service', { required: true })}/>
          </div>
          <div className="form-group">
            <label className="form-label">
              Nombre <span className="form-req">*</span>
            </label>
            <input type="number" className="form-control" min={1} defaultValue={1}
              {...register('nombre', { required: true, min: 1 })}/>
          </div>
          <div className="form-group">
            <label className="form-label">
              Prix unitaire (€) <span className="form-req">*</span>
            </label>
            <input type="number" step="0.01" className="form-control"
              placeholder="0.00"
              {...register('prix_unitaire', { required: true, min: 0 })}/>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────
export default function FacturePro() {
  const { data: pcs = [], isLoading, error, refetch } = useProgrammeClients()
  const [curPC,  setCurPC]  = useState(null)
  const [search, setSearch] = useState('')

  const filtered = pcs.filter(p =>
    !search || (p.client_nom||'').toLowerCase().includes(search.toLowerCase())
  )

  if (curPC) return (
    <Layout breadcrumb={['SITRAC','Sales','Dossier Client','Facture Pro']}>
      <FactureProForm pc={curPC} onBack={() => setCurPC(null)}/>
    </Layout>
  )

  return (
    <Layout breadcrumb={['SITRAC','Sales','Dossier Client','Facture Pro']}>
      <div className="mb-5">
        <h1 className="page-title">
          <FileCheck size={22} className="text-orange"/> Facture Pro
        </h1>
        <p className="page-sub">Factures proforma par dossier client</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={FileCheck} value={pcs.length}
          label="Dossiers" color="orange"/>
        <StatCard icon={FileCheck} value={pcs.filter(p => p.a_cotation).length}
          label="Avec cotation" color="blue"/>
        <StatCard icon={FileCheck} value={pcs.filter(p => p.a_facture_pro).length}
          label="Factures Pro créées" color="green"/>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
            Programmes Clients — Choisir un dossier
          </h3>
          <SearchInput value={search} onChange={setSearch}/>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch}
          loadingText="Chargement...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Client</th><th>Programme</th><th>PAX</th>
                  <th>Date vente</th><th>Cotation</th>
                  <th className="text-center">Facture Pro</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                      Aucun dossier
                    </td>
                  </tr>
                ) : filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <strong className="text-gray-900 dark:text-white">
                        {p.client_nom}
                      </strong>
                    </td>
                    <td><Badge variant="info">{p.programme_nom}</Badge></td>
                    <td>{p.nb_pax}</td>
                    <td className="text-sm text-gray-500">{fmtDate(p.date_vente)}</td>
                    <td>
                      {p.a_cotation
                        ? <Badge variant="active"><Check size={11} className="inline -mt-px"/></Badge>
                        : <Badge variant="inactive">Non</Badge>}
                    </td>
                    <td className="text-center">
                      {!p.a_cotation ? (
                        <span className="flex items-center justify-center gap-1
                          text-xs text-gray-400">
                          <AlertCircle size={12}/> Cotation requise
                        </span>
                      ) : (
                        <button
                          className={`btn btn-sm ${p.a_facture_pro
                            ? 'btn-info' : 'btn-primary'}`}
                          onClick={() => setCurPC(p)}>
                          {p.a_facture_pro
                            ? <><Pencil size={13}/> Modifier</>
                            : <><Plus size={13}/> Créer</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ApiState>
      </div>
    </Layout>
  )
}

// ── Client & Communication ──────────────────────────────────────
// Bandeau compact : dernier envoi du devis au client et bouton d'envoi.
// Le suivi détaillé (historique, échéancier, paiements) est dans « Suivi client & paiements ».
const LIB_CONF = { envoyee:'envoyé, en attente de réponse', consultee:'ouvert par le client, en attente de réponse',
  acceptee:'accepté et signé', refusee:'refusé', expiree:'expiré sans réponse', annulee:'annulé' }

function EnvoiClient({ pcId, fp, peutEnvoyer }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: demandes = [] } = useQuery({
    queryKey: ['rc-confirmations', pcId],
    queryFn: () => relationClientAPI.getSynthese(pcId).then(r => r.confirmations),
  })
  const derniere = demandes[0]
  const envoyable = ['valide', 'verrouille'].includes(fp.statut)
  const envoyer = useMutation({
    mutationFn: () => relationClientAPI.envoyerDevis(pcId, {}),
    onSuccess: (r) => { toast.success(r.resume); qc.invalidateQueries({ queryKey: ['rc-confirmations', pcId] }) },
    onError: (e) => toast.error(e.message),
  })
  return (
    <div className="card mb-4 p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-gray-600 dark:text-gray-300">
        {derniere
          ? <>Devis client {LIB_CONF[derniere.statut]}{derniere.statut === 'refusee' && derniere.motif_refus ? ` — « ${derniere.motif_refus} »` : ''}
              {' '}(envoyé le {fmtDateTime(derniere.envoyee_le)} à {derniere.email_destinataire}).</>
          : envoyable ? "Ce devis n'a pas encore été envoyé au client pour confirmation."
                      : 'Validez la facture pro pour pouvoir l\'envoyer au client à signer.'}
      </div>
      <div className="flex gap-2">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/relation-client?pc=${pcId}`)}>Suivi client</button>
        {peutEnvoyer && envoyable && !['envoyee', 'consultee', 'acceptee'].includes(derniere?.statut) && (
          <button className="btn btn-primary btn-sm" disabled={envoyer.isPending} onClick={() => envoyer.mutate()}>
            <Send size={13}/> Envoyer au client à signer
          </button>
        )}
      </div>
    </div>
  )
}