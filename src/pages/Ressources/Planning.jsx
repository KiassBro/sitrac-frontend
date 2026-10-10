/**
 * SITRAC — Planning des ressources (chauffeurs, guides, véhicules)
 *
 * Onglet « Planning »          : qui est occupé quand, mois par mois. Les doubles affectations
 *                                et les voyages pendant une indisponibilité apparaissent en rouge.
 * Onglet « Ressources »        : fiches (téléphone, langues, immatriculation, places) et
 *                                indisponibilités (congés, entretien du véhicule…).
 * Onglet « Noms à rattacher »  : noms saisis dans les brieffings sans fiche ressource.
 *
 * Les affectations sont lues dans les brieffings (chauffeur, guide, voiture) sur la
 * période du voyage. Dossiers annulés exclus.
 */
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CalendarRange, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, AlertTriangle, Link2, X, Users, Car } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { Modal, StatCard, EmptyState, Badge } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { useConfirm } from '../../hooks/useConfirm'
import { useAuthStore } from '../../store/authStore'
import { TYPES_RESSOURCE, ressourcesAPI } from '../../utils/ressourcesApi'
import { fmtDate } from '../../utils/storage'

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const versDate = (s) => { const [a, m, j] = s.split('-').map(Number); return new Date(a, m - 1, j) }
const JOUR = 24 * 3600 * 1000
const LIB_TYPE = Object.fromEntries(TYPES_RESSOURCE)
const VIDE = { type_ressource: 'chauffeur', nom: '', telephone: '', email: '', langues: '', immatriculation: '',
  capacite: '', notes: '', alias: [], indisponibilites: [] }

export default function Planning() {
  const { user } = useAuthStore()
  const peutModifier = ['Booking', 'Administration'].includes(user?.dept)
  const qc = useQueryClient()
  const { confirmDelete } = useConfirm()
  const [onglet, setOnglet] = useState('planning')
  const [mois, setMois] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [form, setForm] = useState(null)

  const debut = iso(mois)
  const finDate = new Date(mois.getFullYear(), mois.getMonth() + 1, 0)
  const fin = iso(finDate)
  const plan = useQuery({ queryKey: ['planning', debut, fin], queryFn: () => ressourcesAPI.planning(debut, fin) })
  const ressources = useQuery({ queryKey: ['ressources', 'toutes'], queryFn: () => ressourcesAPI.liste() })

  const rafraichir = () => {
    qc.invalidateQueries({ queryKey: ['planning'] })
    qc.invalidateQueries({ queryKey: ['ressources'] })
  }
  const enregistrer = useMutation({
    mutationFn: ({ id, data }) => (id ? ressourcesAPI.modifier(id, data) : ressourcesAPI.creer(data)),
    onSuccess: (_, { id }) => { toast.success(id ? 'Ressource mise à jour' : 'Ressource créée'); setForm(null); rafraichir() },
    onError: (e) => toast.error(e.message),
  })
  const supprimer = useMutation({
    mutationFn: (id) => ressourcesAPI.supprimer(id),
    onSuccess: () => { toast.success('Ressource supprimée'); rafraichir() }, onError: (e) => toast.error(e.message),
  })
  const rattacher = useMutation({
    mutationFn: ({ id, textes }) => ressourcesAPI.alias(id, textes),
    onSuccess: (r) => {
      if (r.ajoutes.length) toast.success(`Rattaché à « ${r.ressource.nom} »`)
      r.conflits.forEach((c) => toast.error(`« ${c.texte} » appartient déjà à « ${c.ressource} »`))
      rafraichir()
    },
    onError: (e) => toast.error(e.message),
  })

  const p = plan.data
  const liste = ressources.data || []
  const changerMois = (n) => setMois(new Date(mois.getFullYear(), mois.getMonth() + n, 1))

  return (
    <Layout breadcrumb={['SITRAC', 'Booking', 'Planning des ressources']}>
      <div className="mb-5">
        <h1 className="page-title"><CalendarRange size={22} className="text-orange" /> Planning des ressources</h1>
        <p className="page-sub">Chauffeurs, guides et véhicules : affectations lues dans les brieffings, conflits détectés automatiquement.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} value={liste.filter((r) => r.type_ressource !== 'vehicule' && r.actif).length} label="Chauffeurs et guides" color="orange" />
        <StatCard icon={Car} value={liste.filter((r) => r.type_ressource === 'vehicule' && r.actif).length} label="Véhicules" color="blue" />
        <StatCard icon={AlertTriangle} value={p?.nb_conflits ?? '—'} label={`Conflits en ${MOIS[mois.getMonth()]}`} color="red" />
        <StatCard icon={Link2} value={p?.non_rattachees?.length ?? '—'} label="Noms à rattacher" color="purple" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[['planning', 'Planning'], ['ressources', 'Ressources'], ['rattacher', `Noms à rattacher${p ? ` (${p.non_rattachees.length})` : ''}`]].map(([k, l]) => (
          <button key={k} className={`btn btn-sm ${onglet === k ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOnglet(k)}>{l}</button>
        ))}
        {peutModifier && onglet === 'ressources' && (
          <button className="btn btn-primary btn-sm ml-auto" onClick={() => setForm({ ...VIDE })}><Plus size={14} /> Ajouter une ressource</button>
        )}
      </div>

      {onglet === 'planning' && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost btn-xs" onClick={() => changerMois(-1)}><ChevronLeft size={14} /></button>
              <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200 min-w-[140px] text-center capitalize">
                {MOIS[mois.getMonth()]} {mois.getFullYear()}
              </h3>
              <button className="btn btn-ghost btn-xs" onClick={() => changerMois(1)}><ChevronRight size={14} /></button>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-orange" /> Voyage</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-brand-red" /> Conflit</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-gray-300 dark:bg-gray-600" /> Indisponible</span>
            </div>
          </div>
          <ApiState isLoading={plan.isLoading} error={plan.error} onRetry={plan.refetch} loadingText="Calcul du planning...">
            {p && <Grille plan={p} debut={mois} fin={finDate} />}
          </ApiState>
        </div>
      )}

      {onglet === 'ressources' && (
        <div className="card">
          <ApiState isLoading={ressources.isLoading} error={ressources.error} onRetry={ressources.refetch}>
            {liste.length === 0 ? (
              <EmptyState icon={Users} title="Aucune ressource" desc="Ajoutez vos chauffeurs, guides et véhicules, ou partez de l'onglet « Noms à rattacher »." />
            ) : (
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead><tr><th>Type</th><th>Nom</th><th>Contact</th><th>Détails</th><th>Indisponibilités</th><th>État</th><th className="text-right">Actions</th></tr></thead>
                  <tbody>
                    {liste.map((r) => (
                      <tr key={r.id} className={r.actif ? '' : 'opacity-60'}>
                        <td><Badge variant="info">{r.type_libelle}</Badge></td>
                        <td>
                          <strong className="text-gray-900 dark:text-white">{r.nom}</strong>
                          {r.alias?.length > 0 && <div className="text-xs text-gray-400" title={r.alias.join(' · ')}>+ {r.alias.length} écriture(s)</div>}
                        </td>
                        <td className="text-xs">{[r.telephone, r.email].filter(Boolean).join(' · ') || '—'}</td>
                        <td className="text-xs">
                          {[r.immatriculation, r.capacite ? `${r.capacite} places` : '', r.langues].filter(Boolean).join(' · ') || '—'}
                        </td>
                        <td className="text-xs">
                          {r.indisponibilites.length
                            ? r.indisponibilites.map((i) => `${fmtDate(i.debut)} → ${fmtDate(i.fin)}${i.motif ? ` (${i.motif})` : ''}`).join(', ')
                            : '—'}
                        </td>
                        <td>{r.actif ? <Badge variant="active">Active</Badge> : <Badge variant="inactive">Inactive</Badge>}</td>
                        <td className="text-right whitespace-nowrap">
                          {peutModifier && (
                            <>
                              <button className="btn btn-ghost btn-xs" onClick={() => setForm({
                                ...VIDE, ...r, capacite: r.capacite ?? '',
                              })}><Pencil size={12} /></button>{' '}
                              <button className="btn btn-ghost btn-xs" onClick={() => confirmDelete(r.nom, () => supprimer.mutate(r.id))}><Trash2 size={12} /></button>
                            </>
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
      )}

      {onglet === 'rattacher' && (
        <div className="card">
          <div className="px-5 pt-4 text-sm text-gray-500 dark:text-gray-400">
            Noms saisis dans les brieffings de {MOIS[mois.getMonth()]} {mois.getFullYear()} qui ne correspondent à aucune
            fiche. Créez la fiche, ou rattachez cette écriture à une ressource existante.
          </div>
          <ApiState isLoading={plan.isLoading} error={plan.error} onRetry={plan.refetch}>
            {!p?.non_rattachees.length ? (
              <EmptyState icon={Link2} title="Tout est rattaché" desc="Chaque nom saisi dans les brieffings du mois correspond à une fiche." />
            ) : (
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead><tr><th>Type</th><th>Nom saisi</th><th>Dossiers</th><th>Action</th></tr></thead>
                  <tbody>
                    {p.non_rattachees.map((g) => (
                      <LigneARattacher key={`${g.type}|${g.texte}`} g={g} liste={liste} peutModifier={peutModifier}
                        onCreer={() => setForm({ ...VIDE, type_ressource: g.type, nom: g.texte })}
                        onRattacher={(id) => rattacher.mutate({ id, textes: [g.texte] })} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ApiState>
        </div>
      )}

      {form && (
        <FormulaireRessource valeurs={form} enCours={enregistrer.isPending} onFermer={() => setForm(null)}
          onEnregistrer={(data) => enregistrer.mutate({ id: form.id, data })} />
      )}
    </Layout>
  )
}

// ─── Grille du planning ──────────────────────────────────────────
function Grille({ plan, debut, fin }) {
  const nbJours = Math.round((fin - debut) / JOUR) + 1
  const jours = Array.from({ length: nbJours }, (_, i) => new Date(debut.getFullYear(), debut.getMonth(), i + 1))
  const position = (d1, d2) => {
    const a = Math.max(0, Math.round((versDate(d1) - debut) / JOUR))
    const b = Math.min(nbJours - 1, Math.round((versDate(d2) - debut) / JOUR))
    return { left: `${(a / nbJours) * 100}%`, width: `${((b - a + 1) / nbJours) * 100}%` }
  }
  const lignes = useMemo(() => [
    ...plan.ressources.map((r) => ({ ...r, fiche: true })),
    ...plan.non_rattachees.map((g) => ({ id: `n-${g.type}-${g.texte}`, type: g.type, type_libelle: LIB_TYPE[g.type],
      nom: g.texte, affectations: g.dossiers, indisponibilites: [], conflits: g.conflits, fiche: false })),
  ].filter((l) => l.affectations.length || l.indisponibilites.length || l.fiche)
    .sort((a, b) => a.type.localeCompare(b.type) || a.nom.localeCompare(b.nom)), [plan])

  if (!lignes.length) {
    return <EmptyState icon={CalendarRange} title="Rien ce mois-ci" desc="Aucune ressource ni affectation sur la période." />
  }
  const enConflit = (l, pc) => l.conflits.some((c) => c.a.pc === pc || c.b.pc === pc)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="flex border-b border-gray-200 dark:border-gray-700 text-[10px] text-gray-400">
          <div className="w-52 flex-shrink-0 px-3 py-1.5 font-bold uppercase">Ressource</div>
          <div className="flex-1 flex">
            {jours.map((j) => (
              <div key={j.getDate()} className={`flex-1 text-center py-1.5 ${[0, 6].includes(j.getDay()) ? 'bg-gray-50 dark:bg-gray-800/60' : ''}`}>
                {j.getDate()}
              </div>
            ))}
          </div>
        </div>
        {lignes.map((l) => (
          <div key={l.id} className="flex border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
            <div className="w-52 flex-shrink-0 px-3 py-2">
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate" title={l.nom}>{l.nom}</div>
              <div className="text-[10px] text-gray-400 flex items-center gap-1">
                {l.type_libelle}{!l.fiche && <span className="text-orange">· sans fiche</span>}
                {l.conflits.length > 0 && <span className="text-brand-red font-bold flex items-center gap-0.5"><AlertTriangle size={10} />{l.conflits.length}</span>}
              </div>
            </div>
            <div className="flex-1 relative min-h-[44px]">
              <div className="absolute inset-0 flex pointer-events-none">
                {jours.map((j) => <div key={j.getDate()} className={`flex-1 ${[0, 6].includes(j.getDay()) ? 'bg-gray-50 dark:bg-gray-800/60' : ''}`} />)}
              </div>
              {l.indisponibilites.map((i) => (
                <div key={`i${i.id}`} className="absolute top-1.5 h-[30px] rounded bg-gray-300 dark:bg-gray-600 text-[10px] px-1.5 flex items-center truncate text-gray-700 dark:text-gray-200"
                  style={position(i.debut, i.fin)} title={`Indisponible : ${i.motif || ''} (${fmtDate(i.debut)} → ${fmtDate(i.fin)})`}>
                  {i.motif || 'Indisponible'}
                </div>
              ))}
              {l.affectations.map((a) => (
                <div key={a.pc} className={`absolute top-1.5 h-[30px] rounded text-[10px] px-1.5 flex items-center truncate text-white font-semibold shadow-sm ${enConflit(l, a.pc) ? 'bg-brand-red ring-2 ring-red-300' : 'bg-orange'}`}
                  style={position(a.debut, a.fin)}
                  title={`PC#${a.pc} ${a.client} — ${a.programme}\n${fmtDate(a.debut)} → ${fmtDate(a.fin)}\nSaisi : ${a.texte}`}>
                  {a.client}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {plan.nb_conflits > 0 && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <div className="text-sm font-bold text-brand-red flex items-center gap-1"><AlertTriangle size={14} /> Conflits à résoudre</div>
          {lignes.flatMap((l) => l.conflits.map((c, i) => (
            <div key={`${l.id}-${i}`} className="text-xs text-gray-600 dark:text-gray-300">
              <b>{l.nom}</b> ({l.type_libelle.toLowerCase()}) :{' '}
              {[c.a, c.b].map((x) => x.indisponibilite
                ? `indisponible${x.motif ? ` (${x.motif})` : ''} du ${fmtDate(x.debut)} au ${fmtDate(x.fin)}`
                : `PC#${x.pc} ${x.client} du ${fmtDate(x.debut)} au ${fmtDate(x.fin)}`).join(' ↔ ')}
            </div>
          )))}
        </div>
      )}
    </div>
  )
}

// ─── Ligne « nom à rattacher » ───────────────────────────────────
function LigneARattacher({ g, liste, peutModifier, onCreer, onRattacher }) {
  const [cible, setCible] = useState('')
  const memesType = liste.filter((r) => r.type_ressource === g.type)
  return (
    <tr>
      <td><Badge variant="info">{LIB_TYPE[g.type]}</Badge></td>
      <td><strong>{g.texte}</strong></td>
      <td className="text-xs">{g.dossiers.map((d) => `PC#${d.pc} ${d.client}`).join(', ')}</td>
      <td className="min-w-[260px]">
        {!peutModifier ? <span className="text-xs text-gray-400">Lecture seule</span> : (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1">
              <select className="form-control !py-1 text-xs" value={cible} onChange={(e) => setCible(e.target.value)}>
                <option value="">Rattacher à…</option>
                {memesType.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
              </select>
              <button className="btn btn-ghost btn-xs" disabled={!cible} onClick={() => onRattacher(Number(cible))}>OK</button>
            </div>
            <button className="btn btn-primary btn-xs justify-start" onClick={onCreer}><Plus size={12} /> Créer la fiche « {g.texte} »</button>
          </div>
        )}
      </td>
    </tr>
  )
}

// ─── Formulaire ressource ────────────────────────────────────────
function FormulaireRessource({ valeurs, enCours, onFermer, onEnregistrer }) {
  const [v, setV] = useState(valeurs)
  const [nouvelAlias, setNouvelAlias] = useState('')
  const champ = (k) => ({ value: v[k] ?? '', onChange: (e) => setV({ ...v, [k]: e.target.value }) })
  const majIndispo = (i, k, val) => setV({ ...v, indisponibilites: v.indisponibilites.map((x, j) => (j === i ? { ...x, [k]: val } : x)) })
  const soumettre = () => {
    if (!v.nom.trim()) { toast.error('Le nom est obligatoire.'); return }
    if (v.indisponibilites.some((i) => !i.debut || !i.fin)) { toast.error('Chaque indisponibilité doit avoir une date de début et de fin.'); return }
    const { id, type_libelle, cree_le, modifie_le, ...data } = v
    onEnregistrer({ ...data, capacite: data.capacite === '' ? null : Number(data.capacite) })
  }
  const vehicule = v.type_ressource === 'vehicule'

  return (
    <Modal open onClose={onFermer} size="lg" icon={vehicule ? Car : Users}
      title={valeurs.id ? `Modifier « ${valeurs.nom} »` : 'Nouvelle ressource'}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onFermer}>Annuler</button>
          <button className="btn btn-success" disabled={enCours} onClick={soumettre}>Enregistrer</button>
        </>
      )}>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Type *</label>
          <select className="form-control" {...champ('type_ressource')} disabled={!!valeurs.id}>
            {TYPES_RESSOURCE.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{vehicule ? 'Désignation *' : 'Nom complet *'}</label>
          <input className="form-control" {...champ('nom')} placeholder={vehicule ? 'Ex : Toyota Land Cruiser 4x4' : 'Ex : Hery Rasolofo'} />
        </div>
        {vehicule ? (
          <>
            <div className="form-group"><label className="form-label">Immatriculation</label><input className="form-control" {...champ('immatriculation')} placeholder="5678 TBA" /></div>
            <div className="form-group"><label className="form-label">Places passagers</label><input type="number" min="1" className="form-control" {...champ('capacite')} /></div>
          </>
        ) : (
          <>
            <div className="form-group"><label className="form-label">Téléphone</label><input className="form-control" {...champ('telephone')} placeholder="+261 34 …" /></div>
            <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-control" {...champ('email')} /></div>
            {v.type_ressource === 'guide' && (
              <div className="form-group col-span-2"><label className="form-label">Langues parlées</label><input className="form-control" {...champ('langues')} placeholder="Français, anglais, allemand" /></div>
            )}
          </>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Autres écritures rencontrées dans les brieffings</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {v.alias.length === 0 && <span className="text-xs text-gray-400">Aucune</span>}
          {v.alias.map((a) => (
            <span key={a} className="badge badge-pending">{a}
              <button type="button" onClick={() => setV({ ...v, alias: v.alias.filter((x) => x !== a) })}><X size={11} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="form-control" value={nouvelAlias} onChange={(e) => setNouvelAlias(e.target.value)}
            placeholder={vehicule ? 'Ex : LC 5678' : 'Ex : Hery R.'} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
            const a = nouvelAlias.trim(); if (a && !v.alias.includes(a)) setV({ ...v, alias: [...v.alias, a] }); setNouvelAlias('')
          }}><Plus size={13} /> Ajouter</button>
        </div>
      </div>

      <div className="form-group">
        <div className="flex items-center justify-between mb-2">
          <label className="form-label !mb-0">Indisponibilités ({vehicule ? 'entretien, réparation…' : 'congés, maladie…'})</label>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setV({ ...v, indisponibilites: [...v.indisponibilites, { debut: '', fin: '', motif: '' }] })}>
            <Plus size={12} /> Ajouter
          </button>
        </div>
        {v.indisponibilites.length === 0 ? <p className="text-xs text-gray-400">Aucune.</p> : v.indisponibilites.map((i, idx) => (
          <div key={i.id || `n${idx}`} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 mb-2">
            <input type="date" className="form-control !py-1 text-sm" value={i.debut} onChange={(e) => majIndispo(idx, 'debut', e.target.value)} />
            <input type="date" className="form-control !py-1 text-sm" value={i.fin} onChange={(e) => majIndispo(idx, 'fin', e.target.value)} />
            <input className="form-control !py-1 text-sm" value={i.motif} placeholder="Motif" onChange={(e) => majIndispo(idx, 'motif', e.target.value)} />
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setV({ ...v, indisponibilites: v.indisponibilites.filter((_, j) => j !== idx) })}><Trash2 size={12} /></button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
        <div className="form-group mb-0"><label className="form-label">Notes</label><input className="form-control" {...champ('notes')} /></div>
        <label className="flex items-center gap-2 text-sm pb-2 cursor-pointer">
          <input type="checkbox" checked={v.actif !== false} onChange={(e) => setV({ ...v, actif: e.target.checked })} /> Active
        </label>
      </div>
    </Modal>
  )
}