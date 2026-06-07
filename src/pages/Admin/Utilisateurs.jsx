import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Users, Plus, Pencil, Trash2 } from 'lucide-react'
import { useConfirm } from '../../hooks/useConfirm'
import { useUtilisateurs, useUtilisateurMutations } from '../../hooks/useApi'
import Layout from '../../components/Layout/Layout'
import { Modal, Toggle, StatCard, Pagination, SearchInput, Badge } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate } from '../../utils/storage'

const DEPTS  = ['Sales','Booking','Finance','Administration','Superviseur']
const COLORS  = { Sales:'#F5A623',Booking:'#27AE60',Finance:'#2980B9',Administration:'#8E44AD',Superviseur:'#2C3E50' }

export default function Utilisateurs() {
  const { data: users = [], isLoading, error, refetch } = useUtilisateurs()
  const { create, update, remove, toggle } = useUtilisateurMutations()
  const { confirmDelete, confirmSave, confirmToggle } = useConfirm()

  const [search, setSearch] = useState('')
  const [fDept,  setFDept]  = useState('')
  const [page,   setPage]   = useState(1)
  const [modal,  setModal]  = useState(false)
  const [editItem, setEditItem] = useState(null)
  const PER = 10

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const filtered  = users.filter(u =>
    (!search || u.login.includes(search.toLowerCase()) || u.nom.toLowerCase().includes(search.toLowerCase()) || u.prenom.toLowerCase().includes(search.toLowerCase())) &&
    (!fDept  || u.departement === fDept)
  )
  const paginated = filtered.slice((page-1)*PER, page*PER)

  const openAdd  = () => { setEditItem(null); reset({ nom:'', prenom:'', login:'', email:'', departement:'', password:'' }); setModal(true) }
  const openEdit = (u) => { setEditItem(u); reset({ nom:u.nom, prenom:u.prenom, login:u.login, email:u.email||'', departement:u.departement, password:'' }); setModal(true) }

  const onSubmit = (data) => {
    if (!editItem && !data.password) { return }
    const payload = { nom:data.nom, prenom:data.prenom, login:data.login.toLowerCase(), email:data.email, departement:data.departement, ...(data.password ? { password:data.password } : {}) }
    const doSave  = () => {
      const opts = { onSuccess: () => setModal(false) }
      if (editItem) update.mutate({ id: editItem.id, data: payload }, opts)
      else          create.mutate(payload, opts)
    }
    if (editItem) confirmSave(doSave); else doSave()
  }

  return (
    <Layout breadcrumb={['SITRAC','Administration','Utilisateurs']}>
      <div className="mb-5">
        <h1 className="page-title"><Users size={22} className="text-orange"/> Gestion des Utilisateurs</h1>
        <p className="page-sub">Administration des comptes SITRAC (RG 01, 29, 36)</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} value={users.length}                        label="Total"        color="orange"/>
        <StatCard icon={Users} value={users.filter(u=>u.actif).length}     label="Actifs"       color="green"/>
        <StatCard icon={Users} value={users.filter(u=>!u.actif).length}    label="Inactifs"     color="red"/>
        <StatCard icon={Users} value={DEPTS.length}                         label="Départements" color="blue"/>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200"><Users size={15} className="text-orange"/>Utilisateurs</h3>
          <div className="flex gap-2 flex-wrap">
            <SearchInput value={search} onChange={v=>{setSearch(v);setPage(1)}}/>
            <select className="form-control w-44 py-2 text-sm" value={fDept} onChange={e=>{setFDept(e.target.value);setPage(1)}}>
              <option value="">Tous les départements</option>
              {DEPTS.map(d=><option key={d}>{d}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14}/> Ajouter</button>
          </div>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement des utilisateurs...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Login</th><th>Nom & Prénom</th><th>Département</th><th>Email</th><th>Créé le</th><th>État</th><th className="text-center">Actions</th></tr></thead>
              <tbody>
                {paginated.length === 0
                  ? <tr><td colSpan={7} className="py-10 text-center text-gray-400">Aucun utilisateur</td></tr>
                  : paginated.map(u => (
                    <tr key={u.id}>
                      <td><strong className="font-mono text-gray-900 dark:text-white">{u.login}</strong></td>
                      <td>{u.prenom} <strong>{u.nom}</strong></td>
                      <td>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:COLORS[u.departement]+'22', color:COLORS[u.departement]}}>
                          {u.departement}
                        </span>
                      </td>
                      <td className="text-gray-400 text-xs">{u.email||'—'}</td>
                      <td className="text-gray-400 text-xs">{fmtDate(u.date_joined)}</td>
                      <td>
                        <Toggle checked={u.actif} onChange={() =>
                          confirmToggle(`${u.prenom} ${u.nom}`, u.actif, () => toggle.mutate(u.id))}/>
                      </td>
                      <td className="text-center">
                        <button className="btn btn-ghost btn-xs mr-1.5" onClick={()=>openEdit(u)}><Pencil size={12}/></button>
                        <button className="btn btn-danger btn-xs" onClick={() =>
                          confirmDelete(`${u.prenom} ${u.nom}`, () => remove.mutate(u.id))}><Trash2 size={12}/></button>
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

      <Modal open={modal} onClose={()=>setModal(false)} title={editItem?'Modifier':'Ajouter un Utilisateur'} icon={Users}
        footer={<>
          <button className="btn btn-ghost" onClick={()=>setModal(false)}>Annuler</button>
          <button className="btn btn-success" onClick={handleSubmit(onSubmit)}
            disabled={create.isPending || update.isPending}>
            {create.isPending || update.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="form-label">Nom <span className="form-req">*</span></label><input className="form-control" {...register('nom',{required:true})}/></div>
          <div className="form-group"><label className="form-label">Prénom <span className="form-req">*</span></label><input className="form-control" {...register('prenom',{required:true})}/></div>
        </div>
        <div className="form-group"><label className="form-label">Login <span className="form-req">*</span></label><input className="form-control font-mono" {...register('login',{required:true})}/></div>
        <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-control" {...register('email')}/></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Département <span className="form-req">*</span></label>
            <select className="form-control" {...register('departement',{required:true})}>
              <option value="">-- Sélectionner --</option>
              {DEPTS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe {editItem?'':  <span className="form-req">*</span>}</label>
            <input type="password" className="form-control" placeholder={editItem?'(laisser vide = inchangé)':'Min. 6 caractères'}
              {...register('password', editItem?{}:{required:true,minLength:6})}/>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-brand-blue">
          ℹ️ Chaque utilisateur appartient à un seul département (RG 01).
        </div>
      </Modal>
    </Layout>
  )
}
