import { useState } from 'react'
import { Folder, Search } from 'lucide-react'
import { useProgrammeClients, useClients } from '../../hooks/useApi'
import Layout from '../../components/Layout/Layout'
import { StatCard, Badge, Pagination, SearchInput } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate, fmt } from '../../utils/storage'

export default function DossierVenteFinance() {
  const { data: pcs     = [], isLoading, error, refetch } = useProgrammeClients()
  const { data: clients = [] } = useClients()

  const [search, setSearch] = useState('')
  const [fType,  setFType]  = useState('')
  const [page,   setPage]   = useState(1)
  const PER = 10

  const filtered  = pcs.filter(p =>
    (!search || (p.client_nom||'').toLowerCase().includes(search.toLowerCase()) ||
                (p.programme_nom||'').toLowerCase().includes(search.toLowerCase())) &&
    (!fType  || (fType === 'avec_cotation'  ? p.a_cotation  : !p.a_cotation) ||
                (fType === 'avec_fp'        ? p.a_facture_pro : !p.a_facture_pro))
  )
  const paginated = filtered.slice((page-1)*PER, page*PER)

  const totalCA = pcs.reduce((s, p) => s + (+p.prix_vente||0) * (+p.nb_pax||1), 0)

  return (
    <Layout breadcrumb={['SITRAC','Finance','Lecture — Dossiers de Vente']}>
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="page-title"><Folder size={22} className="text-orange"/> Dossiers de Vente</h1>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-brand-blue">
            🔒 Lecture seule (RG 21)
          </span>
        </div>
        <p className="page-sub">
          Consultation des dossiers clients créés par le département Sales.
          Aucune modification possible depuis Finance.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Folder} value={pcs.length}
          label="Total dossiers" color="orange"/>
        <StatCard icon={Folder} value={pcs.filter(p => p.a_cotation).length}
          label="Avec cotation" color="blue"/>
        <StatCard icon={Folder} value={pcs.filter(p => p.a_facture_pro).length}
          label="Avec Facture Pro" color="green"/>
        <StatCard icon={Folder} value={fmt(totalCA)}
          label="CA total (€)" color="purple"/>
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
            <select
              className="form-control w-52 py-2 text-sm"
              value={fType}
              onChange={e => { setFType(e.target.value); setPage(1) }}
            >
              <option value="">Tous les dossiers</option>
              <option value="avec_cotation">Avec cotation</option>
              <option value="avec_fp">Avec Facture Pro</option>
            </select>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setFType(''); setPage(1) }}
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
            <Folder size={15} className="text-orange"/> Liste des Dossiers Clients (Sales)
          </h3>
          <span className="text-xs text-gray-400">{filtered.length} dossier{filtered.length > 1 ? 's' : ''}</span>
        </div>

        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement des dossiers...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Programme</th>
                  <th>Nb PAX</th>
                  <th>Prix vente (€)</th>
                  <th>Date vente</th>
                  <th>Période</th>
                  <th>Cotation</th>
                  <th>Facture Pro</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      <Folder size={32} className="mx-auto mb-2 opacity-30"/>
                      Aucun dossier trouvé
                    </td>
                  </tr>
                ) : paginated.map(p => (
                  <tr key={p.id}>
                    <td><span className="text-xs font-mono text-gray-400">#{p.id}</span></td>
                    <td>
                      <strong className="text-gray-900 dark:text-white">{p.client_nom}</strong>
                    </td>
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

      {/* Note lecture seule */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-brand-blue">
          <strong>ℹ️ RG 21 :</strong> Le département Finance consulte les dossiers Sales en lecture seule.
          Pour modifier un dossier, contactez le département Sales.
        </p>
      </div>
    </Layout>
  )
}