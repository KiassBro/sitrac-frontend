import { useRef } from 'react'
import { FileText, Printer } from 'lucide-react'
import { Modal } from '../UI/index.jsx'
import { fmtDate } from '../../utils/storage'

export default function GIPrintModal({ client, open, onClose }) {
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
    table{width:100%;border-collapse:collapse;font-size:10px}
    thead tr{background:#1a1a1a}
    thead th{padding:6px 8px;text-align:left;font-size:8px;font-weight:700;
             text-transform:uppercase;letter-spacing:.5px;color:#fff}
    tbody tr{border-bottom:1px solid #e8e8e8}
    tbody tr:nth-child(even){background:#f5f5f5}
    tbody td{padding:6px 8px}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
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
        paddingBottom:'3px',minHeight:'15px',lineHeight:'1.4',
        borderBottom:'1px solid #e8e8e8',
        color:value?'#1a1a1a':'#bbb',fontStyle:value?'normal':'italic'}}>
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
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4
        overflow-auto max-h-[74vh]">
        <div ref={printRef}>
          <div style={{background:'#fff',maxWidth:'794px',margin:'0 auto',
            padding:'28px 36px',fontFamily:'Arial,Helvetica,sans-serif',
            fontSize:'11px',color:'#1a1a1a'}}>

            {/* En-tête */}
            <div style={{display:'flex',alignItems:'center',
              justifyContent:'space-between',paddingBottom:'12px',
              borderBottom:'2px solid #1a1a1a',marginBottom:'16px'}}>
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
                <div style={{fontSize:'15px',fontWeight:'900',
                  textTransform:'uppercase',letterSpacing:'2px',
                  borderBottom:'3px solid #F5A623',paddingBottom:'4px',
                  display:'inline-block'}}>
                  Informations Générales
                </div>
                <div style={{fontSize:'9px',color:'#555',marginTop:'5px'}}>
                  Réf. : <strong>{refDoc}</strong>
                </div>
                <div style={{fontSize:'9px',color:'#555'}}>Date : {today}</div>
              </div>
            </div>

            {/* Bannière client */}
            <div style={{background:'#1a1a1a',color:'#fff',padding:'10px 14px',
              marginBottom:'16px',display:'flex',justifyContent:'space-between',
              alignItems:'center'}}>
              <div>
                <div style={{fontSize:'14px',fontWeight:'900'}}>
                  {client.titre} {client.nom}
                </div>
                <div style={{fontSize:'9px',color:'#bbb',marginTop:'2px'}}>
                  Nationalité : {client.nationalite || '—'}
                </div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <span style={{padding:'3px 10px',fontSize:'10px',fontWeight:'700',
                  background:'#F5A623',color:'#1a1a1a'}}>
                  {client.type_groupe || 'Individuel'}
                </span>
                <span style={{padding:'3px 10px',fontSize:'10px',fontWeight:'700',
                  color:'#fff',border:'1.5px solid #fff'}}>
                  {client.nb_pax || 1} PAX
                </span>
              </div>
            </div>

            {/* 1. État Civil */}
            <div style={{fontSize:'9px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1.5px',color:'#fff',background:'#1a1a1a',
              padding:'4px 10px',marginBottom:'10px',display:'inline-block'}}>
              1. État Civil
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',
              gap:'8px 14px',marginBottom:'4px'}}>
              <FV label="Titre"              value={client.titre}/>
              <FV label="Nom complet"        value={client.nom}/>
              <FV label="Nationalité"        value={client.nationalite}/>
              <FV label="Date de naissance"
                value={client.date_naissance
                  ? fmtDate(client.date_naissance) : null}/>
              <FV label="N° Passeport / CIN" value={client.num_document}/>
              <FV label="Adresse"            value={client.adresse}/>
              <FV label="Code Postal"        value={client.code_postal}/>
              <FV label="Ville"              value={client.ville}/>
              <FV label="Pays"               value={client.pays}/>
              <FV label="N° Ass. Voyage"     value={client.assurance_voyage}/>
              <FV label="N° Ass. Santé"      value={client.assurance_sante}/>
            </div>

            {/* 2. Contacts */}
            <div style={{fontSize:'9px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1.5px',color:'#fff',background:'#1a1a1a',
              padding:'4px 10px',margin:'13px 0 10px',display:'inline-block'}}>
              2. Contacts &amp; Urgence
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',
              gap:'8px 14px',marginBottom:'4px'}}>
              <FV label="Téléphone"        value={client.telephone}/>
              <FV label="Email"            value={client.email}/>
              <FV label="Observation méd." value={client.observation_med}/>
              <FV label="Contact Urgence"  value={client.urgence_nom}/>
              <FV label="Tél. Urgence"     value={client.urgence_tel}/>
            </div>

            {/* 3. Vols */}
            <div style={{fontSize:'9px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1.5px',color:'#fff',background:'#1a1a1a',
              padding:'4px 10px',margin:'13px 0 10px',display:'inline-block'}}>
              3. Informations de Vol
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',
              gap:'12px',marginBottom:'14px'}}>
              {[
                { label:"Vol d'Arrivée", bg:'#27AE60', col:'white',
                  fields:[
                    ['Départ de',   client.vol_arr_dep],
                    ['Destination', client.vol_arr_dest],
                    ['Date', client.vol_arr_date
                      ? fmtDate(client.vol_arr_date) : null],
                    ['Compagnie',   client.vol_arr_cie],
                  ]},
                { label:"Vol de Départ", bg:'#F5A623', col:'#1a1a1a',
                  fields:[
                    ['Départ de',   client.vol_dep_dep],
                    ['Destination', client.vol_dep_dest],
                    ['Date', client.vol_dep_date
                      ? fmtDate(client.vol_dep_date) : null],
                    ['Compagnie',   client.vol_dep_cie],
                  ]},
              ].map(vol => (
                <div key={vol.label}
                  style={{border:'1.5px solid #1a1a1a',padding:'10px'}}>
                  <div style={{fontSize:'9px',fontWeight:'900',
                    textTransform:'uppercase',letterSpacing:'1px',
                    padding:'3px 8px',marginBottom:'8px',display:'inline-block',
                    background:vol.bg,color:vol.col}}>
                    {vol.label}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',
                    gap:'5px 10px'}}>
                    {vol.fields.map(([l,v]) => <FV key={l} label={l} value={v}/>)}
                  </div>
                </div>
              ))}
            </div>

            {/* 4. PAX */}
            <div style={{fontSize:'9px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1.5px',color:'#fff',background:'#1a1a1a',
              padding:'4px 10px',marginBottom:'8px',display:'inline-block'}}>
              4. Participants — {client.nb_pax || 1} PAX total
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'10px'}}>
              <thead>
                <tr style={{background:'#1a1a1a'}}>
                  {['#','Titre','Nom complet','Nationalité',
                    'N° Passeport/CIN','Téléphone','Email'].map(h=>(
                    <th key={h} style={{padding:'6px 8px',textAlign:'left',
                      fontSize:'8px',fontWeight:'700',textTransform:'uppercase',
                      letterSpacing:'.5px',color:'#fff'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{background:'#f5f5f5',
                  borderLeft:'3px solid #F5A623',
                  borderBottom:'1px solid #e8e8e8'}}>
                  <td style={{padding:'6px 8px',fontSize:'8px',fontWeight:'900',
                    textTransform:'uppercase',color:'#1a1a1a'}}>LEAD.</td>
                  <td style={{padding:'6px 8px'}}>{client.titre}</td>
                  <td style={{padding:'6px 8px',fontWeight:'700'}}>
                    {client.nom}
                    <span style={{fontSize:'7.5px',background:'#F5A623',
                      color:'#1a1a1a',fontWeight:'900',padding:'1px 5px',
                      marginLeft:'5px',textTransform:'uppercase'}}>
                      Leader
                    </span>
                  </td>
                  <td style={{padding:'6px 8px'}}>
                    {client.nationalite||'—'}
                  </td>
                  <td style={{padding:'6px 8px',fontFamily:'monospace',
                    fontSize:'9px'}}>
                    {client.num_document||'—'}
                  </td>
                  <td style={{padding:'6px 8px'}}>{client.telephone||'—'}</td>
                  <td style={{padding:'6px 8px',fontSize:'9px'}}>
                    {client.email||'—'}
                  </td>
                </tr>
                {pax.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{padding:'8px',color:'#aaa',
                      fontStyle:'italic',textAlign:'center',fontSize:'9px',
                      borderBottom:'1px solid #e8e8e8'}}>
                      Aucun participant PAX enregistré
                    </td>
                  </tr>
                ) : pax.map((p,i) => (
                  <tr key={p.id||i} style={{
                    background:i%2===0?'#fff':'#f5f5f5',
                    borderBottom:'1px solid #e8e8e8'}}>
                    <td style={{padding:'6px 8px',color:'#888',
                      fontWeight:'700'}}>{i+1}</td>
                    <td style={{padding:'6px 8px'}}>{p.titre}</td>
                    <td style={{padding:'6px 8px',fontWeight:'600'}}>
                      {p.nom}
                    </td>
                    <td style={{padding:'6px 8px'}}>{p.nationalite||'—'}</td>
                    <td style={{padding:'6px 8px',fontFamily:'monospace',
                      fontSize:'9px'}}>{p.num_document||'—'}</td>
                    <td style={{padding:'6px 8px'}}>{p.telephone||'—'}</td>
                    <td style={{padding:'6px 8px',fontSize:'9px'}}>
                      {p.email||'—'}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={7} style={{padding:'6px 8px',
                    background:'#F5A623',color:'#1a1a1a',
                    fontWeight:'700',fontSize:'10px'}}>
                    Total : {client.nb_pax||1} PAX
                    (1 leader + {pax.length} participant{pax.length>1?'s':''})
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Signatures */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',
              gap:'24px',marginTop:'22px',paddingTop:'14px',
              borderTop:'2px solid #1a1a1a'}}>
              {['Responsable Sales','Responsable Booking',
                'Client Leader'].map(sig=>(
                <div key={sig} style={{textAlign:'center'}}>
                  <div style={{borderBottom:'1.5px solid #1a1a1a',
                    height:'38px',marginBottom:'6px'}}/>
                  <div style={{fontSize:'8px',color:'#555',
                    textTransform:'uppercase',letterSpacing:'.5px',
                    fontWeight:'700'}}>{sig}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{textAlign:'center',fontSize:'8px',color:'#888',
              marginTop:'18px',paddingTop:'8px',
              borderTop:'1px solid #ddd',lineHeight:'1.6'}}>
              <div style={{width:'30px',height:'2px',background:'#F5A623',
                margin:'0 auto 8px'}}/>
              SITRAC — Ramartour Madagascar &nbsp;|&nbsp;
              Réf. {refDoc} &nbsp;|&nbsp; {today}<br/>
              Document confidentiel — Usage interne uniquement
            </div>

          </div>
        </div>
      </div>
    </Modal>
  )
}