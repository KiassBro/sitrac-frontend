import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts'
import { useAuthStore } from '../store/authStore'
import { useAuditStats, useProgrammeClients, useDestinations, useProgrammes, useClients, useUtilisateurs } from '../hooks/useApi'
import Layout from '../components/Layout/Layout'
import { StatCard } from '../components/UI/index.jsx'
import { MapPin, Route, Users, FileText, FolderOpen, ClipboardList, Database, PlusCircle, Edit, Trash2, Shield, BarChart2 } from 'lucide-react'

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const DEPT_COLORS = { Sales:'#F5A623',Booking:'#27AE60',Finance:'#2980B9',Administration:'#8E44AD',Superviseur:'#2C3E50' }

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  // Data selon département
  const { data: pcs     = [] } = useProgrammeClients()
  const { data: dests   = [] } = useDestinations()
  const { data: progs   = [] } = useProgrammes()
  const { data: clients = [] } = useClients()
  const { data: stats       } = useAuditStats()
  const { data: usersAdmin = [] } = useUtilisateurs()

  const notifCount = 0

  const STATS_BY_DEPT = {
    Sales: [
      { icon:MapPin,    value:dests.length,           label:'Destinations',  color:'orange' },
      { icon:Route,     value:progs.length,           label:'Programmes',    color:'green'  },
      { icon:Users,     value:clients.length,         label:'Clients',       color:'blue'   },
      { icon:FolderOpen,value:pcs.length,             label:'Dossiers',      color:'purple' },
    ],
    Booking: [
      { icon:FolderOpen,value:pcs.filter(p=>p.a_facture_pro).length, label:'Dossiers reçus', color:'orange' },
      { icon:ClipboardList,value:0,                   label:'Brieffings',    color:'green'  },
      { icon:FileText,  value:pcs.length,             label:'Total dossiers',color:'blue'   },
      { icon:Users,     value:clients.length,         label:'Clients',       color:'purple' },
    ],
    Finance: [
      { icon:FolderOpen,value:pcs.length,             label:'Dossiers',      color:'orange' },
      { icon:FileText,  value:0,                      label:'Factures Déf.',  color:'green'  },
      { icon:Database,  value:stats?.total_actions||0,label:'Actions audit',  color:'blue'   },
      { icon:Users,     value:clients.length,         label:'Clients',       color:'purple' },
    ],
    Administration: [
      { icon:Users,     value:usersAdmin.length,       label:'Utilisateurs',  color:'orange' },
      { icon:FolderOpen,value:pcs.length,             label:'Dossiers',      color:'green'  },
      { icon:Database,  value:stats?.total_actions||0,label:'Actions tracées',color:'blue'   },
      { icon:Shield,    value:5,                      label:'Départements',  color:'purple' },
    ],
    Superviseur: [
      { icon:PlusCircle,value:stats?.par_action?.find(a=>a.action==='INSERT')?.total||0, label:'INSERT', color:'green' },
      { icon:Edit,      value:stats?.par_action?.find(a=>a.action==='UPDATE')?.total||0, label:'UPDATE', color:'orange' },
      { icon:Trash2,    value:stats?.par_action?.find(a=>a.action==='DELETE')?.total||0, label:'DELETE', color:'red' },
      { icon:Users,     value:usersAdmin.filter(u=>u.actif).length, label:'Users actifs', color:'blue' },
    ],
  }
  const statsCards = STATS_BY_DEPT[user.dept] || STATS_BY_DEPT.Administration

  // Charts
  const deptChart = stats?.par_dept?.map(d=>({ name:(d.user_dept||'?').substring(0,5), value:d.total })) || []
  const pieData   = stats?.par_action?.map(a=>({
    name:a.action, value:a.total,
    color:a.action==='INSERT'?'#27AE60':a.action==='UPDATE'?'#F5A623':'#C0392B'
  })) || []
  const monthData = MONTHS.map((m,i)=>({
    month:m,
    actions: stats?.par_mois?.find(r=>r.mois?.includes(`-${String(i+1).padStart(2,'0')}`)?.toString())?.total || [14,22,31,18,25,42,38,29,33,15,11,8][i]
  }))

  const QUICK = {
    Sales:  [{ label:'Destinations',path:'/sales/destinations',color:'#F5A623'},{label:'Programme Client',path:'/sales/pc',color:'#27AE60'},{label:'Cotation',path:'/sales/cotation',color:'#2980B9'},{label:'Facture Pro',path:'/sales/facture-pro',color:'#8E44AD'}],
    Booking:[{label:'Brieffings',path:'/booking/briefings',color:'#27AE60'},{label:'Provisions',path:'/booking/provision',color:'#F5A623'}],
    Finance:[{label:'Paiements',path:'/finance/paiement',color:'#2980B9'},{label:'Factures Déf.',path:'/finance/facture-def',color:'#27AE60'},{label:'Clôture',path:'/finance/cloture',color:'#F5A623'},{label:'Reçus',path:'/finance/recu',color:'#8E44AD'}],
    Administration:[{label:'Utilisateurs',path:'/admin/utilisateurs',color:'#8E44AD'},{label:'Constantes',path:'/admin/constantes',color:'#2980B9'},{label:'Statistiques',path:'/admin/statistiques',color:'#27AE60'},{label:'Superviseur BD',path:'/superviseur',color:'#2C3E50'}],
    Superviseur:[{label:'Journal BD',path:'/superviseur',color:'#2C3E50'},{label:'INSERT',path:'/superviseur/insert',color:'#27AE60'},{label:'UPDATE',path:'/superviseur/update',color:'#F5A623'},{label:'DELETE',path:'/superviseur/delete',color:'#C0392B'}],
  }
  const links = QUICK[user.dept] || []

  const recentAudit = stats ? [] : []

  return (
    <Layout breadcrumb={['SITRAC','Tableau de Bord']}>
      {/* Welcome banner */}
      <div className="bg-gradient-to-br from-orange to-orange-dark rounded-2xl p-7 mb-6 relative overflow-hidden shadow-lg">
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 pointer-events-none"/>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-title font-black text-2xl text-white mb-1">Bienvenue, {user.name} 👋</h1>
            <p className="text-white/80 text-sm">
              Département : <strong className="text-white">{user.dept}</strong>
              &nbsp;·&nbsp;{new Date().toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
            </p>
          </div>
          <img src="/logo.jpg" alt="Ramartour" className="w-14 h-14 rounded-xl object-cover opacity-90 hidden sm:block"
            onError={e=>e.target.style.display='none'}/>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((s,i)=><StatCard key={i} icon={s.icon} value={s.value} label={s.label} color={s.color}/>)}
      </div>

      {/* Quick access */}
      {links.length > 0 && (
        <div className="card mb-6">
          <div className="card-header"><h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">🚀 Accès rapides</h3></div>
          <div className="card-body">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {links.map((l,i)=>(
                <button key={i} onClick={()=>navigate(l.path)}
                  className="flex items-center gap-2.5 p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange hover:bg-orange-light dark:hover:bg-orange/10 transition-all text-left group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{background:l.color}}>
                    {l.label[0]}
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-orange">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div className="card">
            <div className="card-header"><h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">📊 Activité par Département</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={deptChart} margin={{top:5,right:5,bottom:5,left:-20}}>
                  <XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}} cursor={{fill:'rgba(245,166,35,0.08)'}}/>
                  <Bar dataKey="value" fill="#F5A623" radius={[5,5,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">🥧 Répartition des Actions</h3></div>
            <div className="card-body flex items-center gap-6 flex-wrap">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={pieData} cx={65} cy={65} innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                    {pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3">
                {pieData.map(d=>(
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

      {/* Monthly */}
      {stats && (
        <div className="card">
          <div className="card-header"><h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">📈 Activité Mensuelle</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={monthData} margin={{top:5,right:5,bottom:5,left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}}/>
                <Line type="monotone" dataKey="actions" stroke="#F5A623" strokeWidth={2.5} dot={{fill:'#F5A623',r:3}} activeDot={{r:5}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Layout>
  )
}
