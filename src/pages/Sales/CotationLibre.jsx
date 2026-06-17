import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Calculator, Plus, Pencil, Trash2, Save, ArrowLeft, Printer } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesAPI } from '../../utils/api'
import { useProgrammes } from '../../hooks/useApi'
import { useConfirm } from '../../hooks/useConfirm'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout/Layout'
import { Modal, StatCard } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { fmt, fmtAr, fmtDate } from '../../utils/storage'

function FormCotation({ initial, onSave, onCancel, isSaving }) {
  const { confirmDelete, confirmSave } = useConfirm()
  const { data: progs = [] } = useProgrammes()

  const [lignes, setLignes] = useState(initial?.lignes || [])
  const [fix, setFix] = useState({
    car:    initial?.car    || 0,
    fuel:   initial?.fuel   || 0,
    tax:    initial?.tax    || 0,
    guide:  initial?.guide  || 0,
    comm:   initial?.comm   || 0,
    fee:    initial?.fee    || 0,
    flight: initial?.flight || 0,
    remise: initial?.remise || 0,
  })
  const [taux, setTaux] = useState(initial?.taux_change || 4800)
  const [info, setInfo] = useState({
    client_nom: initial?.client_nom || '',
    programme:  initial?.programme  || '',
    nb_pax:     initial?.nb_pax     || 1,
    date:       initial?.date       || '',
  })
  const [lgModal, setLgModal] = useState(false)
  const [editIdx, setEditIdx] = useState(null)

  const { register, handleSubmit, reset } = useForm()

  const tot1 = lignes.reduce((s, l) =>
    s + (+l.dbl||0) + (+l.bf||0) + (+l.lunch||0) + (+l.diner||0) +
        (+l.tsf||0) + (+l.parking||0) + (+l.guide||0), 0)
  const tot2 = +fix.car + +fix.fuel + +fix.tax + +fix.guide
  const tot3 = tot1 + tot2
  const tot4 = tot3 + +fix.comm + +fix.fee
  const tot5 = tot4 + +fix.flight - +fix.remise

  const openAdd  = () => {
    setEditIdx(null)
    reset({ jour:'', date:'', route:'', hotels:'', dbl:0, bf:0, lunch:0, diner:0, tsf:0, parking:0, guide:0, observation:'' })
    setLgModal(true)
  }
  const openEdit = (i) => { setEditIdx(i); reset({ ...lignes[i] }); setLgModal(true) }
  const saveLg   = handleSubmit(data => {
    const lg = {
      ...data,
      dbl: +data.dbl||0, bf: +data.bf||0, lunch: +data.lunch||0,
      diner: +data.diner||0, tsf: +data.tsf||0, parking: +data.parking||0, guide: +data.guide||0,
    }
    setLignes(prev => editIdx !== null ? prev.map((l, i) => i === editIdx ? lg : l) : [...prev, lg])
    setLgModal(false)
    toast.success(editIdx !== null ? 'Ligne modifiée' : 'Ligne ajoutée')
  })

  const doSave = () => confirmSave(() => {
    if (!info.client_nom.trim()) { toast.error('Le nom du client est obligatoire'); return }
    onSave({
      ...info,
      nb_pax:      +info.nb_pax || 1,
      taux_change: +taux,
      ...Object.fromEntries(Object.entries(fix).map(([k, v]) => [k, +v || 0])),
      lignes: lignes.map((l, i) => ({ ...l, ordre: i })),
    })
  })

  return (
    <div>
      {/* Infos client */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
            Informations Client
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Taux Ar/€</label>
            <input type="number" className="form-control w-28 py-1.5 text-sm"
              value={taux} onChange={e => setTaux(+e.target.value)} />
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="form-group mb-0">
              <label className="form-label">Nom du client <span className="form-req">*</span></label>
              <input className="form-control py-2 text-sm" placeholder="Nom complet..."
                value={info.client_nom} onChange={e => setInfo(p => ({ ...p, client_nom: e.target.value }))} />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Programme (depuis liste)</label>
              <select className="form-control py-2 text-sm"
                onChange={e => {
                  const p = progs.find(x => x.id === +e.target.value)
                  setInfo(prev => ({ ...prev, programme: p?.nom || '' }))
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
                value={info.programme} onChange={e => setInfo(p => ({ ...p, programme: e.target.value }))} />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Nb PAX</label>
              <input type="number" min={1} className="form-control py-2 text-sm"
                value={info.nb_pax} onChange={e => setInfo(p => ({ ...p, nb_pax: +e.target.value || 1 }))} />
            </div>
          </div>
          <div className="form-group mt-3 mb-0">
            <label className="form-label">Date</label>
            <input type="date" className="form-control w-48 py-2 text-sm"
              value={info.date} onChange={e => setInfo(p => ({ ...p, date: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Lignes */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Lignes de Cotation</h3>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={13} /> Ajout Manuel</button>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl text-xs">
            <thead>
              <tr>
                <th>Jour</th><th>Date</th><th>Route</th><th>Hôtels</th>
                <th>Dbl</th><th>Bf</th><th>L</th><th>D</th>
                <th>TSF</th><th>Park</th><th>Guide</th><th>Obs</th>
                <th className="text-center">Act.</th>
              </tr>
            </thead>
            <tbody>
              {lignes.length === 0 ? (
                <tr><td colSpan={13} className="py-6 text-center text-gray-400">
                  Aucune ligne — cliquer sur "Ajout Manuel"
                </td></tr>
              ) : lignes.map((lg, i) => (
                <tr key={i}>
                  <td>{lg.jour||'—'}</td>
                  <td>{fmtDate(lg.date)}</td>
                  <td>{lg.route||'—'}</td>
                  <td>{lg.hotels||'—'}</td>
                  <td>{lg.dbl||0}</td><td>{lg.bf||0}</td>
                  <td>{lg.lunch||0}</td><td>{lg.diner||0}</td>
                  <td>{lg.tsf||0}</td><td>{lg.parking||0}</td><td>{lg.guide||0}</td>
                  <td className="max-w-[80px] truncate text-gray-400">{lg.observation||'—'}</td>
                  <td className="text-center">
                    <button className="btn btn-ghost btn-xs mr-1" onClick={() => openEdit(i)}>
                      <Pencil size={10} />
                    </button>
                    <button className="btn btn-danger btn-xs"
                      onClick={() => confirmDelete(`ligne ${i + 1}`,
                        () => setLignes(p => p.filter((_, j) => j !== i)))}>
                      <Trash2 size={10} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Éléments fixes */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Éléments Fixes</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[['car','CAR'],['fuel','FUEL'],['tax','TAX'],['guide','GUIDE'],
              ['comm','COMM'],['fee','FILE FEE'],['flight','FLIGHT'],['remise','REMISE']
            ].map(([k, l]) => (
              <div key={k} className="form-group mb-0">
                <label className="form-label">{l} (€)</label>
                <input type="number" step="0.01" className="form-control py-2"
                  value={fix[k]} onChange={e => setFix(f => ({ ...f, [k]: +e.target.value || 0 }))} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Totaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="card">
          <div className="card-header"><h3 className="font-title font-bold text-sm">Récapitulatif</h3></div>
          <div className="card-body space-y-2">
            {[
              ['TOTAL 1 (lignes)',              tot1, false],
              ['TOTAL 2 (CAR+FUEL+TAX+GUIDE)',  tot2, false],
              ['TOTAL 3 (T1+T2)',               tot3, 'orange'],
              ['TOTAL 4 (T3+COMM+FEE)',         tot4, false],
              ['TOTAL 5 — PRICE PER PAX',       tot5, 'green'],
            ].map(([label, val, hl]) => (
              <div key={label} className={`flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0
                ${hl === 'green' ? 'font-black text-base text-brand-green'
                  : hl === 'orange' ? 'font-bold text-orange' : 'text-sm'}`}>
                <span>{label}</span><strong>{fmt(val)}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="font-title font-bold text-sm">Conversion Ariary</h3></div>
          <div className="card-body space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Taux</span>
              <strong>{(+taux).toLocaleString('fr-FR')} Ar/€</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">TOTAL 5 en Ariary</span>
              <strong>{fmtAr(tot5 * (+taux))}</strong>
            </div>
            <div className="flex justify-between font-black text-base text-brand-green pt-2 border-t border-gray-100 dark:border-gray-800">
              <span>TOTAL × {info.nb_pax} PAX</span>
              <strong>{fmt(tot5 * (info.nb_pax || 1))}</strong>
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
        title={editIdx !== null ? 'Modifier une Ligne' : 'Ajouter une Ligne'}
        icon={Calculator} size="lg"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setLgModal(false)}>Annuler</button>
          <button className="btn btn-success" onClick={saveLg}>Enregistrer</button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="form-label">Jour</label>
            <input className="form-control" placeholder="Lun, Mar..." {...register('jour')} /></div>
          <div className="form-group"><label className="form-label">Date</label>
            <input type="date" className="form-control" {...register('date')} /></div>
          <div className="form-group"><label className="form-label">Route</label>
            <input className="form-control" {...register('route')} /></div>
          <div className="form-group"><label className="form-label">Hôtels</label>
            <input className="form-control" {...register('hotels')} /></div>
        </div>
        <div className="grid grid-cols-4 lg:grid-cols-7 gap-3 mt-2">
          {[['dbl','DBL'],['bf','BF'],['lunch','L'],['diner','D'],
            ['tsf','TSF'],['parking','Park'],['guide','Guide']].map(([k, l]) => (
            <div key={k} className="form-group">
              <label className="form-label text-[10px]">{l} (€)</label>
              <input type="number" step="0.01" className="form-control py-2 text-sm"
                defaultValue={0} {...register(k)} />
            </div>
          ))}
        </div>
        <div className="form-group mt-2">
          <label className="form-label">Observation</label>
          <input className="form-control" placeholder="Remarques..." {...register('observation')} />
        </div>
      </Modal>
    </div>
  )
}

export default function CotationLibre() {
  const qc = useQueryClient()
  const { confirmDelete } = useConfirm()
  const [view, setView] = useState('list')
  const [edit, setEdit] = useState(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cotations-libres'],
    queryFn:  () => salesAPI.getCotationsLibres(),
    select:   d => d.results ?? d,
  })
  const cotations = data || []

  const createMut = useMutation({
    mutationFn: salesAPI.createCotLibre,
    onSuccess: () => {
      qc.invalidateQueries(['cotations-libres'])
      toast.success('Cotation libre enregistrée')
      setView('list'); setEdit(null)
    },
    onError: e => toast.error(e.message),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => salesAPI.updateCotLibre(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['cotations-libres'])
      toast.success('Cotation modifiée')
      setView('list'); setEdit(null)
    },
    onError: e => toast.error(e.message),
  })
  const deleteMut = useMutation({
    mutationFn: salesAPI.deleteCotLibre,
    onSuccess: () => {
      qc.invalidateQueries(['cotations-libres'])
      toast.success('Cotation supprimée', { icon: '⚠️' })
    },
    onError: e => toast.error(e.message),
  })

  const handleSave = (data) => {
    if (edit) updateMut.mutate({ id: edit.id, data })
    else      createMut.mutate(data)
  }

  const isSaving = createMut.isPending || updateMut.isPending

  if (view === 'new') return (
    <Layout breadcrumb={['SITRAC','Sales','Cotation Libre','Nouvelle']}>
      <div className="flex items-center gap-3 mb-5">
        <button className="btn btn-ghost btn-sm" onClick={() => setView('list')}>
          <ArrowLeft size={14} /> Retour
        </button>
        <h1 className="page-title text-xl">
          <Calculator size={20} className="text-orange" /> Nouvelle Cotation Libre
        </h1>
      </div>
      <FormCotation initial={null} onSave={handleSave} onCancel={() => setView('list')} isSaving={isSaving} />
    </Layout>
  )

  if (view === 'edit') return (
    <Layout breadcrumb={['SITRAC','Sales','Cotation Libre','Modifier']}>
      <div className="flex items-center gap-3 mb-5">
        <button className="btn btn-ghost btn-sm" onClick={() => setView('list')}>
          <ArrowLeft size={14} /> Retour
        </button>
        <h1 className="page-title text-xl">
          <Calculator size={20} className="text-orange" /> Modifier une Cotation Libre
        </h1>
      </div>
      <FormCotation initial={edit} onSave={handleSave} onCancel={() => setView('list')} isSaving={isSaving} />
    </Layout>
  )

  return (
    <Layout breadcrumb={['SITRAC','Sales','Cotation Libre']}>
      <div className="mb-5">
        <h1 className="page-title"><Calculator size={22} className="text-orange" /> Cotation Libre</h1>
        <p className="page-sub">Cotations non liées à un dossier client — usage ponctuel (RG 10, 11, 12)</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Calculator} value={cotations.length} label="Cotations créées" color="orange" />
        <StatCard icon={Calculator}
          value={cotations.length > 0
            ? Math.round(cotations.reduce((s, c) => s + (+c.total5 || 0), 0) / cotations.length)
            : 0}
          label="Prix moy./PAX (€)" color="blue" />
        <StatCard icon={Calculator}
          value={cotations.reduce((s, c) => s + (+c.nb_pax || 1), 0)}
          label="Total PAX estimés" color="green" />
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">
            Mes Cotations Libres
          </h3>
          <button className="btn btn-primary btn-sm" onClick={() => { setEdit(null); setView('new') }}>
            <Plus size={14} /> Nouvelle cotation
          </button>
        </div>
        <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Chargement...">
          {cotations.length === 0 ? (
            <div className="p-16 text-center">
              <Calculator size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="font-bold text-gray-500 dark:text-gray-400 mb-2">Aucune cotation libre</p>
              <p className="text-sm text-gray-400 mb-5">
                Créez une cotation rapide sans la lier à un dossier client existant.
              </p>
              <button className="btn btn-primary" onClick={() => setView('new')}>
                <Plus size={14} /> Créer ma première cotation
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Client</th><th>Programme</th><th>PAX</th>
                    <th>TOTAL 5 (€/PAX)</th><th>TOTAL × PAX</th><th>Date</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cotations.map(c => (
                    <tr key={c.id}>
                      <td><strong className="text-gray-900 dark:text-white">{c.client_nom || '—'}</strong></td>
                      <td className="text-sm text-gray-500">{c.programme || '—'}</td>
                      <td>{c.nb_pax || 1}</td>
                      <td><strong className="text-orange">{fmt(c.total5 || 0)}</strong></td>
                      <td><strong className="text-brand-green">{fmt((+c.total5 || 0) * (+c.nb_pax || 1))}</strong></td>
                      <td className="text-xs text-gray-400">{c.date ? fmtDate(c.date) : '—'}</td>
                      <td className="text-center">
                        <button className="btn btn-ghost btn-xs mr-1"
                          onClick={() => { setEdit(c); setView('edit') }}>
                          <Pencil size={12} />
                        </button>
                        <button className="btn btn-danger btn-xs"
                          onClick={() => confirmDelete(`cotation #${c.id}`, () => deleteMut.mutate(c.id))}>
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