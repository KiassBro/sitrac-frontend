import { useRef } from 'react'
import { FileCheck, Printer } from 'lucide-react'
import { Modal } from '../UI/index.jsx'
import { fmtDate } from '../../utils/storage'

export default function FactureProPrintModal({ data, open, onClose }) {
  const printRef = useRef()

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=960,height=750')
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Facture Pro — ${data?.client_nom}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;font-size:11px;
         color:#1a1a1a;background:#fff}
    table{width:100%;border-collapse:collapse;font-size:10px}
    thead tr{background:#1a1a1a}
    thead th{padding:7px 10px;text-align:left;font-size:8px;font-weight:700;
             text-transform:uppercase;letter-spacing:.5px;color:#fff}
    tbody tr{border-bottom:1px solid #e8e8e8}
    tbody tr:nth-child(even){background:#f5f5f5}
    tbody td{padding:7px 10px}
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

  if (!data) return null

  const today  = new Date().toLocaleDateString('fr-FR',
    { day:'2-digit', month:'long', year:'numeric' })
  const refDoc = `FP-${String(data.programme_client_id).padStart(4,'0')}-${new Date().getFullYear()}`
  const lignes = data.lignes || []
  const totalHT  = lignes.reduce((s,l)=>
    s + (+l.nombre||1)*(+l.prix_unitaire||0), 0)
  const totalTTC = totalHT - (+data.remise||0)

  const FV = ({ label, value }) => (
    <div>
      <div style={{fontSize:'7.5px',color:'#888',textTransform:'uppercase',
        letterSpacing:'.5px',marginBottom:'2px',fontWeight:'700'}}>{label}</div>
      <div style={{fontSize:'11px',fontWeight:'600',color:'#1a1a1a'}}>
        {value || '—'}
      </div>
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} size="xl"
      title={`Facture Proforma — ${data.client_nom}`} icon={FileCheck}
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
                <img src="/logo.png" alt="Ramartour"
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
                  Facture Proforma
                </div>
                <div style={{fontSize:'9px',color:'#555',marginTop:'5px'}}>
                  Réf. : <strong>{refDoc}</strong>
                </div>
                <div style={{fontSize:'9px',color:'#555'}}>
                  Date : {data.date_facture
                    ? fmtDate(data.date_facture) : today}
                </div>
              </div>
            </div>

            {/* Bannière */}
            <div style={{background:'#1a1a1a',color:'#fff',padding:'10px 14px',
              marginBottom:'16px',display:'flex',justifyContent:'space-between',
              alignItems:'center'}}>
              <div>
                <div style={{fontSize:'14px',fontWeight:'900'}}>
                  {data.client_nom}
                </div>
                <div style={{fontSize:'9px',color:'#bbb',marginTop:'2px'}}>
                  Programme : {data.programme_nom}
                </div>
              </div>
              <span style={{padding:'3px 10px',fontSize:'10px',fontWeight:'700',
                background:'#F5A623',color:'#1a1a1a'}}>
                {data.nb_pax} PAX
              </span>
            </div>

            {/* Infos */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',
              gap:'10px',marginBottom:'16px',padding:'10px 12px',
              background:'#f5f5f5'}}>
              <FV label="Programme"  value={data.programme_nom}/>
              <FV label="Nb PAX"     value={String(data.nb_pax)}/>
              <FV label="Date début" value={data.date_debut
                ? fmtDate(data.date_debut) : '—'}/>
              <FV label="Date facture" value={data.date_facture
                ? fmtDate(data.date_facture) : today}/>
            </div>

            {/* Titre */}
            <div style={{fontSize:'9px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1.5px',color:'#fff',background:'#1a1a1a',
              padding:'4px 10px',marginBottom:'8px',display:'inline-block'}}>
              Détail des Prestations
            </div>

            {/* Table */}
            <table style={{width:'100%',borderCollapse:'collapse',
              fontSize:'10px',marginBottom:'16px'}}>
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
                {lignes.length===0 ? (
                  <tr>
                    <td colSpan={6} style={{padding:'12px',textAlign:'center',
                      color:'#aaa',fontStyle:'italic',fontSize:'9px'}}>
                      Aucune ligne de facturation
                    </td>
                  </tr>
                ) : lignes.map((l,i)=>(
                  <tr key={i} style={{
                    background:i%2===0?'#fff':'#f5f5f5',
                    borderBottom:'1px solid #e8e8e8'}}>
                    <td style={{padding:'7px 10px',color:'#888'}}>{i+1}</td>
                    <td style={{padding:'7px 10px',fontSize:'9px',color:'#555'}}>
                      {l.date ? fmtDate(l.date) : '—'}
                    </td>
                    <td style={{padding:'7px 10px',fontWeight:'600'}}>
                      {l.service}
                    </td>
                    <td style={{padding:'7px 10px',textAlign:'right'}}>
                      {l.nombre||1}
                    </td>
                    <td style={{padding:'7px 10px',textAlign:'right'}}>
                      {(+l.prix_unitaire||0).toLocaleString('fr-FR',
                        {minimumFractionDigits:2})} €
                    </td>
                    <td style={{padding:'7px 10px',textAlign:'right',
                      fontWeight:'700'}}>
                      {((+l.nombre||1)*(+l.prix_unitaire||0)).toLocaleString(
                        'fr-FR',{minimumFractionDigits:2})} €
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
                  {totalHT.toLocaleString('fr-FR',
                    {minimumFractionDigits:2})} €
                </strong>
              </div>
              {+data.remise > 0 && (
                <div style={{display:'flex',justifyContent:'space-between',
                  padding:'7px 0',borderBottom:'1px solid #e8e8e8',
                  fontSize:'11px',color:'#888'}}>
                  <span>Remise accordée</span>
                  <span>
                    − {(+data.remise).toLocaleString('fr-FR',
                      {minimumFractionDigits:2})} €
                  </span>
                </div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',
                background:'#F5A623',color:'#1a1a1a',fontWeight:'900',
                fontSize:'13px',padding:'9px 12px',marginTop:'4px'}}>
                <span>TOTAL À PAYER</span>
                <span>
                  {totalTTC.toLocaleString('fr-FR',
                    {minimumFractionDigits:2})} €
                </span>
              </div>
            </div>

            {/* Mentions */}
            <div style={{marginTop:'20px',padding:'10px 12px',background:'#f5f5f5',
              fontSize:'9px',color:'#555',lineHeight:'1.7'}}>
              <strong>Conditions de paiement :</strong> Acompte de 50% à la
              commande, solde avant le départ.<br/>
              <strong>Validité :</strong> Cette facture proforma est valable
              30 jours à compter de sa date d'émission.<br/>
              <strong>Note :</strong> Ce document est une facture proforma
              et ne constitue pas une facture définitive.
            </div>

            {/* Signatures */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'40px',
              marginTop:'30px',paddingTop:'14px',
              borderTop:'2px solid #1a1a1a'}}>
              {['Responsable Sales / Ramartour',
                'Client / Signature & Cachet'].map(sig=>(
                <div key={sig} style={{textAlign:'center'}}>
                  <div style={{borderBottom:'1.5px solid #1a1a1a',
                    height:'40px',marginBottom:'6px'}}/>
                  <div style={{fontSize:'8px',color:'#555',
                    textTransform:'uppercase',letterSpacing:'.5px',
                    fontWeight:'700'}}>{sig}</div>
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
              Réf. {refDoc} &nbsp;|&nbsp; {today}<br/>
              Document confidentiel — Usage interne uniquement
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}