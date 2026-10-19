import { useState, useRef, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { User, Plus, Pencil, Trash2, Users, FileText, Printer } from 'lucide-react'
import { useClients, useClientMutations } from '../../hooks/useApi'
import { salesAPI } from '../../utils/api'
import { useConfirm } from '../../hooks/useConfirm'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import { Modal, StatCard, Pagination, SearchInput, Badge, Alert } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate } from '../../utils/storage'
import GIPrintModal from '../../components/PDF/GIPrintModal'
import ChampPays from '../../components/UI/ChampPays'
import ChampTelephone from '../../components/UI/ChampTelephone'
import { usePays } from '../../utils/referentielsApi'

const TITRES = ['Monsieur', 'Madame', 'Mademoiselle']
const TYPES  = ['Individuel', 'Mini-groupe', 'Groupe', 'Famille']
const TABS = [
  { key: 'civil',    label: 'État Civil'  },
  { key: 'vol',      label: 'Vols'        },
  { key: 'contacts', label: 'Contacts'    },
  { key: 'groupe',   label: 'Groupe'      },
]

const EMPTY = {
  titre: 'Monsieur', nom: '', nationalite: '',
  date_naissance: '', num_document: '',
  adresse: '', code_postal: '', ville: '', pays: '',
  telephone: '', email: '',
  assurance_voyage: '', assurance_sante: '',
  urgence_nom: '', urgence_tel: '', observation_med: '',
  vol_arr_dep: '', vol_arr_dest: '', vol_arr_date: '', vol_arr_cie: '',
  vol_dep_dep: '', vol_dep_dest: '', vol_dep_date: '', vol_dep_cie: '',
  type_groupe: 'Individuel', nb_pax: 1,
}

// SVG icônes inline pour le PDF (remplace les emojis)
const SVG_PLANE_ARR = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.6-.6 1.1l1.5 2.5c.2.4.7.5 1.1.3L8 8.5l-1 4.5-3 1.5c-.4.2-.5.7-.3 1.1l.8 1.4c.3.5.9.6 1.3.3L9 15l3.5 4.5c.3.4.8.5 1.2.3l2.5-1c.6-.2.8-.9.6-1.6z"/></svg>`
const SVG_PLANE_DEP = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.6-.6 1.1l1.5 2.5c.2.4.7.5 1.1.3L8 8.5l-1 4.5-3 1.5c-.4.2-.5.7-.3 1.1l.8 1.4c.3.5.9.6 1.3.3L9 15l3.5 4.5c.3.4.8.5 1.2.3l2.5-1c.6-.2.8-.9.6-1.6z"/></svg>`

// Logo SVG Ramartour Madagascar
const LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54">
  <rect width="54" height="54" rx="10" fill="#F5A623"/>
  <text x="27" y="22" text-anchor="middle" font-family="Arial,sans-serif"
        font-weight="900" font-size="11" fill="white" letter-spacing="1">RAMAR</text>
  <text x="27" y="34" text-anchor="middle" font-family="Arial,sans-serif"
        font-weight="900" font-size="11" fill="white" letter-spacing="1">TOUR</text>
  <text x="27" y="46" text-anchor="middle" font-family="Arial,sans-serif"
        font-weight="700" font-size="6.5" fill="rgba(255,255,255,0.85)" letter-spacing="0.5">MADAGASCAR</text>
  <!-- avion décoratif -->
  <path d="M18 27 L32 21 L34 23 L26 26 L28 31 L31 30 L32 32 L26 33 L24 29 L18 29 Z"
        fill="rgba(255,255,255,0.35)"/>
</svg>`

// ─── Page principale ──────────────────────────────────────────
export default function InformationsGenerales() {
  const { data: clients = [], isLoading, error, refetch } = useClients()
  const { create, update, remove, addPax, delPax } = useClientMutations()
  const { confirmDelete, confirmSave } = useConfirm()

  const [search,         setSearch]         = useState('')
  const [fNat,           setFNat]           = useState('')
  const [fType,          setFType]          = useState('')
  const [page,           setPage]           = useState(1)
  const [leaderModal,    setLeaderModal]    = useState(false)
  const [leaderTab,      setLeaderTab]      = useState('civil')
  const [editLeader,     setEditLeader]     = useState(null)
  const [loadingEdit,    setLoadingEdit]    = useState(false)
  const [paxListModal,   setPaxListModal]   = useState(false)
  const [paxModal,       setPaxModal]       = useState(false)
  const [curLeaderId,    setCurLeaderId]    = useState(null)
  const [curLeaderFull,  setCurLeaderFull]  = useState(null)
  const [loadingPaxList, setLoadingPaxList] = useState(false)
  const [printClient,    setPrintClient]    = useState(null)
  const [loadingPrint,   setLoadingPrint]   = useState(false)
  const PER = 8

  // State contrôlé pour le formulaire leader
  const [fd, setFd] = useState(EMPTY)
  const setF = (field, value) => setFd(prev => ({ ...prev, [field]: value }))
  const inp = (field, extra = {}) => ({
    value: fd[field] ?? '',
    onChange: e => setF(field, e.target.value),
    ...extra,
  })
  const sel = (field) => ({
    value: fd[field] ?? '',
    onChange: e => setF(field, e.target.value),
  })

  const { register: regP, handleSubmit: subP, reset: resetP, control: ctrlP } = useForm()

  // Référentiel pays : l'indicatif téléphonique suit le pays de résidence, sinon la nationalité
  const referentiel = usePays()
  const codeTel = (paysNom, nationalite) =>
    referentiel.depuisPays(paysNom)?.code || referentiel.depuisNationalite(nationalite)?.code || 'MG'

  // Filtre : nationalités réellement présentes parmi les clients
  const natios = useMemo(
    () => [...new Set(clients.map(c => c.nationalite).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')),
    [clients])

  const filtered  = clients.filter(c =>
    (!search || c.nom.toLowerCase().includes(search.toLowerCase())) &&
    (!fNat   || c.nationalite === fNat) &&
    (!fType  || c.type_groupe === fType)
  )
  const paginated = filtered.slice((page-1)*PER, page*PER)

  // ── Ouvrir ajout ──────────────────────────────────────────────
  const openAddLeader = () => {
    setFd({ ...EMPTY })
    setEditLeader(null)
    setLeaderTab('civil')
    setLeaderModal(true)
  }

  // ── Ouvrir modification — charge le détail complet ────────────
  const openEditLeader = async (c) => {
    setLoadingEdit(true)
    try {
      const full = await salesAPI.getClient(c.id)
      setFd({
        titre:            full.titre            || 'Monsieur',
        nom:              full.nom              || '',
        nationalite:      full.nationalite      || '',
        date_naissance:   full.date_naissance   || '',
        num_document:     full.num_document     || '',
        adresse:          full.adresse          || '',
        code_postal:      full.code_postal      || '',
        ville:            full.ville            || '',
        pays:             full.pays             || '',
        telephone:        full.telephone        || '',
        email:            full.email            || '',
        assurance_voyage: full.assurance_voyage || '',
        assurance_sante:  full.assurance_sante  || '',
        urgence_nom:      full.urgence_nom      || '',
        urgence_tel:      full.urgence_tel      || '',
        observation_med:  full.observation_med  || '',
        vol_arr_dep:      full.vol_arr_dep      || '',
        vol_arr_dest:     full.vol_arr_dest     || '',
        vol_arr_date:     full.vol_arr_date     || '',
        vol_arr_cie:      full.vol_arr_cie      || '',
        vol_dep_dep:      full.vol_dep_dep      || '',
        vol_dep_dest:     full.vol_dep_dest     || '',
        vol_dep_date:     full.vol_dep_date     || '',
        vol_dep_cie:      full.vol_dep_cie      || '',
        type_groupe:      full.type_groupe      || 'Individuel',
        nb_pax:           full.nb_pax           || 1,
      })
      setEditLeader(full)
      setLeaderTab('civil')
      setLeaderModal(true)
    } catch {
      toast.error('Erreur lors du chargement du client')
    } finally {
      setLoadingEdit(false)
    }
  }

  // ── Enregistrer leader ────────────────────────────────────────
  const saveLeader = () => {
    if (!fd.nom.trim())         { toast.error('Le nom est obligatoire');         return }
    if (!fd.nationalite.trim()) { toast.error('La nationalité est obligatoire'); return }
    const payload = { ...fd, nb_pax: +fd.nb_pax || 1 }
    // Une date laissée vide doit partir à null (le serveur refuse une chaîne vide)
    for (const champ of ['date_naissance', 'vol_arr_date', 'vol_dep_date']) {
      if (!payload[champ]) payload[champ] = null
    }
    const doSave  = () => {
      const opts = { onSuccess: () => { setLeaderModal(false); refetch() } }
      if (editLeader) update.mutate({ id: editLeader.id, data: payload }, opts)
      else            create.mutate(payload, opts)
    }
    if (editLeader) confirmSave(doSave); else doSave()
  }

  // ── Ouvrir liste PAX — charge le détail complet avec PAX ──────
  const openPaxList = async (id) => {
    setCurLeaderId(id)
    setLoadingPaxList(true)
    try {
      const full = await salesAPI.getClient(id)
      setCurLeaderFull(full)
      setPaxListModal(true)
    } catch {
      toast.error('Erreur lors du chargement des PAX')
    } finally {
      setLoadingPaxList(false)
    }
  }

  // ── Rafraîchir PAX ────────────────────────────────────────────
  const refreshPaxList = async () => {
    if (!curLeaderId) return
    try {
      const full = await salesAPI.getClient(curLeaderId)
      setCurLeaderFull(full)
    } catch { /* silencieux */ }
  }

  // ── Ouvrir PDF — charge le détail complet avant impression ──
  const openPrint = async (c) => {
    setLoadingPrint(true)
    try {
      const full = await salesAPI.getClient(c.id)
      setPrintClient(full)
    } catch {
      toast.error('Erreur lors du chargement de la fiche')
    } finally {
      setLoadingPrint(false)
    }
  }

  const openAddPax = () => {
    resetP({
      titre: 'Monsieur', nom: '', nationalite: '', date_naissance: '',
      num_document: '', adresse: '', ville: '', telephone: '', email: '',
      observation_med: '',
    })
    setPaxModal(true)
  }

  const savePax = (data) => {
    if (!data.date_naissance) data = { ...data, date_naissance: null }
    addPax.mutate({ clientId: curLeaderId, data }, {
      onSuccess: () => {
        setPaxModal(false)
        refreshPaxList()
        toast.success('PAX ajouté avec succès')
      },
      onError: e => toast.error(e.message || 'Erreur lors de l\'ajout'),
    })
  }

  const Spinner = () => (
    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
    </svg>
  )

  return (
    <Layout breadcrumb={['SITRAC','Sales','Dossier Client','Informations Générales']}>
      <div className="mb-5">
        <h1 className="page-title">
          <User size={22} className="text-orange"/> Informations Générales (GI)
        </h1>
        <p className="page-sub">Gestion des clients leaders et leurs participants</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} value={clients.length} label="Total clients" color="orange"/>
        <StatCard icon={User}
          value={clients.filter(c => c.type_groupe === 'Individuel').length}
          label="Individuels" color="green"/>
        <StatCard icon={Users}
          value={clients.filter(c => c.type_groupe === 'Groupe').length}
          label="Groupes" color="blue"/>
        <StatCard icon={Users}
          value={clients.reduce((s, c) => s + (c.nb_pax||1), 0)}
          label="Total PAX" color="purple"/>
      </div>

      {/* Filtres */}
      <div className="card mb-5">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Filtres</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SearchInput value={search}
              onChange={v => { setSearch(v); setPage(1) }}
              placeholder="Rechercher un client..."/>
            <select className="form-control py-2 text-sm" value={fNat}
              onChange={e => { setFNat(e.target.value); setPage(1) }}>
              <option value="">Toutes nationalités</option>
              {natios.map(n => <option key={n}>{n}</option>)}
            </select>
            <select className="form-control py-2 text-sm" value={fType}
              onChange={e => { setFType(e.target.value); setPage(1) }}>
              <option value="">Tous types</option>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setFNat(''); setFType(''); setPage(1) }}>
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm flex items-center gap-2
            text-gray-800 dark:text-gray-200">
            <User size={15} className="text-orange"/> Clients Leaders
          </h3>
          <button className="btn btn-primary btn-sm" onClick={openAddLeader}>
            <Plus size={14}/> Ajouter
          </button>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch}
          loadingText="Chargement des clients...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nom</th><th>PAX</th><th>Nationalité</th>
                  <th>Téléphone</th><th>Email</th><th>Type</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Aucun client
                    </td>
                  </tr>
                ) : paginated.map(c => (
                  <tr key={c.id}>
                    <td>
                      <strong className="text-gray-900 dark:text-white">
                        {c.titre} {c.nom}
                      </strong>
                    </td>
                    <td><Badge variant="info">{c.nb_pax||1}</Badge></td>
                    <td className="text-sm">{c.nationalite}</td>
                    <td className="text-xs text-gray-500">{c.telephone||'—'}</td>
                    <td className="text-xs text-gray-500 max-w-[140px] truncate">
                      {c.email||'—'}
                    </td>
                    <td><Badge variant="pending">{c.type_groupe}</Badge></td>
                    <td>
                      <div className="flex items-center justify-center gap-1">

                        {/* Modifier */}
                        <button className="btn btn-ghost btn-xs"
                          onClick={() => openEditLeader(c)}
                          disabled={loadingEdit} title="Modifier">
                          {loadingEdit ? <Spinner/> : <Pencil size={12}/>}
                        </button>

                        {/* PAX */}
                        <button className="btn btn-info btn-xs"
                          onClick={() => openPaxList(c.id)}
                          disabled={loadingPaxList} title="Gérer PAX">
                          {loadingPaxList ? <Spinner/> : <Users size={12}/>}
                        </button>

                        {/* PDF GI — charge le détail complet */}
                        <button className="btn btn-xs"
                          style={{ background: '#1a1a1a', color: 'white' }}
                          onClick={() => openPrint(c)}
                          disabled={loadingPrint} title="Imprimer Fiche GI">
                          {loadingPrint ? <Spinner/> : <FileText size={12}/>}
                        </button>

                        {/* Supprimer */}
                        <button className="btn btn-danger btn-xs"
                          onClick={() => confirmDelete(c.nom, () =>
                            remove.mutate(c.id, { onSuccess: () => refetch() })
                          )} title="Supprimer">
                          <Trash2 size={12}/>
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage}/>
        </ApiState>
      </div>

      {/* Modal PDF GI */}
      <GIPrintModal
        client={printClient}
        open={!!printClient}
        onClose={() => setPrintClient(null)}
      />

      {/* Modal Leader */}
      <Modal open={leaderModal} onClose={() => setLeaderModal(false)}
        title={editLeader
          ? `Modifier — ${editLeader.titre} ${editLeader.nom}`
          : 'Ajouter un Client Leader'}
        icon={User} size="lg"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setLeaderModal(false)}>
            Annuler
          </button>
          <button className="btn btn-success" onClick={saveLeader}
            disabled={create.isPending || update.isPending}>
            {create.isPending || update.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </>}
      >
        {/* Onglets */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setLeaderTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px
                whitespace-nowrap transition-colors
                ${leaderTab === t.key
                  ? 'border-orange text-orange'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* État Civil */}
        {leaderTab === 'civil' && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Titre</label>
                <select className="form-control" {...sel('titre')}>
                  {TITRES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nom <span className="form-req">*</span></label>
                <input className="form-control" placeholder="Nom de famille" {...inp('nom')}/>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Nationalité <span className="form-req">*</span>
                </label>
                <ChampPays mode="nationalite" value={fd.nationalite}
                  onChange={v => setF('nationalite', v)} effacable={false}/>
              </div>
              <div className="form-group">
                <label className="form-label">Date de naissance</label>
                <input type="date" className="form-control" {...inp('date_naissance')}/>
              </div>
              <div className="form-group">
                <label className="form-label">N° Passeport / CIN</label>
                <input className="form-control" placeholder="Numéro du document"
                  {...inp('num_document')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Adresse</label>
                <input className="form-control" placeholder="Adresse postale"
                  {...inp('adresse')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Code Postal</label>
                <input className="form-control" placeholder="Code postal"
                  {...inp('code_postal')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Ville</label>
                <input className="form-control" placeholder="Ville" {...inp('ville')}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Pays</label>
              <ChampPays mode="pays" value={fd.pays} onChange={v => setF('pays', v)}
                placeholder="Pays de résidence"/>
            </div>
          </div>
        )}

        {/* Vols */}
        {leaderTab === 'vol' && (
          <div>
            <Alert type="info">Informations de vol communes pour tout le groupe.</Alert>
            <p className="font-semibold text-sm text-brand-green mb-3 mt-3">
              Vol d'Arrivée
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Départ de</label>
                <input className="form-control" placeholder="Ville de départ"
                  {...inp('vol_arr_dep')}/>
              </div>
              <div className="form-group">
                <label className="form-label">À destination de</label>
                <input className="form-control" placeholder="Ville d'arrivée"
                  {...inp('vol_arr_dest')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Date d'arrivée</label>
                <input type="date" className="form-control" {...inp('vol_arr_date')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Compagnie</label>
                <input className="form-control" placeholder="Ex: Air Madagascar"
                  {...inp('vol_arr_cie')}/>
              </div>
            </div>
            <p className="font-semibold text-sm text-orange mb-3 mt-5">
              Vol de Départ
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Départ de</label>
                <input className="form-control" placeholder="Ville de départ"
                  {...inp('vol_dep_dep')}/>
              </div>
              <div className="form-group">
                <label className="form-label">À destination de</label>
                <input className="form-control" placeholder="Ville d'arrivée"
                  {...inp('vol_dep_dest')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Date de départ</label>
                <input type="date" className="form-control" {...inp('vol_dep_date')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Compagnie</label>
                <input className="form-control" placeholder="Ex: Air Madagascar"
                  {...inp('vol_dep_cie')}/>
              </div>
            </div>
          </div>
        )}

        {/* Contacts */}
        {leaderTab === 'contacts' && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <ChampTelephone value={fd.telephone} onChange={v => setF('telephone', v)}
                  paysDefaut={codeTel(fd.pays, fd.nationalite)}/>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control"
                  placeholder="email@exemple.com" {...inp('email')}/>
              </div>
              <div className="form-group">
                <label className="form-label">N° Assurance Voyage</label>
                <input className="form-control" placeholder="Numéro de police"
                  {...inp('assurance_voyage')}/>
              </div>
              <div className="form-group">
                <label className="form-label">N° Assurance Santé</label>
                <input className="form-control" placeholder="Numéro de police"
                  {...inp('assurance_sante')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Contact Urgence (Nom)</label>
                <input className="form-control" placeholder="Nom du contact"
                  {...inp('urgence_nom')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Contact Urgence (Tél)</label>
                <ChampTelephone value={fd.urgence_tel} onChange={v => setF('urgence_tel', v)}
                  paysDefaut={codeTel(fd.pays, fd.nationalite)}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Observation médicale</label>
              <textarea className="form-control" rows={3}
                placeholder="Allergies, traitements, régimes..."
                value={fd.observation_med ?? ''}
                onChange={e => setF('observation_med', e.target.value)}/>
            </div>
          </div>
        )}

        {/* Groupe */}
        {leaderTab === 'groupe' && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">
                  Type de groupe <span className="form-req">*</span>
                </label>
                <select className="form-control" {...sel('type_groupe')}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Nb PAX (avec leader) <span className="form-req">*</span>
                </label>
                <input type="number" className="form-control" min={1}
                  value={fd.nb_pax ?? 1}
                  onChange={e => setF('nb_pax', +e.target.value || 1)}/>
              </div>
            </div>
            <Alert type="warning">
              Le leader est inclus dans le nombre PAX.
              Les autres participants se gèrent via le bouton PAX.
            </Alert>
          </div>
        )}
      </Modal>

      {/* Modal PAX List */}
      <Modal open={paxListModal} onClose={() => setPaxListModal(false)}
        title={`PAX — ${curLeaderFull?.nom || ''}`}
        icon={Users} size="lg"
        footer={<>
          <button className="btn btn-primary" onClick={openAddPax}>
            <Plus size={14}/> Ajouter un PAX
          </button>
          <button className="btn btn-ghost" onClick={() => setPaxListModal(false)}>
            Fermer
          </button>
        </>}
      >
        {curLeaderFull && (
          <div className="flex items-center gap-3 p-3 bg-orange/10 rounded-xl mb-4 text-sm">
            <User size={16} className="text-orange flex-shrink-0"/>
            <span>
              <strong>{curLeaderFull.titre} {curLeaderFull.nom}</strong>
              {' '}— {curLeaderFull.type_groupe}
              {' '}— PAX déclarés : <strong>{curLeaderFull.nb_pax||1}</strong>
              {' '}— Enregistrés : <strong>{(curLeaderFull.pax||[]).length + 1}</strong>
              {' '}(leader inclus)
            </span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th><th>Nom</th><th>Nationalité</th>
                <th>Téléphone</th><th>Email</th><th>Passeport</th>
                <th className="text-center">Sup.</th>
              </tr>
            </thead>
            <tbody>
              {curLeaderFull && (
                <tr className="bg-orange/5">
                  <td><span className="text-[10px] font-bold text-orange">LEADER</span></td>
                  <td>
                    <strong className="text-gray-900 dark:text-white">
                      {curLeaderFull.titre} {curLeaderFull.nom}
                    </strong>
                  </td>
                  <td className="text-sm">{curLeaderFull.nationalite||'—'}</td>
                  <td className="text-xs text-gray-500">{curLeaderFull.telephone||'—'}</td>
                  <td className="text-xs text-gray-500">{curLeaderFull.email||'—'}</td>
                  <td className="text-xs text-gray-400 font-mono">
                    {curLeaderFull.num_document||'—'}
                  </td>
                  <td className="text-center">
                    <span className="text-xs text-gray-300">—</span>
                  </td>
                </tr>
              )}
              {!curLeaderFull?.pax?.length ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400 text-sm italic">
                    Aucun participant PAX — cliquer sur "Ajouter un PAX"
                  </td>
                </tr>
              ) : curLeaderFull.pax.map((p, i) => (
                <tr key={p.id}>
                  <td className="text-xs text-gray-400">{i+1}</td>
                  <td>
                    <strong className="text-gray-900 dark:text-white">
                      {p.titre} {p.nom}
                    </strong>
                  </td>
                  <td className="text-sm">{p.nationalite||'—'}</td>
                  <td className="text-xs text-gray-500">{p.telephone||'—'}</td>
                  <td className="text-xs text-gray-500">{p.email||'—'}</td>
                  <td className="text-xs text-gray-400 font-mono">{p.num_document||'—'}</td>
                  <td className="text-center">
                    <button className="btn btn-danger btn-xs"
                      onClick={() => confirmDelete(
                        `${p.titre} ${p.nom}`,
                        () => delPax.mutate(
                          { clientId: curLeaderId, paxId: p.id },
                          {
                            onSuccess: () => {
                              refreshPaxList()
                              toast.success('PAX supprimé')
                            },
                            onError: e => toast.error(e.message),
                          }
                        )
                      )}>
                      <Trash2 size={11}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Modal Add PAX */}
      <Modal open={paxModal} onClose={() => setPaxModal(false)}
        title="Ajouter un Participant PAX" icon={User}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setPaxModal(false)}>
            Annuler
          </button>
          <button className="btn btn-success" onClick={subP(savePax, () => toast.error('Le nom et la nationalité sont obligatoires'))}
            disabled={addPax.isPending}>
            {addPax.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Titre</label>
            <select className="form-control" {...regP('titre')}>
              {TITRES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nom <span className="form-req">*</span></label>
            <input className="form-control" {...regP('nom', { required: true })}/>
          </div>
          <div className="form-group">
            <label className="form-label">
              Nationalité <span className="form-req">*</span>
            </label>
            <Controller name="nationalite" control={ctrlP} rules={{ required: true }}
              render={({ field }) => (
                <ChampPays mode="nationalite" value={field.value} onChange={v => field.onChange(v)}
                  effacable={false}/>
              )}/>
          </div>
          <div className="form-group">
            <label className="form-label">Date de naissance</label>
            <input type="date" className="form-control" {...regP('date_naissance')}/>
          </div>
          <div className="form-group">
            <label className="form-label">N° Passeport / CIN</label>
            <input className="form-control" {...regP('num_document')}/>
          </div>
          <div className="form-group">
            <label className="form-label">Téléphone</label>
            <Controller name="telephone" control={ctrlP}
              render={({ field }) => (
                <ChampTelephone value={field.value} onChange={v => field.onChange(v)}
                  paysDefaut={codeTel(curLeaderFull?.pays, curLeaderFull?.nationalite)}/>
              )}/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-control" {...regP('email')}/>
        </div>
        <div className="form-group">
          <label className="form-label">Observation médicale</label>
          <textarea className="form-control" rows={2}
            placeholder="Allergies, traitements..."
            {...regP('observation_med')}/>
        </div>
      </Modal>
    </Layout>
  )
}
