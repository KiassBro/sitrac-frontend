import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { FileCheck, Plus, Pencil, Trash2, ArrowLeft, Save, AlertCircle, Printer } from 'lucide-react'
import { useProgrammeClients } from '../../hooks/useApi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeAPI } from '../../utils/api'
import { useConfirm } from '../../hooks/useConfirm'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import { Modal, Badge, SearchInput, StatCard } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate, fmt, today } from '../../utils/storage'

// ─── Modal impression Facture Définitive ──────────────────────
function FactureDefPrintModal({ pc, fd, open, onClose }) {
  const printRef = useRef()

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=960,height=750')
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Facture Définitive — ${pc?.client_nom}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1a1a1a;background:#fff}
    .page{width:210mm;min-height:297mm;padding:14mm 16mm;margin:0 auto}
    .header{display:flex;align-items:center;justify-content:space-between;
            padding-bottom:12px;border-bottom:2px solid #1a1a1a;margin-bottom:16px}
    .co-name{font-size:20px;font-weight:900;color:#1a1a1a;letter-spacing:1px}
    .co-sub{font-size:9px;color:#555;margin-top:3px}
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

  if (!pc || !fd) return null

  const today_str = new Date().toLocaleDateString('fr-FR',
    { day: '2-digit', month: 'long', year: 'numeric' })
  const refDoc   = `FD-${String(pc.id).padStart(4, '0')}-${new Date().getFullYear()}`
  const lignes   = fd.lignes || []
  const totalHT  = lignes.reduce((s, l) => s + (+l.nombre||1) * (+l.prix_unitaire||0), 0)
  const totalTTC = totalHT - (+fd.remise||0)

  const FRow = ({ label, value }) => (
    <div>
      <div style={{fontSize:'7.5px',color:'#888',textTransform:'uppercase',
        letterSpacing:'.5px',marginBottom:'2px',fontWeight:'700'}}>{label}</div>
      <div style={{fontSize:'11px',fontWeight:'600',color:'#1a1a1a'}}>{value || '—'}</div>
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} size="xl"
      title={`Facture Définitive — ${pc.client_nom}`} icon={FileCheck}
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
                  Facture Définitive
                </div>
                <div style={{fontSize:'9px',color:'#555',marginTop:'5px'}}>
                  Réf. : <strong>{refDoc}</strong>
                </div>
                <div style={{fontSize:'9px',color:'#555'}}>
                  Date : {fd.date_facture || today_str}
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
              <FRow label="Programme"  value={pc.programme_nom}/>
              <FRow label="Nb PAX"     value={pc.nb_pax}/>
              <FRow label="Date début" value={pc.date_debut ? fmtDate(pc.date_debut) : '—'}/>
              <FRow label="Date fin"   value={pc.date_fin   ? fmtDate(pc.date_fin)   : '—'}/>
            </div>

            {/* Titre */}
            <div style={{fontSize:'9px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1.5px',color:'#fff',background:'#1a1a1a',
              padding:'4px 10px',marginBottom:'8px',display:'inline-block'}}>
              Détail des Prestations Réalisées
            </div>

            {/* Table lignes */}
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
              {+fd.remise > 0 && (
                <div style={{display:'flex',justifyContent:'space-between',
                  padding:'7px 0',borderBottom:'1px solid #e8e8e8',
                  fontSize:'11px',color:'#888'}}>
                  <span>Remise accordée</span>
                  <span>
                    − {(+fd.remise).toLocaleString('fr-FR',
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
              <strong>Conditions de paiement :</strong> Paiement à réception
              de la présente facture.<br/>
              <strong>Note :</strong> Ce document est la facture définitive
              remplaçant la facture proforma initiale. Toute réclamation
              doit être formulée dans les 15 jours suivant la réception.
            </div>

            {/* Signatures */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'40px',
              marginTop:'30px',paddingTop:'14px',borderTop:'2px solid #1a1a1a'}}>
              {['Responsable Finance / Ramartour',
                'Client / Signature &amp; Cachet'].map(sig=>(
                <div key={sig} style={{textAlign:'center'}}>
                  <div style={{borderBottom:'1.5px solid #1a1a1a',
                    height:'40px',marginBottom:'6px'}}/>
                  <div style={{fontSize:'8px',color:'#555',textTransform:'uppercase',
                    letterSpacing:'.5px',fontWeight:'700'}}
                    dangerouslySetInnerHTML={{__html:sig}}/>
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

// ─── Formulaire Facture Définitive ────────────────────────────
function FactureDefForm({ pc, onBack }) {
  const qc = useQueryClient()
  const { confirmDelete, confirmSave } = useConfirm()
  const [lgModal,   setLgModal]   = useState(false)
  const [editIdx,   setEditIdx]   = useState(null)
  const [lignes,    setLignes]    = useState([])
  const [remise,    setRemise]    = useState(0)
  const [dateFac,   setDateFac]   = useState(today())
  const [inited,    setInited]    = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [printFD,   setPrintFD]   = useState(null)

  const lgMethods = useForm()

  const { data: fd, isLoading } = useQuery({
    queryKey: ['facture-def', pc.id],
    queryFn:  () => financeAPI.getFacturesDef(`?programme_client=${pc.id}`)
                    .then(r => (r.results||r)[0] || null),
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
    onSuccess: () => {
      qc.invalidateQueries(['facture-def', pc.id])
      qc.invalidateQueries(['pcs'])
      toast.success('Facture Définitive enregistrée')
      onBack()
    },
    onError: e => toast.error(e.message),
  })

  const totalHT  = lignes.reduce((s,l) => s + (+l.nombre||1)*(+l.prix_unitaire||0), 0)
  const totalTTC = totalHT - (+remise||0)

  const openAdd  = () => {
    setEditIdx(null)
    lgMethods.reset({ date:'', service:'', nombre:1, prix_unitaire:'' })
    setLgModal(true)
  }
  const openEdit = (i) => {
    setEditIdx(i)
    lgMethods.reset({...lignes[i]})
    setLgModal(true)
  }
  const saveLg = lgMethods.handleSubmit(data => {
    const lg = { ...data, nombre:+data.nombre||1, prix_unitaire:+data.prix_unitaire||0 }
    setLignes(prev => editIdx!==null ? prev.map((l,i)=>i===editIdx?lg:l) : [...prev, lg])
    setLgModal(false)
    toast.success(editIdx!==null ? 'Ligne modifiée' : 'Ligne ajoutée')
  })

  const save = () => confirmSave(() => saveMut.mutate({
    programme_client: pc.id,
    date_facture:     dateFac,
    remise:           +remise || 0,
    lignes:           lignes.map((l, i) => ({ ...l, ordre: i })),
  }))

  const openPrint = () => {
    setPrintFD({
      date_facture: dateFac,
      remise:       remise,
      lignes:       lignes,
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
          <FileCheck size={20} className="text-orange"/>
          Facture Définitive — {pc.client_nom}
        </h1>
      </div>

      {/* Infos dossier */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
            Informations du dossier
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Date facture
            </label>
            <input type="date" className="form-control w-44 py-1.5 text-sm"
              value={dateFac} onChange={e=>setDateFac(e.target.value)}/>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
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
        </div>
      </div>

      {/* Lignes */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
            Lignes de Facturation
          </h3>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <Plus size={13}/> Ajouter une ligne
          </button>
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
                {lignes.length===0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Aucune ligne
                    </td>
                  </tr>
                ) : lignes.map((l,i)=>(
                  <tr key={i}>
                    <td>{fmtDate(l.date)}</td>
                    <td>
                      <strong className="text-gray-900 dark:text-white">
                        {l.service}
                      </strong>
                    </td>
                    <td>{l.nombre||1}</td>
                    <td>{fmt(l.prix_unitaire)}</td>
                    <td>
                      <strong className="text-brand-green">
                        {fmt((+l.nombre||1)*(+l.prix_unitaire||0))}
                      </strong>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-ghost btn-xs mr-1"
                        onClick={()=>openEdit(i)}>
                        <Pencil size={11}/>
                      </button>
                      <button className="btn btn-danger btn-xs"
                        onClick={()=>confirmDelete(`ligne ${i+1}`,
                          ()=>setLignes(p=>p.filter((_,j)=>j!==i)))}>
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
                className="form-control w-28 py-1 text-sm text-right"
                value={remise} onChange={e=>setRemise(e.target.value)}/>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-black text-base text-brand-green">
              <span>Total à Payer</span>
              <strong>{fmt(totalTTC)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="btn btn-ghost" onClick={onBack}>Annuler</button>
        {lignes.length > 0 && (
          <button className="btn btn-ghost btn-lg" onClick={openPrint}>
            <Printer size={15}/> Aperçu PDF
          </button>
        )}
        <button className="btn btn-success btn-lg" onClick={save}
          disabled={saveMut.isPending}>
          <Save size={15}/>
          {saveMut.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* Modal PDF */}
      <FactureDefPrintModal
        pc={pc}
        fd={printFD}
        open={printOpen}
        onClose={() => setPrintOpen(false)}
      />

      {/* Modal ligne */}
      <Modal open={lgModal} onClose={()=>setLgModal(false)}
        title={editIdx!==null ? 'Modifier une ligne' : 'Ajouter une ligne'}
        icon={FileCheck}
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
              Service / Description <span className="form-req">*</span>
            </label>
            <input className="form-control"
              placeholder="Description du service..."
              {...lgMethods.register('service',{required:true})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input type="number" min={1} defaultValue={1} className="form-control"
              {...lgMethods.register('nombre',{required:true,min:1})}/>
          </div>
          <div className="form-group">
            <label className="form-label">
              Prix unitaire (€) <span className="form-req">*</span>
            </label>
            <input type="number" step="0.01" className="form-control"
              placeholder="0.00"
              {...lgMethods.register('prix_unitaire',{required:true,min:0})}/>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────
export default function FactureDefinitive() {
  const { data: pcs = [], isLoading, error, refetch } = useProgrammeClients()
  const [curPC, setCurPC]   = useState(null)
  const [search, setSearch] = useState('')

  const eligible = pcs.filter(p => p.a_facture_pro)
  const filtered  = eligible.filter(p =>
    !search || (p.client_nom||'').toLowerCase().includes(search.toLowerCase())
  )

  if (curPC) return (
    <Layout breadcrumb={['SITRAC','Finance','Dossier Finance','Facture Définitive']}>
      <FactureDefForm pc={curPC} onBack={()=>setCurPC(null)}/>
    </Layout>
  )

  return (
    <Layout breadcrumb={['SITRAC','Finance','Dossier Finance','Facture Définitive']}>
      <div className="mb-5">
        <h1 className="page-title">
          <FileCheck size={22} className="text-orange"/> Facture Définitive
        </h1>
        <p className="page-sub">
          Factures définitives remplaçant les factures proforma (RG 22, 27)
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={FileCheck} value={eligible.length}
          label="Dossiers éligibles" color="orange"/>
        <StatCard icon={FileCheck} value={pcs.filter(p=>p.a_facture_pro).length}
          label="Avec Facture Pro" color="blue"/>
        <StatCard icon={FileCheck} value={pcs.length}
          label="Total dossiers" color="green"/>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
            Choisir un dossier
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
                  <th>Prix vente</th><th>Facture Pro</th>
                  <th className="text-center">Facture Déf.</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                      Aucun dossier éligible
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
                    <td>
                      {p.a_facture_pro
                        ? <Badge variant="active">✓</Badge>
                        : <Badge variant="inactive">Non</Badge>}
                    </td>
                    <td className="text-center">
                      {!p.a_facture_pro ? (
                        <span className="flex items-center justify-center gap-1 text-xs text-gray-400">
                          <AlertCircle size={12}/> FP requise
                        </span>
                      ) : (
                        <button className="btn btn-primary btn-sm"
                          onClick={()=>setCurPC(p)}>
                          <FileCheck size={13}/> Gérer
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