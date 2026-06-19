import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { User, Plus, Pencil, Trash2, Users, FileText, Printer } from 'lucide-react'
import { useClients, useClientMutations } from '../../hooks/useApi'
import { useConfirm } from '../../hooks/useConfirm'
import Layout from '../../components/Layout/Layout'
import { Modal, StatCard, Pagination, SearchInput, Badge, Alert } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate } from '../../utils/storage'

const TITRES = ['Monsieur','Madame','Mademoiselle']
const TYPES  = ['Individuel','Mini-groupe','Groupe','Famille']
const NATIOS = ['Française','Malgache','Belge','Allemande','Américaine','Italienne','Anglaise','Espagnole','Autre']
const TABS   = [
  { key:'civil',    label:'État Civil'   },
  { key:'vol',      label:'Vols'         },
  { key:'contacts', label:'Contacts'     },
  { key:'groupe',   label:'Groupe'       },
]

// ─── Composant PDF GI ─────────────────────────────────────────
function GIPrintModal({ client, open, onClose }) {
  const printRef = useRef()

  const handlePrint = () => {
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8"/>
        <title>GI — ${client?.titre} ${client?.nom}</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; background:#fff; }
          .page { width:210mm; min-height:297mm; padding:12mm 14mm; margin:0 auto; }

          /* En-tête */
          .header { display:flex; align-items:center; justify-content:space-between; padding-bottom:10px; border-bottom:3px solid #F5A623; margin-bottom:14px; }
          .header-left { display:flex; align-items:center; gap:12px; }
          .logo-box { width:50px; height:50px; background:#F5A623; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:14px; color:white; letter-spacing:1px; }
          .company-name { font-size:18px; font-weight:900; color:#F5A623; letter-spacing:2px; }
          .company-sub  { font-size:9px; color:#666; margin-top:2px; }
          .doc-title { text-align:right; }
          .doc-title h2 { font-size:16px; font-weight:900; color:#1a1a1a; text-transform:uppercase; letter-spacing:1px; }
          .doc-title .doc-ref { font-size:9px; color:#888; margin-top:3px; }

          /* Bannière client */
          .client-banner { background:#1a1a1a; color:white; padding:8px 14px; border-radius:6px; margin-bottom:14px; display:flex; align-items:center; justify-content:space-between; }
          .client-banner .name { font-size:14px; font-weight:900; }
          .client-banner .type { font-size:10px; background:#F5A623; color:#1a1a1a; padding:2px 8px; border-radius:20px; font-weight:700; }

          /* Sections */
          .section { margin-bottom:14px; break-inside:avoid; }
          .section-title { font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:1px; color:#F5A623; border-bottom:1px solid #F5A623; padding-bottom:3px; margin-bottom:8px; }

          /* Grid infos */
          .grid { display:grid; gap:6px 16px; }
          .grid-2 { grid-template-columns:1fr 1fr; }
          .grid-3 { grid-template-columns:1fr 1fr 1fr; }
          .grid-4 { grid-template-columns:1fr 1fr 1fr 1fr; }
          .field { }
          .field-label { font-size:8px; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
          .field-value { font-size:10px; font-weight:600; color:#1a1a1a; border-bottom:1px solid #e5e5e5; padding-bottom:2px; min-height:14px; }
          .field-value.empty { color:#ccc; font-style:italic; font-weight:400; }

          /* Vols */
          .vol-block { border:1px solid #e5e5e5; border-radius:6px; padding:8px; margin-bottom:8px; }
          .vol-block .vol-header { font-size:9px; font-weight:700; color:#fff; background:#1a1a1a; padding:3px 8px; border-radius:4px; margin-bottom:6px; display:inline-block; }
          .vol-block.retour .vol-header { background:#F5A623; color:#1a1a1a; }

          /* Table PAX */
          table { width:100%; border-collapse:collapse; font-size:10px; }
          table thead tr { background:#1a1a1a; color:white; }
          table thead th { padding:5px 8px; text-align:left; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
          table tbody tr:nth-child(even) { background:#f9f9f9; }
          table tbody tr:nth-child(odd)  { background:#ffffff; }
          table tbody td { padding:5px 8px; border-bottom:1px solid #f0f0f0; }
          table tfoot tr { background:#F5A623; color:#1a1a1a; font-weight:700; }
          table tfoot td { padding:5px 8px; font-size:10px; }

          /* Signature */
          .signature-block { display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; margin-top:20px; padding-top:14px; border-top:2px solid #F5A623; }
          .sig-box { text-align:center; }
          .sig-line { border-bottom:1px solid #1a1a1a; margin-bottom:6px; height:35px; }
          .sig-label { font-size:8px; color:#666; text-transform:uppercase; letter-spacing:0.5px; }

          /* Footer */
          .footer { text-align:center; font-size:8px; color:#aaa; margin-top:20px; padding-top:8px; border-top:1px solid #eee; }
          .badge { display:inline-block; padding:1px 6px; border-radius:10px; font-size:8px; font-weight:700; }
          .badge-orange { background:#fff3e0; color:#e65100; }
          .badge-green  { background:#e8f5e9; color:#1b5e20; }

          @media print {
            body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
            .page { padding:8mm 10mm; }
          }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `)
    win.document.close()
    win.onload = () => { win.focus(); win.print() }
  }

  if (!client) return null

  const paxList  = client.pax || []
  const today    = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })
  const refDoc   = `GI-${String(client.id).padStart(4,'0')}-${new Date().getFullYear()}`
  const totalPax = (client.nb_pax || 1)

  return (
    <Modal open={open} onClose={onClose} size="xl"
      title={`Fiche GI — ${client.titre} ${client.nom}`} icon={FileText}
      footer={
        <div className="flex gap-3">
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={14}/> Imprimer / Enregistrer PDF
          </button>
        </div>
      }>

      {/* Aperçu du document */}
      <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 overflow-auto max-h-[70vh]">
        <div ref={printRef}>
          <div className="page" style={{background:'white', width:'100%', maxWidth:'794px', margin:'0 auto', padding:'24px 32px', fontFamily:'Arial,sans-serif', fontSize:'11px', color:'#1a1a1a'}}>

            {/* En-tête */}
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:'10px', borderBottom:'3px solid #F5A623', marginBottom:'14px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <div style={{width:'50px', height:'50px', background:'#F5A623', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', fontSize:'13px', color:'white', letterSpacing:'1px'}}>
                  RT
                </div>
                <div>
                  <div style={{fontSize:'18px', fontWeight:'900', color:'#F5A623', letterSpacing:'2px'}}>SITRAC</div>
                  <div style={{fontSize:'9px', color:'#666', marginTop:'2px'}}>Ramartour Madagascar</div>
                  <div style={{fontSize:'8px', color:'#999'}}>Système de Traitement des Relations Clients</div>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'16px', fontWeight:'900', color:'#1a1a1a', textTransform:'uppercase', letterSpacing:'1px'}}>
                  Informations Générales
                </div>
                <div style={{fontSize:'9px', color:'#888', marginTop:'3px'}}>Réf. : {refDoc}</div>
                <div style={{fontSize:'9px', color:'#888'}}>Date : {today}</div>
              </div>
            </div>

            {/* Bannière client */}
            <div style={{background:'#1a1a1a', color:'white', padding:'8px 14px', borderRadius:'6px', marginBottom:'14px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:'15px', fontWeight:'900'}}>{client.titre} {client.nom}</div>
                <div style={{fontSize:'9px', color:'#ccc', marginTop:'2px'}}>Nationalité : {client.nationalite || '—'}</div>
              </div>
              <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                <span style={{background:'#F5A623', color:'#1a1a1a', padding:'3px 10px', borderRadius:'20px', fontWeight:'700', fontSize:'10px'}}>
                  {client.type_groupe || 'Individuel'}
                </span>
                <span style={{background:'#333', color:'white', padding:'3px 10px', borderRadius:'20px', fontWeight:'700', fontSize:'10px'}}>
                  {totalPax} PAX
                </span>
              </div>
            </div>

            {/* SECTION 1 : État Civil */}
            <div style={{marginBottom:'14px'}}>
              <div style={{fontSize:'10px', fontWeight:'900', textTransform:'uppercase', letterSpacing:'1px', color:'#F5A623', borderBottom:'1px solid #F5A623', paddingBottom:'3px', marginBottom:'8px'}}>
                1. État Civil
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'6px 16px'}}>
                {[
                  ['Titre',           client.titre],
                  ['Nom complet',     client.nom],
                  ['Nationalité',     client.nationalite],
                  ['Date naissance',  client.date_naissance ? fmtDate(client.date_naissance) : '—'],
                  ['N° Passeport/CIN',client.num_document],
                  ['Adresse',         client.adresse],
                  ['Code Postal',     client.code_postal],
                  ['Ville',           client.ville],
                  ['Pays',            client.pays],
                  ['N° Ass. Voyage',  client.assurance_voyage],
                  ['N° Ass. Santé',   client.assurance_sante],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{fontSize:'8px', color:'#888', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'2px'}}>{label}</div>
                    <div style={{fontSize:'10px', fontWeight:'600', borderBottom:'1px solid #e5e5e5', paddingBottom:'2px', minHeight:'14px', color: value ? '#1a1a1a' : '#ccc', fontStyle: value ? 'normal' : 'italic'}}>
                      {value || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2 : Contacts & Urgence */}
            <div style={{marginBottom:'14px'}}>
              <div style={{fontSize:'10px', fontWeight:'900', textTransform:'uppercase', letterSpacing:'1px', color:'#F5A623', borderBottom:'1px solid #F5A623', paddingBottom:'3px', marginBottom:'8px'}}>
                2. Contacts &amp; Urgence
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'6px 16px'}}>
                {[
                  ['Téléphone',          client.telephone],
                  ['Email',              client.email],
                  ['Observation méd.',   client.observation_med],
                  ['Contact urgence',    client.urgence_nom],
                  ['Tél. urgence',       client.urgence_tel],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{fontSize:'8px', color:'#888', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'2px'}}>{label}</div>
                    <div style={{fontSize:'10px', fontWeight:'600', borderBottom:'1px solid #e5e5e5', paddingBottom:'2px', minHeight:'14px', color: value ? '#1a1a1a' : '#ccc', fontStyle: value ? 'normal' : 'italic'}}>
                      {value || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3 : Informations de Vol */}
            <div style={{marginBottom:'14px'}}>
              <div style={{fontSize:'10px', fontWeight:'900', textTransform:'uppercase', letterSpacing:'1px', color:'#F5A623', borderBottom:'1px solid #F5A623', paddingBottom:'3px', marginBottom:'8px'}}>
                3. Informations de Vol
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                {/* Vol Arrivée */}
                <div style={{border:'1px solid #e5e5e5', borderRadius:'6px', padding:'8px'}}>
                  <div style={{fontSize:'9px', fontWeight:'700', color:'#fff', background:'#27AE60', padding:'3px 8px', borderRadius:'4px', marginBottom:'6px', display:'inline-block'}}>
                    ✈️ Vol d'Arrivée
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px 10px'}}>
                    {[
                      ['Départ de',   client.vol_arr_dep],
                      ['Destination', client.vol_arr_dest],
                      ['Date',        client.vol_arr_date ? fmtDate(client.vol_arr_date) : '—'],
                      ['Compagnie',   client.vol_arr_cie],
                    ].map(([l,v])=>(
                      <div key={l}>
                        <div style={{fontSize:'8px', color:'#888', textTransform:'uppercase'}}>{l}</div>
                        <div style={{fontSize:'10px', fontWeight:'600', borderBottom:'1px solid #eee', paddingBottom:'2px', minHeight:'13px'}}>{v||'—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Vol Départ */}
                <div style={{border:'1px solid #e5e5e5', borderRadius:'6px', padding:'8px'}}>
                  <div style={{fontSize:'9px', fontWeight:'700', color:'#1a1a1a', background:'#F5A623', padding:'3px 8px', borderRadius:'4px', marginBottom:'6px', display:'inline-block'}}>
                    🛫 Vol de Départ
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px 10px'}}>
                    {[
                      ['Départ de',   client.vol_dep_dep],
                      ['Destination', client.vol_dep_dest],
                      ['Date',        client.vol_dep_date ? fmtDate(client.vol_dep_date) : '—'],
                      ['Compagnie',   client.vol_dep_cie],
                    ].map(([l,v])=>(
                      <div key={l}>
                        <div style={{fontSize:'8px', color:'#888', textTransform:'uppercase'}}>{l}</div>
                        <div style={{fontSize:'10px', fontWeight:'600', borderBottom:'1px solid #eee', paddingBottom:'2px', minHeight:'13px'}}>{v||'—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4 : Liste des PAX */}
            {paxList.length > 0 && (
              <div style={{marginBottom:'14px'}}>
                <div style={{fontSize:'10px', fontWeight:'900', textTransform:'uppercase', letterSpacing:'1px', color:'#F5A623', borderBottom:'1px solid #F5A623', paddingBottom:'3px', marginBottom:'8px'}}>
                  4. Participants (PAX) — {paxList.length} participant{paxList.length>1?'s':''} + 1 leader
                </div>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:'10px'}}>
                  <thead>
                    <tr style={{background:'#1a1a1a', color:'white'}}>
                      {['#','Titre','Nom complet','Nationalité','N° Passeport/CIN','Téléphone','Email'].map(h=>(
                        <th key={h} style={{padding:'5px 7px', textAlign:'left', fontSize:'8px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Leader */}
                    <tr style={{background:'#fff8e1'}}>
                      <td style={{padding:'5px 7px', fontWeight:'700', color:'#e65100'}}>L</td>
                      <td style={{padding:'5px 7px'}}>{client.titre}</td>
                      <td style={{padding:'5px 7px', fontWeight:'700'}}>{client.nom} <span style={{fontSize:'8px', color:'#F5A623', fontWeight:'700'}}>(LEADER)</span></td>
                      <td style={{padding:'5px 7px'}}>{client.nationalite||'—'}</td>
                      <td style={{padding:'5px 7px', fontFamily:'monospace'}}>{client.num_document||'—'}</td>
                      <td style={{padding:'5px 7px'}}>{client.telephone||'—'}</td>
                      <td style={{padding:'5px 7px', fontSize:'9px'}}>{client.email||'—'}</td>
                    </tr>
                    {/* PAX */}
                    {paxList.map((p, i) => (
                      <tr key={p.id||i} style={{background: i%2===0 ? '#f9f9f9' : '#ffffff'}}>
                        <td style={{padding:'5px 7px', color:'#888'}}>{i+1}</td>
                        <td style={{padding:'5px 7px'}}>{p.titre}</td>
                        <td style={{padding:'5px 7px', fontWeight:'600'}}>{p.nom}</td>
                        <td style={{padding:'5px 7px'}}>{p.nationalite||'—'}</td>
                        <td style={{padding:'5px 7px', fontFamily:'monospace'}}>{p.num_document||'—'}</td>
                        <td style={{padding:'5px 7px'}}>{p.telephone||'—'}</td>
                        <td style={{padding:'5px 7px', fontSize:'9px'}}>{p.email||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{background:'#F5A623', color:'#1a1a1a'}}>
                      <td colSpan={7} style={{padding:'5px 7px', fontWeight:'700', fontSize:'10px'}}>
                        Total : {totalPax} PAX (1 leader + {paxList.length} participant{paxList.length>1?'s':''})
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Signature */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px', marginTop:'20px', paddingTop:'14px', borderTop:'2px solid #F5A623'}}>
              {['Responsable Sales','Responsable Booking','Client Leader'].map(sig => (
                <div key={sig} style={{textAlign:'center'}}>
                  <div style={{borderBottom:'1px solid #1a1a1a', marginBottom:'6px', height:'35px'}}></div>
                  <div style={{fontSize:'8px', color:'#666', textTransform:'uppercase', letterSpacing:'0.5px'}}>{sig}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{textAlign:'center', fontSize:'8px', color:'#aaa', marginTop:'16px', paddingTop:'8px', borderTop:'1px solid #eee'}}>
              SITRAC — Ramartour Madagascar &nbsp;|&nbsp; Document généré le {today} &nbsp;|&nbsp; Réf. {refDoc}
              <br/>Ce document est confidentiel et destiné exclusivement à l'usage interne de Ramartour Madagascar.
            </div>

          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── Page principale ──────────────────────────────────────────
export default function InformationsGenerales() {
  const { data: clients = [], isLoading, error, refetch } = useClients()
  const { create, update, remove, addPax, delPax } = useClientMutations()
  const { confirmDelete, confirmSave } = useConfirm()

  const [search,   setSearch]   = useState('')
  const [fNat,     setFNat]     = useState('')
  const [fType,    setFType]    = useState('')
  const [page,     setPage]     = useState(1)
  const PER = 8

  const [leaderModal,  setLeaderModal]  = useState(false)
  const [leaderTab,    setLeaderTab]    = useState('civil')
  const [editLeader,   setEditLeader]   = useState(null)
  const [paxListModal, setPaxListModal] = useState(false)
  const [paxModal,     setPaxModal]     = useState(false)
  const [curLeaderId,  setCurLeaderId]  = useState(null)
  const [printClient,  setPrintClient]  = useState(null)  // ← nouveau

  const { register: regL, handleSubmit: subL, reset: resetL } = useForm()
  const { register: regP, handleSubmit: subP, reset: resetP } = useForm()

  const filtered  = clients.filter(c =>
    (!search || c.nom.toLowerCase().includes(search.toLowerCase())) &&
    (!fNat   || c.nationalite === fNat) &&
    (!fType  || c.type_groupe === fType)
  )
  const paginated = filtered.slice((page-1)*PER, page*PER)

  const openAddLeader = () => {
    setEditLeader(null); setLeaderTab('civil')
    resetL({ titre:'Monsieur', nom:'', nationalite:'', date_naissance:'', num_document:'',
             adresse:'', code_postal:'', ville:'', pays:'', telephone:'', email:'',
             assurance_voyage:'', assurance_sante:'', urgence_nom:'', urgence_tel:'', observation_med:'',
             vol_arr_dep:'', vol_arr_dest:'', vol_arr_date:'', vol_arr_cie:'',
             vol_dep_dep:'', vol_dep_dest:'', vol_dep_date:'', vol_dep_cie:'',
             type_groupe:'Individuel', nb_pax:1 })
    setLeaderModal(true)
  }
  const openEditLeader = (c) => {
    setEditLeader(c); setLeaderTab('civil')
    resetL({ titre:c.titre||'Monsieur', nom:c.nom||'', nationalite:c.nationalite||'',
             date_naissance:c.date_naissance||'', num_document:c.num_document||'',
             adresse:c.adresse||'', code_postal:c.code_postal||'', ville:c.ville||'', pays:c.pays||'',
             telephone:c.telephone||'', email:c.email||'',
             assurance_voyage:c.assurance_voyage||'', assurance_sante:c.assurance_sante||'',
             urgence_nom:c.urgence_nom||'', urgence_tel:c.urgence_tel||'', observation_med:c.observation_med||'',
             vol_arr_dep:c.vol_arr_dep||'', vol_arr_dest:c.vol_arr_dest||'',
             vol_arr_date:c.vol_arr_date||'', vol_arr_cie:c.vol_arr_cie||'',
             vol_dep_dep:c.vol_dep_dep||'', vol_dep_dest:c.vol_dep_dest||'',
             vol_dep_date:c.vol_dep_date||'', vol_dep_cie:c.vol_dep_cie||'',
             type_groupe:c.type_groupe||'Individuel', nb_pax:c.nb_pax||1 })
    setLeaderModal(true)
  }

  const saveLeader = (data) => {
    const payload = { ...data, nb_pax: +data.nb_pax || 1 }
    const doSave  = () => {
      const opts = { onSuccess: () => setLeaderModal(false) }
      if (editLeader) update.mutate({ id: editLeader.id, data: payload }, opts)
      else            create.mutate(payload, opts)
    }
    if (editLeader) confirmSave(doSave); else doSave()
  }

  const openPaxList = (id) => { setCurLeaderId(id); setPaxListModal(true) }
  const openAddPax  = () => {
    resetP({ titre:'Monsieur', nom:'', nationalite:'', date_naissance:'', num_document:'',
             adresse:'', ville:'', telephone:'', email:'', observation_med:'' })
    setPaxModal(true)
  }
  const savePax = (data) => {
    addPax.mutate({ clientId: curLeaderId, data }, {
      onSuccess: () => setPaxModal(false)
    })
  }

  const curLeader = clients.find(c => c.id === curLeaderId)

  return (
    <Layout breadcrumb={['SITRAC','Sales','Dossier Client','Informations Générales']}>
      <div className="mb-5">
        <h1 className="page-title"><User size={22} className="text-orange"/> Informations Générales (GI)</h1>
        <p className="page-sub">Gestion des clients leaders et leurs participants (RG 07, 08)</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} value={clients.length}                                   label="Total clients"  color="orange"/>
        <StatCard icon={User}  value={clients.filter(c=>c.type_groupe==='Individuel').length} label="Individuels" color="green"/>
        <StatCard icon={Users} value={clients.filter(c=>c.type_groupe==='Groupe').length}  label="Groupes"      color="blue"/>
        <StatCard icon={Users} value={clients.reduce((s,c)=>s+(c.nb_pax||1),0)}           label="Total PAX"     color="purple"/>
      </div>

      {/* Filtres */}
      <div className="card mb-5">
        <div className="card-header"><h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Filtres</h3></div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SearchInput value={search} onChange={v=>{setSearch(v);setPage(1)}} placeholder="Rechercher un client..."/>
            <select className="form-control py-2 text-sm" value={fNat} onChange={e=>{setFNat(e.target.value);setPage(1)}}>
              <option value="">Toutes nationalités</option>
              {NATIOS.map(n=><option key={n}>{n}</option>)}
            </select>
            <select className="form-control py-2 text-sm" value={fType} onChange={e=>{setFType(e.target.value);setPage(1)}}>
              <option value="">Tous types</option>
              {TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={()=>{setSearch('');setFNat('');setFType('');setPage(1)}}>
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <User size={15} className="text-orange"/> Clients Leaders
          </h3>
          <button className="btn btn-primary btn-sm" onClick={openAddLeader}><Plus size={14}/> Ajouter</button>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement des clients...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nom</th><th>PAX</th><th>Nationalité</th>
                  <th>Téléphone</th><th>Email</th><th>Type</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400">Aucun client</td></tr>
                ) : paginated.map(c => (
                  <tr key={c.id}>
                    <td><strong className="text-gray-900 dark:text-white">{c.titre} {c.nom}</strong></td>
                    <td><Badge variant="info">{c.nb_pax||1}</Badge></td>
                    <td className="text-sm">{c.nationalite}</td>
                    <td className="text-xs text-gray-500">{c.telephone||'—'}</td>
                    <td className="text-xs text-gray-500 max-w-[140px] truncate">{c.email||'—'}</td>
                    <td><Badge variant="pending">{c.type_groupe}</Badge></td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        {/* Modifier */}
                        <button className="btn btn-ghost btn-xs" onClick={()=>openEditLeader(c)} title="Modifier">
                          <Pencil size={12}/>
                        </button>
                        {/* PAX */}
                        <button className="btn btn-info btn-xs" onClick={()=>openPaxList(c.id)} title="Gérer PAX">
                          <Users size={12}/>
                        </button>
                        {/* PDF GI ← nouveau bouton */}
                        <button
                          className="btn btn-xs"
                          style={{background:'#1a1a1a', color:'white'}}
                          onClick={()=>setPrintClient(c)}
                          title="Imprimer Fiche GI"
                        >
                          <FileText size={12}/>
                        </button>
                        {/* Supprimer */}
                        <button className="btn btn-danger btn-xs"
                          onClick={()=>confirmDelete(c.nom, ()=>remove.mutate(c.id))}
                          title="Supprimer">
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage}/>
        </ApiState>
      </div>

      {/* ── Modal PDF GI ── */}
      <GIPrintModal
        client={printClient}
        open={!!printClient}
        onClose={()=>setPrintClient(null)}
      />

      {/* ── Modal Ajout/Modification Leader ── */}
      <Modal open={leaderModal} onClose={()=>setLeaderModal(false)}
        title={editLeader?'Modifier un Client Leader':'Ajouter un Client Leader'} icon={User} size="lg"
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setLeaderModal(false)}>Annuler</button>
          <button className="btn btn-success" onClick={subL(saveLeader)}
            disabled={create.isPending||update.isPending}>
            {create.isPending||update.isPending?'Enregistrement...':'Enregistrer'}
          </button>
        </>}
      >
        {/* Onglets */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-5 overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setLeaderTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors
                ${leaderTab===t.key?'border-orange text-orange':'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {leaderTab==='civil' && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="form-label">Titre</label><select className="form-control" {...regL('titre')}>{TITRES.map(t=><option key={t}>{t}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Nom <span className="form-req">*</span></label><input className="form-control" {...regL('nom',{required:true})}/></div>
              <div className="form-group"><label className="form-label">Nationalité <span className="form-req">*</span></label><input className="form-control" {...regL('nationalite',{required:true})}/></div>
              <div className="form-group"><label className="form-label">Date de naissance</label><input type="date" className="form-control" {...regL('date_naissance')}/></div>
              <div className="form-group"><label className="form-label">N° Passeport / CIN</label><input className="form-control" {...regL('num_document')}/></div>
              <div className="form-group"><label className="form-label">Adresse</label><input className="form-control" {...regL('adresse')}/></div>
              <div className="form-group"><label className="form-label">Code Postal</label><input className="form-control" {...regL('code_postal')}/></div>
              <div className="form-group"><label className="form-label">Ville</label><input className="form-control" {...regL('ville')}/></div>
            </div>
            <div className="form-group"><label className="form-label">Pays</label><input className="form-control" {...regL('pays')}/></div>
          </div>
        )}

        {leaderTab==='vol' && (
          <div>
            <Alert type="info">ℹ️ Informations de vol communes pour tout le groupe.</Alert>
            <p className="font-semibold text-sm text-brand-green mb-3 mt-2">✈️ Vol d'Arrivée</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="form-label">Départ de</label><input className="form-control" {...regL('vol_arr_dep')}/></div>
              <div className="form-group"><label className="form-label">Destination</label><input className="form-control" {...regL('vol_arr_dest')}/></div>
              <div className="form-group"><label className="form-label">Date d'arrivée</label><input type="date" className="form-control" {...regL('vol_arr_date')}/></div>
              <div className="form-group"><label className="form-label">Compagnie</label><input className="form-control" placeholder="Air Madagascar..." {...regL('vol_arr_cie')}/></div>
            </div>
            <p className="font-semibold text-sm text-orange mb-3 mt-4">🛫 Vol de Départ</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="form-label">Départ de</label><input className="form-control" {...regL('vol_dep_dep')}/></div>
              <div className="form-group"><label className="form-label">Destination</label><input className="form-control" {...regL('vol_dep_dest')}/></div>
              <div className="form-group"><label className="form-label">Date de départ</label><input type="date" className="form-control" {...regL('vol_dep_date')}/></div>
              <div className="form-group"><label className="form-label">Compagnie</label><input className="form-control" {...regL('vol_dep_cie')}/></div>
            </div>
          </div>
        )}

        {leaderTab==='contacts' && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="form-label">Téléphone</label><input className="form-control" placeholder="+261..." {...regL('telephone')}/></div>
              <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-control" {...regL('email')}/></div>
              <div className="form-group"><label className="form-label">N° Assurance Voyage</label><input className="form-control" {...regL('assurance_voyage')}/></div>
              <div className="form-group"><label className="form-label">N° Assurance Santé</label><input className="form-control" {...regL('assurance_sante')}/></div>
              <div className="form-group"><label className="form-label">Contact Urgence (Nom)</label><input className="form-control" {...regL('urgence_nom')}/></div>
              <div className="form-group"><label className="form-label">Contact Urgence (Tél)</label><input className="form-control" {...regL('urgence_tel')}/></div>
            </div>
            <div className="form-group"><label className="form-label">Observation médicale</label><textarea className="form-control" rows={3} {...regL('observation_med')}/></div>
          </div>
        )}

        {leaderTab==='groupe' && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="form-label">Type de groupe <span className="form-req">*</span></label><select className="form-control" {...regL('type_groupe')}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Nb PAX (avec leader) <span className="form-req">*</span></label><input type="number" className="form-control" min={1} {...regL('nb_pax',{required:true,min:1})}/></div>
            </div>
            <Alert type="warning">⚠️ Le leader est inclus dans le nombre PAX. Les autres participants se gèrent via le bouton PAX.</Alert>
          </div>
        )}
      </Modal>

      {/* ── Modal PAX List ── */}
      <Modal open={paxListModal} onClose={()=>setPaxListModal(false)}
        title={`PAX — ${curLeader?.nom||''}`} icon={Users} size="lg"
        footer={<>
          <button className="btn btn-primary" onClick={openAddPax}><Plus size={14}/> Ajouter un PAX</button>
          <button className="btn btn-ghost" onClick={()=>setPaxListModal(false)}>Fermer</button>
        </>}
      >
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Nom</th><th>Nationalité</th><th>Téléphone</th><th>Email</th><th>Passeport</th><th className="text-center">Sup.</th></tr></thead>
            <tbody>
              {!curLeader?.pax?.length
                ? <tr><td colSpan={6} className="py-8 text-center text-gray-400">Aucun participant PAX</td></tr>
                : curLeader.pax.map(p=>(
                  <tr key={p.id}>
                    <td><strong>{p.titre} {p.nom}</strong></td>
                    <td>{p.nationalite}</td>
                    <td className="text-xs text-gray-500">{p.telephone||'—'}</td>
                    <td className="text-xs text-gray-500">{p.email||'—'}</td>
                    <td className="text-xs text-gray-400">{p.num_document||'—'}</td>
                    <td className="text-center">
                      <button className="btn btn-danger btn-xs"
                        onClick={()=>confirmDelete(`${p.titre} ${p.nom}`,()=>delPax.mutate({clientId:curLeaderId,paxId:p.id}))}>
                        <Trash2 size={11}/>
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ── Modal Add PAX ── */}
      <Modal open={paxModal} onClose={()=>setPaxModal(false)} title="Ajouter un PAX" icon={User}
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setPaxModal(false)}>Annuler</button>
          <button className="btn btn-success" onClick={subP(savePax)} disabled={addPax.isPending}>
            {addPax.isPending?'Enregistrement...':'Enregistrer'}
          </button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="form-label">Titre</label><select className="form-control" {...regP('titre')}>{TITRES.map(t=><option key={t}>{t}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Nom <span className="form-req">*</span></label><input className="form-control" {...regP('nom',{required:true})}/></div>
          <div className="form-group"><label className="form-label">Nationalité <span className="form-req">*</span></label><input className="form-control" {...regP('nationalite',{required:true})}/></div>
          <div className="form-group"><label className="form-label">Date de naissance</label><input type="date" className="form-control" {...regP('date_naissance')}/></div>
          <div className="form-group"><label className="form-label">N° Passeport / CIN</label><input className="form-control" {...regP('num_document')}/></div>
          <div className="form-group"><label className="form-label">Téléphone</label><input className="form-control" {...regP('telephone')}/></div>
        </div>
        <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-control" {...regP('email')}/></div>
      </Modal>
    </Layout>
  )
}