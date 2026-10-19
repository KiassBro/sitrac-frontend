import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FolderOpen, Plus, Pencil, Trash2, ArrowLeft, Save, Printer } from 'lucide-react'
import { useProgrammeClients } from '../../hooks/useApi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeAPI, bookingAPI } from '../../utils/api'
import { useConfirm } from '../../hooks/useConfirm'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import ChampPrestataire from '../../components/Prestataires/ChampPrestataire'
import { Modal, Badge, SearchInput, StatCard } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate, fmt, today } from '../../utils/storage'
import { AlertTriangle } from 'lucide-react'

// ─── Modal Rapport de Clôture PDF ─────────────────────────────
function CloturePrintModal({ pc, data, open, onClose }) {
  const printRef = useRef()

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=960,height=750')
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Rapport de Clôture — ${pc?.client_nom}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1a1a1a;background:#fff}
    .page{width:210mm;min-height:297mm;padding:14mm 16mm;margin:0 auto}
    .header{display:flex;align-items:center;justify-content:space-between;
            padding-bottom:12px;border-bottom:2px solid #1a1a1a;margin-bottom:16px}
    .co-name{font-size:20px;font-weight:900;color:#1a1a1a;letter-spacing:1px}
    .co-sub{font-size:9px;color:#555;margin-top:3px}
    .doc-title{font-size:15px;font-weight:900;text-transform:uppercase;
               letter-spacing:2px;border-bottom:3px solid #F5A623;
               padding-bottom:4px;display:inline-block}
    .doc-ref{font-size:9px;color:#555;margin-top:5px}
    .banner{background:#1a1a1a;color:#fff;padding:10px 14px;margin-bottom:16px;
            display:flex;justify-content:space-between;align-items:center}
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
    .td-right{text-align:right;font-weight:700}
    .synthese{margin-top:16px;border:1.5px solid #1a1a1a}
    .syn-row{display:flex;justify-content:space-between;align-items:center;
             padding:9px 14px;border-bottom:1px solid #e8e8e8;font-size:12px}
    .syn-row:last-child{border-bottom:none}
    .syn-row.total-pos{background:#F5A623;font-weight:900;font-size:14px;color:#1a1a1a}
    .syn-row.total-neg{background:#1a1a1a;font-weight:900;font-size:14px;color:#fff}
    .progress-bar{height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;margin-top:4px}
    .progress-fill{height:100%;border-radius:4px}
    .mention{margin-top:20px;padding:10px 12px;background:#f5f5f5;
             font-size:9px;color:#555;line-height:1.7}
    .sig-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;
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

  if (!pc || !data) return null

  const today_str = new Date().toLocaleDateString('fr-FR',
    { day:'2-digit', month:'long', year:'numeric' })
  const refDoc    = `CL-${String(pc.id).padStart(4,'0')}-${new Date().getFullYear()}`
  const lignes    = data.lignes || []
  const totalDep  = lignes.reduce((s,l) => s + (+l.montant||0), 0)
  const recettes  = +data.total_recettes || 0
  const benefice  = recettes - totalDep
  const marge     = recettes > 0 ? Math.round((benefice/recettes)*100) : 0
  const isProfit  = benefice >= 0

  const FRow = ({ label, value }) => (
    <div>
      <div style={{fontSize:'7.5px',color:'#888',textTransform:'uppercase',
        letterSpacing:'.5px',marginBottom:'2px',fontWeight:'700'}}>{label}</div>
      <div style={{fontSize:'11px',fontWeight:'600',color:'#1a1a1a'}}>{value || '—'}</div>
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} size="xl"
      title={`Rapport de Clôture — ${pc.client_nom}`} icon={FolderOpen}
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
                  <div style={{fontSize:'9px',color:'#555',marginTop:'3px'}}>Madagascar</div>
                  <div style={{fontSize:'8px',color:'#888'}}>
                    Système de Traitement des Relations Clients
                  </div>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'15px',fontWeight:'900',textTransform:'uppercase',
                  letterSpacing:'2px',borderBottom:'3px solid #F5A623',
                  paddingBottom:'4px',display:'inline-block'}}>
                  Rapport de Clôture
                </div>
                <div style={{fontSize:'9px',color:'#555',marginTop:'5px'}}>
                  Réf. : <strong>{refDoc}</strong>
                </div>
                <div style={{fontSize:'9px',color:'#555'}}>
                  Date : {data.date_cloture || today_str}
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
              <div style={{display:'flex',gap:'8px'}}>
                <span style={{padding:'3px 10px',fontSize:'10px',fontWeight:'700',
                  background:'#F5A623',color:'#1a1a1a'}}>
                  {pc.nb_pax} PAX
                </span>
                <span style={{padding:'3px 10px',fontSize:'10px',fontWeight:'700',
                  color:'#fff',border:'1.5px solid #fff'}}>
                  CLÔTURÉ
                </span>
              </div>
            </div>

            {/* Infos dossier */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',
              gap:'10px',marginBottom:'16px',padding:'10px 12px',background:'#f5f5f5'}}>
              <FRow label="Programme"    value={pc.programme_nom}/>
              <FRow label="Nb PAX"       value={pc.nb_pax}/>
              <FRow label="Période"
                value={`${fmtDate(pc.date_debut)} → ${fmtDate(pc.date_fin)}`}/>
              <FRow label="Date clôture" value={data.date_cloture
                ? fmtDate(data.date_cloture) : today_str}/>
            </div>

            {/* Résultat financier visuel */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',
              gap:'10px',marginBottom:'16px'}}>
              {[
                ['RECETTES TOTALES',   recettes, '#1a1a1a','#fff'],
                ['DÉPENSES TOTALES',   totalDep, '#f5f5f5','#1a1a1a'],
                ['BÉNÉFICE NET',       benefice, isProfit?'#F5A623':'#1a1a1a', isProfit?'#1a1a1a':'#fff'],
              ].map(([l,v,bg,col]) => (
                <div key={l} style={{background:bg,color:col,padding:'12px 14px',
                  textAlign:'center'}}>
                  <div style={{fontSize:'8px',fontWeight:'700',textTransform:'uppercase',
                    letterSpacing:'1px',opacity:.8,marginBottom:'6px'}}>{l}</div>
                  <div style={{fontSize:'18px',fontWeight:'900'}}>
                    {(+v||0).toLocaleString('fr-FR',{minimumFractionDigits:2})} €
                  </div>
                </div>
              ))}
            </div>

            {/* Barre de marge */}
            <div style={{marginBottom:'16px',padding:'10px 14px',background:'#f5f5f5'}}>
              <div style={{display:'flex',justifyContent:'space-between',
                marginBottom:'6px',fontSize:'10px',fontWeight:'700'}}>
                <span>Taux de marge</span>
                <span style={{color:isProfit?'#27AE60':'#C0392B',fontWeight:'900'}}>
                  {marge}%
                </span>
              </div>
              <div style={{height:'8px',background:'#e0e0e0',borderRadius:'4px',overflow:'hidden'}}>
                <div style={{
                  height:'100%',borderRadius:'4px',
                  background:isProfit?'#27AE60':'#C0392B',
                  width:`${Math.min(100,Math.abs(marge))}%`,
                  transition:'width .5s ease'
                }}/>
              </div>
              <div style={{marginTop:'6px',fontSize:'9px',color:'#888'}}>
                {isProfit
                  ? `Marge bénéficiaire de ${marge}% — dossier rentable`
                  : `Déficit de ${Math.abs(marge)}% — pertes sur ce dossier`}
              </div>
            </div>

            {/* Titre dépenses */}
            <div style={{fontSize:'9px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1.5px',color:'#fff',background:'#1a1a1a',
              padding:'4px 10px',marginBottom:'8px',display:'inline-block'}}>
              Détail des Dépenses Réelles
            </div>

            {/* Table dépenses */}
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'10px',
              marginBottom:'16px'}}>
              <thead>
                <tr style={{background:'#1a1a1a'}}>
                  {['#','Date','Description','Prestataire','Montant (€)'].map(h=>(
                    <th key={h} style={{padding:'7px 10px',textAlign:'left',
                      fontSize:'8px',fontWeight:'700',textTransform:'uppercase',
                      letterSpacing:'.5px',color:'#fff'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignes.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{padding:'12px',textAlign:'center',
                      color:'#aaa',fontStyle:'italic',fontSize:'9px'}}>
                      Aucune dépense enregistrée
                    </td>
                  </tr>
                ) : lignes.map((l,i) => (
                  <tr key={i} style={{
                    background: i%2===0 ? '#fff' : '#f5f5f5',
                    borderBottom:'1px solid #e8e8e8'}}>
                    <td style={{padding:'7px 10px',color:'#888'}}>{i+1}</td>
                    <td style={{padding:'7px 10px',fontSize:'9px',color:'#555'}}>
                      {l.date ? fmtDate(l.date) : '—'}
                    </td>
                    <td style={{padding:'7px 10px',fontWeight:'600'}}>{l.description}</td>
                    <td style={{padding:'7px 10px',color:'#555'}}>{l.prestataire||'—'}</td>
                    <td style={{padding:'7px 10px',textAlign:'right',fontWeight:'700',
                      color:'#1a1a1a'}}>
                      {(+l.montant||0).toLocaleString('fr-FR',{minimumFractionDigits:2})} €
                    </td>
                  </tr>
                ))}
                {/* Total dépenses */}
                <tr style={{background:'#1a1a1a'}}>
                  <td colSpan={4} style={{padding:'7px 10px',color:'#fff',
                    fontWeight:'700',fontSize:'10px',textTransform:'uppercase'}}>
                    Total Dépenses
                  </td>
                  <td style={{padding:'7px 10px',textAlign:'right',fontWeight:'900',
                    color:'#F5A623',fontSize:'12px'}}>
                    {totalDep.toLocaleString('fr-FR',{minimumFractionDigits:2})} €
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Synthèse financière */}
            <div style={{fontSize:'9px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1.5px',color:'#fff',background:'#1a1a1a',
              padding:'4px 10px',marginBottom:'8px',display:'inline-block'}}>
              Synthèse Financière
            </div>
            <div style={{border:'1.5px solid #1a1a1a',marginBottom:'20px'}}>
              {[
                ['Total Recettes (encaissé)',     recettes,  false],
                ['Total Dépenses (réelles)',       totalDep,  false],
              ].map(([l,v]) => (
                <div key={l} style={{display:'flex',justifyContent:'space-between',
                  alignItems:'center',padding:'9px 14px',
                  borderBottom:'1px solid #e8e8e8',fontSize:'12px'}}>
                  <span style={{color:'#555'}}>{l}</span>
                  <strong>{(+v||0).toLocaleString('fr-FR',{minimumFractionDigits:2})} €</strong>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',
                alignItems:'center',padding:'11px 14px',fontSize:'14px',
                fontWeight:'900',
                background: isProfit ? '#F5A623' : '#1a1a1a',
                color: isProfit ? '#1a1a1a' : '#fff'}}>
                <span>BÉNÉFICE NET</span>
                <span>
                  {benefice >= 0 ? '+' : ''}{benefice.toLocaleString('fr-FR',
                    {minimumFractionDigits:2})} €
                  &nbsp;({marge}%)
                </span>
              </div>
            </div>

            {/* Observation */}
            {data.observation && (
              <div style={{padding:'10px 12px',background:'#f5f5f5',
                fontSize:'9px',color:'#555',marginBottom:'16px',lineHeight:'1.7'}}>
                <strong>Observation :</strong> {data.observation}
              </div>
            )}

            {/* Signatures */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'30px',
              marginTop:'24px',paddingTop:'14px',borderTop:'2px solid #1a1a1a'}}>
              {['Responsable Finance','Responsable Sales','Direction'].map(sig=>(
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

// ─── Formulaire Clôture ────────────────────────────────────────
function ClotureForm({ pc, onBack }) {
  const qc = useQueryClient()
  const { confirmDelete, confirmSave } = useConfirm()
  const [lgModal,    setLgModal]    = useState(false)
  const [editIdx,    setEditIdx]    = useState(null)
  const [lignes,     setLignes]     = useState([])
  const [obs,        setObs]        = useState('')
  const [dateCl,     setDateCl]     = useState(today())
  const [inited,     setInited]     = useState(false)
  const [clotureId,  setClotureId]  = useState(null)
  const [printOpen,  setPrintOpen]  = useState(false)
  const [printData,  setPrintData]  = useState(null)

  const lgMethods = useForm()

  const { data: cloture, isLoading } = useQuery({
    queryKey: ['cloture', pc.id],
    queryFn:  () => financeAPI.getClotures(`?programme_client=${pc.id}`)
                    .then(r => (r.results||r)[0] || null),
    retry: false,
  })

  if (cloture && !inited) {
    setLignes(cloture.lignes || [])
    setObs(cloture.observation || '')
    setDateCl(cloture.date_cloture || today())
    setClotureId(cloture.id)
    setInited(true)
  }

  // RG 24 : les recettes sont calculées par le serveur = somme des paiements du dossier
  const { data: paiements = [] } = useQuery({
    queryKey: ['paiements', pc.id],
    queryFn:  () => financeAPI.getPaiements(`?programme_client=${pc.id}`).then(r => r.results || r),
  })
  const totRec = paiements.reduce((s,p) => s + (+p.montant||0), 0)

  const saveMut = useMutation({
    mutationFn: (data) => clotureId
      ? financeAPI.updateCloture(clotureId, data)
      : financeAPI.createCloture(data),
    onSuccess: (res) => {
      if (!clotureId && res?.id) setClotureId(res.id)
      qc.invalidateQueries({ queryKey: ['cloture', pc.id] })
      toast.success('Clôture enregistrée avec succès')
      onBack()
    },
    onError: e => toast.error(e.message || 'Erreur lors de l\'enregistrement'),
  })

  const totalDep = lignes.reduce((s,l) => s + (+l.montant||0), 0)
  const benefice = (+totRec||0) - totalDep

  // Nouvelle clôture : les dépenses réelles sont reprises des reçus des
  // prestataires (RG 26) ; à défaut, de la provision du Booking.
  const [reprise, setReprise] = useState(false)
  const reprendreDepenses = async (silencieux = false) => {
    try {
      const recus = await financeAPI.getRecus(`?programme_client=${pc.id}`).then(r => r.results || r)
      let nouvelles = (recus || []).map(r => ({
        description: r.description || `Règlement ${r.prestataire}`, prestataire: r.prestataire,
        montant: +r.montant || 0, date: r.date_recu || '',
      }))
      let source = 'des reçus'
      if (!nouvelles.length) {
        const prov = await bookingAPI.getProvisions(`?programme_client=${pc.id}`).then(r => (r.results||r)[0] || null)
        nouvelles = (prov?.lignes || []).map(l => ({ description: l.description, prestataire: l.prestataire || '',
          montant: +l.montant || 0, date: l.date || '' }))
        source = 'de la provision'
      }
      if (!nouvelles.length) { if (!silencieux) toast('Aucun reçu ni provision pour ce dossier'); return }
      setLignes(nouvelles)
      toast.success(`${nouvelles.length} dépense(s) reprise(s) ${source}`)
    } catch { if (!silencieux) toast.error('Reprise impossible') }
  }
  useEffect(() => {
    if (isLoading || cloture || reprise) return
    setReprise(true)
    if (lignes.length === 0) reprendreDepenses(true)
  }, [isLoading, cloture])

  const openAdd  = () => {
    setEditIdx(null)
    lgMethods.reset({ description:'', prestataire:'', montant:'', date:'' })
    setLgModal(true)
  }
  const openEdit = (i) => {
    setEditIdx(i)
    lgMethods.reset({...lignes[i]})
    setLgModal(true)
  }
  const saveLg = lgMethods.handleSubmit(data => {
    const lg = { ...data, montant:+data.montant||0 }
    setLignes(prev =>
      editIdx!==null ? prev.map((l,i)=>i===editIdx?lg:l) : [...prev, lg]
    )
    setLgModal(false)
    toast.success(editIdx!==null ? 'Ligne modifiée' : 'Ligne ajoutée')
  })

  const deleteLg = (i) => {
    confirmDelete(`ligne ${i+1}`, () => {
      setLignes(prev => prev.filter((_,j)=>j!==i))
      toast.success('Ligne supprimée — cliquer "Clôturer" pour confirmer', { duration:3000 })
    })
  }

  const save = () => {
    if (+totRec <= 0) {
      toast.error('Aucun paiement enregistré pour ce dossier : la clôture est impossible')
      return
    }
    confirmSave(() => saveMut.mutate({
      programme_client: pc.id,
      date_cloture:     dateCl,
      observation:      obs,
      lignes: lignes.map((l,i) => ({
        description: l.description,
        prestataire: l.prestataire||'',
        montant:     +l.montant||0,
        date:        l.date||null,
        ordre:       i,
      })),
    }))
  }

  const openPrint = () => {
    setPrintData({
      date_cloture:    dateCl,
      observation:     obs,
      total_recettes:  totRec,
      lignes:          lignes,
    })
    setPrintOpen(true)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={14}/> Retour
        </button>
        <h1 className="page-title text-xl">
          <FolderOpen size={20} className="text-orange"/>
          Clôture — {pc.client_nom}
        </h1>
        {clotureId && (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100
            dark:bg-blue-900/30 text-brand-blue">
            Clôture #{clotureId} — modification
          </span>
        )}
      </div>

      {/* Paramètres */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
            Paramètres de clôture
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Date clôture
            </label>
            <input type="date" className="form-control w-44 py-1.5 text-sm"
              value={dateCl} onChange={e=>setDateCl(e.target.value)}/>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
            {[
              ['Client',   pc.client_nom],
              ['Programme',pc.programme_nom],
              ['PAX',      pc.nb_pax],
              ['Période',  `${fmtDate(pc.date_debut)} → ${fmtDate(pc.date_fin)}`],
            ].map(([k,v])=>(
              <div key={k}>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                  {k}
                </div>
                <div className="font-semibold text-gray-800 dark:text-gray-200">{v}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">
                Total Recettes (€) — somme des paiements du dossier
              </label>
              <input type="number" className="form-control bg-gray-50 dark:bg-gray-800"
                value={totRec.toFixed(2)} readOnly disabled/>
              <p className="form-hint">Calculé automatiquement à partir des paiements enregistrés.</p>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Observation</label>
              <input className="form-control" value={obs}
                onChange={e=>setObs(e.target.value)}
                placeholder="Remarques sur la clôture..."/>
            </div>
          </div>
        </div>
      </div>

      {/* Lignes dépenses */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
            Lignes de Dépenses Réelles
          </h3>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => reprendreDepenses(false)}
              title="Remplace les lignes par les reçus des prestataires (ou, à défaut, la provision)">
              <Plus size={13}/> Reprendre les reçus
            </button>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <Plus size={13}/> Ajouter
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
                  <th>Date</th><th>Description</th><th>Prestataire</th>
                  <th>Montant (€)</th><th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lignes.length===0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      Aucune dépense — cliquer sur "+ Ajouter"
                    </td>
                  </tr>
                ) : lignes.map((l,i)=>(
                  <tr key={i}>
                    <td>{fmtDate(l.date)}</td>
                    <td>
                      <strong className="text-gray-900 dark:text-white">
                        {l.description}
                      </strong>
                    </td>
                    <td className="text-gray-500">{l.prestataire||'—'}</td>
                    <td>
                      <strong className="text-brand-red">{fmt(l.montant)}</strong>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-ghost btn-xs mr-1"
                        onClick={()=>openEdit(i)}>
                        <Pencil size={11}/>
                      </button>
                      <button className="btn btn-danger btn-xs"
                        onClick={()=>deleteLg(i)}>
                        <Trash2 size={11}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Résumé */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Recettes</span>
              <strong className="text-brand-green">{fmt(+totRec||0)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Dépenses</span>
              <strong className="text-brand-red">{fmt(totalDep)}</strong>
            </div>
            <div className={`flex justify-between pt-2 border-t border-gray-200
              dark:border-gray-700 font-black text-base
              ${benefice>=0?'text-brand-green':'text-brand-red'}`}>
              <span>Bénéfice Net</span>
              <strong>{fmt(benefice)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 mb-4 bg-orange/10 border border-orange/30 rounded-xl
        text-sm text-orange flex items-center gap-2">
        <AlertTriangle size={15} className="flex-shrink-0"/>
        <span>Les dépenses sont sauvegardées en cliquant
          sur <strong>"Clôturer le dossier"</strong>.</span>
      </div>

      <div className="flex justify-end gap-3">
        <button className="btn btn-ghost" onClick={onBack}>Annuler</button>
        {(lignes.length > 0 || +totRec > 0) && (
          <button className="btn btn-ghost btn-lg" onClick={openPrint}>
            <Printer size={15}/> Aperçu PDF
          </button>
        )}
        <button className="btn btn-success btn-lg" onClick={save}
          disabled={saveMut.isPending}>
          <Save size={15}/>
          {saveMut.isPending ? 'Enregistrement...' : 'Clôturer le dossier'}
        </button>
      </div>

      {/* Modal PDF */}
      <CloturePrintModal
        pc={pc}
        data={printData}
        open={printOpen}
        onClose={() => setPrintOpen(false)}
      />

      {/* Modal ligne */}
      <Modal open={lgModal} onClose={()=>setLgModal(false)}
        title={editIdx!==null ? 'Modifier une dépense' : 'Ajouter une dépense'}
        icon={FolderOpen}
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setLgModal(false)}>
            Annuler
          </button>
          <button className="btn btn-success" onClick={saveLg}>
            Enregistrer
          </button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-control"
              {...lgMethods.register('date')}/>
          </div>
          <div className="form-group col-span-2">
            <label className="form-label">
              Description <span className="form-req">*</span>
            </label>
            <input className="form-control"
              placeholder="Ex: Hébergements 4 nuits..."
              {...lgMethods.register('description',{required:true})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Prestataire</label>
            <ChampPrestataire form={lgMethods} name="prestataire" champMontant="montant"/>
          </div>
          <div className="form-group">
            <label className="form-label">
              Montant (€) <span className="form-req">*</span>
            </label>
            <input type="number" step="0.01" className="form-control"
              placeholder="0.00"
              {...lgMethods.register('montant',{required:true,min:0})}/>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────
export default function Cloture() {
  const { data: pcs = [], isLoading, error, refetch } = useProgrammeClients()
  const [curPC, setCurPC]   = useState(null)
  const [search, setSearch] = useState('')

  const eligible = pcs.filter(p => p.a_facture_pro)
  const filtered  = eligible.filter(p =>
    !search || (p.client_nom||'').toLowerCase().includes(search.toLowerCase())
  )

  if (curPC) return (
    <Layout breadcrumb={['SITRAC','Finance','Dossier Finance','Clôture']}>
      <ClotureForm pc={curPC} onBack={()=>setCurPC(null)}/>
    </Layout>
  )

  return (
    <Layout breadcrumb={['SITRAC','Finance','Dossier Finance','Clôture']}>
      <div className="mb-5">
        <h1 className="page-title">
          <FolderOpen size={22} className="text-orange"/> Clôture
        </h1>
        <p className="page-sub">Clôture financière des dossiers clients</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={FolderOpen} value={eligible.length}
          label="Dossiers éligibles"  color="orange"/>
        <StatCard icon={FolderOpen} value={pcs.length}
          label="Total dossiers"       color="blue"/>
        <StatCard icon={FolderOpen} value={eligible.length}
          label="Avec Facture Pro"     color="green"/>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
            Choisir un dossier à clôturer
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
                  <th>Prix vente (€)</th><th className="text-center">Clôture</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400">
                      Aucun dossier éligible (Facture Pro requise)
                    </td>
                  </tr>
                ) : filtered.map(p=>(
                  <tr key={p.id}>
                    <td>
                      <strong className="text-gray-900 dark:text-white">
                        {p.client_nom}
                      </strong>
                    </td>
                    <td><Badge variant="info">{p.programme_nom}</Badge></td>
                    <td>{p.nb_pax}</td>
                    <td>
                      <strong>{(+p.prix_vente).toLocaleString('fr-FR')} €</strong>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-primary btn-sm"
                        onClick={()=>setCurPC(p)}>
                        <FolderOpen size={13}/> Clôturer
                      </button>
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