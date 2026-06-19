import { useState } from 'react'
import { Folder } from 'lucide-react'
import { useProgrammeClients } from '../../hooks/useApi'
import Layout from '../../components/Layout/Layout'
import { StatCard, Badge, Pagination, SearchInput } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate, fmt } from '../../utils/storage'

export default function DossierVenteBooking() {
  const { data: pcs = [], isLoading, error, refetch } = useProgrammeClients()
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)
  const PER = 10

  const filtered  = pcs.filter(p =>
    !search ||
    (p.client_nom||'').toLowerCase().includes(search.toLowerCase()) ||
    (p.programme_nom||'').toLowerCase().includes(search.toLowerCase())
  )
  const paginated = filtered.slice((page-1)*PER, page*PER)

  return (
    <Layout breadcrumb={['SITRAC','Booking','Lecture — Dossiers de Vente']}>
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="page-title"><Folder size={22} className="text-orange"/> Dossiers de Vente</h1>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-brand-blue">
            🔒 Lecture seule (RG 20)
          </span>
        </div>
        <p className="page-sub">
          Consultation des dossiers créés par Sales. Aucune modification possible depuis Booking.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Folder} value={pcs.length}                                label="Total dossiers"   color="orange"/>
        <StatCard icon={Folder} value={pcs.filter(p=>p.a_cotation).length}        label="Avec cotation"    color="blue"/>
        <StatCard icon={Folder} value={pcs.filter(p=>p.a_facture_pro).length}     label="Avec Facture Pro" color="green"/>
        <StatCard icon={Folder} value={pcs.reduce((s,p)=>s+(+p.nb_pax||1),0)}    label="Total PAX"        color="purple"/>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <Folder size={15} className="text-orange"/> Dossiers Clients (Sales)
          </h3>
          <SearchInput value={search} onChange={v=>{setSearch(v);setPage(1)}}/>
        </div>

        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th><th>Client</th><th>Programme</th><th>Nb PAX</th>
                  <th>Prix vente (€)</th><th>Date vente</th><th>Période</th>
                  <th>Cotation</th><th>Facture Pro</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center text-gray-400">
                    <Folder size={32} className="mx-auto mb-2 opacity-30"/>
                    Aucun dossier trouvé
                  </td></tr>
                ) : paginated.map(p => (
                  <tr key={p.id}>
                    <td><span className="font-mono text-xs text-gray-400">#{p.id}</span></td>
                    <td><strong className="text-gray-900 dark:text-white">{p.client_nom}</strong></td>
                    <td><Badge variant="info">{p.programme_nom}</Badge></td>
                    <td>{p.nb_pax}</td>
                    <td><strong>{(+p.prix_vente).toLocaleString('fr-FR')} €</strong></td>
                    <td className="text-sm text-gray-500">{fmtDate(p.date_vente)}</td>
                    <td className="text-xs text-gray-400">
                      {fmtDate(p.date_debut)} → {fmtDate(p.date_fin)}
                    </td>
                    <td>
                      {p.a_cotation
                        ? <Badge variant="active">✓ Oui</Badge>
                        : <Badge variant="inactive">Non</Badge>}
                    </td>
                    <td>
                      {p.a_facture_pro
                        ? <Badge variant="active">✓ Oui</Badge>
                        : <Badge variant="inactive">Non</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage}/>
        </ApiState>
      </div>

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-brand-blue">
          <strong>ℹ️ RG 20 :</strong> Booking consulte les dossiers Sales en lecture seule.
          Pour modifier, contactez le département Sales.
        </p>
      </div>
    </Layout>
  )
}