import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { FileText, Plus, Pencil, Trash2, ArrowLeft, Save, Printer, Download, Upload, Lock, Unlock, HistoryIcon } from 'lucide-react'
import { useProgrammeClients, useCotation, useCotationMutation } from '../../hooks/useApi'
import { useQuery } from '@tanstack/react-query'
import { useConfirm } from '../../hooks/useConfirm'
import { useAuthStore } from '../../store/authStore'
import Layout from '../../components/Layout/Layout'
import { Modal, Badge, SearchInput } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate, fmt, fmtAr, fmtDateTime } from '../../utils/storage'
import { salesAPI } from '../../utils/api'

// ─── Modal Aperçu PDF Cotation ─────────────────────────────────
function CotationPrintModal({ pc, data, open, onClose }) {
  const printRef = useRef()

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=960,height=750')
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Cotation — ${pc?.client_nom}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;font-size:10.5px;color:#1a1a1a;background:#fff}
    .page{width:210mm;min-height:297mm;padding:12mm 14mm;margin:0 auto}
    .header{display:flex;align-items:center;justify-content:space-between;
            padding-bottom:12px;border-bottom:2px solid #1a1a1a;margin-bottom:14px}
    .co-name{font-size:20px;font-weight:900;color:#1a1a1a;letter-spacing:1px}
    .co-sub{font-size:9px;color:#555;margin-top:3px}
    .doc-title{font-size:15px;font-weight:900;text-transform:uppercase;
               letter-spacing:2px;border-bottom:3px solid #F5A623;
               padding-bottom:4px;display:inline-block}
    .doc-ref{font-size:9px;color:#555;margin-top:5px}
    .banner{background:#1a1a1a;color:#fff;padding:9px 14px;margin-bottom:14px;
            display:flex;justify-content:space-between;align-items:center}
    .bn-name{font-size:13px;font-weight:900}
    .bn-sub{font-size:9px;color:#bbb;margin-top:2px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;
               gap:8px;margin-bottom:14px;padding:9px 11px;background:#f5f5f5}
    .fl{font-size:7.5px;color:#888;text-transform:uppercase;
        letter-spacing:.5px;margin-bottom:2px;font-weight:700}
    .fv{font-size:10px;font-weight:600;color:#1a1a1a}
    .st{font-size:9px;font-weight:900;text-transform:uppercase;
        letter-spacing:1.5px;color:#fff;background:#1a1a1a;
        padding:4px 10px;margin-bottom:7px;display:inline-block}
    table{width:100%;border-collapse:collapse;font-size:9px}
    thead tr{background:#1a1a1a}
    thead th{padding:5px 6px;text-align:left;font-size:7.5px;font-weight:700;
             text-transform:uppercase;letter-spacing:.3px;color:#fff}
    tbody tr{border-bottom:1px solid #e8e8e8}
    tbody tr:nth-child(even){background:#f5f5f5}
    tbody td{padding:5px 6px}
    .fixes-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px}
    .fixe-box{border:1px solid #e0e0e0;padding:7px 9px;text-align:center}
    .fixe-lbl{font-size:7px;color:#888;text-transform:uppercase;
              font-weight:700;letter-spacing:.4px;margin-bottom:3px}
    .fixe-val{font-size:12px;font-weight:900;color:#1a1a1a}
    .recap{border:1.5px solid #1a1a1a;margin-bottom:14px}
    .recap-row{display:flex;justify-content:space-between;align-items:center;
               padding:7px 12px;border-bottom:1px solid #e8e8e8;font-size:10px}
    .recap-row:last-child{border-bottom:none}
    .recap-row.t3{background:#f5f5f5;font-weight:700}
    .recap-row.t5{background:#F5A623;color:#1a1a1a;font-weight:900;font-size:13px}
    .ariary-box{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
    .ar-card{border:1px solid #1a1a1a;padding:10px 12px;text-align:center}
    .ar-lbl{font-size:7.5px;color:#888;text-transform:uppercase;
            font-weight:700;letter-spacing:.5px;margin-bottom:5px}
    .ar-val{font-size:14px;font-weight:900;color:#1a1a1a}
    .final-box{background:#1a1a1a;color:#fff;padding:14px 16px;
               text-align:center;margin-bottom:18px}
    .final-lbl{font-size:9px;text-transform:uppercase;letter-spacing:1px;
               opacity:.8;margin-bottom:4px}
    .final-val{font-size:20px;font-weight:900;color:#F5A623}
    .sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;
              margin-top:20px;padding-top:12px;border-top:2px solid #1a1a1a}
    .sig-line{border-bottom:1.5px solid #1a1a1a;height:36px;margin-bottom:6px}
    .sig-lbl{font-size:8px;color:#555;text-transform:uppercase;
             letter-spacing:.5px;font-weight:700;text-align:center}
    .footer{text-align:center;font-size:8px;color:#888;margin-top:16px;
            padding-top:7px;border-top:1px solid #ddd;line-height:1.6}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .page{padding:8mm 10mm}
    }
  </style>
</head>
<body>${printRef.current?.innerHTML || ''}</body>
</html>`)
    win.document.close()
    win.onload = () => { win.focus(); win.print() }
  }

  if (!pc || !data) return null

  const today_str = new Date().toLocaleDateString('fr-FR',
    { day:'2-digit', month:'long', year:'numeric' })
  const refDoc = `COT-${String(pc.id).padStart(4,'0')}-${new Date().getFullYear()}`
  const { lignes, fix, taux, tot1, tot2, tot3, tot4, tot5 } = data

  const FRow = ({ label, value }) => (
    <div>
      <div style={{fontSize:'7.5px',color:'#888',textTransform:'uppercase',
        letterSpacing:'.5px',marginBottom:'2px',fontWeight:'700'}}>{label}</div>
      <div style={{fontSize:'10px',fontWeight:'600',color:'#1a1a1a'}}>{value || '—'}</div>
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} size="xl"
      title={`Aperçu Cotation — ${pc.client_nom}`} icon={FileText}
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
            padding:'26px 32px',fontFamily:'Arial,Helvetica,sans-serif',
            fontSize:'10.5px',color:'#1a1a1a'}}>

            {/* En-tête */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              paddingBottom:'12px',borderBottom:'2px solid #1a1a1a',marginBottom:'14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                <img src="/logo.jpg" alt="Ramartour"
                  style={{width:'50px',height:'50px',objectFit:'contain'}}/>
                <div>
                  <div style={{fontSize:'19px',fontWeight:'900',
                    color:'#1a1a1a',letterSpacing:'1px'}}>RAMARTOUR</div>
                  <div style={{fontSize:'9px',color:'#555',marginTop:'3px'}}>Madagascar</div>
                  <div style={{fontSize:'8px',color:'#888'}}>
                    Système de Traitement des Relations Clients
                  </div>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'14px',fontWeight:'900',textTransform:'uppercase',
                  letterSpacing:'2px',borderBottom:'3px solid #F5A623',
                  paddingBottom:'4px',display:'inline-block'}}>
                  Fiche de Cotation
                </div>
                <div style={{fontSize:'9px',color:'#555',marginTop:'5px'}}>
                  Réf. : <strong>{refDoc}</strong>
                </div>
                <div style={{fontSize:'9px',color:'#555'}}>Date : {today_str}</div>
              </div>
            </div>

            {/* Bannière client */}
            <div style={{background:'#1a1a1a',color:'#fff',padding:'9px 14px',
              marginBottom:'14px',display:'flex',justifyContent:'space-between',
              alignItems:'center'}}>
              <div>
                <div style={{fontSize:'13px',fontWeight:'900'}}>{pc.client_nom}</div>
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
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',
              gap:'8px',marginBottom:'14px',padding:'9px 11px',background:'#f5f5f5'}}>
              <FRow label="Programme"  value={pc.programme_nom}/>
              <FRow label="Nb PAX"     value={pc.nb_pax}/>
              <FRow label="Date début" value={pc.date_debut?fmtDate(pc.date_debut):'—'}/>
              <FRow label="Date fin"   value={pc.date_fin?fmtDate(pc.date_fin):'—'}/>
              <FRow label="Taux Ar/€"  value={`${(+taux).toLocaleString('fr-FR')} Ar`}/>
            </div>

            {/* Titre lignes */}
            <div style={{fontSize:'9px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1.5px',color:'#fff',background:'#1a1a1a',
              padding:'4px 10px',marginBottom:'7px',display:'inline-block'}}>
              Programme Jour par Jour
            </div>

            {/* Table lignes */}
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'9px',
              marginBottom:'14px'}}>
              <thead>
                <tr style={{background:'#1a1a1a'}}>
                  {['Jour','Date','Route','Hôtels','DBL','BF','L','D','TSF','Park','Guide'].map(h=>(
                    <th key={h} style={{padding:'5px 6px',textAlign:'left',
                      fontSize:'7.5px',fontWeight:'700',textTransform:'uppercase',
                      letterSpacing:'.3px',color:'#fff'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(!lignes || lignes.length===0) ? (
                  <tr>
                    <td colSpan={11} style={{padding:'10px',textAlign:'center',
                      color:'#aaa',fontStyle:'italic',fontSize:'9px'}}>
                      Aucune ligne de cotation
                    </td>
                  </tr>
                ) : lignes.map((lg,i) => (
                  <tr key={i} style={{
                    background: i%2===0 ? '#fff' : '#f5f5f5',
                    borderBottom:'1px solid #e8e8e8'}}>
                    <td style={{padding:'5px 6px'}}>{lg.jour||'—'}</td>
                    <td style={{padding:'5px 6px',fontSize:'8px',color:'#555'}}>
                      {lg.date?fmtDate(lg.date):'—'}
                    </td>
                    <td style={{padding:'5px 6px',fontWeight:'600'}}>{lg.route||'—'}</td>
                    <td style={{padding:'5px 6px',fontSize:'8px'}}>{lg.hotels||'—'}</td>
                    <td style={{padding:'5px 6px',textAlign:'right'}}>{lg.dbl||0}</td>
                    <td style={{padding:'5px 6px',textAlign:'right'}}>{lg.bf||0}</td>
                    <td style={{padding:'5px 6px',textAlign:'right'}}>{lg.lunch||0}</td>
                    <td style={{padding:'5px 6px',textAlign:'right'}}>{lg.diner||0}</td>
                    <td style={{padding:'5px 6px',textAlign:'right'}}>{lg.tsf||0}</td>
                    <td style={{padding:'5px 6px',textAlign:'right'}}>{lg.parking||0}</td>
                    <td style={{padding:'5px 6px',textAlign:'right'}}>{lg.guide||0}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Éléments fixes */}
            <div style={{fontSize:'9px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1.5px',color:'#fff',background:'#1a1a1a',
              padding:'4px 10px',marginBottom:'7px',display:'inline-block'}}>
              Éléments Fixes (€)
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',
              gap:'6px',marginBottom:'14px'}}>
              {[
                ['CAR',fix.car],['FUEL',fix.fuel],['TAX',fix.tax],['GUIDE',fix.guide],
                ['COMM',fix.comm],['FILE FEE',fix.fee],['FLIGHT',fix.flight],['REMISE',fix.remise],
              ].map(([l,v]) => (
                <div key={l} style={{border:'1px solid #e0e0e0',padding:'7px 9px',textAlign:'center'}}>
                  <div style={{fontSize:'7px',color:'#888',textTransform:'uppercase',
                    fontWeight:'700',letterSpacing:'.4px',marginBottom:'3px'}}>{l}</div>
                  <div style={{fontSize:'12px',fontWeight:'900',color:'#1a1a1a'}}>
                    {(+v||0).toLocaleString('fr-FR')} €
                  </div>
                </div>
              ))}
            </div>

            {/* Récapitulatif */}
            <div style={{fontSize:'9px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1.5px',color:'#fff',background:'#1a1a1a',
              padding:'4px 10px',marginBottom:'7px',display:'inline-block'}}>
              Récapitulatif des Totaux
            </div>
            <div style={{border:'1.5px solid #1a1a1a',marginBottom:'14px'}}>
              {[
                ['TOTAL 1 — Somme des lignes journalières', tot1, false],
                ['TOTAL 2 — CAR + FUEL + TAX + GUIDE',       tot2, false],
                ['TOTAL 3 — TOTAL 1 + TOTAL 2',              tot3, true],
                ['TOTAL 4 — TOTAL 3 + COMM + FILE FEE',      tot4, false],
              ].map(([l,v,hl]) => (
                <div key={l} style={{display:'flex',justifyContent:'space-between',
                  alignItems:'center',padding:'7px 12px',borderBottom:'1px solid #e8e8e8',
                  fontSize:'10px',background:hl?'#f5f5f5':'transparent',
                  fontWeight:hl?'700':'400'}}>
                  <span style={{color:'#555'}}>{l}</span>
                  <strong>{(+v||0).toLocaleString('fr-FR',{minimumFractionDigits:2})} €</strong>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',
                alignItems:'center',padding:'9px 12px',fontSize:'13px',fontWeight:'900',
                background:'#F5A623',color:'#1a1a1a'}}>
                <span>TOTAL 5 — PRIX DE REVIENT / PAX</span>
                <span>{(+tot5||0).toLocaleString('fr-FR',{minimumFractionDigits:2})} €</span>
              </div>
            </div>

            {/* Conversion Ariary */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',
              gap:'10px',marginBottom:'14px'}}>
              <div style={{border:'1px solid #1a1a1a',padding:'10px 12px',textAlign:'center'}}>
                <div style={{fontSize:'7.5px',color:'#888',textTransform:'uppercase',
                  fontWeight:'700',letterSpacing:'.5px',marginBottom:'5px'}}>
                  TOTAL 5 en Ariary
                </div>
                <div style={{fontSize:'14px',fontWeight:'900',color:'#1a1a1a'}}>
                  {((+tot5||0)*(+taux||0)).toLocaleString('fr-FR')} Ar
                </div>
              </div>
              <div style={{border:'1px solid #1a1a1a',padding:'10px 12px',textAlign:'center'}}>
                <div style={{fontSize:'7.5px',color:'#888',textTransform:'uppercase',
                  fontWeight:'700',letterSpacing:'.5px',marginBottom:'5px'}}>
                  Taux de change appliqué
                </div>
                <div style={{fontSize:'14px',fontWeight:'900',color:'#1a1a1a'}}>
                  1 € = {(+taux||0).toLocaleString('fr-FR')} Ar
                </div>
              </div>
            </div>

            {/* Total final groupe */}
            <div style={{background:'#1a1a1a',color:'#fff',padding:'14px 16px',
              textAlign:'center',marginBottom:'18px'}}>
              <div style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'1px',
                opacity:.8,marginBottom:'4px'}}>
                Prix de revient total — {pc.nb_pax} PAX
              </div>
              <div style={{fontSize:'20px',fontWeight:'900',color:'#F5A623'}}>
                {((+tot5||0)*(pc.nb_pax||1)).toLocaleString('fr-FR',
                  {minimumFractionDigits:2})} €
              </div>
            </div>

            {/* Mentions */}
            <div style={{padding:'9px 11px',background:'#f5f5f5',
              fontSize:'8.5px',color:'#555',lineHeight:'1.7',marginBottom:'16px'}}>
              <strong>Note :</strong> Ce document est un document interne représentant
              le coût de revient pour l'agence. Il ne constitue pas une facture
              et n'est pas destiné au client final.
            </div>

            {/* Signatures */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'40px',
              marginTop:'20px',paddingTop:'12px',borderTop:'2px solid #1a1a1a'}}>
              {['Responsable Sales','Validation Direction'].map(sig=>(
                <div key={sig} style={{textAlign:'center'}}>
                  <div style={{borderBottom:'1.5px solid #1a1a1a',
                    height:'36px',marginBottom:'6px'}}/>
                  <div style={{fontSize:'8px',color:'#555',textTransform:'uppercase',
                    letterSpacing:'.5px',fontWeight:'700'}}>{sig}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{textAlign:'center',fontSize:'8px',color:'#888',
              marginTop:'16px',paddingTop:'7px',
              borderTop:'1px solid #ddd',lineHeight:'1.6'}}>
              <div style={{width:'30px',height:'2px',background:'#F5A623',
                margin:'0 auto 8px'}}/>
              SITRAC — Ramartour Madagascar &nbsp;|&nbsp;
              Réf. {refDoc} &nbsp;|&nbsp; {today_str}<br/>
              Document interne confidentiel — Usage Sales uniquement
            </div>

          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── Sous-composant : formulaire de cotation ──────────────────
function CotationForm({ pc, onBack }) {
  const { data: cot, isLoading, error, refetch } = useCotation(pc.id)
  const save = useCotationMutation(pc.id)
  const { confirmDelete, confirmSave, confirm } = useConfirm()
  const { user } = useAuthStore()

  const [lignes,      setLignes]    = useState(() => cot?.lignes || [])
  const [fix,         setFix]       = useState(() => ({
    car:cot?.car||0, fuel:cot?.fuel||0, tax:cot?.tax||0, guide:cot?.guide||0,
    comm:cot?.comm||0, fee:cot?.fee||0, flight:cot?.flight||0, remise:cot?.remise||0
  }))
  const [taux,        setTaux]      = useState(() => cot?.taux_change || 4800)
  const [lgModal,      setLgModal]    = useState(false)
  const [editLigne,    setEditLigne]  = useState(null)
  const [initialized,  setInit]       = useState(false)
  const [printOpen,    setPrintOpen]  = useState(false)
  const [csvBusy,      setCsvBusy]    = useState(false)
  const [lockBusy,     setLockBusy]   = useState(false)
  const [histOpen,     setHistOpen]   = useState(false)
  const fileInputRef = useRef(null)
  const isLocked = !!cot?.valide

  const { data: historique = [], isLoading: histLoading } = useQuery({
    queryKey: ['cotation-historique', pc.id],
    queryFn:  () => salesAPI.getCotationHistorique(pc.id),
    enabled:  histOpen && !!cot,
  })

  const { register, handleSubmit, reset } = useForm()

  if (cot && !initialized) {
    setLignes(cot.lignes || [])
    setFix({
      car:cot.car||0, fuel:cot.fuel||0, tax:cot.tax||0, guide:cot.guide||0,
      comm:cot.comm||0, fee:cot.fee||0, flight:cot.flight||0, remise:cot.remise||0
    })
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

  // ── RG 31/32 : Export/Import CSV des lignes de cotation ────────
  // Nécessite que la cotation existe déjà côté serveur : les endpoints
  // export/import agissent sur les lignes réellement enregistrées, pas
  // sur les modifications locales non sauvegardées via "Tout enregistrer".
  const exportCsv = async () => {
    if (!cot) return
    setCsvBusy(true)
    try {
      await salesAPI.exportCotationCsv(pc.id)
    } catch (e) {
      alert(`Échec de l'export CSV : ${e.message}`)
    } finally {
      setCsvBusy(false)
    }
  }

  const triggerImport = () => fileInputRef.current?.click()

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permet de réimporter le même fichier plus tard
    if (!file || !cot) return
    setCsvBusy(true)
    try {
      const result = await salesAPI.importCotationCsv(pc.id, file)
      setLignes(result.cotation.lignes || [])
      await refetch()
      alert(result.detail)
    } catch (e) {
      alert(`Échec de l'import CSV : ${e.message}`)
    } finally {
      setCsvBusy(false)
    }
  }

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

  // ── RG 15 : verrouillage après validation ────────────────────
  const validerCotation = () => confirm({
    icon:'🔒', type:'warning', title:'Valider la cotation',
    msg:"Une fois validée, cette cotation ne pourra plus être modifiée (RG 15). Continuer ?",
    confirmText:'Oui, valider',
    onConfirm: async () => {
      setLockBusy(true)
      try { await salesAPI.validerCotation(pc.id); await refetch() }
      catch (e) { alert(`Échec de la validation : ${e.message}`) }
      finally { setLockBusy(false) }
    },
  })

  const devaliderCotation = () => confirm({
    icon:'🔓', type:'warning', title:'Dévalider la cotation',
    msg:"Cette cotation redeviendra modifiable. Réservé à l'Administration.",
    confirmText:'Oui, dévalider',
    onConfirm: async () => {
      setLockBusy(true)
      try { await salesAPI.devaliderCotation(pc.id); await refetch() }
      catch (e) { alert(`Échec : ${e.message}`) }
      finally { setLockBusy(false) }
    },
  })

  const openPrint = () => setPrintOpen(true)

  if (isLoading) return <div className="text-center py-8 text-gray-400">Chargement de la cotation...</div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={14}/> Retour</button>
        <h1 className="page-title text-xl"><FileText size={20} className="text-orange"/> Cotation — {pc.client_nom}</h1>
      </div>

      {/* RG 15 : bannière de statut de validation */}
      {isLocked ? (
        <div className="card mb-4 p-4 flex items-center justify-between gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-brand-green flex-shrink-0"/>
            <div className="text-sm text-brand-green">
              <strong>Cotation validée</strong> le {fmtDateTime(cot.valide_le)} par {cot.valide_par_nom || '—'}.
              Elle ne peut plus être modifiée (RG 15).
            </div>
          </div>
          {user?.dept === 'Administration' && (
            <button className="btn btn-ghost btn-sm flex-shrink-0" disabled={lockBusy} onClick={devaliderCotation}>
              <Unlock size={13}/> Dévalider
            </button>
          )}
        </div>
      ) : cot && (
        <div className="card mb-4 p-4 flex items-center justify-between gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3 text-sm text-orange-700 dark:text-orange-400">
            <Lock size={18} className="flex-shrink-0"/>
            Cette cotation est encore modifiable. Validez-la une fois définitive pour la verrouiller (RG 15).
          </div>
          <button className="btn btn-primary btn-sm flex-shrink-0" disabled={lockBusy} onClick={validerCotation}>
            <Lock size={13}/> Valider
          </button>
        </div>
      )}

      {/* Info dossier */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Informations du dossier</h3>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Taux Ar/€</label>
            <input type="number" className="form-control w-28 py-1.5 text-sm" value={taux} disabled={isLocked} onChange={e=>setTaux(e.target.value)}/>
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
            <button className="btn btn-primary btn-sm" disabled={isLocked} onClick={openAddLigne}><Plus size={13}/> Ajout Manuel</button>
            <button className="btn btn-ghost btn-sm" disabled={!cot || csvBusy} onClick={exportCsv}
              title={!cot ? "Enregistrez d'abord la cotation pour pouvoir exporter" : ''}>
              <Download size={13}/> Exporter
            </button>
            <button className="btn btn-ghost btn-sm" disabled={!cot || csvBusy || isLocked} onClick={triggerImport}
              title={!cot ? "Enregistrez d'abord la cotation pour pouvoir importer" : isLocked ? 'Cotation validée — verrouillée (RG 15)' : ''}>
              <Upload size={13}/> Importer
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile}/>
            <button className="btn btn-ghost btn-sm" disabled={!cot} onClick={()=>setHistOpen(true)}
              title={!cot ? "Enregistrez d'abord la cotation" : ''}>
              <HistoryIcon size={13}/> Historique
            </button>
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
                      <button className="btn btn-ghost btn-xs mr-1" disabled={isLocked} onClick={()=>openEditLigne(i)}><Pencil size={10}/></button>
                      <button className="btn btn-danger btn-xs" disabled={isLocked} onClick={()=>deleteLigne(i)}><Trash2 size={10}/></button>
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
                <input type="number" step="0.01" className="form-control py-2" value={fix[k]} disabled={isLocked}
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
        {(lignes.length > 0 || tot5 > 0) && (
          <button className="btn btn-ghost btn-lg" onClick={openPrint}>
            <Printer size={15}/> Aperçu PDF
          </button>
        )}
        <button className="btn btn-success btn-lg" onClick={saveCot} disabled={save.isPending || isLocked}
          title={isLocked ? 'Cotation validée — verrouillée (RG 15)' : ''}>
          <Save size={16}/> {save.isPending?'Enregistrement...':'Tout Enregistrer'}
        </button>
      </div>

      {/* Modal PDF */}
      <CotationPrintModal
        pc={pc}
        data={{ lignes, fix, taux, tot1, tot2, tot3, tot4, tot5 }}
        open={printOpen}
        onClose={() => setPrintOpen(false)}
      />

      {/* Nouvelle fonctionnalité : historique des versions de la cotation */}
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
                <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                  {[['CAR',v.snapshot.car],['FUEL',v.snapshot.fuel],['TAX',v.snapshot.tax],['GUIDE',v.snapshot.guide]].map(([l,val])=>(
                    <div key={l} className="text-center p-1.5 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-[9px] text-gray-400 uppercase">{l}</div>
                      <div className="font-bold">{(+val).toLocaleString('fr-FR')} €</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  État avant cette modification : <strong>{v.snapshot.lignes.length}</strong> ligne{v.snapshot.lignes.length>1?'s':''},
                  {' '}TOTAL 5 : <strong className="text-brand-green">{(+v.snapshot.total5).toLocaleString('fr-FR')} €</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

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