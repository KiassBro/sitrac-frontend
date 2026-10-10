import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid
} from 'recharts'
import { useAuthStore } from '../store/authStore'
import {
  useAuditStats, useProgrammeClients, useDestinations,
  useProgrammes, useClients, useUtilisateurs
} from '../hooks/useApi'
import { financeAPI } from '../utils/api'
import Layout from '../components/Layout/Layout'
import MaJournee from '../components/Tableau/MaJournee'
import { StatCard } from '../components/UI/index.jsx'
import {
  MapPin, Route, Users, FileText, FolderOpen,
  ClipboardList, Database, PlusCircle, Edit, Trash2,
  Shield, BarChart2, TrendingUp, CreditCard, AlertCircle
} from 'lucide-react'
import { fmt } from '../utils/storage'

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

// ─── Section KPIs Finance ────────────────────────────────────
function FinanceKPIs({ pcs, paiements, clotures }) {
  const totalCA       = pcs.reduce((s,p) => s + (+p.prix_vente||0)*(+p.nb_pax||1), 0)
  const totalPaye     = paiements.reduce((s,p) => s + (+p.montant||0), 0)
  const totalDep      = clotures.reduce((s,c) => s + (+c.total_depenses||0), 0)
  const beneficeNet   = clotures.reduce((s,c) => s + (+c.benefice_net||0), 0)
  const tauxRecouvr   = totalCA > 0 ? Math.round((totalPaye/totalCA)*100) : 0
  const restant       = Math.max(0, totalCA - totalPaye)
  const dossiersRetard = pcs.filter(p => {
    const paye = paiements
      .filter(pm => pm.programme_client === p.id)
      .reduce((s,pm) => s + (+pm.montant||0), 0)
    return paye < (+p.prix_vente||0)*(+p.nb_pax||1)
  }).length

  // CA mensuel
  const caParMois = MONTHS.map((m,i) => {
    const ca = pcs
      .filter(p => {
        const d = new Date(p.date_vente)
        return d.getMonth()===i && d.getFullYear()===new Date().getFullYear()
      })
      .reduce((s,p) => s + (+p.prix_vente||0)*(+p.nb_pax||1), 0)
    return { mois: m, ca }
  })

  // Paiements par type
  const parType = Object.values(
    paiements.reduce((acc,p) => {
      const k = p.type_paiement || 'Autre'
      if (!acc[k]) acc[k] = { type:k, total:0 }
      acc[k].total += (+p.montant||0)
      return acc
    }, {})
  ).sort((a,b) => b.total-a.total)

  const COLORS = ['#F5A623','#1a1a1a','#555','#888','#bbb']

  return (
    <div>
      {/* Titre section Finance */}
      <div className="flex items-center gap-2 mb-4 mt-2">
        <div className="w-1 h-5 bg-orange rounded-full"/>
        <h2 className="font-title font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          KPIs Financiers
        </h2>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard icon={TrendingUp}  value={fmt(totalCA)}      label="CA Total (€)"         color="orange"/>
        <StatCard icon={CreditCard}  value={fmt(totalPaye)}    label="Total Encaissé (€)"   color="green"/>
        <StatCard icon={FileText}    value={`${tauxRecouvr}%`} label="Taux Recouvrement"    color="blue"/>
        <StatCard icon={FolderOpen}  value={fmt(beneficeNet)}  label="Bénéfice Net (€)"     color="purple"/>
      </div>

      {/* KPIs secondaires */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
            Total Dossiers
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{pcs.length}</div>
          <div className="text-xs text-gray-400 mt-1">
            {pcs.filter(p=>p.a_facture_pro).length} avec Facture Pro
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
            Total Dépenses
          </div>
          <div className="text-2xl font-black text-brand-red">{fmt(totalDep)}</div>
          <div className="text-xs text-gray-400 mt-1">
            {clotures.length} dossier{clotures.length>1?'s':''} clôturé{clotures.length>1?'s':''}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
            Reste à Encaisser
          </div>
          <div className={`text-2xl font-black ${restant>0?'text-orange':'text-brand-green'}`}>
            {fmt(restant)}
          </div>
          <div className="text-xs text-gray-400 mt-1">sur {fmt(totalCA)} facturé</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
            <AlertCircle size={11} className="text-brand-red"/> Dossiers en retard
          </div>
          <div className={`text-2xl font-black ${dossiersRetard>0?'text-brand-red':'text-brand-green'}`}>
            {dossiersRetard}
          </div>
          <div className="text-xs text-gray-400 mt-1">paiement incomplet</div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* CA mensuel */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
              Chiffre d'Affaires Mensuel (€)
            </h3>
            <span className="text-xs text-gray-400">{new Date().getFullYear()}</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={caParMois} margin={{top:5,right:5,bottom:5,left:-10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mois" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}
                  tickFormatter={v => v>0?`${(v/1000).toFixed(0)}k`:'0'}/>
                <Tooltip
                  formatter={v => [`${v.toLocaleString('fr-FR')} €`,'CA']}
                  contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}}
                  cursor={{fill:'rgba(245,166,35,0.08)'}}/>
                <Bar dataKey="ca" radius={[5,5,0,0]}>
                  {caParMois.map((_,i) => (
                    <Cell key={i}
                      fill={i===new Date().getMonth() ? '#F5A623' : '#1a1a1a'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Jauge recouvrement */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
              Recouvrement des Paiements
            </h3>
          </div>
          <div className="card-body flex items-center gap-6">
            <svg width="130" height="130" viewBox="0 0 130 130" className="flex-shrink-0">
              <circle cx="65" cy="65" r="52" fill="none" stroke="#f3f4f6" strokeWidth="13"/>
              <circle cx="65" cy="65" r="52" fill="none"
                stroke={tauxRecouvr>=80?'#27AE60':tauxRecouvr>=50?'#F5A623':'#C0392B'}
                strokeWidth="13" strokeLinecap="round"
                strokeDasharray={`${2*Math.PI*52*tauxRecouvr/100} ${2*Math.PI*52}`}
                strokeDashoffset={2*Math.PI*52*0.25}/>
              <text x="65" y="60" textAnchor="middle" fontSize="22" fontWeight="900"
                fill={tauxRecouvr>=80?'#27AE60':tauxRecouvr>=50?'#F5A623':'#C0392B'}>
                {tauxRecouvr}%
              </text>
              <text x="65" y="75" textAnchor="middle" fontSize="9" fill="#888">
                encaissé
              </text>
            </svg>
            <div className="space-y-3 flex-1">
              {[
                ['CA Total',  fmt(totalCA),   'text-gray-700 dark:text-gray-300'],
                ['Encaissé',  fmt(totalPaye), 'text-brand-green'],
                ['Restant',   fmt(restant),   'text-orange'],
              ].map(([l,v,cls]) => (
                <div key={l}>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">{l}</div>
                  <div className={`font-black text-sm ${cls}`}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Paiements par type */}
      {parType.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
              Paiements par Type
            </h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={parType} margin={{top:5,right:5,bottom:5,left:-10}}>
                <XAxis dataKey="type" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}
                  tickFormatter={v => v>0?`${(v/1000).toFixed(0)}k`:'0'}/>
                <Tooltip
                  formatter={v => [`${v.toLocaleString('fr-FR')} €`,'Total']}
                  contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}}
                  cursor={{fill:'rgba(245,166,35,0.08)'}}/>
                <Bar dataKey="total" radius={[5,5,0,0]}>
                  {parType.map((_,i) => (
                    <Cell key={i} fill={COLORS[i%COLORS.length]}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Synthèse clôtures */}
      {clotures.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
              Synthèse des Clôtures
            </h3>
            <span className="text-xs text-gray-400">
              {clotures.length} dossier{clotures.length>1?'s':''} clôturé{clotures.length>1?'s':''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl text-sm">
              <thead>
                <tr>
                  <th>Dossier</th><th>Recettes (€)</th>
                  <th>Dépenses (€)</th><th>Bénéfice Net (€)</th><th>Marge %</th>
                </tr>
              </thead>
              <tbody>
                {clotures.slice(0,6).map(c => {
                  const marge = c.total_recettes > 0
                    ? Math.round((c.benefice_net/c.total_recettes)*100) : 0
                  return (
                    <tr key={c.id}>
                      <td><span className="font-mono text-xs text-gray-400">#{c.programme_client}</span></td>
                      <td><strong className="text-brand-green">{fmt(c.total_recettes)}</strong></td>
                      <td><strong className="text-brand-red">{fmt(c.total_depenses)}</strong></td>
                      <td>
                        <strong className={c.benefice_net>=0?'text-brand-green':'text-brand-red'}>
                          {fmt(c.benefice_net)}
                        </strong>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{
                                background: marge>=20?'#27AE60':marge>=0?'#F5A623':'#C0392B',
                                width:`${Math.min(100,Math.abs(marge))}%`
                              }}/>
                          </div>
                          <span className={`text-xs font-bold ${
                            marge>=20?'text-brand-green':marge>=0?'text-orange':'text-brand-red'}`}>
                            {marge}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Dashboard principal ──────────────────────────────────────
export default function Dashboard() {
  const { user }   = useAuthStore()
  const navigate   = useNavigate()
  const isFinance  = user.dept === 'Finance'

  const { data: pcs     = [] } = useProgrammeClients()
  const { data: dests   = [] } = useDestinations()
  const { data: progs   = [] } = useProgrammes()
  const { data: clients = [] } = useClients()
  const { data: stats       } = useAuditStats()
  const { data: usersAdmin = [] } = useUtilisateurs()

  // Données Finance — chargées uniquement si Finance
  const { data: paiementsData } = useQuery({
    queryKey: ['paiements-dashboard'],
    queryFn:  () => financeAPI.getPaiements('?page_size=500'),
    select:   d => d.results ?? d,
    enabled:  isFinance,
  })
  const { data: cloturesData } = useQuery({
    queryKey: ['clotures-dashboard'],
    queryFn:  () => financeAPI.getClotures('?page_size=500'),
    select:   d => d.results ?? d,
    enabled:  isFinance,
  })
  const paiements = paiementsData || []
  const clotures  = cloturesData  || []

  // Stats cards selon département
  const STATS_BY_DEPT = {
    Sales: [
      { icon:MapPin,     value:dests.length,                  label:'Destinations',  color:'orange' },
      { icon:Route,      value:progs.length,                  label:'Programmes',    color:'green'  },
      { icon:Users,      value:clients.length,                label:'Clients',       color:'blue'   },
      { icon:FolderOpen, value:pcs.length,                    label:'Dossiers',      color:'purple' },
    ],
    Booking: [
      { icon:FolderOpen,    value:pcs.filter(p=>p.a_facture_pro).length, label:'Dossiers reçus',  color:'orange' },
      { icon:ClipboardList, value:0,                          label:'Brieffings',    color:'green'  },
      { icon:FileText,      value:pcs.length,                 label:'Total dossiers',color:'blue'   },
      { icon:Users,         value:clients.length,             label:'Clients',       color:'purple' },
    ],
    Finance: [
      { icon:FolderOpen, value:pcs.length,                    label:'Dossiers',         color:'orange' },
      { icon:FileText,   value:pcs.filter(p=>p.a_facture_pro).length, label:'Avec FP',  color:'green'  },
      { icon:CreditCard, value:paiements.length,              label:'Paiements',         color:'blue'   },
      { icon:TrendingUp, value:clotures.length,               label:'Clôtures',          color:'purple' },
    ],
    Administration: [
      { icon:Users,      value:usersAdmin.length,             label:'Utilisateurs',  color:'orange' },
      { icon:FolderOpen, value:pcs.length,                    label:'Dossiers',      color:'green'  },
      { icon:Database,   value:stats?.total_actions||0,       label:'Actions tracées',color:'blue'  },
      { icon:Shield,     value:5,                             label:'Départements',  color:'purple' },
    ],
    Superviseur: [
      { icon:PlusCircle, value:stats?.par_action?.find(a=>a.action==='INSERT')?.total||0, label:'INSERT', color:'green'  },
      { icon:Edit,       value:stats?.par_action?.find(a=>a.action==='UPDATE')?.total||0, label:'UPDATE', color:'orange' },
      { icon:Trash2,     value:stats?.par_action?.find(a=>a.action==='DELETE')?.total||0, label:'DELETE', color:'red'    },
      { icon:Users,      value:usersAdmin.filter(u=>u.actif).length, label:'Users actifs', color:'blue' },
    ],
  }
  const statsCards = STATS_BY_DEPT[user.dept] || STATS_BY_DEPT.Administration

  const deptChart = stats?.par_dept?.map(d=>({
    name:(d.user_dept||'?').substring(0,5), value:d.total
  })) || []
  const pieData   = stats?.par_action?.map(a=>({
    name:a.action, value:a.total,
    color:a.action==='INSERT'?'#27AE60':a.action==='UPDATE'?'#F5A623':'#C0392B'
  })) || []
  const monthData = MONTHS.map((m,i) => ({
    month: m,
    actions: stats?.par_mois?.find(r => r.mois?.includes(`-${String(i+1).padStart(2,'0')}`))?.total
      || [14,22,31,18,25,42,38,29,33,15,11,8][i]
  }))

  const QUICK = {
    Sales:  [
      { label:'Destinations',    path:'/sales/destinations',  color:'#F5A623' },
      { label:'Programme Client',path:'/sales/pc',            color:'#27AE60' },
      { label:'Cotation',        path:'/sales/cotation',      color:'#2980B9' },
      { label:'Facture Pro',     path:'/sales/facture-pro',   color:'#8E44AD' },
    ],
    Booking:[
      { label:'Brieffings',path:'/booking/briefings', color:'#27AE60' },
      { label:'Provisions', path:'/booking/provision', color:'#F5A623' },
    ],
    Finance:[
      { label:'Paiements',     path:'/finance/paiement',    color:'#2980B9' },
      { label:'Factures Déf.', path:'/finance/facture-def', color:'#27AE60' },
      { label:'Clôture',       path:'/finance/cloture',     color:'#F5A623' },
      { label:'Reçus',         path:'/finance/recu',        color:'#8E44AD' },
    ],
    Administration:[
      { label:'Utilisateurs', path:'/admin/utilisateurs',  color:'#8E44AD' },
      { label:'Constantes',   path:'/admin/constantes',    color:'#2980B9' },
      { label:'Statistiques', path:'/admin/statistiques',  color:'#27AE60' },
      { label:'Superviseur',  path:'/superviseur',         color:'#2C3E50' },
    ],
    Superviseur:[
      { label:'Journal BD', path:'/superviseur',        color:'#2C3E50' },
      { label:'INSERT',     path:'/superviseur/insert', color:'#27AE60' },
      { label:'UPDATE',     path:'/superviseur/update', color:'#F5A623' },
      { label:'DELETE',     path:'/superviseur/delete', color:'#C0392B' },
    ],
  }
  const links = QUICK[user.dept] || []

  return (
    <Layout breadcrumb={['SITRAC','Tableau de Bord']}>

      {/* Bannière bienvenue */}
      <div className="bg-gradient-to-br from-orange to-orange-dark rounded-2xl p-7 mb-6 relative overflow-hidden shadow-lg">
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 pointer-events-none"/>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-title font-black text-2xl text-white mb-1">
              Bienvenue, {user.name} 👋
            </h1>
            <p className="text-white/80 text-sm">
              Département : <strong className="text-white">{user.dept}</strong>
              &nbsp;·&nbsp;
              {new Date().toLocaleDateString('fr-FR',{
                weekday:'long', year:'numeric', month:'long', day:'numeric'
              })}
            </p>
          </div>
          <img src="/logo.png" alt="Ramartour"
            className="w-14 h-14 rounded-xl object-cover opacity-90 hidden sm:block"
            onError={e=>e.target.style.display='none'}/>
        </div>
      </div>

      {/* Actions du jour pour le département (devis, départs, échéances, planning…) */}
      <MaJournee/>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((s,i) => (
          <StatCard key={i} icon={s.icon} value={s.value}
            label={s.label} color={s.color}/>
        ))}
      </div>

      {/* Accès rapides */}
      {links.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
              🚀 Accès rapides
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {links.map((l,i) => (
                <button key={i} onClick={() => navigate(l.path)}
                  className="flex items-center gap-2.5 p-3.5 bg-gray-50 dark:bg-gray-800
                    rounded-xl border border-gray-200 dark:border-gray-700
                    hover:border-orange hover:bg-orange-light dark:hover:bg-orange/10
                    transition-all text-left group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center
                    text-white text-xs font-black flex-shrink-0"
                    style={{background:l.color}}>
                    {l.label[0]}
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300
                    group-hover:text-orange">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── KPIs Finance intégrés ── */}
      {isFinance && (
        <FinanceKPIs
          pcs={pcs}
          paiements={paiements}
          clotures={clotures}
        />
      )}

      {/* Charts audit — non Finance */}
      {!isFinance && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
                📊 Activité par Département
              </h3>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={deptChart} margin={{top:5,right:5,bottom:5,left:-20}}>
                  <XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',
                    fontSize:'12px'}} cursor={{fill:'rgba(245,166,35,0.08)'}}/>
                  <Bar dataKey="value" fill="#F5A623" radius={[5,5,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
                🥧 Répartition des Actions
              </h3>
            </div>
            <div className="card-body flex items-center gap-6 flex-wrap">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={pieData} cx={65} cy={65}
                    innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                    {pieData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',
                    fontSize:'12px'}}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{background:d.color}}/>
                    <span className="text-gray-600 dark:text-gray-400">{d.name}</span>
                    <strong className="ml-1">{d.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activité mensuelle — non Finance */}
      {!isFinance && stats && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
              📈 Activité Mensuelle
            </h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={monthData} margin={{top:5,right:5,bottom:5,left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',
                  fontSize:'12px'}}/>
                <Line type="monotone" dataKey="actions" stroke="#F5A623"
                  strokeWidth={2.5} dot={{fill:'#F5A623',r:3}} activeDot={{r:5}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </Layout>
  )
}