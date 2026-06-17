import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FileText, Plus, Pencil, Trash2, Save, ArrowLeft, Printer } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesAPI } from '../../utils/api'
import { useClients, useProgrammes } from '../../hooks/useApi'
import { useConfirm } from '../../hooks/useConfirm'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import { Modal, StatCard } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmt, fmtDate, today } from '../../utils/storage'

function FormFPLibre({ initial, onSave, onCancel, isSaving }) {
  const { confirmDelete, confirmSave } = useConfirm()
  const { data: clients = [] } = useClients()
  const { data: progs   = [] } = useProgrammes()

  const [lignes,  setLignes]  = useState(initial?.lignes  || [])
  const [remise,  setRemise]  = useState(initial?.remise  || 0)
  const [dateFac, setDateFac] = useState(initial?.date_facture || today())
  const [info, setInfo] = useState({
    client_nom: initial?.client_nom || '',
    programme:  initial?.programme  || '',
    reference:  initial?.reference  || '',
    nb_pax:     initial?.nb_pax     || 1,
  })
  const [lgModal, setLgModal] = useState(false)
  const [editIdx, setEditIdx] = useState(null)

  const lgMethods = useForm()

  const totalHT  = lignes.reduce((s, l) => s + (+l.nombre || 1) * (+l.prix_unitaire || 0), 0)
  const totalTTC = totalHT - (+remise || 0)

  const openAdd  = () => {
    setEditIdx(null)
    lgMethods.reset({ date: '', service: '', nombre: 1, prix_unitaire: '' })
    setLgModal(true)
  }
  const openEdit = (i) => { setEditIdx(i); lgMethods.reset({ ...lignes[i] }); setLgModal(true) }
  const saveLg   = lgMethods.handleSubmit(data => {
    const lg = { ...data, nombre: +data.nombre || 1, prix_unitaire: +data.prix_unitaire || 0 }
    setLignes(prev => editIdx !== null ? prev.map((l, i) => i === editIdx ? lg : l) : [...prev, lg])
    setLgModal(false)
    toast.success(editIdx !== null ? 'Ligne modifiée' : 'Ligne ajoutée')
  })

  const doSave = () => confirmSave(() => {
    if (!info.client_nom.trim()) { toast.error('Le nom du client est obligatoire'); return }
    if (lignes.length === 0)     { toast.error('Ajoutez au moins une ligne'); return }
    onSave({
      ...info,
      nb_pax:       +info.nb_pax || 1,
      date_facture: dateFac,
      remise:       +remise || 0,
      lignes:       lignes.map((l, i) => ({ ...l, ordre: i })),
    })
  })

  return (
    <div>
      {/* Informations */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
            Informations de la Facture
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Date facture</label>
            <input type="date" className="form-control w-44 py-1.5 text-sm"
              value={dateFac} onChange={e => setDateFac(e.target.value)} />
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="form-group mb-0">
              <label className="form-label">Client (depuis liste)</label>
              <select className="form-control py-2 text-sm"
                onChange={e => {
                  const c = clients.find(x => x.id === +e.target.value)
                  if (c) setInfo(p => ({ ...p, client_nom: `${c.titre} ${c.nom}` }))
                }}>
                <option value="">-- Ou saisir manuellement --</option>
                {clients.map(c =>
                  <option key={c.id} value={c.id}>{c.titre} {c.nom}</option>
                )}
              </select>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Nom du client <span className="form-req">*</span></label>
              <input className="form-control py-2 text-sm" placeholder="Nom complet du client"
                value={info.client_nom}
                onChange={e => setInfo(p => ({ ...p, client_nom: e.target.value }))} />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Programme (depuis liste)</label>
              <select className="form-control py-2 text-sm"
                onChange={e => {
                  const p = progs.find(x => x.id === +e.target.value)
                  if (p) setInfo(prev => ({ ...prev, programme: p.nom }))
                }}>
                <option value="">-- Ou saisir manuellement --</option>
                {progs.filter(p => p.actif).map(p =>
                  <option key={p.id} value={p.id}>{p.nom}</option>
                )}
              </select>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Désignation programme</label>
              <input className="form-control py-2 text-sm" placeholder="Nom du programme..."
                value={info.programme}
                onChange={e => setInfo(p => ({ ...p, programme: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="form-group mb-0">
              <label className="form-label">Référence / N° Facture</label>
              <input className="form-control py-2 text-sm" placeholder="Ex: FPL-2024-001"
                value={info.reference}
                onChange={e => setInfo(p => ({ ...p, reference: e.target.value }))} />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Nb PAX</label>
              <input type="number" min={1} className="form-control py-2 text-sm"
                value={info.nb_pax}
                onChange={e => setInfo(p => ({ ...p, nb_pax: +e.target.value || 1 }))} />
            </div>
          </div>
        </div>
      </div>

      {/* Lignes */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
            Lignes de Facturation
          </h3>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <Plus size={13} /> Ajouter une ligne
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th><th>Service / Description</th>
                <th>Nombre</th><th>Prix unit. (€)</th><th>Total (€)</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lignes.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">
                  Aucune ligne — cliquer sur "Ajouter une ligne"
                </td></tr>
              ) : lignes.map((l, i) => (
                <tr key={i}>
                  <td>{fmtDate(l.date)}</td>
                  <td><strong className="text-gray-900 dark:text-white">{l.service}</strong></td>
                  <td>{l.nombre || 1}</td>
                  <td>{fmt(l.prix_unitaire)}</td>
                  <td><strong className="text-brand-green">
                    {fmt((+l.nombre || 1) * (+l.prix_unitaire || 0))}
                  </strong></td>
                  <td className="text-center">
                    <button className="btn btn-ghost btn-xs mr-1" onClick={() => openEdit(i)}>
                      <Pencil size={11} />
                    </button>
                    <button className="btn btn-danger btn-xs"
                      onClick={() => confirmDelete(`ligne ${i + 1}`,
                        () => setLignes(p => p.filter((_, j) => j !== i)))}>
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total HT</span>
              <strong>{fmt(totalHT)}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Remise (€)</span>
              <input type="number" step="0.01" className="form-control w-28 py-1 text-sm text-right"
                value={remise} onChange={e => setRemise(+e.target.value || 0)} />
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-black text-base text-brand-green">
              <span>Total à Payer</span>
              <strong>{fmt(totalTTC)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
            <Printer size={14} /> Imprimer
          </button>
          <button className="btn btn-success btn-lg" onClick={doSave} disabled={isSaving}>
            <Save size={15} /> {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Modal ligne */}
      <Modal open={lgModal} onClose={() => setLgModal(false)}
        title={editIdx !== null ? 'Modifier une ligne' : 'Ajouter une ligne'}
        icon={FileText}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setLgModal(false)}>Annuler</button>
          <button className="btn btn-success" onClick={saveLg}>Enregistrer</button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-control" {...lgMethods.register('date')} />
          </div>
          <div className="form-group col-span-2">
            <label className="form-label">Service / Description <span className="form-req">*</span></label>
            <input className="form-control" placeholder="Description du service..."
              {...lgMethods.register('service', { required: true })} />
          </div>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input type="number" min={1} defaultValue={1} className="form-control"
              {...lgMethods.register('nombre', { required: true, min: 1 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Prix unitaire (€) <span className="form-req">*</span></label>
            <input type="number" step="0.01" className="form-control" placeholder="0.00"
              {...lgMethods.register('prix_unitaire', { required: true, min: 0 })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function FactureProLibre() {
  const qc = useQueryClient()
  const { confirmDelete } = useConfirm()
  const [view, setView] = useState('list')
  const [edit, setEdit] = useState(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['fp-libres'],
    queryFn:  () => salesAPI.getFPLibres(),
    select:   d => d.results ?? d,
  })
  const factures = data || []

  const createMut = useMutation({
    mutationFn: salesAPI.createFPLibre,
    onSuccess: () => {
      qc.invalidateQueries(['fp-libres'])
      toast.success('Facture Pro Libre enregistrée')
      setView('list'); setEdit(null)
    },
    onError: e => toast.error(e.message),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => salesAPI.updateFPLibre(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['fp-libres'])
      toast.success('Facture modifiée')
      setView('list'); setEdit(null)
    },
    onError: e => toast.error(e.message),
  })
  const deleteMut = useMutation({
    mutationFn: salesAPI.deleteFPLibre,
    onSuccess: () => {
      qc.invalidateQueries(['fp-libres'])
      toast.success('Facture supprimée', { icon: '⚠️' })
    },
    onError: e => toast.error(e.message),
  })

  const handleSave = (data) => {
    if (edit) updateMut.mutate({ id: edit.id, data })
    else      createMut.mutate(data)
  }

  const isSaving = createMut.isPending || updateMut.isPending

  if (view === 'new') return (
    <Layout breadcrumb={['SITRAC','Sales','Facture Pro Libre','Nouvelle']}>
      <div className="flex items-center gap-3 mb-5">
        <button className="btn btn-ghost btn-sm" onClick={() => setView('list')}>
          <ArrowLeft size={14} /> Retour
        </button>
        <h1 className="page-title text-xl">
          <FileText size={20} className="text-orange" /> Nouvelle Facture Pro Libre
        </h1>
      </div>
      <FormFPLibre initial={null} onSave={handleSave} onCancel={() => setView('list')} isSaving={isSaving} />
    </Layout>
  )

  if (view === 'edit') return (
    <Layout breadcrumb={['SITRAC','Sales','Facture Pro Libre','Modifier']}>
      <div className="flex items-center gap-3 mb-5">
        <button className="btn btn-ghost btn-sm" onClick={() => setView('list')}>
          <ArrowLeft size={14} /> Retour
        </button>
        <h1 className="page-title text-xl">
          <FileText size={20} className="text-orange" /> Modifier une Facture Pro Libre
        </h1>
      </div>
      <FormFPLibre initial={edit} onSave={handleSave} onCancel={() => setView('list')} isSaving={isSaving} />
    </Layout>
  )

  return (
    <Layout breadcrumb={['SITRAC','Sales','Facture Pro Libre']}>
      <div className="mb-5">
        <h1 className="page-title"><FileText size={22} className="text-orange" /> Facture Pro Libre</h1>
        <p className="page-sub">Factures proforma non liées à un dossier client — usage ponctuel (RG 13, 14, 15)</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={FileText} value={factures.length} label="Factures créées" color="orange" />
        <StatCard icon={FileText}
          value={fmt(factures.reduce((s, f) => s + (+f.total_ttc || 0), 0))}
          label="Total facturé (€)" color="green" />
        <StatCard icon={FileText}
          value={factures.filter(f => +f.remise > 0).length}
          label="Avec remise" color="blue" />
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
            Mes Factures Pro Libres
          </h3>
          <button className="btn btn-primary btn-sm" onClick={() => { setEdit(null); setView('new') }}>
            <Plus size={14} /> Nouvelle facture
          </button>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement...">
          {factures.length === 0 ? (
            <div className="p-16 text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="font-bold text-gray-500 dark:text-gray-400 mb-2">Aucune facture pro libre</p>
              <p className="text-sm text-gray-400 mb-5">
                Créez une facture pro rapide sans la lier à un dossier client existant.
              </p>
              <button className="btn btn-primary" onClick={() => setView('new')}>
                <Plus size={14} /> Créer ma première facture
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Référence</th><th>Client</th><th>Programme</th>
                    <th>Date</th><th>Total HT</th><th>Remise</th><th>Total TTC</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {factures.map(fp => (
                    <tr key={fp.id}>
                      <td><span className="font-mono text-xs text-brand-blue">{fp.reference || '—'}</span></td>
                      <td><strong className="text-gray-900 dark:text-white">{fp.client_nom}</strong></td>
                      <td className="text-sm text-gray-500">{fp.programme || '—'}</td>
                      <td className="text-sm text-gray-500">{fmtDate(fp.date_facture)}</td>
                      <td>{fmt(fp.total_ht || 0)}</td>
                      <td className="text-brand-red">
                        {+fp.remise > 0 ? `-${fmt(fp.remise)}` : '—'}
                      </td>
                      <td><strong className="text-brand-green">{fmt(fp.total_ttc || 0)}</strong></td>
                      <td className="text-center">
                        <button className="btn btn-ghost btn-xs mr-1"
                          onClick={() => { setEdit(fp); setView('edit') }}>
                          <Pencil size={12} />
                        </button>
                        <button className="btn btn-danger btn-xs"
                          onClick={() => confirmDelete(`facture #${fp.id}`,
                            () => deleteMut.mutate(fp.id))}>
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ApiState>
      </div>
    </Layout>
  )
}