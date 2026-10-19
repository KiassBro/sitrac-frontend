import { useState } from 'react'
import { FolderOpen, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { bookingAPI } from '../../utils/api'
import Layout from '../../components/Layout/Layout'
import { StatCard, Badge, Pagination, SearchInput } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate } from '../../utils/storage'
import { Lock, Info } from 'lucide-react'

export default function DossierBookingFinance() {
  const [search, setSearch] = useState('')
  const [fEtat,  setFEtat]  = useState('')
  const [page,   setPage]   = useState(1)
  const PER = 10

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['brieffings-finance'],
    queryFn:  () => bookingAPI.getBrieffings(),
    select:   d  => d.results ?? d,
  })
  const brieffings = data || []

  const filtered  = brieffings.filter(b =>
    (!search || (b.client_nom||'').toLowerCase().includes(search.toLowerCase()) ||
                (b.programme_nom||'').toLowerCase().includes(search.toLowerCase()))
  )
  const paginated = filtered.slice((page-1)*PER, page*PER)

  // Stats
  const totalPax      = brieffings.reduce((s, b) => s + (+b.nb_pax||0), 0)
  const totalAdultes  = brieffings.reduce((s, b) => s + (+b.nb_adultes||0), 0)

  return (
    <Layout breadcrumb={['SITRAC','Finance','Lecture — Dossiers Booking']}>
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="page-title"><FolderOpen size={22} className="text-orange"/> Dossiers Booking</h1>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-brand-blue">
            <Lock size={11} className="inline -mt-px mr-1"/>Lecture seule
          </span>
        </div>
        <p className="page-sub">
          Consultation des brieffings créés par le département Booking.
          Aucune modification possible depuis Finance.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FolderOpen} value={brieffings.length}
          label="Total brieffings" color="orange"/>
        <StatCard icon={FolderOpen} value={totalPax}
          label="Total PAX" color="blue"/>
        <StatCard icon={FolderOpen} value={totalAdultes}
          label="Total adultes" color="green"/>
        <StatCard icon={FolderOpen} value={brieffings.filter(b => b.chauffeur).length}
          label="Avec chauffeur" color="purple"/>
      </div>

      {/* Filtres */}
      <div className="card mb-5">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Filtres</h3>
        </div>
        <div className="card-body">
          <div className="flex flex-wrap gap-3">
            <SearchInput
              value={search}
              onChange={v => { setSearch(v); setPage(1) }}
              placeholder="Rechercher client ou programme..."
            />
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setPage(1) }}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <FolderOpen size={15} className="text-orange"/> Brieffings (Booking)
          </h3>
          <span className="text-xs text-gray-400">
            {filtered.length} brieffing{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement des brieffings...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Programme</th>
                  <th>Date programme</th>
                  <th>Chauffeur</th>
                  <th>Guide</th>
                  <th>Voiture</th>
                  <th>Nb PAX</th>
                  <th>Adultes</th>
                  <th>Enfants</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      <FolderOpen size={32} className="mx-auto mb-2 opacity-30"/>
                      Aucun brieffing trouvé
                    </td>
                  </tr>
                ) : paginated.map(b => (
                  <tr key={b.id}>
                    <td>
                      <strong className="text-gray-900 dark:text-white">{b.client_nom || '—'}</strong>
                    </td>
                    <td><Badge variant="info">{b.programme_nom || '—'}</Badge></td>
                    <td className="text-sm text-gray-500">
                      {b.date_programme ? fmtDate(b.date_programme) : '—'}
                    </td>
                    <td className="text-sm">{b.chauffeur || '—'}</td>
                    <td className="text-sm">{b.guide     || '—'}</td>
                    <td className="text-sm">{b.voiture   || '—'}</td>
                    <td><Badge variant="info">{b.nb_pax || 0}</Badge></td>
                    <td>{b.nb_adultes || 0}</td>
                    <td>{b.nb_enfants || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage}/>
        </ApiState>
      </div>

      {/* Détail prestataires */}
      {brieffings.length > 0 && (
        <div className="card mt-5">
          <div className="card-header">
            <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
              Détail des Prestataires par Brieffing
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {brieffings.slice(0, 5).map(b => (
              <div key={b.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <strong className="text-sm text-gray-800 dark:text-gray-200">
                    {b.client_nom || '—'}
                  </strong>
                  <span className="text-xs text-gray-400">— {b.programme_nom || '—'}</span>
                </div>
                {b.lignes && b.lignes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="tbl text-xs">
                      <thead>
                        <tr>
                          <th>Prestataire</th>
                          <th>État</th>
                          <th>Type facture</th>
                          <th>Tarif (€)</th>
                          <th>Zone paiement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {b.lignes.map((l, i) => (
                          <tr key={i}>
                            <td><strong>{l.prestataire}</strong></td>
                            <td>
                              <Badge variant={
                                l.etat === 'OK_MAIL'  ? 'active'  :
                                l.etat === 'OK_PHONE' ? 'pending' : 'inactive'
                              }>
                                {l.etat === 'OK_MAIL'  ? 'OK Mail'      :
                                 l.etat === 'OK_PHONE' ? 'OK Téléphone' : 'Non confirmé'}
                              </Badge>
                            </td>
                            <td>{l.facture_type || '—'}</td>
                            <td>{(+l.tarif_paiement||0).toLocaleString('fr-FR')} €</td>
                            <td className="text-gray-400">{l.zone_paiement || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Aucun prestataire enregistré</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note lecture seule */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-brand-blue">
          <Info size={14} className="inline -mt-0.5 mr-1"/>Le département Finance consulte les dossiers Booking en lecture seule.
          Pour modifier un brieffing, contactez le département Booking.
        </p>
      </div>
    </Layout>
  )
}