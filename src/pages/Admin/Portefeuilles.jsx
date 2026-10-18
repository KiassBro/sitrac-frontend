/**
 * SITRAC — Portefeuilles commerciaux (RG 29) — Administration uniquement.
 *
 * Chaque client appartient à un commercial (« responsable ») : un agent Sales ne voit
 * que ses clients et leurs dossiers. Ici, l'Administration :
 *   - voit combien de clients et de prospects suit chaque commercial ;
 *   - transfère tout le portefeuille d'un commercial à un autre (congé, départ) ;
 *   - change le responsable d'un client précis.
 */
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowRightLeft, Briefcase, UserX, Users } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { Badge, Pagination, SearchInput } from '../../components/UI/index.jsx'
import { api } from '../../utils/api'
import { useConfirm } from '../../hooks/useConfirm'

const PAR_PAGE = 15

export default function Portefeuilles() {
  const { confirm } = useConfirm()
  const [donnees, setDonnees] = useState({ commerciaux: [], sans_responsable: { clients: 0, prospects: 0 } })
  const [transfert, setTransfert] = useState({ de: '', vers: '', prospects: true })
  const [enCours, setEnCours] = useState(false)
  const [filtre, setFiltre] = useState('')
  const [search, setSearch] = useState('')
  const [recherche, setRecherche] = useState('')
  const [page, setPage] = useState(1)
  const [clients, setClients] = useState({ results: [], count: 0 })
  const [chargement, setChargement] = useState(false)

  // GET /sales/clients/portefeuilles/ → { commerciaux: [{id, nom, departement, actif, clients, dossiers_en_cours,
  //   prospects_actifs}], sans_responsable: {clients, prospects_actifs} }
  const chargerCommerciaux = useCallback(() =>
    api.get('/sales/clients/portefeuilles/')
      .then((r) => setDonnees({
        commerciaux: r.commerciaux.map((c) => ({ ...c, nb_clients: c.clients, nb_prospects: c.prospects_actifs })),
        sans_responsable: { clients: r.sans_responsable.clients, prospects: r.sans_responsable.prospects_actifs },
      }))
      .catch((e) => toast.error(e.message)), [])

  const chargerClients = useCallback(() => {
    setChargement(true)
    const p = new URLSearchParams({ page, page_size: PAR_PAGE, ordering: 'nom' })
    if (filtre === 'aucun') p.set('sans_responsable', '1')
    else if (filtre) p.set('responsable', filtre)
    if (recherche) p.set('search', recherche)
    return api.get(`/sales/clients/?${p}`)
      .then((r) => setClients(Array.isArray(r) ? { results: r, count: r.length } : r))
      .catch((e) => toast.error(e.message))
      .finally(() => setChargement(false))
  }, [page, filtre, recherche])

  useEffect(() => { chargerCommerciaux() }, [chargerCommerciaux])
  useEffect(() => { chargerClients() }, [chargerClients])
  useEffect(() => { const h = setTimeout(() => { setRecherche(search); setPage(1) }, 300); return () => clearTimeout(h) }, [search])

  const actifs = donnees.commerciaux.filter((c) => c.actif)
  const nom = (id) => donnees.commerciaux.find((c) => String(c.id) === String(id))?.nom || '—'

  const transferer = () => {
    if (!transfert.de || !transfert.vers) return toast.error('Choisissez les deux commerciaux.')
    const source = donnees.commerciaux.find((c) => String(c.id) === String(transfert.de))
    confirm({
      icon: '🔁', type: 'warning', title: 'Transférer le portefeuille',
      msg: `Les ${source?.nb_clients || 0} client(s)${transfert.prospects ? ` et ${source?.nb_prospects || 0} prospect(s) en cours` : ''} `
        + `de ${nom(transfert.de)} seront confiés à ${nom(transfert.vers)}.`,
      confirmText: 'Oui, transférer', onConfirm: executerTransfert,
    })
  }

  const executerTransfert = async () => {
    setEnCours(true)
    try {
      const r = await api.post('/sales/clients/reattribuer/', {
        de: Number(transfert.de), vers: Number(transfert.vers), prospects: transfert.prospects,
      })
      toast.success(r.detail)
      setTransfert({ de: '', vers: '', prospects: true })
      chargerCommerciaux(); chargerClients()
    } catch (e) { toast.error(e.message) } finally { setEnCours(false) }
  }

  const changerResponsable = async (client, vers) => {
    try {
      await api.patch(`/sales/clients/${client.id}/`, { responsable: vers ? Number(vers) : null })
      toast.success(`${client.nom} : ${vers ? `confié à ${nom(vers)}` : 'sans responsable'}`)
      chargerCommerciaux(); chargerClients()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <Layout breadcrumb={['SITRAC', 'Administration', 'Portefeuilles commerciaux']}>
      <div className="mb-5">
        <h1 className="page-title"><Briefcase size={22} className="text-orange" /> Portefeuilles commerciaux</h1>
        <p className="page-sub">
          RG 29 : chaque commercial ne voit que ses clients et leurs dossiers. Booking, Finance, le Superviseur et
          l'Administration voient tout. Les clients sans responsable restent visibles par tous les commerciaux :
          le premier qui crée un dossier les prend en charge.
        </p>
      </div>

      {/* Commerciaux */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {donnees.commerciaux.map((c) => (
          <button key={c.id} type="button" onClick={() => { setFiltre(String(c.id)); setPage(1) }}
            className={`card card-body text-left transition hover:shadow-md ${String(c.id) === filtre ? 'ring-2 ring-orange' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{c.nom}</p>
                <p className="text-xs text-gray-500">{c.departement}</p>
              </div>
              {!c.actif && <Badge variant="inactive">Désactivé</Badge>}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm">
              <span><b className="text-lg text-gray-900 dark:text-white">{c.nb_clients}</b> <span className="text-gray-500">clients</span></span>
              <span><b className="text-lg text-gray-900 dark:text-white">{c.dossiers_en_cours}</b> <span className="text-gray-500">dossiers en cours</span></span>
              <span><b className="text-lg text-gray-900 dark:text-white">{c.nb_prospects}</b> <span className="text-gray-500">prospects</span></span>
            </div>
          </button>
        ))}
        <button type="button" onClick={() => { setFiltre('aucun'); setPage(1) }}
          className={`card card-body text-left transition hover:shadow-md ${filtre === 'aucun' ? 'ring-2 ring-orange' : ''}`}>
          <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><UserX size={16} className="text-gray-400" /> Sans responsable</p>
          <p className="text-xs text-gray-500">Visibles par tous les commerciaux</p>
          <div className="flex gap-5 mt-3 text-sm">
            <span><b className="text-lg text-gray-900 dark:text-white">{donnees.sans_responsable.clients}</b> <span className="text-gray-500">clients</span></span>
            <span><b className="text-lg text-gray-900 dark:text-white">{donnees.sans_responsable.prospects}</b> <span className="text-gray-500">prospects</span></span>
          </div>
        </button>
      </div>

      {/* Transfert en masse */}
      <div className="card mb-5">
        <div className="card-header">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><ArrowRightLeft size={17} className="text-orange" /> Transférer tout un portefeuille</h3>
          <span className="text-xs text-gray-500">Congé, départ, réorganisation</span>
        </div>
        <div className="card-body grid md:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
          <div>
            <label className="form-label" htmlFor="pf-de">Clients de</label>
            <select id="pf-de" className="form-control" value={transfert.de} onChange={(e) => setTransfert({ ...transfert, de: e.target.value })}>
              <option value="">— Choisir —</option>
              {donnees.commerciaux.filter((c) => c.nb_clients || c.nb_prospects).map((c) => (
                <option key={c.id} value={c.id}>{c.nom} ({c.nb_clients} clients){c.actif ? '' : ' — désactivé'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="pf-vers">Confiés à</label>
            <select id="pf-vers" className="form-control" value={transfert.vers} onChange={(e) => setTransfert({ ...transfert, vers: e.target.value })}>
              <option value="">— Choisir —</option>
              {actifs.filter((c) => String(c.id) !== transfert.de).map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm pb-2">
            <input type="checkbox" checked={transfert.prospects} onChange={(e) => setTransfert({ ...transfert, prospects: e.target.checked })} />
            Prospects en cours aussi
          </label>
          <button className="btn btn-primary" disabled={enCours || !transfert.de || !transfert.vers} onClick={transferer}>
            <ArrowRightLeft size={15} /> Transférer
          </button>
        </div>
      </div>

      {/* Clients, un par un */}
      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Users size={17} className="text-orange" /> Clients</h3>
          <div className="flex flex-wrap items-center gap-2">
            <select className="form-control !w-auto" value={filtre} onChange={(e) => { setFiltre(e.target.value); setPage(1) }} aria-label="Filtrer par commercial">
              <option value="">Tous les commerciaux</option>
              <option value="aucun">Sans responsable</option>
              {donnees.commerciaux.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <SearchInput value={search} onChange={setSearch} placeholder="Nom, email…" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Client</th><th>Nationalité</th><th>Email</th><th>Commercial responsable</th></tr></thead>
            <tbody>
              {chargement && <tr><td colSpan={4} className="text-gray-400">Chargement…</td></tr>}
              {!chargement && !clients.results.length && <tr><td colSpan={4} className="text-gray-400">Aucun client.</td></tr>}
              {!chargement && clients.results.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.titre} {c.nom}</td>
                  <td>{c.nationalite || '—'}</td>
                  <td className="text-xs">{c.email || '—'}</td>
                  <td>
                    <select className="form-control !py-1 !text-sm max-w-[16rem]" value={c.responsable || ''}
                      onChange={(e) => changerResponsable(c, e.target.value)} aria-label={`Responsable de ${c.nom}`}>
                      <option value="">— Sans responsable —</option>
                      {actifs.map((u) => <option key={u.id} value={u.id}>{u.nom}</option>)}
                      {c.responsable && !actifs.some((u) => u.id === c.responsable) && (
                        <option value={c.responsable}>{c.responsable_nom} (désactivé)</option>
                      )}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {clients.count > PAR_PAGE && (
          <div className="card-body pt-0"><Pagination page={page} total={clients.count} perPage={PAR_PAGE} onChange={setPage} /></div>
        )}
      </div>
    </Layout>
  )
}
