import { useRef } from 'react'
import { FileText, Printer } from 'lucide-react'
import { Modal } from '../UI/index.jsx'
import { fmtDate } from '../../utils/storage'

export default function CotationPrintModal({ data, open, onClose }) {
  const printRef = useRef()

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=960,height=750')
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Cotation — ${data?.client_nom}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;font-size:10.5px;
         color:#1a1a1a;background:#fff}
    table{width:100%;border-collapse:collapse;font-size:9px}
    thead tr{background:#1a1a1a}
    thead th{padding:5px 6px;text-align:left;font-size:7.5px;font-weight:700;
             text-transform:uppercase;letter-spacing:.3px;color:#fff}
    tbody tr{border-bottom:1px solid #e8e8e8}
    tbody tr:nth-child(even){background:#f5f5f5}
    tbody td{padding:5px 6px}
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
  const refDoc = `COT-${String(data.programme_client_id).padStart(4,'0')}-${new Date().getFullYear()}`
  const lignes = data.lignes || []
  const fix    = data.fix    || {}
  const tot1   = data.total1 || 0
  const tot2   = data.total2 || 0
  const tot3   = data.total3 || 0
  const tot4   = data.total4 || 0
  const tot5   = data.total5 || 0
  const taux   = data.taux_change || 4800

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
      title={`Fiche Cotation — ${data.client_nom}`} icon={FileText}
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
            padding:'26px 32px',fontFamily:'Arial,Helvetica,sans-serif',
            fontSize:'10.5px',color:'#1a1a1a'}}>

            {/* En-tête */}
            <div style={{display:'flex',alignItems:'center',
              justifyContent:'space-between',paddingBottom:'12px',
              borderBottom:'2px solid #1a1a1a',marginBottom:'14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                <img src="/logo.png" alt="Ramartour"
                  style={{width:'50px',height:'50px',objectFit:'contain'}}/>
                <div>
                  <div style={{fontSize:'19px',fontWeight:'900',
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
                <div style={{fontSize:'14px',fontWeight:'900',
                  textTransform:'uppercase',letterSpacing:'2px',
                  borderBottom:'3px solid #F5A623',paddingBottom:'4px',
                  display:'inline-block'}}>
                  Fiche de Cotation
                </div>
                <div style={{fontSize:'9px',color:'#555',marginTop:'5px'}}>
                  Réf. : <strong>{refDoc}</strong>
                </div>
                <div style={{fontSize:'9px',color:'#555'}}>Date : {today}</div>
              </div>
            </div>

            {/* Bannière */}
            <div style={{background:'#1a1a1a',color:'#fff',padding:'9px 14px',
              marginBottom:'14px',display:'flex',justifyContent:'space-between',
              alignItems:'center'}}>
              <div>
                <div style={{fontSize:'13px',fontWeight:'900'}}>
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
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',
              gap:'8px',marginBottom:'14px',padding:'9px 11px',
              background:'#f5f5f5'}}>
              <FV label="Client"     value={data.client_nom}/>
              <FV label="Programme"  value={data.programme_nom}/>
              <FV label="Nb PAX"     value={String(data.nb_pax)}/>
              <FV label="Date début" value={data.date_debut
                ? fmtDate(data.date_debut) : '—'}/>
              <FV label="Taux Ar/€"
                value={`${(+taux).toLocaleString('fr-FR')} Ar`}/>
            </div>

            {/* Lignes journalières */}
            <div style={{fontSize:'9px',fontWeight:'900',textTransform:'uppercase',
              letterSpacing:'1.5px',color:'#fff',background:'#1a1a1a',
              padding:'4px 10px',marginBottom:'7px',display:'inline-block'}}>
              Programme Jour par Jour
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'9px',
              marginBottom:'14px'}}>
              <thead>
                <tr style={{background:'#1a1a1a'}}>
                  {['Jour','Date','Route','Hôtels','DBL','BF',
                    'L','D','TSF','Park','Guide'].map(h=>(
                    <th key={h} style={{padding:'5px 6px',textAlign:'left',
                      fontSize:'7.5px',fontWeight:'700',textTransform:'uppercase',
                      letterSpacing:'.3px',color:'#fff'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignes.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{padding:'10px',textAlign:'center',
                      color:'#aaa',fontStyle:'italic',fontSize:'9px'}}>
                      Aucune ligne de cotation
                    </td>
                  </tr>
                ) : lignes.map((lg,i)=>(
                  <tr key={i} style={{
                    background:i%2===0?'#fff':'#f5f5f5',
                    borderBottom:'1px solid #e8e8e8'}}>
                    <td style={{padding:'5px 6px'}}>{lg.jour||'—'}</td>
                    <td style={{padding:'5px 6px',fontSize:'8px',color:'#555'}}>
                      {lg.date?fmtDate(lg.date):'—'}
                    </td>
                    <td style={{padding:'5px 6px',fontWeight:'600'}}>
                      {lg.route||'—'}
                    </td>
                    <td style={{padding:'5px 6px',fontSize:'8px'}}>
                      {lg.hotels||'—'}
                    </td>
                    <td style={{padding:'5px 6px',textAlign:'right'}}>
                      {lg.dbl||0}
                    </td>
                    <td style={{padding:'5px 6px',textAlign:'right'}}>
                      {lg.bf||0}
                    </td>
                    <td style={{padding:'5px 6px',textAlign:'right'}}>
                      {lg.lunch||0}
                    </td>
                    <td style={{padding:'5px 6px',textAlign:'right'}}>
                      {lg.diner||0}
                    </td>
                    <td style={{padding:'5px 6px',textAlign:'right'}}>
                      {lg.tsf||0}
                    </td>
                    <td style={{padding:'5px 6px',textAlign:'right'}}>
                      {lg.parking||0}
                    </td>
                    <td style={{padding:'5px 6px',textAlign:'right'}}>
                      {lg.guide||0}
                    </td>
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
                ['CAR',     fix.car   ||0],
                ['FUEL',    fix.fuel  ||0],
                ['TAX',     fix.tax   ||0],
                ['GUIDE',   fix.guide ||0],
                ['COMM',    fix.comm  ||0],
                ['FILE FEE',fix.fee   ||0],
                ['FLIGHT',  fix.flight||0],
                ['REMISE',  fix.remise||0],
              ].map(([l,v])=>(
                <div key={l} style={{border:'1px solid #e0e0e0',
                  padding:'7px 9px',textAlign:'center'}}>
                  <div style={{fontSize:'7px',color:'#888',
                    textTransform:'uppercase',fontWeight:'700',
                    letterSpacing:'.4px',marginBottom:'3px'}}>{l}</div>
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
                ['TOTAL 1 — Somme journalière', tot1, false],
                ['TOTAL 2 — CAR+FUEL+TAX+GUIDE', tot2, false],
                ['TOTAL 3 — TOTAL 1 + TOTAL 2',  tot3, true],
                ['TOTAL 4 — TOTAL 3 + COMM + FILE FEE', tot4, false],
              ].map(([l,v,hl])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',
                  alignItems:'center',padding:'7px 12px',
                  borderBottom:'1px solid #e8e8e8',fontSize:'10px',
                  background:hl?'#f5f5f5':'transparent',
                  fontWeight:hl?'700':'400'}}>
                  <span style={{color:'#555'}}>{l}</span>
                  <strong>
                    {(+v||0).toLocaleString('fr-FR',
                      {minimumFractionDigits:2})} €
                  </strong>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',
                alignItems:'center',padding:'9px 12px',fontSize:'13px',
                fontWeight:'900',background:'#F5A623',color:'#1a1a1a'}}>
                <span>TOTAL 5 — PRIX DE REVIENT / PAX</span>
                <span>
                  {(+tot5||0).toLocaleString('fr-FR',
                    {minimumFractionDigits:2})} €
                </span>
              </div>
            </div>

            {/* Conversion Ariary */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',
              gap:'10px',marginBottom:'14px'}}>
              <div style={{border:'1px solid #1a1a1a',padding:'10px 12px',
                textAlign:'center'}}>
                <div style={{fontSize:'7.5px',color:'#888',
                  textTransform:'uppercase',fontWeight:'700',
                  letterSpacing:'.5px',marginBottom:'5px'}}>
                  TOTAL 5 en Ariary
                </div>
                <div style={{fontSize:'14px',fontWeight:'900',color:'#1a1a1a'}}>
                  {((+tot5||0)*(+taux||0)).toLocaleString('fr-FR')} Ar
                </div>
              </div>
              <div style={{border:'1px solid #1a1a1a',padding:'10px 12px',
                textAlign:'center'}}>
                <div style={{fontSize:'7.5px',color:'#888',
                  textTransform:'uppercase',fontWeight:'700',
                  letterSpacing:'.5px',marginBottom:'5px'}}>
                  Total groupe ({data.nb_pax} PAX)
                </div>
                <div style={{fontSize:'14px',fontWeight:'900',color:'#1a1a1a'}}>
                  {((+tot5||0)*(+data.nb_pax||1)).toLocaleString('fr-FR',
                    {minimumFractionDigits:2})} €
                </div>
              </div>
            </div>

            {/* Note */}
            <div style={{padding:'9px 11px',background:'#f5f5f5',
              fontSize:'8.5px',color:'#555',lineHeight:'1.7',
              marginBottom:'16px'}}>
              <strong>Note :</strong> Ce document est un document interne
              représentant le coût de revient pour l'agence.
              Il n'est pas destiné au client final.
            </div>

            {/* Signatures */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'40px',
              marginTop:'20px',paddingTop:'12px',
              borderTop:'2px solid #1a1a1a'}}>
              {['Responsable Sales','Validation Direction'].map(sig=>(
                <div key={sig} style={{textAlign:'center'}}>
                  <div style={{borderBottom:'1.5px solid #1a1a1a',
                    height:'36px',marginBottom:'6px'}}/>
                  <div style={{fontSize:'8px',color:'#555',
                    textTransform:'uppercase',letterSpacing:'.5px',
                    fontWeight:'700'}}>{sig}</div>
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
              Réf. {refDoc} &nbsp;|&nbsp; {today}<br/>
              Document interne confidentiel — Usage Sales uniquement
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}