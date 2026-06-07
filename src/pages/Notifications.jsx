import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, Check, CheckCheck, ExternalLink, Search } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useConfirm } from '../hooks/useConfirm'
import { useAuditStats, useProgrammeClients, useDestinations, useProgrammes } from '../hooks/useApi'
import Layout from '../components/Layout/Layout'
import { Modal, StatCard } from '../components/UI/index.jsx'
import { timeAgo } from '../utils/storage'

const CAT_META = {
  sales:   { label:'Sales',   bg:'bg-orange-100 dark:bg-orange-900/30', text:'text-orange-700 dark:text-orange-400' },
  booking: { label:'Booking', bg:'bg-green-100 dark:bg-green-900/30',   text:'text-green-700 dark:text-green-400'  },
  finance: { label:'Finance', bg:'bg-blue-100 dark:bg-blue-900/30',     text:'text-blue-700 dark:text-blue-400'    },
  system:  { label:'Système', bg:'bg-purple-100 dark:bg-purple-900/30', text:'text-purple-700 dark:text-purple-400'},
}
const PRIO = {
  high:   { label:'Urgente', cls:'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'            },
  medium: { label:'Moyenne', cls:'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  low:    { label:'Info',    cls:'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'            },
}
const FILTERS = [
  { key:'all',label:'Toutes'},{ key:'unread',label:'Non lues'},{ key:'high',label:'Urgentes'},
  { key:'sales',label:'Sales'},{ key:'booking',label:'Booking'},{ key:'finance',label:'Finance'},{ key:'system',label:'Système'},
]

// Construit les notifications depuis les données réelles de l'API
function buildNotifs({ stats, pcs, dests, progs, dept }) {
  const notifs = []
  const now = Date.now()

  // Alertes audit (Superviseur / Admin)
  if (dept === 'Superviseur' || dept === 'Administration') {
    const ins = stats?.par_action?.find(a=>a.action==='INSERT')?.total || 0
    const upd = stats?.par_action?.find(a=>a.action==='UPDATE')?.total || 0
    const del = stats?.par_action?.find(a=>a.action==='DELETE')?.total || 0
    if (ins>0) notifs.push({ id:'s-ins', cat:'system', prio:'medium', title:`${ins} insertion${ins>1?'s':''} enregistrée${ins>1?'s':''}`, desc:`${ins} nouvel enregistrement${ins>1?'s':''} ajouté${ins>1?'s':''} en base de données.`, link:'/superviseur/insert', ts:now-600000 })
    if (upd>0) notifs.push({ id:'s-upd', cat:'system', prio:'low',    title:`${upd} modification${upd>1?'s':''} effectuée${upd>1?'s':''}`, desc:`${upd} entrée${upd>1?'s':''} modifiée${upd>1?'s':''} dans la base de données.`, link:'/superviseur/update', ts:now-1200000 })
    if (del>0) notifs.push({ id:'s-del', cat:'system', prio:'medium', title:`${del} suppression${del>1?'s':''} archivée${del>1?'s':''}`, desc:`${del} enregistrement${del>1?'s':''} archivé${del>1?'s':''} (RG 37).`, link:'/superviseur/delete', ts:now-1800000 })
  }

  // Alertes Sales
  if (dept === 'Sales' || dept === 'Administration') {
    const noCot = pcs.filter(p=>!p.a_cotation)
    const noFP  = pcs.filter(p=>p.a_cotation && !p.a_facture_pro)
    const inactDests = dests.filter(d=>!d.actif)
    const inactProgs = progs.filter(p=>!p.actif)
    if (noCot.length>0) notifs.push({ id:'noCot', cat:'sales', prio:'high', title:`${noCot.length} dossier${noCot.length>1?'s':''} sans cotation`, desc:`Les dossiers de ${noCot.slice(0,3).map(p=>p.client_nom).join(', ')}${noCot.length>3?'…':''} n'ont pas encore de cotation (RG 28).`, link:'/sales/cotation', ts:now-300000 })
    if (noFP.length>0)  notifs.push({ id:'noFP',  cat:'sales', prio:'high', title:`${noFP.length} dossier${noFP.length>1?'s':''} sans Facture Pro`, desc:`${noFP.slice(0,3).map(p=>p.client_nom).join(', ')}${noFP.length>3?'…':''} ont une cotation mais pas de facture pro (RG 13).`, link:'/sales/facture-pro', ts:now-900000 })
    if (inactDests.length>0) notifs.push({ id:'inactDest', cat:'sales', prio:'low', title:`${inactDests.length} destination${inactDests.length>1?'s':''} désactivée${inactDests.length>1?'s':''}`, desc:`${inactDests.map(d=>d.code).join(', ')} ne peuvent plus être utilisées dans les programmes.`, link:'/sales/destinations', ts:now-3600000 })
    if (inactProgs.length>0) notifs.push({ id:'inactProg', cat:'sales', prio:'low', title:`${inactProgs.length} programme${inactProgs.length>1?'s':''} désactivé${inactProgs.length>1?'s':''}`, desc:`${inactProgs.map(p=>p.nom).join(', ')} — aucune vente possible (RG 06).`, link:'/sales/programmes', ts:now-7200000 })
  }

  // Alertes Booking
  if (dept === 'Booking' || dept === 'Administration') {
    const noBrf = pcs.filter(p=>p.a_facture_pro && !p.a_brieffing)
    if (noBrf.length>0) notifs.push({ id:'noBrf', cat:'booking', prio:'high', title:`${noBrf.length} dossier${noBrf.length>1?'s':''} sans Brieffing`, desc:`${noBrf.slice(0,3).map(p=>p.client_nom).join(', ')}${noBrf.length>3?'…':''} — facture pro validée mais brieffing manquant (RG 17).`, link:'/booking/briefings', ts:now-600000 })
  }

  // Alertes Finance
  if (dept === 'Finance' || dept === 'Administration') {
    const noFD = pcs.filter(p=>p.a_facture_pro && !p.a_facture_def)
    if (noFD.length>0) notifs.push({ id:'noFD', cat:'finance', prio:'high', title:`${noFD.length} dossier${noFD.length>1?'s':''} sans Facture Définitive`, desc:`${noFD.slice(0,3).map(p=>p.client_nom).join(', ')}${noFD.length>3?'…':''} — la facture définitive doit être émise (RG 22).`, link:'/finance/facture-def', ts:now-600000 })
  }

  if (notifs.length===0) notifs.push({ id:'ok', cat:'system', prio:'low', title:'Tout est à jour ✅', desc:'Aucune tâche en attente. Toutes les données sont cohérentes avec les règles de gestion.', link:'/dashboard', ts:now-60000 })
  return notifs
}

export default function Notifications() {
  const { user }  = useAuthStore()
  const { confirm } = useConfirm()
  const navigate  = useNavigate()

  const { data: stats } = useAuditStats()
  const { data: pcs   = [] } = useProgrammeClients()
  const { data: dests = [] } = useDestinations()
  const { data: progs = [] } = useProgrammes()

  // Lecture lu/non-lu en session (pas en localStorage)
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem('sitrac_notif_read')||'[]')) }
    catch { return new Set() }
  })
  const markRead = (id) => setReadIds(prev => {
    const n = new Set(prev); n.add(String(id))
    sessionStorage.setItem('sitrac_notif_read', JSON.stringify([...n]))
    return n
  })

  const raw = useMemo(() => buildNotifs({ stats, pcs, dests, progs, dept:user.dept }), [stats, pcs, dests, progs, user.dept])
  const all = useMemo(() => raw.map(n=>({...n, read:readIds.has(String(n.id))})), [raw, readIds])

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)

  const filtered = useMemo(() => all.filter(n => {
    const fm = filter==='all'?true:filter==='unread'?!n.read:filter==='high'?n.prio==='high':n.cat===filter
    const sm = !search||n.title.toLowerCase().includes(search.toLowerCase())||n.desc.toLowerCase().includes(search.toLowerCase())
    return fm && sm
  }), [all, filter, search])

  const unread  = all.filter(n=>!n.read).length
  const urgent  = all.filter(n=>n.prio==='high').length

  const markAll = () => confirm({
    icon:'✅', type:'success', title:'Tout marquer comme lu', msg:'Marquer toutes les notifications comme lues ?', confirmText:'Oui, tout lire',
    onConfirm: () => { all.forEach(n=>markRead(n.id)) }
  })

  const open = (n) => { markRead(n.id); setDetail(n) }

  return (
    <Layout breadcrumb={['SITRAC','Notifications']}>
      <div className="mb-5">
        <h1 className="page-title"><Bell size={22} className="text-orange"/> Notifications</h1>
        <p className="page-sub">Alertes générées depuis les données réelles du backend (RG 28, 39, 40)</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Bell}    value={all.length} label="Total"    color="orange"/>
        <StatCard icon={BellOff} value={unread}     label="Non lues" color="red"/>
        <StatCard icon={Bell}    value={urgent}     label="Urgentes" color="red"/>
        <StatCard icon={Check}   value={all.length-unread} label="Lues" color="green"/>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(f=>{
            const cnt = f.key==='all'?all.length:f.key==='unread'?unread:f.key==='high'?urgent:all.filter(n=>n.cat===f.key).length
            return (
              <button key={f.key} onClick={()=>setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all
                  ${filter===f.key?'bg-orange text-white border-orange':'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange hover:text-orange'}`}>
                {f.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${filter===f.key?'bg-white/30 text-white':'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>{cnt}</span>
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." className="form-control pl-8 w-48 text-xs py-2"/>
          </div>
          {unread>0 && <button className="btn btn-ghost btn-sm" onClick={markAll}><CheckCheck size={14}/> Tout lire</button>}
        </div>
      </div>

      {filtered.length===0
        ? <div className="card p-16 text-center"><BellOff size={48} className="mx-auto mb-4 text-gray-300"/><p className="font-bold text-gray-500 dark:text-gray-400">Aucune notification pour ce filtre</p></div>
        : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map(n=>{
                const cat = CAT_META[n.cat]||CAT_META.system
                const p   = PRIO[n.prio]||PRIO.low
                return (
                  <motion.div key={n.id} layout initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:.96}}
                    onClick={()=>open(n)}
                    className={`card flex items-start gap-4 p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all ${!n.read?'border-l-4 border-l-orange':'opacity-75 hover:opacity-100'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${cat.bg} ${cat.text}`}>🔔</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h4 className={`font-bold text-sm ${!n.read?'text-gray-900 dark:text-white':'text-gray-500 dark:text-gray-400'}`}>{n.title}</h4>
                        {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-orange flex-shrink-0 mt-1"/>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.desc}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[10px] text-gray-400">{timeAgo(n.ts)}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.cls}`}>{p.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>{cat.label}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0" onClick={e=>e.stopPropagation()}>
                      {!n.read && <button className="btn btn-ghost btn-xs" onClick={()=>markRead(n.id)}><Check size={11}/></button>}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )
      }

      <Modal open={!!detail} onClose={()=>setDetail(null)} title={detail?.title||''} icon={Bell}
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setDetail(null)}>Fermer</button>
          {detail?.link && <button className="btn btn-primary" onClick={()=>{setDetail(null);navigate(detail.link)}}><ExternalLink size={14}/> Aller au module</button>}
        </>}
      >
        {detail && (
          <div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4 flex-wrap">
              <span className={`text-xs font-black px-2.5 py-1 rounded-full ${(PRIO[detail.prio]||PRIO.low).cls}`}>{(PRIO[detail.prio]||PRIO.low).label}</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${(CAT_META[detail.cat]||CAT_META.system).bg} ${(CAT_META[detail.cat]||CAT_META.system).text}`}>{(CAT_META[detail.cat]||CAT_META.system).label}</span>
              <span className="text-xs text-gray-400">{timeAgo(detail.ts)}</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{detail.desc}</p>
            {detail.link && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-brand-blue">
                <div className="text-xs font-bold text-brand-blue mb-1">Module concerné</div>
                <div className="font-mono text-xs text-gray-700 dark:text-gray-300">{detail.link}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  )
}
