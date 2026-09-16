import { useState } from 'react'
import { Trash2, RefreshCw, Download, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { superviseurAPI } from '../../utils/api'
import Layout from '../../components/Layout/Layout'
import { StatCard, Pagination } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'

function fmtDT(ts) {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' }) }
  catch { return ts }
}

export default function SuperviseurDelete() {
  const [page,   setPage]   = useState(1)
  const [fTable, setFTable] = useState('')
  const [fDate,  setFDate]  = useState('')
  const [search, setSearch] = useState('')
  const PER = 20

  const params = () => {
    const p = new URLSearchParams({ action:'DELETE', page, page_size:PER })
    if (fTable)  p.set('table', fTable)
    if (fDate)   p.set('date_from', fDate)
    if (search)  p.set('search', search)
    return `?${p.toString()}`
  }

  const { data: logsData, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-delete', page, fTable, fDate, search],
    queryFn:  () => superviseurAPI.getLogs(params()),
    refetchInterval: 30000,
  })

  const logs  = logsData?.results || []
  const total = logsData?.count   || 0

  return (
    <Layout breadcrumb={['SITRAC','Superviseur','Journal DELETE']}>
      <div className="mb-5">
        <h1 className="page-title"><Trash2 size={22} className="text-brand-red"/> Journal des Suppressions (DELETE)</h1>
        <p className="page-sub flex items-center gap-2">
          Toutes les suppressions d'enregistrements — archivées selon RG 37
          <span className="flex items-center gap-1.5 text-xs font-bold text-brand-green">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse inline-block"/>
            Surveillance active
          </span>
        </p>
      </div>

      {total > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-5">
          <AlertTriangle size={18} className="text-brand-red flex-shrink-0"/>
          <p className="text-sm text-brand-red">
            <strong>{total} suppression{total > 1 ? 's' : ''}</strong> détectée{total > 1 ? 's' : ''} dans la base de données.
            Toutes sont archivées et traçables (RG 37).
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Trash2} value={total}       label="Total DELETE"  color="red"/>
        <StatCard icon={Trash2} value={logs.length} label="Cette page"    color="orange"/>
        <StatCard icon={Trash2}
          value={[...new Set(logs.map(l=>l.user_login))].length}
          label="Utilisateurs" color="blue"/>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Trash2 size={14} className="text-brand-red"/> Suppressions (archivées)
          </h3>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={refetch}><RefreshCw size={13}/> Actualiser</button>
            <button className="btn btn-ghost btn-sm"
              onClick={() => superviseurAPI.exportCsv('?action=DELETE')
                .catch(err => alert(`Échec de l'export CSV : ${err.message}`))}>
              <Download size={13}/> CSV
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-3">
          <input className="form-control py-1.5 text-xs w-40" placeholder="Table..."
            value={fTable} onChange={e=>{setFTable(e.target.value);setPage(1)}}/>
          <input type="date" className="form-control py-1.5 text-xs w-40"
            value={fDate} onChange={e=>{setFDate(e.target.value);setPage(1)}}/>
          <input className="form-control py-1.5 text-xs w-48" placeholder="🔍 Rechercher..."
            value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setFTable('');setFDate('');setSearch('');setPage(1)}}>
            Réinitialiser
          </button>
        </div>

        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement...">
          <div className="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Trash2 size={32} className="mx-auto mb-3 opacity-30"/>
                Aucune suppression trouvée
              </div>
            ) : logs.map(l => (
              <div key={l.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-red-50/50 dark:hover:bg-red-900/10">
                <span className="text-[10px] text-gray-400 w-36 flex-shrink-0 mt-0.5">{fmtDT(l.ts)}</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">DELETE</span>
                <span className="text-brand-blue flex-shrink-0">[{l.table}]</span>
                <span className="text-brand-purple flex-shrink-0">{l.user_login}</span>
                <span className="text-gray-500 dark:text-gray-400 flex-1 truncate">{l.detail}</span>
                {l.donnees_avant && (
                  <span className="text-[10px] text-red-300 flex-shrink-0">🗃 archivé</span>
                )}
              </div>
            ))}
          </div>
          <Pagination page={page} total={total} perPage={PER} onChange={setPage}/>
        </ApiState>
      </div>
    </Layout>
  )
}