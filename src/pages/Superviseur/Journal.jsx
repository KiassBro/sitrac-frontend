import { useState } from 'react'
import { BarChart, Bar, Cell, PieChart, Pie, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Database, Download, Eye, RefreshCw } from 'lucide-react'
import { useAuditLogs, useAuditStats } from '../../hooks/useApi'
import { superviseurAPI } from '../../utils/api'
import Layout from '../../components/Layout/Layout'
import { StatCard, Badge, Pagination } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { Modal } from '../../components/UI/index.jsx'
import { fmtDateTime } from '../../utils/storage'

const ACTION_META = {
  INSERT: { bg:'bg-green-100 dark:bg-green-900/30', text:'text-green-800 dark:text-green-400' },
  UPDATE: { bg:'bg-orange-100 dark:bg-orange-900/30', text:'text-orange-700 dark:text-orange-400' },
  DELETE: { bg:'bg-red-100 dark:bg-red-900/30', text:'text-red-700 dark:text-red-400' },
}
const FILTERS_BTN = [
  { key:'', label:'Tous', color:'bg-brand-blue text-white' },
  { key:'INSERT', label:'INSERT', color:'bg-brand-green text-white' },
  { key:'UPDATE', label:'UPDATE', color:'bg-orange text-white' },
  { key:'DELETE', label:'DELETE', color:'bg-brand-red text-white' },
]

export default function Journal() {
  const [filter,   setFilter]   = useState('')
  const [fTable,   setFTable]   = useState('')
  const [fUser,    setFUser]    = useState('')
  const [fDate,    setFDate]    = useState('')
  const [search,   setSearch]   = useState('')
  const [page,     setPage]     = useState(1)
  const [detail,   setDetail]   = useState(null)
  const PER = 15

  // Build query params
  const params = () => {
    const p = new URLSearchParams()
    if (filter) p.set('action', filter)
    if (fTable)  p.set('table', fTable)
    if (fUser)   p.set('user_login', fUser)
    if (fDate)   p.set('date_from', fDate)
    if (search)  p.set('search', search)
    p.set('page', page)
    p.set('page_size', PER)
    return `?${p.toString()}`
  }

  const { data: logsData, isLoading, error, refetch } = useAuditLogs(params())
  const { data: stats } = useAuditStats()

  const logs  = logsData?.results || []
  const total = logsData?.count   || 0

  const exportCsv = () => {
    // exportCsv() effectue maintenant un fetch authentifié (JWT) et déclenche
    // le téléchargement lui-même — voir utils/api.js:downloadFile().
    superviseurAPI.exportCsv().catch(err => {
      alert(`Échec de l'export CSV : ${err.message}`)
    })
  }

  return (
    <Layout breadcrumb={['SITRAC','Superviseur','Journal des Actions']}>
      <div className="mb-5">
        <h1 className="page-title"><Database size={22} className="text-orange"/> Superviseur Base de Données</h1>
        <p className="page-sub flex items-center gap-2">
          Journal complet INSERT / UPDATE / DELETE
          <span className="flex items-center gap-1.5 text-xs font-bold text-brand-green">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse inline-block"/>Surveillance active
          </span>
        </p>
      </div>

      {/* KPIs depuis l'API stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats?.par_action?.map(a => (
          <StatCard key={a.action} icon={Database} value={a.total} label={a.action}
            color={a.action==='INSERT'?'green':a.action==='UPDATE'?'orange':'red'}/>
        ))}
        {!stats && <StatCard icon={Database} value="…" label="Chargement" color="blue"/>}
      </div>

      {/* Graphiques */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div className="card">
            <div className="card-header"><h3 className="font-title font-bold text-sm">📊 Activité par Département</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={stats.par_dept?.map(d=>({name:d.user_dept?.substring(0,5)||'?', value:d.total}))}
                  margin={{top:5,right:5,bottom:5,left:-20}}>
                  <XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}} cursor={{fill:'rgba(245,166,35,0.08)'}}/>
                  <Bar dataKey="value" fill="#F5A623" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="font-title font-bold text-sm">🥧 Répartition des Actions</h3></div>
            <div className="card-body flex items-center gap-6 flex-wrap">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={stats.par_action?.map(a=>({name:a.action, value:a.total, color:a.action==='INSERT'?'#27AE60':a.action==='UPDATE'?'#F5A623':'#C0392B'}))}
                    cx={50} cy={50} innerRadius={28} outerRadius={48} dataKey="value" paddingAngle={3}>
                    {stats.par_action?.map((a,i)=><Cell key={i} fill={a.action==='INSERT'?'#27AE60':a.action==='UPDATE'?'#F5A623':'#C0392B'}/>)}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius:'10px',border:'1px solid #e5e7eb',fontSize:'12px'}}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {stats.par_action?.map(a=>(
                  <div key={a.action} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-sm" style={{background:a.action==='INSERT'?'#27AE60':a.action==='UPDATE'?'#F5A623':'#C0392B'}}/>
                    <span>{a.action}</span><strong className="ml-1">{a.total}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table journal */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm flex items-center gap-2"><Database size={14} className="text-orange"/>Journal des Actions</h3>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={refetch}><RefreshCw size={13}/> Actualiser</button>
            <button className="btn btn-ghost btn-sm" onClick={exportCsv}><Download size={13}/> CSV</button>
          </div>
        </div>

        {/* Filtres */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-3">
          <div className="flex gap-1.5">
            {FILTERS_BTN.map(f=>(
              <button key={f.key} onClick={()=>{setFilter(f.key);setPage(1)}}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filter===f.key?f.color:'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <input className="form-control py-1.5 text-xs" style={{width:160}} placeholder="Table..."
            value={fTable} onChange={e=>{setFTable(e.target.value);setPage(1)}}/>
          <input className="form-control py-1.5 text-xs" style={{width:130}} placeholder="Utilisateur..."
            value={fUser} onChange={e=>{setFUser(e.target.value);setPage(1)}}/>
          <input type="date" className="form-control py-1.5 text-xs" style={{width:150}}
            value={fDate} onChange={e=>{setFDate(e.target.value);setPage(1)}}/>
          <input className="form-control py-1.5 text-xs" style={{width:190}} placeholder="🔍 Rechercher..."
            value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/>
        </div>

        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement du journal...">
          <div className="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-xs">
            {logs.length === 0
              ? <div className="p-12 text-center text-gray-400"><Database size={32} className="mx-auto mb-3 opacity-30"/>Aucune action trouvée</div>
              : logs.map(l => {
                  const am = ACTION_META[l.action] || ACTION_META.INSERT
                  return (
                    <div key={l.id} onClick={()=>setDetail(l)}
                      className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                      <span className="text-[10px] text-gray-400 w-32 flex-shrink-0 mt-0.5">{fmtDateTime(l.ts)}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0 ${am.bg} ${am.text}`}>{l.action}</span>
                      <span className="text-brand-blue flex-shrink-0">[{l.table}]</span>
                      <span className="text-brand-purple flex-shrink-0">{l.user_login}</span>
                      <span className="text-gray-600 dark:text-gray-400 flex-1 truncate">{l.detail}</span>
                      <Eye size={11} className="text-gray-300 flex-shrink-0 mt-0.5"/>
                    </div>
                  )
                })
            }
          </div>
          <Pagination page={page} total={total} perPage={PER} onChange={setPage}/>
        </ApiState>
      </div>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={()=>setDetail(null)} title="Détail de l'action" icon={Database}
        footer={<button className="btn btn-ghost" onClick={()=>setDetail(null)}>Fermer</button>}>
        {detail && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {[['Action', <span key="action" className={`font-black text-xs px-2 py-0.5 rounded ${(ACTION_META[detail.action]||ACTION_META.INSERT).bg} ${(ACTION_META[detail.action]||ACTION_META.INSERT).text}`}>{detail.action}</span>],
                ['Table',  <span key="table" className="font-mono text-brand-blue">{detail.table}</span>],
                ['Utilisateur', `${detail.user_login} (${detail.user_dept})`],
                ['Horodatage', fmtDateTime(detail.ts)]
              ].map(([k,v])=>(
                <div key={k}>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{k}</div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{v}</div>
                </div>
              ))}
            </div>
            {detail.detail && <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4 text-sm">{detail.detail}</div>}
            {(detail.donnees_avant || detail.donnees_apres) && (
              <div className="grid grid-cols-2 gap-3">
                {detail.donnees_avant && <div>
                  <div className="text-xs font-bold text-brand-red mb-1">🔴 Avant</div>
                  <pre className="text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded-lg overflow-auto max-h-36">{JSON.stringify(detail.donnees_avant,null,2)}</pre>
                </div>}
                {detail.donnees_apres && <div>
                  <div className="text-xs font-bold text-brand-green mb-1">🟢 Après</div>
                  <pre className="text-xs bg-green-50 dark:bg-green-900/20 p-3 rounded-lg overflow-auto max-h-36">{JSON.stringify(detail.donnees_apres,null,2)}</pre>
                </div>}
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  )
}