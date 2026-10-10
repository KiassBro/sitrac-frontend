import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Car, Plus, Pencil, Trash2, Info, Ban } from 'lucide-react'
import { useConfirm } from '../../hooks/useConfirm'
import { useProgrammeClients, usePCMutations, useClients, useProgrammes } from '../../hooks/useApi'
import Layout from '../../components/Layout/Layout'
import AnnulationDossier from '../../components/Dossiers/AnnulationDossier'
import { Modal, StatCard, Pagination, SearchInput, Badge, Alert } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmtDate } from '../../utils/storage'

export default function ProgrammeClient() {
  // RG 34 : cette page affiche aussi les dossiers annulés (badge « Annulé »)
  const { data: pcs     = [], isLoading, error, refetch } = useProgrammeClients('', { inclureAnnules: true })
  const { data: clients = [] } = useClients()
  const { data: progs   = [] } = useProgrammes()
  const { create, update, remove } = usePCMutations()
  const { confirmDelete, confirmSave } = useConfirm()

  const [search,   setSearch]   = useState('')
  const [page,     setPage]     = useState(1)
  const [modal,    setModal]    = useState(false)
  const [editItem, setEditItem] = useState(null)
  // Info du programme sélectionné pour affichage
  const [selectedProg, setSelectedProg] = useState(null)
  const [annulPC,  setAnnulPC]  = useState(null)   // dossier ouvert dans la fenêtre d'annulation
  const PER = 8

  // ─── React Hook Form avec setValue pour mise à jour du prix ────
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm()

  const filtered  = pcs.filter(p =>
    !search ||
    (p.client_nom||'').toLowerCase().includes(search.toLowerCase()) ||
    (p.programme_nom||'').toLowerCase().includes(search.toLowerCase())
  )
  const paginated = filtered.slice((page-1)*PER, page*PER)
  const actifs    = pcs.filter(p => !p.annule)
  const totalCA   = actifs.reduce((s,p) => s + (+p.prix_vente||0) * (p.nb_pax||1), 0)

  const openAdd = () => {
    setEditItem(null)
    setSelectedProg(null)
    reset({ client:'', programme:'', nb_pax:1, prix_vente:'', date_debut:'', date_fin:'' })
    setModal(true)
  }

  const openEdit = (p) => {
    setEditItem(p)
    const prog = progs.find(x => x.id === p.programme)
    setSelectedProg(prog || null)
    reset({
      client:      p.client,
      programme:   p.programme,
      nb_pax:      p.nb_pax,
      prix_vente:  p.prix_vente,
      date_debut:  p.date_debut,
      date_fin:    p.date_fin,
    })
    setModal(true)
  }

  // ─── Changement de programme : remplit le prix + affiche les infos ──
  const handleProgChange = (e) => {
    const id   = +e.target.value
    const prog = progs.find(p => p.id === id)
    setSelectedProg(prog || null)
    if (prog) {
      // setValue met à jour SEULEMENT le champ prix_vente sans toucher les autres
      setValue('prix_vente', prog.prix, { shouldValidate: true, shouldDirty: true })
      // Mise à jour du champ programme dans le form via register onChange natif
    } else {
      setValue('prix_vente', '', { shouldValidate: false })
    }
  }

  const onSubmit = (data) => {
    if (selectedProg && !selectedProg.actif) return
    const payload = {
      client:      +data.client,
      programme:   +data.programme,
      nb_pax:      +data.nb_pax,
      prix_vente:  +data.prix_vente,
      date_debut:  data.date_debut,
      date_fin:    data.date_fin,
    }
    const doSave = () => {
      const opts = { onSuccess: () => { setModal(false); setSelectedProg(null) } }
      if (editItem) update.mutate({ id: editItem.id, data: payload }, opts)
      else          create.mutate(payload, opts)
    }
    if (editItem) confirmSave(doSave); else doSave()
  }

  return (
    <Layout breadcrumb={['SITRAC','Sales','Dossier Client','Programme Client']}>
      <div className="mb-5">
        <h1 className="page-title"><Car size={22} className="text-orange"/> Programme Client</h1>
        <p className="page-sub">Dossiers de vente — programmes vendus aux clients (RG 08, 09)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Car} value={actifs.length}                               label="Dossiers actifs" color="orange"/>
        <StatCard icon={Car} value={actifs.reduce((s,p)=>s+(p.nb_pax||1),0)}     label="Total PAX"      color="green"/>
        <StatCard icon={Car} value={`${totalCA.toLocaleString('fr-FR')} €`}       label="CA total"       color="blue"/>
        <StatCard icon={Ban} value={pcs.length - actifs.length}                  label="Dossiers annulés" color="red"/>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <Car size={15} className="text-orange"/> Programmes Vendus
          </h3>
          <div className="flex gap-2">
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }}/>
            <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14}/> Ajouter</button>
          </div>
        </div>

        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement des dossiers...">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Client</th><th>Programme</th><th>Nb PAX</th><th>Prix</th>
                  <th>Date vente</th><th>Période</th><th>Cotation</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={8} className="py-10 text-center text-gray-400">Aucun dossier</td></tr>
                ) : paginated.map(p => (
                  <tr key={p.id} className={p.annule ? 'opacity-60' : ''}>
                    <td>
                      <strong className="text-gray-900 dark:text-white">{p.client_nom}</strong>
                      {p.annule && <span className="ml-2"><Badge variant="inactive">Annulé</Badge></span>}
                    </td>
                    <td><Badge variant="info">{p.programme_nom}</Badge></td>
                    <td>{p.nb_pax}</td>
                    <td><strong>{(+p.prix_vente).toLocaleString('fr-FR')} €</strong></td>
                    <td className="text-sm text-gray-500">{fmtDate(p.date_vente)}</td>
                    <td className="text-xs text-gray-400">{fmtDate(p.date_debut)} → {fmtDate(p.date_fin)}</td>
                    <td>{p.a_cotation ? <Badge variant="active">Oui</Badge> : <Badge variant="inactive">Non</Badge>}</td>
                    <td className="text-center">
                      <button className="btn btn-ghost btn-xs mr-1.5" disabled={p.annule} onClick={() => openEdit(p)}
                        title={p.annule ? 'Dossier annulé — non modifiable (RG 34)' : 'Modifier'}><Pencil size={12}/></button>
                      <button className="btn btn-ghost btn-xs mr-1.5" onClick={() => setAnnulPC(p)}
                        title={p.annule ? "Voir l'annulation" : 'Annuler le dossier (RG 34)'}>
                        <Ban size={12} className={p.annule ? 'text-brand-red' : ''}/>
                      </button>
                      <button className="btn btn-danger btn-xs" onClick={() =>
                        confirmDelete(`dossier de ${p.client_nom}`, () => remove.mutate(p.id))}>
                        <Trash2 size={12}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.length} perPage={PER} onChange={setPage}/>
        </ApiState>
      </div>

      {/* RG 34 : annulation / réactivation du dossier */}
      <AnnulationDossier pc={annulPC} open={!!annulPC} onClose={() => setAnnulPC(null)}/>

      {/* Modal */}
      <Modal
        open={modal}
        onClose={() => { setModal(false); setSelectedProg(null) }}
        title={editItem ? 'Modifier un Programme Client' : 'Ajouter un Programme Client'}
        icon={Car}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setModal(false); setSelectedProg(null) }}>
              Annuler
            </button>
            <button
              className="btn btn-success"
              onClick={handleSubmit(onSubmit)}
              disabled={create.isPending || update.isPending}
            >
              {create.isPending || update.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </>
        }
      >
        {/* Alerte programme désactivé */}
        {selectedProg && !selectedProg.actif && (
          <Alert type="danger">
            ⚠️ Ce programme est désactivé — impossible de créer un dossier (RG 06)
          </Alert>
        )}

        {/* Client */}
        <div className="form-group">
          <label className="form-label">Client Leader <span className="form-req">*</span></label>
          <select
            className={`form-control ${errors.client ? 'border-brand-red' : ''}`}
            {...register('client', { required: 'Sélectionnez un client' })}
          >
            <option value="">-- Sélectionner un client --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.titre} {c.nom} — {c.type_groupe} ({c.nb_pax} PAX)
              </option>
            ))}
          </select>
          {errors.client && <p className="text-xs text-brand-red mt-1">{errors.client.message}</p>}
        </div>

        {/* Programme */}
        <div className="form-group">
          <label className="form-label">Programme <span className="form-req">*</span></label>
          <select
            className={`form-control ${errors.programme ? 'border-brand-red' : ''}`}
            {...register('programme', { required: 'Sélectionnez un programme' })}
            onChange={handleProgChange}
          >
            <option value="">-- Sélectionner un programme --</option>
            {progs.map(p => (
              <option key={p.id} value={p.id}>
                {p.nom} — {p.code} {!p.actif ? '[INACTIF]' : ''}
              </option>
            ))}
          </select>
          {errors.programme && <p className="text-xs text-brand-red mt-1">{errors.programme.message}</p>}
        </div>

        {/* Fiche du programme sélectionné */}
        {selectedProg && (
          <div className={`rounded-xl p-4 mb-4 border ${selectedProg.actif
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Info size={13} className={selectedProg.actif ? 'text-brand-blue' : 'text-brand-red'}/>
              <span className={`text-xs font-bold uppercase tracking-wide ${selectedProg.actif ? 'text-brand-blue' : 'text-brand-red'}`}>
                Détail du programme sélectionné
              </span>
              {!selectedProg.actif && (
                <span className="ml-auto text-xs font-black text-brand-red bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                  INACTIF
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <div>
                <span className="text-gray-400 text-xs">Nom</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedProg.nom}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Code</span>
                <p className="font-mono font-bold text-brand-blue">{selectedProg.code}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Type</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedProg.type_prog}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Prix catalogue</span>
                <p className="font-black text-orange text-base">{(+selectedProg.prix).toLocaleString('fr-FR')} €</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 text-xs">Itinéraire</span>
                <p className="font-mono text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {[...(selectedProg.destinations_aller||[]), ...(selectedProg.destinations_retour||[])].join(' → ') || '—'}
                </p>
              </div>
              {selectedProg.description && (
                <div className="col-span-2">
                  <span className="text-gray-400 text-xs">Description</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{selectedProg.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nb PAX + Prix */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Nb PAX <span className="form-req">*</span></label>
            <input
              type="number" min={1}
              className={`form-control ${errors.nb_pax ? 'border-brand-red' : ''}`}
              {...register('nb_pax', { required: true, min: 1, valueAsNumber: true })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Prix de vente (€) <span className="form-req">*</span>
              {selectedProg && (
                <span className="ml-2 text-[10px] font-normal text-gray-400">
                  (catalogue : {(+selectedProg.prix).toLocaleString('fr-FR')} €)
                </span>
              )}
            </label>
            <input
              type="number" step="0.01"
              className={`form-control ${errors.prix_vente ? 'border-brand-red' : ''} ${selectedProg ? 'border-orange ring-1 ring-orange/20' : ''}`}
              placeholder="0.00"
              {...register('prix_vente', { required: true, min: 0, valueAsNumber: true })}
            />
            {selectedProg && (
              <p className="form-hint text-orange">
                ✓ Prix automatiquement rempli depuis le programme — vous pouvez le modifier
              </p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Date début <span className="form-req">*</span></label>
            <input
              type="date"
              className={`form-control ${errors.date_debut ? 'border-brand-red' : ''}`}
              {...register('date_debut', { required: true })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date fin <span className="form-req">*</span></label>
            <input
              type="date"
              className={`form-control ${errors.date_fin ? 'border-brand-red' : ''}`}
              {...register('date_fin', { required: true })}
            />
          </div>
        </div>
      </Modal>
    </Layout>
  )
}