import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, Cell, PieChart, Pie, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Shield, Users, Settings, History, BarChart2, Database } from 'lucide-react'
import { useAuditStats, useUtilisateurs, useProgrammeClients } from '../../hooks/useApi'
import Layout from '../../components/Layout/Layout'
import { StatCard } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const DEPT_COLOR = { Sales:'#F5A623', Booking:'#27AE60', Finance:'#2980B9', Administration:'#8E44AD', Superviseur:'#2C3E50' }

const QUICK = [
  { label:'Utilisateurs',  path:'/admin/utilisateurs', color:'#8E44AD', icon:Users    },
  { label:'Constantes',    path:'/admin/constantes',   color:'#2980B9', icon:Settings  },
  { label:'Historique',    path:'/admin/historique',   color:'#27AE60', icon:History   },
  { label:'Statistiques',  path:'/admin/statistiques', color:'#F5A623', icon:BarChart2  },
  { label:'Superviseur BD',path:'/superviseur',        color:'#2C3E50', icon:Database  },
]

export default function AdminDashboard() {
  const navigate = useNavigate()

  // Toutes les données viennent du backend
  const { data: stats, isLoading: statsLoading } = useAuditStats()
  const { data: users = [], isLoading: usersLoading } = useUtilisateurs()
  const { data: pcs   = [] } = useProgrammeClients()

  const isLoading = statsLoading || usersLoading

  // Graphique barres — activité par département
  const deptData = (stats?.par_dept || []).map(d => ({
    name:  (d.user_dept || '?').substring(0, 5),
    value: d.total,
  }))

  // Camembert — répartition des actions
  const pieData = (stats?.par_action || []).map(a => ({
    name:  a.action,
    value: a.total,
    color: a.action === 'INSERT' ? '#27AE60' : a.action === 'UPDATE' ? '#F5A623' : '#C0392B',
  }))

  const totActions = (stats?.par_action || []).reduce((s, a) => s + a.total, 0) || 1

  // Courbe mensuelle depuis les données réelles
  const monthData = MONTHS.map((m, i) => {
    const entry = (stats?.par_mois || []).find(r => r.mois && r.mois.includes(`-${String(i+1).padStart(2,'0')}`))
    return { month: m, value: entry?.total || 0 }
  })

  // Tables actives
  const topTables = (stats?.par_table || []).slice(0, 5)

  return (
    <Layout breadcrumb={['SITRAC','Administration','Tableau de Bord']}>
      <div className="mb-5">
        <h1 className="page-title"><Shield size={22} className="text-orange"/> Administration</h1>
        <p className="page-sub">Vue globale du système SITRAC — données en temps réel depuis le backend</p>
      </div>

      {/* KPIs depuis l'API */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}    value={isLoading ? '…' : users.length}                    label="Utilisateurs"     color="orange"/>
        <StatCard icon={Database} value={isLoading ? '…' : pcs.length}                      label="Dossiers clients" color="green"/>
        <StatCard icon={BarChart2}value={isLoading ? '…' : (stats?.total_actions ?? '…')}   label="Actions tracées"  color="blue"/>
        <StatCard icon={Shield}   value={isLoading ? '…' : users.filter(u=>u.actif).length} label="Utilisateurs actifs" color="purple"/>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Barres par département */}
        <div className="card">
          <div className="card-header"><h3 className="font-title font-bold text-sm">📊 Activité par Département</h3></div>
          <div className="card-body">
            {statsLoading
              ? <div className="h-40 flex items-center justify-center text-sm text-gray-400">Chargement...</div>
              : deptData.length === 0
                ? <div className="h-40 flex items-center justify-center text-sm text-gray-400">Aucune activité enregistrée</div>
                : (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={deptData} margin={{top:5,right:5,bottom:5,left:-20}}>
                      <XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}} cursor={{fill:'rgba(245,166,35,0.08)'}}/>
                      <Bar dataKey="value" fill="#F5A623" radius={[5,5,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                )
            }
          </div>
        </div>

        {/* Camembert */}
        <div className="card">
          <div className="card-header"><h3 className="font-title font-bold text-sm">🥧 Répartition des Actions</h3></div>
          <div className="card-body flex items-center gap-6 flex-wrap">
            {statsLoading
              ? <div className="h-40 flex items-center justify-center w-full text-sm text-gray-400">Chargement...</div>
              : pieData.length === 0
                ? <div className="h-40 flex items-center justify-center w-full text-sm text-gray-400">Aucune action dans le journal</div>
                : <>
                  <ResponsiveContainer width={130} height={130}>
                    <PieChart>
                      <Pie data={pieData} cx={60} cy={60} innerRadius={35} outerRadius={58} dataKey="value" paddingAngle={3}>
                        {pieData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center gap-2.5 text-sm">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{background:d.color}}/>
                        <span className="text-gray-600 dark:text-gray-400">{d.name}</span>
                        <strong className="ml-1">{d.value}</strong>
                        <span className="text-xs text-gray-400">({Math.round(d.value/totActions*100)}%)</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 font-bold text-sm">Total : {stats?.total_actions || 0}</div>
                  </div>
                </>
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Courbe mensuelle */}
        <div className="card lg:col-span-2">
          <div className="card-header"><h3 className="font-title font-bold text-sm">📈 Activité mensuelle</h3></div>
          <div className="card-body">
            {statsLoading
              ? <div className="h-36 flex items-center justify-center text-sm text-gray-400">Chargement...</div>
              : (
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={monthData} margin={{top:5,right:5,bottom:5,left:-20}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                    <XAxis dataKey="month" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}}/>
                    <Line type="monotone" dataKey="value" stroke="#F5A623" strokeWidth={2.5} dot={{fill:'#F5A623',r:3}} activeDot={{r:5}}/>
                  </LineChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </div>

        {/* Sessions — vrais utilisateurs depuis l'API */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-title font-bold text-sm">👥 Utilisateurs</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              {users.filter(u=>u.actif).length} actifs
            </span>
          </div>
          <div className="card-body p-0">
            {usersLoading
              ? <div className="p-5 text-center text-sm text-gray-400">Chargement...</div>
              : users.slice(0, 5).map(u => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs flex-shrink-0"
                    style={{background: DEPT_COLOR[u.departement] || '#F5A623'}}>
                    {u.login[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{u.login}</div>
                    <div className="text-[10px] text-gray-400">{u.departement}</div>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${u.actif ? 'bg-brand-green' : 'bg-gray-300'}`}/>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Tables actives + Accès rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="card-header"><h3 className="font-title font-bold text-sm">🗃️ Tables les plus actives</h3></div>
          <div className="card-body space-y-3">
            {statsLoading
              ? <div className="text-sm text-gray-400 text-center py-4">Chargement...</div>
              : topTables.length === 0
                ? <div className="text-sm text-gray-400 text-center py-4">Aucune activité dans le journal d'audit</div>
                : topTables.map(t => (
                  <div key={t.table} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-brand-blue min-w-[130px] truncate">{(t.table||'').replace(/_/g,' ')}</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-blue rounded-full"
                        style={{width:`${Math.round(t.total / (topTables[0]?.total || 1) * 100)}%`}}/>
                    </div>
                    <strong className="text-xs w-8 text-right">{t.total}</strong>
                  </div>
                ))
            }
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="font-title font-bold text-sm">🚀 Accès rapides</h3></div>
          <div className="card-body grid grid-cols-2 gap-3">
            {QUICK.map(q => {
              const Icon = q.icon
              return (
                <button key={q.path} onClick={() => navigate(q.path)}
                  className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange hover:bg-orange-light dark:hover:bg-orange/10 transition-all text-left group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{background: q.color + '22', color: q.color}}>
                    <Icon size={16}/>
                  </div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-orange">{q.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Layout>
  )
}
