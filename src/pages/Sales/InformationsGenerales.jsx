import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { User, Plus, Pencil, Trash2, Users, FileText } from 'lucide-react'
import { useClients, useClientMutations } from '../../hooks/useApi'
import { useConfirm } from '../../hooks/useConfirm'
import Layout from '../../components/Layout/Layout'
import { Modal, StatCard, Pagination, SearchInput, Badge, Alert } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'

const TITRES = ['Monsieur','Madame','Mademoiselle']
const TYPES  = ['Individuel','Mini-groupe','Groupe','Famille']
const NATIOS = ['Française','Malgache','Belge','Allemande','Américaine','Italienne','Anglaise','Espagnole','Autre']
const TABS   = [
  { key:'civil',    label:'État Civil'   },
  { key:'vol',      label:'Vols'         },
  { key:'contacts', label:'Contacts'     },
  { key:'groupe',   label:'Groupe'       },
]

export default function InformationsGenerales() {
  const { data: clients = [], isLoading, error, refetch } = useClients()
  const { create, update, remove, addPax, delPax } = useClientMutations()
  const { confirmDelete, confirmSave } = useConfirm()

  const [search, setSearch] = useState('')
  const [fNat,   setFNat]   = useState('')
  const [fType,  setFType]  = useState('')
  const [page,   setPage]   = useState(1)
  const PER = 8

  const [leaderModal, setLeaderModal] = useState(false)
  const [leaderTab,   setLeaderTab]   = useState('civil')
  const [editLeader,  setEditLeader]  = useState(null)
  const [paxListModal, setPaxListModal] = useState(false)
  const [paxModal,     setPaxModal]     = useState(false)
  const [curLeaderId,  setCurLeaderId]  = useState(null)

  const { register: regL, handleSubmit: subL, reset: resetL } = useForm()
  const { register: regP, handleSubmit: subP, reset: resetP } = useForm()

  const filtered  = clients.filter(c =>
    (!search || c.nom.toLowerCase().includes(search.toLowerCase())) &&
    (!fNat   || c.nationalite === fNat) &&
    (!fType  || c.type_groupe === fType)
  )
  const paginated = filtered.slice((page-1)*PER, page*PER)

  const openAddLeader = () => {
    setEditLeader(null); setLeaderTab('civil')
    resetL({ titre:'Monsieur', nom:'', nationalite:'', date_naissance:'', num_document:'',
             adresse:'', code_postal:'', ville:'', pays:'', telephone:'', email:'',
             assurance_voyage:'', assurance_sante:'', urgence_nom:'', urgence_tel:'', observation_med:'',
             vol_arr_dep:'', vol_arr_dest:'', vol_arr_date:'', vol_arr_cie:'',
             vol_dep_dep:'', vol_dep_dest:'', vol_dep_date:'', vol_dep_cie:'',
             type_groupe:'Individuel', nb_pax:1 })
    setLeaderModal(true)
  }
  const openEditLeader = (c) => {
    setEditLeader(c); setLeaderTab('civil')
    resetL({ titre:c.titre||'Monsieur', nom:c.nom||'', nationalite:c.nationalite||'',
             date_naissance:c.date_naissance||'', num_document:c.num_document||'',
             adresse:c.adresse||'', code_postal:c.code_postal||'', ville:c.ville||'', pays:c.pays||'',
             telephone:c.telephone||'', email:c.email||'',
             assurance_voyage:c.assurance_voyage||'', assurance_sante:c.assurance_sante||'',
             urgence_nom:c.urgence_nom||'', urgence_tel:c.urgence_tel||'', observation_med:c.observation_med||'',
             vol_arr_dep:c.vol_arr_dep||'', vol_arr_dest:c.vol_arr_dest||'',
             vol_arr_date:c.vol_arr_date||'', vol_arr_cie:c.vol_arr_cie||'',
             vol_dep_dep:c.vol_dep_dep||'', vol_dep_dest:c.vol_dep_dest||'',
             vol_dep_date:c.vol_dep_date||'', vol_dep_cie:c.vol_dep_cie||'',
             type_groupe:c.type_groupe||'Individuel', nb_pax:c.nb_pax||1 })
    setLeaderModal(true)
  }

  const saveLeader = (data) => {
    const payload = { ...data, nb_pax: +data.nb_pax || 1 }
    const doSave  = () => {
      const opts = { onSuccess: () => setLeaderModal(false) }
      if (editLeader) update.mutate({ id: editLeader.id, data: payload }, opts)
      else            create.mutate(payload, opts)
    }
    if (editLeader) confirmSave(doSave); else doSave()
  }

  const openPaxList = (id) => { setCurLeaderId(id); setPaxListModal(true) }
  const openAddPax  = () => {
    resetP({ titre:'Monsieur', nom:'', nationalite:'', date_naissance:'', num_document:'', adresse:'', ville:'', telephone:'', email:'', observation_med:'' })
    setPaxModal(true)
  }
  const savePax = (data) => {
    addPax.mutate({ clientId: curLeaderId, data }, {
      onSuccess: () => { setPaxModal(false) }
    })
  }

  const curLeader = clients.find(c => c.id === curLeaderId)

  return (
    <Layout breadcrumb={['SITRAC','Sales','Dossier Client','Informations Générales']}>
      <div className="mb-5">
        <h1 className="page-title"><User size={22} className="text-orange"/> Informations Générales (GI)</h1>
        <p className="page-sub">Gestion des clients leaders et leurs participants (RG 07, 08)</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} value={clients.length}                                  label="Total clients"  color="orange"/>
        <StatCard icon={User}  value={clients.filter(c=>c.type_groupe==='Individuel').length} label="Individuels" color="green"/>
        <StatCard icon={Users} value={clients.filter(c=>c.type_groupe==='Groupe').length}  label="Groupes"      color="blue"/>
        <StatCard icon={Users} value={clients.reduce((s,c)=>s+(c.nb_pax||1),0)}          label="Total PAX"     color="purple"/>
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <div className="card-header"><h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Filtres</h3></div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SearchInput value={search} onChange={v=>{setSearch(v);setPage(1)}} placeholder="Rechercher un client..."/>
            <select className="form-control py-2 text-sm" value={fNat} onChange={e=>{setFNat(e.target.value);setPage(1)}}>
              <option value="">Toutes nationalités</option>
              {NATIOS.map(n=><option key={n}>{n}</option>)}
            </select>
            <select className="form-control py-2 text-sm" value={fType} onChange={e=>{setFType(e.target.value);setPage(1)}}>
              <option value="">Tous types</option>
              {TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={()=>{setSearch('');setFNat('');setFType('');setPage(1)}}>Réinitialiser</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200"><User size={15} className="text-orange"/>Clients Leaders</h3>
          <button className="btn btn-primary btn-sm" onClick={openAddLeader}><Plus size={14}/> Ajouter</button>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement des clients...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Nom</th><th>PAX</th><th>Nationalité</th><th>Téléphone</th><th>Email</th><th>Type</th><th className="text-center">Actions</th></tr></thead>
              <tbody>
                {paginated.length===0
                  ? <tr><td colSpan={7} className="py-12 text-center text-gray-400">Aucun client</td></tr>
                  : paginated.map(c=>(
                    <tr key={c.id}>
                      <td><strong className="text-gray-900 dark:text-white">{c.titre} {c.nom}</strong></td>
                      <td><Badge variant="info">{c.nb_pax||1}</Badge></td>
                      <td className="text-sm">{c.nationalite}</td>
                      <td className="text-xs text-gray-500">{c.telephone||'—'}</td>
                      <td className="text-xs text-gray-500 max-w-[140px] truncate">{c.email||'—'}</td>
                      <td><Badge variant="pending">{c.type_groupe}</Badge></td>
                      <td className="text-center">
                        <button className="btn btn-ghost btn-xs mr-1" onClick={()=>openEditLeader(c)}><Pencil size={12}/></button>
                        <button className="btn btn-info btn-xs mr-1" onClick={()=>openPaxList(c.id)} title="Gérer PAX"><Users size={12}/></button>
                        <button className="btn btn-danger btn-xs" onClick={()=>confirmDelete(c.nom,()=>remove.mutate(c.id))}><Trash2 size={12}/></button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage}/>
        </ApiState>
      </div>

      {/* Leader Modal */}
      <Modal open={leaderModal} onClose={()=>setLeaderModal(false)}
        title={editLeader?'Modifier un Client Leader':'Ajouter un Client Leader'} icon={User} size="lg"
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setLeaderModal(false)}>Annuler</button>
          <button className="btn btn-success" onClick={subL(saveLeader)} disabled={create.isPending||update.isPending}>
            {create.isPending||update.isPending?'Enregistrement...':'Enregistrer'}
          </button>
        </>}
      >
        {/* Onglets */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-5 overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setLeaderTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors
                ${leaderTab===t.key?'border-orange text-orange':'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {leaderTab==='civil' && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="form-label">Titre</label><select className="form-control" {...regL('titre')}>{TITRES.map(t=><option key={t}>{t}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Nom <span className="form-req">*</span></label><input className="form-control" {...regL('nom',{required:true})}/></div>
              <div className="form-group"><label className="form-label">Nationalité <span className="form-req">*</span></label><input className="form-control" {...regL('nationalite',{required:true})}/></div>
              <div className="form-group"><label className="form-label">Date de naissance</label><input type="date" className="form-control" {...regL('date_naissance')}/></div>
              <div className="form-group"><label className="form-label">N° Passeport / CIN</label><input className="form-control" {...regL('num_document')}/></div>
              <div className="form-group"><label className="form-label">Adresse</label><input className="form-control" {...regL('adresse')}/></div>
              <div className="form-group"><label className="form-label">Code Postal</label><input className="form-control" {...regL('code_postal')}/></div>
              <div className="form-group"><label className="form-label">Ville</label><input className="form-control" {...regL('ville')}/></div>
            </div>
            <div className="form-group"><label className="form-label">Pays</label><input className="form-control" {...regL('pays')}/></div>
          </div>
        )}
        {leaderTab==='vol' && (
          <div>
            <Alert type="info">ℹ️ Informations de vol communes pour tout le groupe.</Alert>
            <p className="font-semibold text-sm text-brand-green mb-3">✈️ Vol d'Arrivée</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="form-label">Départ de</label><input className="form-control" {...regL('vol_arr_dep')}/></div>
              <div className="form-group"><label className="form-label">Destination</label><input className="form-control" {...regL('vol_arr_dest')}/></div>
              <div className="form-group"><label className="form-label">Date d'arrivée</label><input type="date" className="form-control" {...regL('vol_arr_date')}/></div>
              <div className="form-group"><label className="form-label">Compagnie</label><input className="form-control" placeholder="Air Madagascar..." {...regL('vol_arr_cie')}/></div>
            </div>
            <p className="font-semibold text-sm text-orange mb-3 mt-4">🛫 Vol de Départ</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="form-label">Départ de</label><input className="form-control" {...regL('vol_dep_dep')}/></div>
              <div className="form-group"><label className="form-label">Destination</label><input className="form-control" {...regL('vol_dep_dest')}/></div>
              <div className="form-group"><label className="form-label">Date de départ</label><input type="date" className="form-control" {...regL('vol_dep_date')}/></div>
              <div className="form-group"><label className="form-label">Compagnie</label><input className="form-control" {...regL('vol_dep_cie')}/></div>
            </div>
          </div>
        )}
        {leaderTab==='contacts' && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="form-label">Téléphone</label><input className="form-control" placeholder="+261..." {...regL('telephone')}/></div>
              <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-control" {...regL('email')}/></div>
              <div className="form-group"><label className="form-label">N° Assurance Voyage</label><input className="form-control" {...regL('assurance_voyage')}/></div>
              <div className="form-group"><label className="form-label">N° Assurance Santé</label><input className="form-control" {...regL('assurance_sante')}/></div>
              <div className="form-group"><label className="form-label">Contact Urgence (Nom)</label><input className="form-control" {...regL('urgence_nom')}/></div>
              <div className="form-group"><label className="form-label">Contact Urgence (Tél)</label><input className="form-control" {...regL('urgence_tel')}/></div>
            </div>
            <div className="form-group"><label className="form-label">Observation médicale</label><textarea className="form-control" rows={3} {...regL('observation_med')}/></div>
          </div>
        )}
        {leaderTab==='groupe' && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="form-label">Type de groupe <span className="form-req">*</span></label><select className="form-control" {...regL('type_groupe')}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Nb PAX (avec leader) <span className="form-req">*</span></label><input type="number" className="form-control" min={1} {...regL('nb_pax',{required:true,min:1})}/></div>
            </div>
            <Alert type="warning">⚠️ Le leader est inclus dans le nombre PAX. Les autres participants se gèrent via le bouton PAX.</Alert>
          </div>
        )}
      </Modal>

      {/* PAX List Modal */}
      <Modal open={paxListModal} onClose={()=>setPaxListModal(false)} title={`PAX — ${curLeader?.nom||''}`} icon={Users} size="lg"
        footer={<>
          <button className="btn btn-primary" onClick={openAddPax}><Plus size={14}/> Ajouter un PAX</button>
          <button className="btn btn-ghost" onClick={()=>setPaxListModal(false)}>Fermer</button>
        </>}
      >
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Nom</th><th>Nationalité</th><th>Téléphone</th><th>Email</th><th>Passeport</th><th className="text-center">Sup.</th></tr></thead>
            <tbody>
              {!curLeader?.pax?.length
                ? <tr><td colSpan={6} className="py-8 text-center text-gray-400">Aucun participant PAX</td></tr>
                : curLeader.pax.map(p=>(
                  <tr key={p.id}>
                    <td><strong>{p.titre} {p.nom}</strong></td>
                    <td>{p.nationalite}</td>
                    <td className="text-xs text-gray-500">{p.telephone||'—'}</td>
                    <td className="text-xs text-gray-500">{p.email||'—'}</td>
                    <td className="text-xs text-gray-400">{p.num_document||'—'}</td>
                    <td className="text-center">
                      <button className="btn btn-danger btn-xs" onClick={()=>confirmDelete(`${p.titre} ${p.nom}`,()=>delPax.mutate({clientId:curLeaderId,paxId:p.id}))}><Trash2 size={11}/></button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Add PAX Modal */}
      <Modal open={paxModal} onClose={()=>setPaxModal(false)} title="Ajouter un Participant PAX" icon={User}
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setPaxModal(false)}>Annuler</button>
          <button className="btn btn-success" onClick={subP(savePax)} disabled={addPax.isPending}>
            {addPax.isPending?'Enregistrement...':'Enregistrer'}
          </button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="form-label">Titre</label><select className="form-control" {...regP('titre')}>{TITRES.map(t=><option key={t}>{t}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Nom <span className="form-req">*</span></label><input className="form-control" {...regP('nom',{required:true})}/></div>
          <div className="form-group"><label className="form-label">Nationalité <span className="form-req">*</span></label><input className="form-control" {...regP('nationalite',{required:true})}/></div>
          <div className="form-group"><label className="form-label">Date de naissance</label><input type="date" className="form-control" {...regP('date_naissance')}/></div>
          <div className="form-group"><label className="form-label">N° Passeport / CIN</label><input className="form-control" {...regP('num_document')}/></div>
          <div className="form-group"><label className="form-label">Téléphone</label><input className="form-control" {...regP('telephone')}/></div>
        </div>
        <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-control" {...regP('email')}/></div>
      </Modal>
    </Layout>
  )
}
