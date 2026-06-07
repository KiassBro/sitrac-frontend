import { useState } from 'react'
import { History, Search, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { authAPI } from '../../utils/api'
import Layout from '../../components/Layout/Layout'
import { StatCard, Badge, Pagination } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'

const DEPT_COLORS = { Sales:'#F5A623', Booking:'#27AE60', Finance:'#2980B9', Administration:'#8E44AD', Superviseur:'#2C3E50' }

function fmtDateTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
  } catch { return ts }
}
function duration(start, end) {
  if (!start) return '—'
  const from = new Date(start)
  const to   = end ? new Date(end) : new Date()
  const ms   = to - from
  const min  = Math.floor(ms / 60000)
  if (min < 60) return `${min} min`
  return `${Math.floor(min/60)}h ${min%60}min`
}

export default function Historique() {
  const [search, setSearch] = useState('')
  const [fUser,  setFUser]  = useState('')
  const [page,   setPage]   = useState(1)
  const PER = 15

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sessions', page, fUser],
    queryFn:  () => {
      const p = new URLSearchParams({ page, page_size: PER })
      if (fUser) p.set('utilisateur', fUser)
      return authAPI.getSessions()
    },
  })

  const sessions = data?.results || data || []
  const total    = data?.count || sessions.length

  const filtered = sessions.filter(s =>
    !search || (s.utilisateur_login||'').toLowerCase().includes(search.toLowerCase())
  )

  const online   = filtered.filter(s => !s.date_deconnexion).length
  const today    = new Date().toLocaleDateString('fr-FR')
  const todaySess= filtered.filter(s => new Date(s.date_connexion).toLocaleDateString('fr-FR') === today).length

  return (
    <Layout breadcrumb={['SITRAC','Administration','Historique Sessions']}>
      <div className="mb-5">
        <h1 className="page-title"><History size={22} className="text-orange"/> Historique des Sessions</h1>
        <p className="page-sub">Journal des connexions et déconnexions des utilisateurs</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={History} value={total} label="Total sessions" color="orange"/>
        <StatCard icon={History} value={online} label="En ligne" color="green"/>
        <StatCard icon={History} value={todaySess} label="Aujourd'hui" color="blue"/>
        <StatCard icon={History} value={filtered.filter(s=>s.date_deconnexion).length} label="Terminées" color="purple"/>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Journal des Connexions</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Rechercher un utilisateur..." className="form-control pl-8 w-52 text-xs py-2"/>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={refetch}><RefreshCw size={13}/> Actualiser</button>
          </div>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement des sessions...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Utilisateur</th><th>Connexion</th><th>Déconnexion</th>
                  <th>Durée</th><th>IP</th><th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-400">Aucune session enregistrée</td></tr>
                ) : filtered.map(s => {
                  const color = DEPT_COLORS['Administration'] || '#8E44AD'
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                            style={{ background: color }}>
                            {(s.utilisateur_login||'?')[0].toUpperCase()}
                          </div>
                          <strong className="text-gray-900 dark:text-white">{s.utilisateur_login}</strong>
                        </div>
                      </td>
                      <td className="text-sm text-gray-600 dark:text-gray-300">{fmtDateTime(s.date_connexion)}</td>
                      <td className="text-sm text-gray-600 dark:text-gray-300">
                        {s.date_deconnexion ? fmtDateTime(s.date_deconnexion) : <span className="text-brand-green text-xs font-bold">En ligne</span>}
                      </td>
                      <td className="text-xs text-gray-500">{duration(s.date_connexion, s.date_deconnexion)}</td>
                      <td className="font-mono text-xs text-gray-400">{s.ip_address || '—'}</td>
                      <td>
                        {s.date_deconnexion
                          ? <Badge variant="inactive">Terminée</Badge>
                          : <Badge variant="active">Active</Badge>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} perPage={PER} onChange={setPage}/>
        </ApiState>
      </div>
    </Layout>
  )
}
