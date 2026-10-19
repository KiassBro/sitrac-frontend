import { BarChart, Bar, Cell, PieChart, Pie, LineChart, Line,
         XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { BarChart2, TrendingUp, Database, RefreshCw } from 'lucide-react'
import { useAuditStats } from '../../hooks/useApi'
import Layout from '../../components/Layout/Layout'
import { StatCard } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { BarChart3 as IcoBarres, PieChart as IcoCamembert, Database as IcoTables, TrendingUp as IcoTendance, Trophy as IcoTrophee } from 'lucide-react'

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function SuperviseurStats() {
  const { data: stats, isLoading, error, refetch } = useAuditStats()

  const actionData = stats?.par_action || []
  const deptData   = (stats?.par_dept  || []).map(d => ({
    name:  (d.user_dept||'?').substring(0,5),
    value: d.total,
    color: { Sales:'#F5A623', Booking:'#27AE60', Finance:'#2980B9',
              Administration:'#8E44AD', Superviseur:'#2C3E50' }[d.user_dept] || '#999',
  }))
  const monthData  = MONTHS.map((m, i) => {
    const entry = (stats?.par_mois||[]).find(r => r.mois?.includes(`-${String(i+1).padStart(2,'0')}`))
    return { mois: m, actions: entry?.total || 0 }
  })
  const userTop = (stats?.par_user || []).slice(0, 8).map(u => ({
    user: u.user_login, actions: u.total,
  }))
  const tableTop = (stats?.par_table || []).slice(0, 6)
  const tot = actionData.reduce((s,a)=>s+a.total, 0) || 1

  return (
    <Layout breadcrumb={['SITRAC','Superviseur','Statistiques d\'Audit']}>
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title"><BarChart2 size={22} className="text-orange"/> Statistiques d'Audit</h1>
            <p className="page-sub">Analyse complète des actions INSERT / UPDATE / DELETE</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={refetch}>
            <RefreshCw size={13}/> Actualiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Database}   value={stats?.total_actions ?? '…'} label="Total actions"  color="orange"/>
        <StatCard icon={TrendingUp} value={actionData.find(a=>a.action==='INSERT')?.total || 0} label="INSERT" color="green"/>
        <StatCard icon={TrendingUp} value={actionData.find(a=>a.action==='UPDATE')?.total || 0} label="UPDATE" color="blue"/>
        <StatCard icon={TrendingUp} value={actionData.find(a=>a.action==='DELETE')?.total || 0} label="DELETE" color="red"/>
      </div>

      <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement des statistiques...">

        {/* Graphiques ligne 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="card">
            <div className="card-header"><h3 className="font-title font-bold text-sm flex items-center gap-2"><IcoBarres size={15} className="text-orange shrink-0"/>Activité par Département</h3></div>
            <div className="card-body">
              {deptData.length === 0
                ? <div className="h-40 flex items-center justify-center text-sm text-gray-400">Aucune donnée</div>
                : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={deptData} margin={{top:5,right:5,bottom:5,left:-20}}>
                      <XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}}
                        cursor={{fill:'rgba(245,166,35,0.08)'}}/>
                      <Bar dataKey="value" radius={[5,5,0,0]}>
                        {deptData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="font-title font-bold text-sm flex items-center gap-2"><IcoCamembert size={15} className="text-orange shrink-0"/>Répartition INSERT/UPDATE/DELETE</h3></div>
            <div className="card-body flex items-center gap-8 flex-wrap">
              {actionData.length === 0
                ? <div className="h-40 flex items-center justify-center w-full text-sm text-gray-400">Aucune donnée</div>
                : <>
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={actionData.map(a=>({...a, color:a.action==='INSERT'?'#27AE60':a.action==='UPDATE'?'#F5A623':'#C0392B'}))}
                        cx={65} cy={65} innerRadius={35} outerRadius={58} paddingAngle={3} dataKey="total">
                        {actionData.map((a,i)=>(
                          <Cell key={i} fill={a.action==='INSERT'?'#27AE60':a.action==='UPDATE'?'#F5A623':'#C0392B'}/>
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {actionData.map(a=>(
                      <div key={a.action} className="flex items-center gap-2.5 text-sm">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{background:a.action==='INSERT'?'#27AE60':a.action==='UPDATE'?'#F5A623':'#C0392B'}}/>
                        <span className="text-gray-600 dark:text-gray-400">{a.action}</span>
                        <strong className="ml-1">{a.total}</strong>
                        <span className="text-xs text-gray-400">({Math.round(a.total/tot*100)}%)</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 font-bold text-sm">
                      Total : {stats?.total_actions || 0}
                    </div>
                  </div>
                </>
              }
            </div>
          </div>
        </div>

        {/* Activité mensuelle */}
        <div className="card mb-5">
          <div className="card-header"><h3 className="font-title font-bold text-sm flex items-center gap-2"><IcoTendance size={15} className="text-orange shrink-0"/>Activité Mensuelle</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={monthData} margin={{top:5,right:10,bottom:5,left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mois" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}}/>
                <Line type="monotone" dataKey="actions" stroke="#F5A623" strokeWidth={2.5}
                  dot={{fill:'#F5A623',r:3}} activeDot={{r:5}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top users + Top tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <div className="card-header"><h3 className="font-title font-bold text-sm flex items-center gap-2"><IcoTrophee size={15} className="text-orange shrink-0"/>Top Utilisateurs</h3></div>
            <div className="card-body">
              {userTop.length === 0
                ? <div className="text-center py-8 text-sm text-gray-400">Aucune donnée</div>
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={userTop} layout="vertical" margin={{top:5,right:5,bottom:5,left:0}}>
                      <XAxis type="number" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis type="category" dataKey="user" tick={{fontSize:10}}
                        axisLine={false} tickLine={false} width={90}/>
                      <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}}/>
                      <Bar dataKey="actions" fill="#F5A623" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="font-title font-bold text-sm flex items-center gap-2"><IcoTables size={15} className="text-orange shrink-0"/>Tables les plus actives</h3></div>
            <div className="card-body space-y-3">
              {tableTop.length === 0
                ? <div className="text-center py-8 text-sm text-gray-400">Aucune donnée</div>
                : tableTop.map(t => (
                  <div key={t.table} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-brand-blue min-w-[130px] truncate">
                      {(t.table||'').replace(/_/g,' ')}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-blue rounded-full"
                        style={{width:`${Math.round(t.total/(tableTop[0]?.total||1)*100)}%`}}/>
                    </div>
                    <strong className="text-xs w-8 text-right">{t.total}</strong>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

      </ApiState>
    </Layout>
  )
}