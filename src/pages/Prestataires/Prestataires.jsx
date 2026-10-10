/**
 * SITRAC — Référentiel des prestataires
 *
 * Onglet « Référentiel »        : fiches prestataires avec contacts, conditions et tarifs.
 * Onglet « Noms à rattacher »   : noms saisis en texte libre dans les dossiers (cotation,
 *                                 brieffing, provision, clôture, reçus) qui ne correspondent
 *                                 encore à aucune fiche. On peut créer la fiche ou rattacher
 *                                 ces orthographes à une fiche existante.
 * Fiche (bouton statistiques)   : combien a-t-on engagé, prévu, dépensé et réglé chez ce
 *                                 prestataire, dossier par dossier.
 */
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Building2, Plus, Pencil, Trash2, BarChart3, Link2, X, Wand2, Phone, Mail,
} from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { Modal, Toggle, StatCard, SearchInput, EmptyState } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { useConfirm } from '../../hooks/useConfirm'
import { useAuthStore } from '../../store/authStore'
import { salesAPI } from '../../utils/api'
import { CATEGORIES, MODES_PAIEMENT, SAISONS, UNITES, prestatairesAPI } from '../../utils/prestatairesApi'

const euro = (v) => `${Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const VIDE = {
  nom: '', categorie: 'hebergement', destination: '', ville: '', adresse: '', contact_nom: '', telephone: '',
  email: '', mode_paiement: '', delai_paiement_jours: '', conditions_paiement: '', alias: [], notes: '', tarifs: [],
}
const TARIF_VIDE = { libelle: '', unite: 'nuit', prix: '', saison: 'toute_annee', date_debut: '', date_fin: '', observation: '' }

export default function Prestataires() {
  const { user } = useAuthStore()
  const peutModifier  = ['Sales', 'Booking', 'Finance', 'Administration'].includes(user?.dept)
  const peutSupprimer = user?.dept === 'Administration'
  const qc = useQueryClient()
  const { confirmDelete, confirmToggle } = useConfirm()

  const [onglet, setOnglet]       = useState('referentiel')
  const [search, setSearch]       = useState('')
  const [fCategorie, setFCat]     = useState('')
  const [fEtat, setFEtat]         = useState('')
  const [formulaire, setForm]     = useState(null)   // null = fermé, sinon données du formulaire
  const [ficheId, setFicheId]     = useState(null)

  const liste = useQuery({ queryKey: ['prestataires'], queryFn: () => prestatairesAPI.liste() })
  const suggestions = useQuery({ queryKey: ['prestataires-suggestions'], queryFn: () => prestatairesAPI.suggestions() })
  const destinations = useQuery({
    queryKey: ['destinations', 'toutes'], queryFn: () => salesAPI.getDestinations('?page_size=100'),
    select: (d) => d.results ?? d,
  })

  const rafraichir = () => {
    qc.invalidateQueries({ queryKey: ['prestataires'] })
    qc.invalidateQueries({ queryKey: ['prestataires-suggestions'] })
    qc.invalidateQueries({ queryKey: ['prestataire-stats'] })
  }
  const enregistrer = useMutation({
    mutationFn: ({ id, data }) => (id ? prestatairesAPI.modifier(id, data) : prestatairesAPI.creer(data)),
    onSuccess: (_, { id }) => { toast.success(id ? 'Fiche mise à jour' : 'Prestataire créé'); setForm(null); rafraichir() },
    onError: (e) => toast.error(e.message),
  })
  const basculer = useMutation({
    mutationFn: (id) => prestatairesAPI.basculer(id),
    onSuccess: () => rafraichir(), onError: (e) => toast.error(e.message),
  })
  const supprimer = useMutation({
    mutationFn: (id) => prestatairesAPI.supprimer(id),
    onSuccess: () => { toast.success('Prestataire supprimé (archivé dans le journal)'); rafraichir() },
    onError: (e) => toast.error(e.message),
  })
  const rattacher = useMutation({
    mutationFn: ({ id, textes }) => prestatairesAPI.alias(id, textes),
    onSuccess: (r) => {
      if (r.ajoutes.length) toast.success(`${r.ajoutes.length} orthographe(s) rattachée(s) à « ${r.prestataire.nom} »`)
      r.conflits.forEach((c) => toast.error(`« ${c.texte} » appartient déjà à « ${c.prestataire} »`))
      rafraichir()
    },
    onError: (e) => toast.error(e.message),
  })

  const prestataires = liste.data || []
  const aRattacher = suggestions.data || []
  const filtres = useMemo(() => prestataires.filter((p) => {
    const q = search.trim().toLowerCase()
    const texte = [p.nom, p.ville, p.contact_nom, ...(p.alias || [])].join(' ').toLowerCase()
    return (!q || texte.includes(q)) && (!fCategorie || p.categorie === fCategorie)
      && (!fEtat || (fEtat === 'actif' ? p.actif : !p.actif))
  }), [prestataires, search, fCategorie, fEtat])

  const ouvrirCreation = (prefill = {}) => setForm({ ...VIDE, ...prefill })
  const ouvrirModification = async (id) => {
    try {
      const p = await prestatairesAPI.fiche(id)
      setForm({
        ...VIDE, ...p, destination: p.destination || '', delai_paiement_jours: p.delai_paiement_jours ?? '',
        tarifs: (p.tarifs || []).map((t) => ({ ...t, date_debut: t.date_debut || '', date_fin: t.date_fin || '' })),
      })
    } catch (e) { toast.error(e.message) }
  }

  return (
    <Layout breadcrumb={['SITRAC', 'Base de données', 'Prestataires']}>
      <div className="mb-5">
        <h1 className="page-title"><Building2 size={22} className="text-orange" /> Prestataires</h1>
        <p className="page-sub">
          Une fiche unique par hôtel, transporteur, guide ou parc, avec ses tarifs — et le rattachement des noms
          déjà saisis dans les dossiers.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Building2} value={prestataires.length} label="Prestataires" color="orange" />
        <StatCard icon={Building2} value={prestataires.filter((p) => p.actif).length} label="Actifs" color="green" />
        <StatCard icon={Link2} value={aRattacher.length} label="Noms à rattacher" color="blue" />
      </div>

      <div className="flex gap-2 mb-4">
        {[['referentiel', 'Référentiel'], ['rattacher', `Noms à rattacher (${aRattacher.length})`]].map(([k, l]) => (
          <button key={k} className={`btn btn-sm ${onglet === k ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOnglet(k)}>
            {l}
          </button>
        ))}
      </div>

      {onglet === 'referentiel' ? (
        <div className="card">
          <div className="card-header flex-wrap gap-2">
            <h3 className="font-title font-bold text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <Building2 size={15} className="text-orange" /> Référentiel
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <SearchInput value={search} onChange={setSearch} placeholder="Nom, ville, contact, variante…" />
              <select className="form-control !w-auto !py-1.5 text-sm" value={fCategorie} onChange={(e) => setFCat(e.target.value)}>
                <option value="">Toutes catégories</option>
                {CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <select className="form-control !w-auto !py-1.5 text-sm" value={fEtat} onChange={(e) => setFEtat(e.target.value)}>
                <option value="">Tous</option>
                <option value="actif">Actifs</option>
                <option value="inactif">Inactifs</option>
              </select>
              {peutModifier && (
                <button className="btn btn-primary btn-sm" onClick={() => ouvrirCreation()}><Plus size={14} /> Ajouter</button>
              )}
            </div>
          </div>
          <ApiState isLoading={liste.isLoading} error={liste.error} onRetry={liste.refetch} loadingText="Chargement des prestataires...">
            {filtres.length === 0 ? (
              <EmptyState icon={Building2} title="Aucun prestataire"
                desc={prestataires.length ? 'Aucun résultat pour ces filtres.' : "Commencez par l'onglet « Noms à rattacher » : il propose les prestataires déjà présents dans vos dossiers."} />
            ) : (
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead><tr>
                    <th>Nom</th><th>Catégorie</th><th>Destination / ville</th><th>Contact</th>
                    <th className="text-center">Tarifs</th><th className="text-center">État</th><th className="text-right">Actions</th>
                  </tr></thead>
                  <tbody>
                    {filtres.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="font-semibold text-gray-900 dark:text-white">{p.nom}</div>
                          {p.alias?.length > 0 && (
                            <div className="text-xs text-gray-400" title={p.alias.join(' · ')}>
                              + {p.alias.length} autre{p.alias.length > 1 ? 's' : ''} orthographe{p.alias.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </td>
                        <td><span className="badge badge-info">{p.categorie_libelle}</span></td>
                        <td>{[p.destination_nom, p.ville].filter(Boolean).join(' · ') || '—'}</td>
                        <td className="text-xs">
                          {p.contact_nom && <div>{p.contact_nom}</div>}
                          {p.telephone && <div className="flex items-center gap-1"><Phone size={11} /> {p.telephone}</div>}
                          {p.email && <div className="flex items-center gap-1"><Mail size={11} /> {p.email}</div>}
                          {!p.contact_nom && !p.telephone && !p.email && '—'}
                        </td>
                        <td className="text-center">{p.nb_tarifs}</td>
                        <td className="text-center">
                          <Toggle checked={p.actif} onChange={() => peutModifier
                            && confirmToggle(p.nom, p.actif, () => basculer.mutate(p.id))} />
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <button className="btn btn-ghost btn-xs" title="Statistiques et fiche" onClick={() => setFicheId(p.id)}>
                            <BarChart3 size={13} />
                          </button>{' '}
                          {peutModifier && (
                            <button className="btn btn-ghost btn-xs" title="Modifier" onClick={() => ouvrirModification(p.id)}>
                              <Pencil size={13} />
                            </button>
                          )}{' '}
                          {peutSupprimer && (
                            <button className="btn btn-ghost btn-xs" title="Supprimer"
                              onClick={() => confirmDelete(p.nom, () => supprimer.mutate(p.id))}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ApiState>
        </div>
      ) : (
        <NomsARattacher
          suggestions={aRattacher} chargement={suggestions} prestataires={prestataires} peutModifier={peutModifier}
          onCreer={(s) => ouvrirCreation({ nom: s.nom_propose, alias: s.variantes.map((v) => v.texte).filter((t) => t !== s.nom_propose) })}
          onRattacher={(id, textes) => rattacher.mutate({ id, textes })}
        />
      )}

      {formulaire && (
        <FormulairePrestataire
          valeurs={formulaire} destinations={destinations.data || []} enCours={enregistrer.isPending}
          onFermer={() => setForm(null)}
          onEnregistrer={(data) => enregistrer.mutate({ id: formulaire.id, data })}
        />
      )}
      {ficheId && <FichePrestataire id={ficheId} onFermer={() => setFicheId(null)} />}
    </Layout>
  )
}

// ─────────────────────────────────────────────────────────────────
function NomsARattacher({ suggestions, chargement, prestataires, peutModifier, onCreer, onRattacher }) {
  const [cible, setCible] = useState({})
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-title font-bold text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200">
          <Wand2 size={15} className="text-orange" /> Noms saisis dans les dossiers, sans fiche prestataire
        </h3>
      </div>
      <div className="px-5 pt-4 text-sm text-gray-500 dark:text-gray-400">
        Les orthographes d'un même nom sont regroupées (accents, majuscules, ponctuation et mots comme « Hôtel » ou
        « Lodge » ignorés). Créez la fiche, ou rattachez ces orthographes à une fiche existante : les statistiques du
        prestataire les prendront alors en compte, sans modifier les dossiers.
      </div>
      <ApiState isLoading={chargement.isLoading} error={chargement.error} onRetry={chargement.refetch} loadingText="Analyse des dossiers...">
        {suggestions.length === 0 ? (
          <EmptyState icon={Link2} title="Tout est rattaché" desc="Chaque prestataire cité dans les dossiers correspond à une fiche." />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr>
                <th>Orthographes trouvées</th><th className="text-center">Mentions</th><th className="text-center">Dossiers</th>
                <th className="text-right">Montants</th><th>Action</th>
              </tr></thead>
              <tbody>
                {suggestions.map((s) => {
                  const textes = s.variantes.map((v) => v.texte)
                  return (
                    <tr key={s.cle}>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {s.variantes.map((v) => (
                            <span key={v.texte} className="badge badge-pending">{v.texte}{v.occurrences > 1 ? ` ×${v.occurrences}` : ''}</span>
                          ))}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{Object.entries(s.sources).map(([k, n]) => `${k} ${n}`).join(' · ')}</div>
                      </td>
                      <td className="text-center">{s.occurrences}</td>
                      <td className="text-center">{s.nb_dossiers}</td>
                      <td className="text-right whitespace-nowrap">{Number(s.montant) ? euro(s.montant) : '—'}</td>
                      <td className="min-w-[260px]">
                        {!peutModifier ? <span className="text-xs text-gray-400">Lecture seule</span> : (
                          <div className="flex flex-col gap-1.5">
                            {s.rapprochement && (
                              <button className="btn btn-success btn-xs justify-start" onClick={() => onRattacher(s.rapprochement.id, textes)}>
                                <Link2 size={12} /> Rattacher à « {s.rapprochement.nom} » ({Math.round(s.rapprochement.score * 100)} %)
                              </button>
                            )}
                            <div className="flex gap-1">
                              <select className="form-control !py-1 text-xs" value={cible[s.cle] || ''}
                                onChange={(e) => setCible({ ...cible, [s.cle]: e.target.value })}>
                                <option value="">Rattacher à…</option>
                                {prestataires.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                              </select>
                              <button className="btn btn-ghost btn-xs" disabled={!cible[s.cle]}
                                onClick={() => onRattacher(Number(cible[s.cle]), textes)}>OK</button>
                            </div>
                            <button className="btn btn-primary btn-xs justify-start" onClick={() => onCreer(s)}>
                              <Plus size={12} /> Créer la fiche « {s.nom_propose} »
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </ApiState>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
function FormulairePrestataire({ valeurs, destinations, enCours, onFermer, onEnregistrer }) {
  const [v, setV] = useState(valeurs)
  const [nouvelAlias, setNouvelAlias] = useState('')
  const champ = (k) => ({ value: v[k] ?? '', onChange: (e) => setV({ ...v, [k]: e.target.value }) })
  const majTarif = (i, k, val) => setV({ ...v, tarifs: v.tarifs.map((t, j) => (j === i ? { ...t, [k]: val } : t)) })
  const ajouterAlias = () => {
    const a = nouvelAlias.trim()
    if (a && !v.alias.includes(a)) setV({ ...v, alias: [...v.alias, a] })
    setNouvelAlias('')
  }
  const soumettre = () => {
    if (!v.nom.trim()) { toast.error('Le nom est obligatoire.'); return }
    if (v.tarifs.some((t) => !t.libelle.trim() || t.prix === '')) {
      toast.error('Chaque tarif doit avoir une prestation et un prix.'); return
    }
    const { id, categorie_libelle, destination_nom, cree_par_nom, cree_le, modifie_le, actif, ...data } = v
    onEnregistrer({
      ...data, destination: data.destination || null,
      delai_paiement_jours: data.delai_paiement_jours === '' ? null : Number(data.delai_paiement_jours),
      tarifs: data.tarifs.map(({ unite_libelle, saison_libelle, ...t }) => ({
        ...t, date_debut: t.date_debut || null, date_fin: t.date_fin || null,
      })),
    })
  }

  return (
    <Modal open onClose={onFermer} size="xl" icon={Building2}
      title={valeurs.id ? `Modifier « ${valeurs.nom} »` : 'Nouveau prestataire'}
      footer={(
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onFermer}>Annuler</button>
          <button className="btn btn-success" disabled={enCours} onClick={soumettre}>Enregistrer</button>
        </div>
      )}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="form-label">Nom *</label>
          <input className="form-control" {...champ('nom')} placeholder="Ex : Hôtel Le Neptune" />
        </div>
        <div>
          <label className="form-label">Catégorie *</label>
          <select className="form-control" {...champ('categorie')}>
            {CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Destination</label>
          <select className="form-control" {...champ('destination')}>
            <option value="">—</option>
            {destinations.map((d) => <option key={d.id} value={d.id}>{d.ville} ({d.code})</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Ville</label>
          <input className="form-control" {...champ('ville')} />
        </div>
        <div>
          <label className="form-label">Adresse</label>
          <input className="form-control" {...champ('adresse')} />
        </div>
        <div>
          <label className="form-label">Personne de contact</label>
          <input className="form-control" {...champ('contact_nom')} />
        </div>
        <div>
          <label className="form-label">Téléphone</label>
          <input className="form-control" {...champ('telephone')} placeholder="+261 …" />
        </div>
        <div>
          <label className="form-label">Email</label>
          <input className="form-control" type="email" {...champ('email')} />
        </div>
        <div>
          <label className="form-label">Mode de paiement habituel</label>
          <select className="form-control" {...champ('mode_paiement')}>
            <option value="">—</option>
            {MODES_PAIEMENT.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Délai de paiement (jours)</label>
          <input className="form-control" type="number" min="0" {...champ('delai_paiement_jours')} />
        </div>
        <div>
          <label className="form-label">Conditions de paiement</label>
          <input className="form-control" {...champ('conditions_paiement')} placeholder="Ex : 30 % à la réservation" />
        </div>
      </div>

      <div className="mt-5">
        <label className="form-label">Autres orthographes rencontrées dans les dossiers</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {v.alias.length === 0 && <span className="text-xs text-gray-400">Aucune</span>}
          {v.alias.map((a) => (
            <span key={a} className="badge badge-pending">
              {a}
              <button type="button" onClick={() => setV({ ...v, alias: v.alias.filter((x) => x !== a) })}><X size={11} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="form-control" value={nouvelAlias} onChange={(e) => setNouvelAlias(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouterAlias() } }}
            placeholder="Ex : Neptune Hotel" />
          <button type="button" className="btn btn-ghost btn-sm" onClick={ajouterAlias}><Plus size={13} /> Ajouter</button>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <label className="form-label !mb-0">Tarifs</label>
          <button type="button" className="btn btn-ghost btn-xs"
            onClick={() => setV({ ...v, tarifs: [...v.tarifs, { ...TARIF_VIDE }] })}><Plus size={12} /> Ajouter un tarif</button>
        </div>
        {v.tarifs.length === 0 ? <p className="text-xs text-gray-400">Aucun tarif.</p> : (
          <div className="overflow-x-auto">
            <table className="tbl text-xs">
              <thead><tr><th>Prestation *</th><th>Unité</th><th>Prix (€) *</th><th>Saison</th><th>Du</th><th>Au</th><th>Observation</th><th /></tr></thead>
              <tbody>
                {v.tarifs.map((t, i) => (
                  <tr key={t.id || `n${i}`}>
                    <td><input className="form-control !py-1 min-w-[150px]" value={t.libelle} onChange={(e) => majTarif(i, 'libelle', e.target.value)} placeholder="Chambre double" /></td>
                    <td><select className="form-control !py-1" value={t.unite} onChange={(e) => majTarif(i, 'unite', e.target.value)}>
                      {UNITES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td>
                    <td><input className="form-control !py-1 w-24" type="number" min="0" step="0.01" value={t.prix} onChange={(e) => majTarif(i, 'prix', e.target.value)} /></td>
                    <td><select className="form-control !py-1" value={t.saison} onChange={(e) => majTarif(i, 'saison', e.target.value)}>
                      {SAISONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td>
                    <td><input className="form-control !py-1" type="date" value={t.date_debut} onChange={(e) => majTarif(i, 'date_debut', e.target.value)} /></td>
                    <td><input className="form-control !py-1" type="date" value={t.date_fin} onChange={(e) => majTarif(i, 'date_fin', e.target.value)} /></td>
                    <td><input className="form-control !py-1" value={t.observation} onChange={(e) => majTarif(i, 'observation', e.target.value)} /></td>
                    <td><button type="button" className="btn btn-ghost btn-xs" title="Retirer"
                      onClick={() => setV({ ...v, tarifs: v.tarifs.filter((_, j) => j !== i) })}><Trash2 size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-5">
        <label className="form-label">Notes internes</label>
        <textarea className="form-control" rows={2} {...champ('notes')} />
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────
function FichePrestataire({ id, onFermer }) {
  const anneeCourante = new Date().getFullYear()
  const [annee, setAnnee] = useState('')
  const fiche = useQuery({ queryKey: ['prestataire', id], queryFn: () => prestatairesAPI.fiche(id) })
  const stats = useQuery({ queryKey: ['prestataire-stats', id, annee], queryFn: () => prestatairesAPI.statistiques(id, annee) })
  const p = fiche.data
  const s = stats.data

  return (
    <Modal open onClose={onFermer} size="xl" icon={BarChart3} title={p ? p.nom : 'Prestataire'}>
      <ApiState isLoading={fiche.isLoading} error={fiche.error} onRetry={fiche.refetch}>
        {p && (
          <>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 dark:text-gray-300 mb-4">
              <span><b>{p.categorie_libelle}</b></span>
              {(p.destination_nom || p.ville) && <span>{[p.destination_nom, p.ville].filter(Boolean).join(' · ')}</span>}
              {p.contact_nom && <span>{p.contact_nom}</span>}
              {p.telephone && <span>{p.telephone}</span>}
              {p.email && <span>{p.email}</span>}
              {p.mode_paiement && <span>Paiement : {p.mode_paiement}{p.delai_paiement_jours != null ? ` à ${p.delai_paiement_jours} j` : ''}</span>}
            </div>
            {p.conditions_paiement && <p className="text-sm mb-4">{p.conditions_paiement}</p>}

            {p.tarifs.length > 0 && (
              <div className="mb-5 overflow-x-auto">
                <table className="tbl text-xs">
                  <thead><tr><th>Prestation</th><th>Unité</th><th className="text-right">Prix</th><th>Saison</th><th>Validité</th></tr></thead>
                  <tbody>{p.tarifs.map((t) => (
                    <tr key={t.id}>
                      <td>{t.libelle}{t.observation ? <span className="text-gray-400"> — {t.observation}</span> : ''}</td>
                      <td>{t.unite_libelle}</td><td className="text-right">{euro(t.prix)}</td><td>{t.saison_libelle}</td>
                      <td>{t.date_debut || t.date_fin ? `${t.date_debut || '…'} → ${t.date_fin || '…'}` : '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </>
        )}
      </ApiState>

      <div className="flex items-center justify-between mb-3">
        <h4 className="font-title font-bold text-sm">Activité dans les dossiers</h4>
        <select className="form-control !w-auto !py-1 text-sm" value={annee} onChange={(e) => setAnnee(e.target.value)}>
          <option value="">Toutes les années</option>
          {[anneeCourante + 1, anneeCourante, anneeCourante - 1, anneeCourante - 2].map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <ApiState isLoading={stats.isLoading} error={stats.error} onRetry={stats.refetch}>
        {s && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
              {s.sources.map((src) => (
                <div key={src.cle} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                  <div className="text-xs text-gray-500">{src.libelle}</div>
                  <div className="font-bold text-base mt-1">
                    {src.unite === 'usage' ? `${s.totaux[src.cle]} mention(s)` : euro(s.totaux[src.cle])}
                  </div>
                </div>
              ))}
            </div>
            {Number(s.ecart_regle_depense) !== 0 && (
              <p className="text-sm mb-3">
                Écart entre dépensé (clôtures) et réglé (reçus) : <b>{euro(s.ecart_regle_depense)}</b>
                {Number(s.ecart_regle_depense) > 0 ? ' — reçus manquants ou paiements restant dus.' : ''}
              </p>
            )}
            {s.dossiers.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun dossier ne mentionne ce prestataire{annee ? ` en ${annee}` : ''}.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="tbl text-xs">
                  <thead><tr>
                    <th>Dossier</th><th>Départ</th>
                    {s.sources.map((src) => <th key={src.cle} className="text-right">{src.libelle.split(' (')[0]}</th>)}
                  </tr></thead>
                  <tbody>{s.dossiers.map((d) => (
                    <tr key={d.id}>
                      <td><div className="font-semibold">PC#{d.id} — {d.client}</div><div className="text-gray-400">{d.programme}</div></td>
                      <td>{d.date_debut}</td>
                      {s.sources.map((src) => (
                        <td key={src.cle} className="text-right">
                          {src.unite === 'usage' ? (d[src.cle] || '—') : (Number(d[src.cle]) ? euro(d[src.cle]) : '—')}
                        </td>
                      ))}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            {s.variantes_trouvees.length > 0 && (
              <p className="text-xs text-gray-400 mt-3">
                Orthographes reconnues : {s.variantes_trouvees.map((v) => `${v.texte} (${v.occurrences})`).join(' · ')}
              </p>
            )}
          </>
        )}
      </ApiState>
    </Modal>
  )
}