import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { User, Plus, Pencil, Trash2, Users, FileText, Printer } from 'lucide-react'
import { useClients, useClientMutations } from '../../hooks/useApi'
import { salesAPI } from '../../utils/api'
import { useConfirm } from '../../hooks/useConfirm'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import { Modal, StatCard, Pagination, SearchInput, Badge, Alert } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate } from '../../utils/storage'

const TITRES = ['Monsieur', 'Madame', 'Mademoiselle']
const TYPES  = ['Individuel', 'Mini-groupe', 'Groupe', 'Famille']
const NATIOS = ['Française','Malgache','Belge','Allemande','Américaine',
                'Italienne','Anglaise','Espagnole','Autre']
const TABS = [
  { key: 'civil',    label: 'État Civil'  },
  { key: 'vol',      label: 'Vols'        },
  { key: 'contacts', label: 'Contacts'    },
  { key: 'groupe',   label: 'Groupe'      },
]

const EMPTY = {
  titre: 'Monsieur', nom: '', nationalite: '',
  date_naissance: '', num_document: '',
  adresse: '', code_postal: '', ville: '', pays: '',
  telephone: '', email: '',
  assurance_voyage: '', assurance_sante: '',
  urgence_nom: '', urgence_tel: '', observation_med: '',
  vol_arr_dep: '', vol_arr_dest: '', vol_arr_date: '', vol_arr_cie: '',
  vol_dep_dep: '', vol_dep_dest: '', vol_dep_date: '', vol_dep_cie: '',
  type_groupe: 'Individuel', nb_pax: 1,
}

// SVG icônes inline pour le PDF (remplace les emojis)
const SVG_PLANE_ARR = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.6-.6 1.1l1.5 2.5c.2.4.7.5 1.1.3L8 8.5l-1 4.5-3 1.5c-.4.2-.5.7-.3 1.1l.8 1.4c.3.5.9.6 1.3.3L9 15l3.5 4.5c.3.4.8.5 1.2.3l2.5-1c.6-.2.8-.9.6-1.6z"/></svg>`
const SVG_PLANE_DEP = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.6-.6 1.1l1.5 2.5c.2.4.7.5 1.1.3L8 8.5l-1 4.5-3 1.5c-.4.2-.5.7-.3 1.1l.8 1.4c.3.5.9.6 1.3.3L9 15l3.5 4.5c.3.4.8.5 1.2.3l2.5-1c.6-.2.8-.9.6-1.6z"/></svg>`

// Logo SVG Ramartour Madagascar
const LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54">
  <rect width="54" height="54" rx="10" fill="#F5A623"/>
  <text x="27" y="22" text-anchor="middle" font-family="Arial,sans-serif"
        font-weight="900" font-size="11" fill="white" letter-spacing="1">RAMAR</text>
  <text x="27" y="34" text-anchor="middle" font-family="Arial,sans-serif"
        font-weight="900" font-size="11" fill="white" letter-spacing="1">TOUR</text>
  <text x="27" y="46" text-anchor="middle" font-family="Arial,sans-serif"
        font-weight="700" font-size="6.5" fill="rgba(255,255,255,0.85)" letter-spacing="0.5">MADAGASCAR</text>
  <!-- avion décoratif -->
  <path d="M18 27 L32 21 L34 23 L26 26 L28 31 L31 30 L32 32 L26 33 L24 29 L18 29 Z"
        fill="rgba(255,255,255,0.35)"/>
</svg>`

// ─── PDF GI ───────────────────────────────────────────────────
function GIPrintModal({ client, open, onClose }) {
  const printRef = useRef()

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=960,height=750')
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>GI — ${client?.titre} ${client?.nom}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1a1a1a;background:#fff}
    .page{width:210mm;min-height:297mm;padding:12mm 15mm;margin:0 auto}
    .header{display:flex;align-items:center;justify-content:space-between;
            padding-bottom:10px;border-bottom:3px solid #F5A623;margin-bottom:14px}
    .logo-area{display:flex;align-items:center;gap:10px}
    .logo-img{width:58px;height:58px;object-fit:contain;border-radius:6px}
    .company-name{font-size:20px;font-weight:900;color:#F5A623;letter-spacing:2px}
    .company-sub{font-size:9px;color:#666;margin-top:1px}
    .company-sub2{font-size:8px;color:#999}
    .doc-info{text-align:right}
    .doc-title{font-size:16px;font-weight:900;text-transform:uppercase;
               letter-spacing:1px;color:#1a1a1a}
    .doc-ref{font-size:9px;color:#888;margin-top:3px}
    .banner{background:#1a1a1a;color:white;padding:9px 14px;border-radius:7px;
            margin-bottom:14px;display:flex;align-items:center;justify-content:space-between}
    .banner-name{font-size:15px;font-weight:900}
    .banner-nat{font-size:9px;color:#ccc;margin-top:2px}
    .badges{display:flex;gap:8px;align-items:center}
    .badge-o{background:#F5A623;color:#1a1a1a;padding:3px 10px;
             border-radius:20px;font-weight:700;font-size:10px}
    .badge-d{background:#444;color:white;padding:3px 10px;
             border-radius:20px;font-weight:700;font-size:10px}
    .st{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px;
        color:#F5A623;border-bottom:1.5px solid #F5A623;padding-bottom:3px;margin:13px 0 8px}
    .g4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:7px 16px}
    .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px 16px}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:7px 12px}
    .fl{font-size:7.5px;color:#888;text-transform:uppercase;
        letter-spacing:.5px;margin-bottom:2px;font-weight:700}
    .fv{font-size:10px;font-weight:600;border-bottom:1px solid #e8e8e8;
        padding-bottom:3px;min-height:15px;line-height:1.4}
    .fv.empty{color:#bbb;font-style:italic;font-weight:400}
    .vol-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .vol-box{border:1px solid #e5e5e5;border-radius:7px;padding:9px}
    .vol-hdr{display:inline-flex;align-items:center;gap:6px;font-size:9px;
             font-weight:700;padding:4px 9px;border-radius:5px;margin-bottom:8px}
    .vol-hdr-arr{background:#27AE60;color:white}
    .vol-hdr-dep{background:#F5A623;color:#1a1a1a}
    .vol-inner{display:grid;grid-template-columns:1fr 1fr;gap:5px 10px}
    .pax-tbl{width:100%;border-collapse:collapse;font-size:10px}
    .pax-tbl thead tr{background:#1a1a1a}
    .pax-tbl thead th{padding:5px 7px;text-align:left;font-size:8px;
                      font-weight:700;text-transform:uppercase;color:white;letter-spacing:.5px}
    .pax-tbl tbody tr:nth-child(even){background:#f8f8f8}
    .pax-tbl tbody td{padding:5px 7px;border-bottom:1px solid #f0f0f0}
    .pax-tbl tfoot td{padding:5px 7px;background:#F5A623;color:#1a1a1a;font-weight:700}
    .leader-row{background:#fff8e1!important}
    .sig-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;
              margin-top:22px;padding-top:14px;border-top:2px solid #F5A623}
    .sig-line{border-bottom:1px solid #1a1a1a;height:38px;margin-bottom:7px}
    .sig-lbl{font-size:8px;color:#666;text-transform:uppercase;
             letter-spacing:.5px;text-align:center}
    .footer{text-align:center;font-size:8px;color:#bbb;margin-top:18px;
            padding-top:9px;border-top:1px solid #eee;line-height:1.6}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .page{padding:8mm 12mm}
    }
  </style>
</head>
<body>${printRef.current?.innerHTML || ''}</body>
</html>`)
    win.document.close()
    win.onload = () => { win.focus(); win.print() }
  }

  if (!client) return null
  const pax    = client.pax || []
  const today  = new Date().toLocaleDateString('fr-FR',
    { day:'2-digit', month:'long', year:'numeric' })
  const refDoc = `GI-${String(client.id).padStart(4,'0')}-${new Date().getFullYear()}`

  const FV = ({ label, value }) => (
    <div>
      <div style={{fontSize:'7.5px',color:'#888',textTransform:'uppercase',
        letterSpacing:'.5px',marginBottom:'2px',fontWeight:'700'}}>{label}</div>
      <div style={{fontSize:'10px',fontWeight:value?'600':'400',
        borderBottom:'1px solid #e8e8e8',paddingBottom:'3px',minHeight:'15px',
        lineHeight:'1.4',color:value?'#1a1a1a':'#bbb',fontStyle:value?'normal':'italic'}}>
        {value || '—'}
      </div>
    </div>
  )

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
      }
    >
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 overflow-auto max-h-[74vh]">
        <div ref={printRef}>
          <div style={{background:'white',maxWidth:'794px',margin:'0 auto',
            padding:'24px 32px',fontFamily:'Arial,Helvetica,sans-serif',
            fontSize:'11px',color:'#1a1a1a'}}>

            {/* ── En-tête avec VRAI LOGO ── */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              paddingBottom:'10px',borderBottom:'3px solid #F5A623',marginBottom:'14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                {/* ✅ Logo original Ramartour en base64 */}
                <img
                  src="/logo.jpg"
                  alt="Ramartour Madagascar"
                  style={{width:'60px',height:'60px',objectFit:'contain',borderRadius:'6px'}}
                />
                <div>
                  <div style={{fontSize:'19px',fontWeight:'900',color:'#F5A623',
                    letterSpacing:'2px'}}>RAMARTOUR</div>
                  <div style={{fontSize:'9px',color:'#666',marginTop:'1px'}}>Madagascar</div>
                  <div style={{fontSize:'8px',color:'#999'}}>
                    Système de Traitement des Relations Clients
                  </div>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'16px',fontWeight:'900',textTransform:'uppercase',
                  letterSpacing:'1px',color:'#1a1a1a'}}>Informations Générales</div>
                <div style={{fontSize:'9px',color:'#888',marginTop:'3px'}}>
                  Réf. : {refDoc}
                </div>
                <div style={{fontSize:'9px',color:'#888'}}>Date : {today}</div>
              </div>
            </div>

            {/* ── Bannière client ── */}
            <div style={{background:'#1a1a1a',color:'white',padding:'9px 14px',
              borderRadius:'7px',marginBottom:'14px',display:'flex',
              alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:'15px',fontWeight:'900'}}>
                  {client.titre} {client.nom}
                </div>
                <div style={{fontSize:'9px',color:'#ccc',marginTop:'2px'}}>
                  Nationalité : {client.nationalite || '—'}
                </div>
              </div>
              <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                <span style={{background:'#F5A623',color:'#1a1a1a',padding:'3px 10px',
                  borderRadius:'20px',fontWeight:'700',fontSize:'10px'}}>
                  {client.type_groupe || 'Individuel'}
                </span>
                <span style={{background:'#444',color:'white',padding:'3px 10px',
                  borderRadius:'20px',fontWeight:'700',fontSize:'10px'}}>
                  {client.nb_pax || 1} PAX
                </span>
              </div>
            </div>

            {/* ── 1. État Civil ── */}
            <div style={{fontSize:'10px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1px',color:'#F5A623',borderBottom:'1.5px solid #F5A623',
              paddingBottom:'3px',margin:'13px 0 8px'}}>1. État Civil</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',
              gap:'7px 16px',marginBottom:'4px'}}>
              <FV label="Titre"             value={client.titre}/>
              <FV label="Nom complet"       value={client.nom}/>
              <FV label="Nationalité"       value={client.nationalite}/>
              <FV label="Date de naissance"
                value={client.date_naissance ? fmtDate(client.date_naissance) : null}/>
              <FV label="N° Passeport / CIN" value={client.num_document}/>
              <FV label="Adresse"            value={client.adresse}/>
              <FV label="Code Postal"        value={client.code_postal}/>
              <FV label="Ville"              value={client.ville}/>
              <FV label="Pays"               value={client.pays}/>
              <FV label="N° Ass. Voyage"     value={client.assurance_voyage}/>
              <FV label="N° Ass. Santé"      value={client.assurance_sante}/>
            </div>

            {/* ── 2. Contacts & Urgence ── */}
            <div style={{fontSize:'10px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1px',color:'#F5A623',borderBottom:'1.5px solid #F5A623',
              paddingBottom:'3px',margin:'13px 0 8px'}}>2. Contacts &amp; Urgence</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',
              gap:'7px 16px',marginBottom:'4px'}}>
              <FV label="Téléphone"         value={client.telephone}/>
              <FV label="Email"             value={client.email}/>
              <FV label="Observation méd."  value={client.observation_med}/>
              <FV label="Contact Urgence"   value={client.urgence_nom}/>
              <FV label="Tél. Urgence"      value={client.urgence_tel}/>
            </div>

            {/* ── 3. Informations de Vol ── */}
            <div style={{fontSize:'10px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1px',color:'#F5A623',borderBottom:'1.5px solid #F5A623',
              paddingBottom:'3px',margin:'13px 0 8px'}}>3. Informations de Vol</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',
              gap:'10px',marginBottom:'6px'}}>
              {/* Vol Arrivée */}
              <div style={{border:'1px solid #e5e5e5',borderRadius:'7px',padding:'9px'}}>
                <div style={{display:'inline-flex',alignItems:'center',gap:'6px',
                  background:'#27AE60',color:'white',fontSize:'9px',fontWeight:'700',
                  padding:'4px 9px',borderRadius:'5px',marginBottom:'8px'}}>
                  {/* Icône avion SVG */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5
                      1.8 6.2c-.5.1-.9.6-.6 1.1l1.5 2.5c.2.4.7.5 1.1.3L8 8.5l-1 4.5
                      -3 1.5c-.4.2-.5.7-.3 1.1l.8 1.4c.3.5.9.6 1.3.3L9 15l3.5 4.5
                      c.3.4.8.5 1.2.3l2.5-1c.6-.2.8-.9.6-1.6z"/>
                  </svg>
                  Vol d'Arrivée
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5px 10px'}}>
                  <FV label="Départ de"   value={client.vol_arr_dep}/>
                  <FV label="Destination" value={client.vol_arr_dest}/>
                  <FV label="Date"
                    value={client.vol_arr_date ? fmtDate(client.vol_arr_date) : null}/>
                  <FV label="Compagnie"   value={client.vol_arr_cie}/>
                </div>
              </div>
              {/* Vol Départ */}
              <div style={{border:'1px solid #e5e5e5',borderRadius:'7px',padding:'9px'}}>
                <div style={{display:'inline-flex',alignItems:'center',gap:'6px',
                  background:'#F5A623',color:'#1a1a1a',fontSize:'9px',fontWeight:'700',
                  padding:'4px 9px',borderRadius:'5px',marginBottom:'8px'}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07
                      A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41
                      A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81
                      a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6.56 6.56l.95-.95
                      a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7
                      A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Vol de Départ
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5px 10px'}}>
                  <FV label="Départ de"   value={client.vol_dep_dep}/>
                  <FV label="Destination" value={client.vol_dep_dest}/>
                  <FV label="Date"
                    value={client.vol_dep_date ? fmtDate(client.vol_dep_date) : null}/>
                  <FV label="Compagnie"   value={client.vol_dep_cie}/>
                </div>
              </div>
            </div>

            {/* ── 4. Liste PAX ── */}
            <div style={{fontSize:'10px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1px',color:'#F5A623',borderBottom:'1.5px solid #F5A623',
              paddingBottom:'3px',margin:'13px 0 8px'}}>
              4. Liste des Participants — {client.nb_pax||1} PAX total
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'10px'}}>
              <thead>
                <tr style={{background:'#1a1a1a'}}>
                  {['#','Titre','Nom complet','Nationalité',
                    'N° Passeport / CIN','Téléphone','Email'].map(h => (
                    <th key={h} style={{padding:'5px 7px',textAlign:'left',fontSize:'8px',
                      fontWeight:'700',textTransform:'uppercase',
                      color:'white',letterSpacing:'.5px'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Leader */}
                <tr style={{background:'#fff8e1'}}>
                  <td style={{padding:'5px 7px',fontWeight:'700',color:'#e65100',
                    fontSize:'8px'}}>LEAD.</td>
                  <td style={{padding:'5px 7px'}}>{client.titre}</td>
                  <td style={{padding:'5px 7px',fontWeight:'700'}}>
                    {client.nom}
                    <span style={{fontSize:'7.5px',color:'#F5A623',
                      fontWeight:'800',marginLeft:'5px'}}>(LEADER)</span>
                  </td>
                  <td style={{padding:'5px 7px'}}>{client.nationalite||'—'}</td>
                  <td style={{padding:'5px 7px',fontFamily:'monospace',fontSize:'9px'}}>
                    {client.num_document||'—'}
                  </td>
                  <td style={{padding:'5px 7px'}}>{client.telephone||'—'}</td>
                  <td style={{padding:'5px 7px',fontSize:'9px'}}>{client.email||'—'}</td>
                </tr>
                {/* PAX */}
                {pax.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{padding:'8px 7px',color:'#aaa',
                      fontStyle:'italic',textAlign:'center',fontSize:'9px'}}>
                      Aucun participant PAX enregistré
                    </td>
                  </tr>
                ) : pax.map((p, i) => (
                  <tr key={p.id||i}
                    style={{background: i%2===0 ? '#f8f8f8' : '#ffffff'}}>
                    <td style={{padding:'5px 7px',color:'#888'}}>{i+1}</td>
                    <td style={{padding:'5px 7px'}}>{p.titre}</td>
                    <td style={{padding:'5px 7px',fontWeight:'600'}}>{p.nom}</td>
                    <td style={{padding:'5px 7px'}}>{p.nationalite||'—'}</td>
                    <td style={{padding:'5px 7px',fontFamily:'monospace',fontSize:'9px'}}>
                      {p.num_document||'—'}
                    </td>
                    <td style={{padding:'5px 7px'}}>{p.telephone||'—'}</td>
                    <td style={{padding:'5px 7px',fontSize:'9px'}}>{p.email||'—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7} style={{padding:'5px 7px',background:'#F5A623',
                    color:'#1a1a1a',fontWeight:'700',fontSize:'10px'}}>
                    Total : {client.nb_pax||1} PAX
                    (1 leader + {pax.length} participant{pax.length>1?'s':''})
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* ── Signatures ── */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'24px',
              marginTop:'22px',paddingTop:'14px',borderTop:'2px solid #F5A623'}}>
              {['Responsable Sales','Responsable Booking','Client Leader'].map(sig => (
                <div key={sig} style={{textAlign:'center'}}>
                  <div style={{borderBottom:'1px solid #1a1a1a',
                    height:'38px',marginBottom:'7px'}}/>
                  <div style={{fontSize:'8px',color:'#666',
                    textTransform:'uppercase',letterSpacing:'.5px'}}>{sig}</div>
                </div>
              ))}
            </div>

            {/* ── Footer ── */}
            <div style={{textAlign:'center',fontSize:'8px',color:'#bbb',
              marginTop:'18px',paddingTop:'9px',borderTop:'1px solid #eee',lineHeight:'1.6'}}>
              SITRAC — Ramartour Madagascar &nbsp;|&nbsp;
              Document généré le {today} &nbsp;|&nbsp; Réf. {refDoc}<br/>
              Ce document est confidentiel et destiné exclusivement
              à l'usage interne de Ramartour Madagascar.
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

  const [search,         setSearch]         = useState('')
  const [fNat,           setFNat]           = useState('')
  const [fType,          setFType]          = useState('')
  const [page,           setPage]           = useState(1)
  const [leaderModal,    setLeaderModal]    = useState(false)
  const [leaderTab,      setLeaderTab]      = useState('civil')
  const [editLeader,     setEditLeader]     = useState(null)
  const [loadingEdit,    setLoadingEdit]    = useState(false)
  const [paxListModal,   setPaxListModal]   = useState(false)
  const [paxModal,       setPaxModal]       = useState(false)
  const [curLeaderId,    setCurLeaderId]    = useState(null)
  const [curLeaderFull,  setCurLeaderFull]  = useState(null)
  const [loadingPaxList, setLoadingPaxList] = useState(false)
  const [printClient,    setPrintClient]    = useState(null)
  const [loadingPrint,   setLoadingPrint]   = useState(false)
  const PER = 8

  // State contrôlé pour le formulaire leader
  const [fd, setFd] = useState(EMPTY)
  const setF = (field, value) => setFd(prev => ({ ...prev, [field]: value }))
  const inp = (field, extra = {}) => ({
    value: fd[field] ?? '',
    onChange: e => setF(field, e.target.value),
    ...extra,
  })
  const sel = (field) => ({
    value: fd[field] ?? '',
    onChange: e => setF(field, e.target.value),
  })

  const { register: regP, handleSubmit: subP, reset: resetP } = useForm()

  const filtered  = clients.filter(c =>
    (!search || c.nom.toLowerCase().includes(search.toLowerCase())) &&
    (!fNat   || c.nationalite === fNat) &&
    (!fType  || c.type_groupe === fType)
  )
  const paginated = filtered.slice((page-1)*PER, page*PER)

  // ── Ouvrir ajout ──────────────────────────────────────────────
  const openAddLeader = () => {
    setFd({ ...EMPTY })
    setEditLeader(null)
    setLeaderTab('civil')
    setLeaderModal(true)
  }

  // ── Ouvrir modification — charge le détail complet ────────────
  const openEditLeader = async (c) => {
    setLoadingEdit(true)
    try {
      const full = await salesAPI.getClient(c.id)
      setFd({
        titre:            full.titre            || 'Monsieur',
        nom:              full.nom              || '',
        nationalite:      full.nationalite      || '',
        date_naissance:   full.date_naissance   || '',
        num_document:     full.num_document     || '',
        adresse:          full.adresse          || '',
        code_postal:      full.code_postal      || '',
        ville:            full.ville            || '',
        pays:             full.pays             || '',
        telephone:        full.telephone        || '',
        email:            full.email            || '',
        assurance_voyage: full.assurance_voyage || '',
        assurance_sante:  full.assurance_sante  || '',
        urgence_nom:      full.urgence_nom      || '',
        urgence_tel:      full.urgence_tel      || '',
        observation_med:  full.observation_med  || '',
        vol_arr_dep:      full.vol_arr_dep      || '',
        vol_arr_dest:     full.vol_arr_dest     || '',
        vol_arr_date:     full.vol_arr_date     || '',
        vol_arr_cie:      full.vol_arr_cie      || '',
        vol_dep_dep:      full.vol_dep_dep      || '',
        vol_dep_dest:     full.vol_dep_dest     || '',
        vol_dep_date:     full.vol_dep_date     || '',
        vol_dep_cie:      full.vol_dep_cie      || '',
        type_groupe:      full.type_groupe      || 'Individuel',
        nb_pax:           full.nb_pax           || 1,
      })
      setEditLeader(full)
      setLeaderTab('civil')
      setLeaderModal(true)
    } catch {
      toast.error('Erreur lors du chargement du client')
    } finally {
      setLoadingEdit(false)
    }
  }

  // ── Enregistrer leader ────────────────────────────────────────
  const saveLeader = () => {
    if (!fd.nom.trim())         { toast.error('Le nom est obligatoire');         return }
    if (!fd.nationalite.trim()) { toast.error('La nationalité est obligatoire'); return }
    const payload = { ...fd, nb_pax: +fd.nb_pax || 1 }
    const doSave  = () => {
      const opts = { onSuccess: () => { setLeaderModal(false); refetch() } }
      if (editLeader) update.mutate({ id: editLeader.id, data: payload }, opts)
      else            create.mutate(payload, opts)
    }
    if (editLeader) confirmSave(doSave); else doSave()
  }

  // ── Ouvrir liste PAX — charge le détail complet avec PAX ──────
  const openPaxList = async (id) => {
    setCurLeaderId(id)
    setLoadingPaxList(true)
    try {
      const full = await salesAPI.getClient(id)
      setCurLeaderFull(full)
      setPaxListModal(true)
    } catch {
      toast.error('Erreur lors du chargement des PAX')
    } finally {
      setLoadingPaxList(false)
    }
  }

  // ── Rafraîchir PAX ────────────────────────────────────────────
  const refreshPaxList = async () => {
    if (!curLeaderId) return
    try {
      const full = await salesAPI.getClient(curLeaderId)
      setCurLeaderFull(full)
    } catch { /* silencieux */ }
  }

  // ── Ouvrir PDF — ✅ charge le détail complet avant impression ──
  const openPrint = async (c) => {
    setLoadingPrint(true)
    try {
      const full = await salesAPI.getClient(c.id)
      setPrintClient(full)
    } catch {
      toast.error('Erreur lors du chargement de la fiche')
    } finally {
      setLoadingPrint(false)
    }
  }

  const openAddPax = () => {
    resetP({
      titre: 'Monsieur', nom: '', nationalite: '', date_naissance: '',
      num_document: '', adresse: '', ville: '', telephone: '', email: '',
      observation_med: '',
    })
    setPaxModal(true)
  }

  const savePax = (data) => {
    addPax.mutate({ clientId: curLeaderId, data }, {
      onSuccess: () => {
        setPaxModal(false)
        refreshPaxList()
        toast.success('PAX ajouté avec succès')
      },
      onError: e => toast.error(e.message || 'Erreur lors de l\'ajout'),
    })
  }

  const Spinner = () => (
    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
    </svg>
  )

  return (
    <Layout breadcrumb={['SITRAC','Sales','Dossier Client','Informations Générales']}>
      <div className="mb-5">
        <h1 className="page-title">
          <User size={22} className="text-orange"/> Informations Générales (GI)
        </h1>
        <p className="page-sub">Gestion des clients leaders et leurs participants (RG 07, 08)</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} value={clients.length} label="Total clients" color="orange"/>
        <StatCard icon={User}
          value={clients.filter(c => c.type_groupe === 'Individuel').length}
          label="Individuels" color="green"/>
        <StatCard icon={Users}
          value={clients.filter(c => c.type_groupe === 'Groupe').length}
          label="Groupes" color="blue"/>
        <StatCard icon={Users}
          value={clients.reduce((s, c) => s + (c.nb_pax||1), 0)}
          label="Total PAX" color="purple"/>
      </div>

      {/* Filtres */}
      <div className="card mb-5">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Filtres</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SearchInput value={search}
              onChange={v => { setSearch(v); setPage(1) }}
              placeholder="Rechercher un client..."/>
            <select className="form-control py-2 text-sm" value={fNat}
              onChange={e => { setFNat(e.target.value); setPage(1) }}>
              <option value="">Toutes nationalités</option>
              {NATIOS.map(n => <option key={n}>{n}</option>)}
            </select>
            <select className="form-control py-2 text-sm" value={fType}
              onChange={e => { setFType(e.target.value); setPage(1) }}>
              <option value="">Tous types</option>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setFNat(''); setFType(''); setPage(1) }}>
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm flex items-center gap-2
            text-gray-800 dark:text-gray-200">
            <User size={15} className="text-orange"/> Clients Leaders
          </h3>
          <button className="btn btn-primary btn-sm" onClick={openAddLeader}>
            <Plus size={14}/> Ajouter
          </button>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch}
          loadingText="Chargement des clients...">
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
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Aucun client
                    </td>
                  </tr>
                ) : paginated.map(c => (
                  <tr key={c.id}>
                    <td>
                      <strong className="text-gray-900 dark:text-white">
                        {c.titre} {c.nom}
                      </strong>
                    </td>
                    <td><Badge variant="info">{c.nb_pax||1}</Badge></td>
                    <td className="text-sm">{c.nationalite}</td>
                    <td className="text-xs text-gray-500">{c.telephone||'—'}</td>
                    <td className="text-xs text-gray-500 max-w-[140px] truncate">
                      {c.email||'—'}
                    </td>
                    <td><Badge variant="pending">{c.type_groupe}</Badge></td>
                    <td>
                      <div className="flex items-center justify-center gap-1">

                        {/* Modifier */}
                        <button className="btn btn-ghost btn-xs"
                          onClick={() => openEditLeader(c)}
                          disabled={loadingEdit} title="Modifier">
                          {loadingEdit ? <Spinner/> : <Pencil size={12}/>}
                        </button>

                        {/* PAX */}
                        <button className="btn btn-info btn-xs"
                          onClick={() => openPaxList(c.id)}
                          disabled={loadingPaxList} title="Gérer PAX">
                          {loadingPaxList ? <Spinner/> : <Users size={12}/>}
                        </button>

                        {/* PDF GI — ✅ charge le détail complet */}
                        <button className="btn btn-xs"
                          style={{ background: '#1a1a1a', color: 'white' }}
                          onClick={() => openPrint(c)}
                          disabled={loadingPrint} title="Imprimer Fiche GI">
                          {loadingPrint ? <Spinner/> : <FileText size={12}/>}
                        </button>

                        {/* Supprimer */}
                        <button className="btn btn-danger btn-xs"
                          onClick={() => confirmDelete(c.nom, () =>
                            remove.mutate(c.id, { onSuccess: () => refetch() })
                          )} title="Supprimer">
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

      {/* Modal PDF GI */}
      <GIPrintModal
        client={printClient}
        open={!!printClient}
        onClose={() => setPrintClient(null)}
      />

      {/* Modal Leader */}
      <Modal open={leaderModal} onClose={() => setLeaderModal(false)}
        title={editLeader
          ? `Modifier — ${editLeader.titre} ${editLeader.nom}`
          : 'Ajouter un Client Leader'}
        icon={User} size="lg"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setLeaderModal(false)}>
            Annuler
          </button>
          <button className="btn btn-success" onClick={saveLeader}
            disabled={create.isPending || update.isPending}>
            {create.isPending || update.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </>}
      >
        {/* Onglets */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setLeaderTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px
                whitespace-nowrap transition-colors
                ${leaderTab === t.key
                  ? 'border-orange text-orange'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* État Civil */}
        {leaderTab === 'civil' && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Titre</label>
                <select className="form-control" {...sel('titre')}>
                  {TITRES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nom <span className="form-req">*</span></label>
                <input className="form-control" placeholder="Nom de famille" {...inp('nom')}/>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Nationalité <span className="form-req">*</span>
                </label>
                <input className="form-control" placeholder="Ex: Française"
                  {...inp('nationalite')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Date de naissance</label>
                <input type="date" className="form-control" {...inp('date_naissance')}/>
              </div>
              <div className="form-group">
                <label className="form-label">N° Passeport / CIN</label>
                <input className="form-control" placeholder="Numéro du document"
                  {...inp('num_document')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Adresse</label>
                <input className="form-control" placeholder="Adresse postale"
                  {...inp('adresse')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Code Postal</label>
                <input className="form-control" placeholder="Code postal"
                  {...inp('code_postal')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Ville</label>
                <input className="form-control" placeholder="Ville" {...inp('ville')}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Pays</label>
              <input className="form-control" placeholder="Pays" {...inp('pays')}/>
            </div>
          </div>
        )}

        {/* Vols */}
        {leaderTab === 'vol' && (
          <div>
            <Alert type="info">ℹ️ Informations de vol communes pour tout le groupe.</Alert>
            <p className="font-semibold text-sm text-brand-green mb-3 mt-3">
              Vol d'Arrivée
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Départ de</label>
                <input className="form-control" placeholder="Ville de départ"
                  {...inp('vol_arr_dep')}/>
              </div>
              <div className="form-group">
                <label className="form-label">À destination de</label>
                <input className="form-control" placeholder="Ville d'arrivée"
                  {...inp('vol_arr_dest')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Date d'arrivée</label>
                <input type="date" className="form-control" {...inp('vol_arr_date')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Compagnie</label>
                <input className="form-control" placeholder="Ex: Air Madagascar"
                  {...inp('vol_arr_cie')}/>
              </div>
            </div>
            <p className="font-semibold text-sm text-orange mb-3 mt-5">
              Vol de Départ
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Départ de</label>
                <input className="form-control" placeholder="Ville de départ"
                  {...inp('vol_dep_dep')}/>
              </div>
              <div className="form-group">
                <label className="form-label">À destination de</label>
                <input className="form-control" placeholder="Ville d'arrivée"
                  {...inp('vol_dep_dest')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Date de départ</label>
                <input type="date" className="form-control" {...inp('vol_dep_date')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Compagnie</label>
                <input className="form-control" placeholder="Ex: Air Madagascar"
                  {...inp('vol_dep_cie')}/>
              </div>
            </div>
          </div>
        )}

        {/* Contacts */}
        {leaderTab === 'contacts' && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input className="form-control" placeholder="+261..."
                  {...inp('telephone')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control"
                  placeholder="email@exemple.com" {...inp('email')}/>
              </div>
              <div className="form-group">
                <label className="form-label">N° Assurance Voyage</label>
                <input className="form-control" placeholder="Numéro de police"
                  {...inp('assurance_voyage')}/>
              </div>
              <div className="form-group">
                <label className="form-label">N° Assurance Santé</label>
                <input className="form-control" placeholder="Numéro de police"
                  {...inp('assurance_sante')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Contact Urgence (Nom)</label>
                <input className="form-control" placeholder="Nom du contact"
                  {...inp('urgence_nom')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Contact Urgence (Tél)</label>
                <input className="form-control" placeholder="+261..."
                  {...inp('urgence_tel')}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Observation médicale</label>
              <textarea className="form-control" rows={3}
                placeholder="Allergies, traitements, régimes..."
                value={fd.observation_med ?? ''}
                onChange={e => setF('observation_med', e.target.value)}/>
            </div>
          </div>
        )}

        {/* Groupe */}
        {leaderTab === 'groupe' && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">
                  Type de groupe <span className="form-req">*</span>
                </label>
                <select className="form-control" {...sel('type_groupe')}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Nb PAX (avec leader) <span className="form-req">*</span>
                </label>
                <input type="number" className="form-control" min={1}
                  value={fd.nb_pax ?? 1}
                  onChange={e => setF('nb_pax', +e.target.value || 1)}/>
              </div>
            </div>
            <Alert type="warning">
              Le leader est inclus dans le nombre PAX.
              Les autres participants se gèrent via le bouton PAX.
            </Alert>
          </div>
        )}
      </Modal>

      {/* Modal PAX List */}
      <Modal open={paxListModal} onClose={() => setPaxListModal(false)}
        title={`PAX — ${curLeaderFull?.nom || ''}`}
        icon={Users} size="lg"
        footer={<>
          <button className="btn btn-primary" onClick={openAddPax}>
            <Plus size={14}/> Ajouter un PAX
          </button>
          <button className="btn btn-ghost" onClick={() => setPaxListModal(false)}>
            Fermer
          </button>
        </>}
      >
        {curLeaderFull && (
          <div className="flex items-center gap-3 p-3 bg-orange/10 rounded-xl mb-4 text-sm">
            <User size={16} className="text-orange flex-shrink-0"/>
            <span>
              <strong>{curLeaderFull.titre} {curLeaderFull.nom}</strong>
              {' '}— {curLeaderFull.type_groupe}
              {' '}— PAX déclarés : <strong>{curLeaderFull.nb_pax||1}</strong>
              {' '}— Enregistrés : <strong>{(curLeaderFull.pax||[]).length + 1}</strong>
              {' '}(leader inclus)
            </span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th><th>Nom</th><th>Nationalité</th>
                <th>Téléphone</th><th>Email</th><th>Passeport</th>
                <th className="text-center">Sup.</th>
              </tr>
            </thead>
            <tbody>
              {curLeaderFull && (
                <tr className="bg-orange/5">
                  <td><span className="text-[10px] font-bold text-orange">LEADER</span></td>
                  <td>
                    <strong className="text-gray-900 dark:text-white">
                      {curLeaderFull.titre} {curLeaderFull.nom}
                    </strong>
                  </td>
                  <td className="text-sm">{curLeaderFull.nationalite||'—'}</td>
                  <td className="text-xs text-gray-500">{curLeaderFull.telephone||'—'}</td>
                  <td className="text-xs text-gray-500">{curLeaderFull.email||'—'}</td>
                  <td className="text-xs text-gray-400 font-mono">
                    {curLeaderFull.num_document||'—'}
                  </td>
                  <td className="text-center">
                    <span className="text-xs text-gray-300">—</span>
                  </td>
                </tr>
              )}
              {!curLeaderFull?.pax?.length ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400 text-sm italic">
                    Aucun participant PAX — cliquer sur "Ajouter un PAX"
                  </td>
                </tr>
              ) : curLeaderFull.pax.map((p, i) => (
                <tr key={p.id}>
                  <td className="text-xs text-gray-400">{i+1}</td>
                  <td>
                    <strong className="text-gray-900 dark:text-white">
                      {p.titre} {p.nom}
                    </strong>
                  </td>
                  <td className="text-sm">{p.nationalite||'—'}</td>
                  <td className="text-xs text-gray-500">{p.telephone||'—'}</td>
                  <td className="text-xs text-gray-500">{p.email||'—'}</td>
                  <td className="text-xs text-gray-400 font-mono">{p.num_document||'—'}</td>
                  <td className="text-center">
                    <button className="btn btn-danger btn-xs"
                      onClick={() => confirmDelete(
                        `${p.titre} ${p.nom}`,
                        () => delPax.mutate(
                          { clientId: curLeaderId, paxId: p.id },
                          {
                            onSuccess: () => {
                              refreshPaxList()
                              toast.success('PAX supprimé', { icon: '⚠️' })
                            },
                            onError: e => toast.error(e.message),
                          }
                        )
                      )}>
                      <Trash2 size={11}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Modal Add PAX */}
      <Modal open={paxModal} onClose={() => setPaxModal(false)}
        title="Ajouter un Participant PAX" icon={User}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setPaxModal(false)}>
            Annuler
          </button>
          <button className="btn btn-success" onClick={subP(savePax)}
            disabled={addPax.isPending}>
            {addPax.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Titre</label>
            <select className="form-control" {...regP('titre')}>
              {TITRES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nom <span className="form-req">*</span></label>
            <input className="form-control" {...regP('nom', { required: true })}/>
          </div>
          <div className="form-group">
            <label className="form-label">
              Nationalité <span className="form-req">*</span>
            </label>
            <input className="form-control"
              {...regP('nationalite', { required: true })}/>
          </div>
          <div className="form-group">
            <label className="form-label">Date de naissance</label>
            <input type="date" className="form-control" {...regP('date_naissance')}/>
          </div>
          <div className="form-group">
            <label className="form-label">N° Passeport / CIN</label>
            <input className="form-control" {...regP('num_document')}/>
          </div>
          <div className="form-group">
            <label className="form-label">Téléphone</label>
            <input className="form-control" {...regP('telephone')}/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-control" {...regP('email')}/>
        </div>
        <div className="form-group">
          <label className="form-label">Observation médicale</label>
          <textarea className="form-control" rows={2}
            placeholder="Allergies, traitements..."
            {...regP('observation_med')}/>
        </div>
      </Modal>
    </Layout>
  )
}