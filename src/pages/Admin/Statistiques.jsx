import { BarChart, Bar, Cell, LineChart, Line, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { BarChart2, TrendingUp, Users, Database } from 'lucide-react'
import { useAuditStats, useProgrammeClients, useClients, useDestinations, useProgrammes, useUtilisateurs } from '../../hooks/useApi'
import Layout from '../../components/Layout/Layout'
import { StatCard } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const DEPT_COLORS = { Sales:'#F5A623', Booking:'#27AE60', Finance:'#2980B9', Administration:'#8E44AD', Superviseur:'#2C3E50' }

export default function Statistiques() {
  const { data: stats, isLoading: statsLoading } = useAuditStats()
  const { data: pcs    = [] } = useProgrammeClients()
  const { data: clients= [] } = useClients()
  const { data: dests  = [] } = useDestinations()
  const { data: progs  = [] } = useProgrammes()
  const { data: users  = [] } = useUtilisateurs()

  const isLoading = statsLoading

  // Données pour les graphiques
  const actionData = stats?.par_action || []
  const deptData   = (stats?.par_dept || []).map(d => ({
    dept: d.user_dept || '?',
    actions: d.total,
    color: DEPT_COLORS[d.user_dept] || '#999',
  }))
  const monthData  = MONTHS.map((m, i) => {
    const entry = (stats?.par_mois || []).find(r => r.mois?.includes(`-${String(i+1).padStart(2,'0')}`))
    return { mois: m, actions: entry?.total || 0 }
  })
  const userActivity = (stats?.par_user || []).slice(0, 8).map(u => ({
    user: u.user_login, actions: u.total
  }))

  // KPIs métier
  const totalCA    = pcs.reduce((s,p) => s + (+p.prix_vente||0)*(p.nb_pax||1), 0)
  const tauxCot    = pcs.length ? Math.round(pcs.filter(p=>p.a_cotation).length / pcs.length * 100) : 0
  const tauxFP     = pcs.length ? Math.round(pcs.filter(p=>p.a_facture_pro).length / pcs.length * 100) : 0

  return (
    <Layout breadcrumb={['SITRAC','Administration','Statistiques']}>
      <div className="mb-5">
        <h1 className="page-title"><BarChart2 size={22} className="text-orange"/> Statistiques Système</h1>
        <p className="page-sub">Bilans d'activité — données réelles depuis le backend (RG 38)</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Database}    value={stats?.total_actions ?? '…'} label="Actions totales"   color="orange"/>
        <StatCard icon={Users}       value={users.length}                 label="Utilisateurs"      color="blue"/>
        <StatCard icon={TrendingUp}  value={pcs.length}                   label="Dossiers clients"  color="green"/>
        <StatCard icon={BarChart2}   value={`${totalCA.toLocaleString('fr-FR')} €`} label="CA total" color="purple"/>
      </div>

      <ApiState isLoading={isLoading} error={null} loadingText="Chargement des statistiques...">

        {/* Ligne 1 : activité par département + camembert actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="card">
            <div className="card-header"><h3 className="font-title font-bold text-sm">📊 Activité par Département</h3></div>
            <div className="card-body">
              {deptData.length === 0
                ? <div className="h-40 flex items-center justify-center text-sm text-gray-400">Aucune donnée</div>
                : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={deptData} margin={{top:5,right:5,bottom:5,left:-20}}>
                      <XAxis dataKey="dept" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}} cursor={{fill:'rgba(245,166,35,0.08)'}}/>
                      <Bar dataKey="actions" radius={[5,5,0,0]}>
                        {deptData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="font-title font-bold text-sm">🥧 Répartition INSERT/UPDATE/DELETE</h3></div>
            <div className="card-body flex items-center gap-8 flex-wrap">
              {actionData.length === 0
                ? <div className="h-40 flex items-center justify-center w-full text-sm text-gray-400">Aucune donnée</div>
                : <>
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={actionData.map(a=>({...a, color:a.action==='INSERT'?'#27AE60':a.action==='UPDATE'?'#F5A623':'#C0392B'}))}
                        cx={65} cy={65} innerRadius={35} outerRadius={58} paddingAngle={3} dataKey="total">
                        {actionData.map((a,i) => <Cell key={i} fill={a.action==='INSERT'?'#27AE60':a.action==='UPDATE'?'#F5A623':'#C0392B'}/>)}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {actionData.map(a => (
                      <div key={a.action} className="flex items-center gap-2.5 text-sm">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{background:a.action==='INSERT'?'#27AE60':a.action==='UPDATE'?'#F5A623':'#C0392B'}}/>
                        <span className="text-gray-600 dark:text-gray-400">{a.action}</span>
                        <strong className="ml-1">{a.total}</strong>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 font-bold text-sm text-gray-700 dark:text-gray-300">
                      Total : {stats?.total_actions || 0}
                    </div>
                  </div>
                </>
              }
            </div>
          </div>
        </div>

        {/* Ligne 2 : activité mensuelle */}
        <div className="card mb-5">
          <div className="card-header"><h3 className="font-title font-bold text-sm">📈 Activité Mensuelle</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={monthData} margin={{top:5,right:10,bottom:5,left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mois" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}}/>
                <Line type="monotone" dataKey="actions" stroke="#F5A623" strokeWidth={2.5} dot={{fill:'#F5A623',r:3}} activeDot={{r:5}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ligne 3 : stats métier + top users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Stats métier */}
          <div className="card">
            <div className="card-header"><h3 className="font-title font-bold text-sm">📋 Indicateurs Métier</h3></div>
            <div className="card-body space-y-4">
              {[
                { label:'Destinations actives',     val:dests.filter(d=>d.actif).length,    max:dests.length,        color:'#F5A623' },
                { label:'Programmes actifs',        val:progs.filter(p=>p.actif).length,    max:progs.length,        color:'#27AE60' },
                { label:'Dossiers avec cotation',   val:pcs.filter(p=>p.a_cotation).length, max:pcs.length,          color:'#2980B9' },
                { label:'Dossiers avec Facture Pro',val:pcs.filter(p=>p.a_facture_pro).length,max:pcs.length,        color:'#8E44AD' },
                { label:'Utilisateurs actifs',      val:users.filter(u=>u.actif).length,    max:users.length,        color:'#2C3E50' },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{row.label}</span>
                    <strong style={{color:row.color}}>{row.val} / {row.max}</strong>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      background: row.color,
                      width: row.max ? `${Math.round(row.val/row.max*100)}%` : '0%'
                    }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top utilisateurs */}
          <div className="card">
            <div className="card-header"><h3 className="font-title font-bold text-sm">🏆 Top Utilisateurs (actions)</h3></div>
            <div className="card-body">
              {userActivity.length === 0
                ? <div className="text-center py-8 text-sm text-gray-400">Aucune donnée d'activité</div>
                : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={userActivity} layout="vertical" margin={{top:5,right:5,bottom:5,left:0}}>
                      <XAxis type="number" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis type="category" dataKey="user" tick={{fontSize:10}} axisLine={false} tickLine={false} width={80}/>
                      <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}}/>
                      <Bar dataKey="actions" fill="#F5A623" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </div>
          </div>
        </div>

      </ApiState>
    </Layout>
  )
}
