/**
 * SITRAC — Prospects : demandes de devis, avant le dossier client.
 *
 * Tableau en colonnes (nouveau → contacté → devis envoyé → gagné / perdu).
 * Une fiche regroupe la demande, l'historique des échanges, la prochaine relance
 * et la conversion en client (avec création du dossier si programme et dates).
 * Lien du formulaire public à mettre sur ramartour.com : /demande-devis
 */
import { Fragment, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Inbox, Plus, Phone, Mail, MessageCircle, BellRing, UserCheck, XCircle, Copy, Globe, Search, Users,
} from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { Modal, StatCard, Badge } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { useAuthStore } from '../../store/authStore'
import { useProgrammes } from '../../hooks/useApi'
import { SOURCES_PROSPECT, STATUTS_PROSPECT, prospectsAPI } from '../../utils/prospectsApi'
import { fmtDate, fmtDateTime } from '../../utils/storage'

const COLONNES = STATUTS_PROSPECT
const COULEUR = { nouveau: 'border-t-orange', contacte: 'border-t-brand-blue', devis_envoye: 'border-t-purple-500',
  gagne: 'border-t-brand-green', perdu: 'border-t-gray-400' }
const VIDE = { nom: '', email: '', telephone: '', pays: '', langue: 'en', nb_adultes: 2, nb_enfants: 0, date_arrivee: '',
  duree_jours: '', budget: '', programme_souhaite: '', envies: '', source: 'email' }

export default function Prospects() {
  const { user } = useAuthStore()
  const peutModifier = ['Sales', 'Administration'].includes(user?.dept)
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filtreRelance, setFiltreRelance] = useState(false)
  const [ouvert, setOuvert] = useState(null)
  const [nouveau, setNouveau] = useState(null)

  const liste = useQuery({ queryKey: ['prospects'], queryFn: () => prospectsAPI.liste() })
  const stats = useQuery({ queryKey: ['prospects-stats'], queryFn: prospectsAPI.statistiques })
  const rafraichir = () => { qc.invalidateQueries({ queryKey: ['prospects'] }); qc.invalidateQueries({ queryKey: ['prospects-stats'] }) }

  const creer = useMutation({
    mutationFn: (data) => prospectsAPI.creer(data),
    onSuccess: () => { toast.success('Prospect ajouté'); setNouveau(null); rafraichir() },
    onError: (e) => toast.error(e.message),
  })

  const prospects = liste.data || []
  const filtres = useMemo(() => prospects.filter((p) => {
    const q = search.trim().toLowerCase()
    return (!q || [p.nom, p.email, p.pays, p.envies].join(' ').toLowerCase().includes(q)) && (!filtreRelance || p.a_relancer)
  }), [prospects, search, filtreRelance])
  const s = stats.data
  const lienPublic = `${window.location.origin}/demande-devis`
  const fiche = ouvert ? prospects.find((p) => p.id === ouvert) : null

  return (
    <Layout breadcrumb={['SITRAC', 'Sales', 'Prospects']}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title"><Inbox size={22} className="text-orange" /> Prospects</h1>
          <p className="page-sub">Demandes de devis, du premier contact à la conversion en client.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" title="Lien à mettre sur le bouton « Demander un devis » de ramartour.com"
            onClick={() => navigator.clipboard.writeText(lienPublic).then(() => toast.success('Lien du formulaire copié'))}>
            <Globe size={14} /> Lien du formulaire <Copy size={12} />
          </button>
          {peutModifier && <button className="btn btn-primary btn-sm" onClick={() => setNouveau({ ...VIDE })}><Plus size={14} /> Saisir un prospect</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Inbox} value={s?.par_statut?.nouveau ?? '—'} label="Nouveaux à traiter" color="orange" />
        <StatCard icon={BellRing} value={s?.a_relancer ?? '—'} label="À relancer aujourd'hui" color="red" />
        <StatCard icon={UserCheck} value={s?.taux_conversion != null ? `${s.taux_conversion} %` : '—'} label="Taux de conversion (12 mois)" color="green" />
        <StatCard icon={Phone} value={s?.delai_premier_contact_heures != null ? `${s.delai_premier_contact_heures} h` : '—'} label="Délai moyen de 1er contact" color="blue" />
      </div>
      {s?.sans_contact_48h > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-brand-red">
          {s.sans_contact_48h} demande(s) attendent un premier contact depuis plus de 48 heures — délai promis au voyageur.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-control !pl-8 !py-1.5 text-sm w-64" placeholder="Nom, email, pays, envies…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={filtreRelance} onChange={(e) => setFiltreRelance(e.target.checked)} /> À relancer uniquement
        </label>
      </div>

      <ApiState isLoading={liste.isLoading} error={liste.error} onRetry={liste.refetch} loadingText="Chargement des prospects...">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {COLONNES.map(([statut, libelle]) => {
            const items = filtres.filter((p) => p.statut === statut)
            return (
              <div key={statut} className={`card border-t-4 ${COULEUR[statut]} !p-0`}>
                <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                  <span className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">{libelle}</span>
                  <span className="text-xs text-gray-400">{items.length}</span>
                </div>
                <div className="p-2 space-y-2 max-h-[65vh] overflow-y-auto">
                  {items.length === 0 && <p className="text-xs text-gray-400 text-center py-4">—</p>}
                  {items.map((p) => (
                    <button key={p.id} onClick={() => setOuvert(p.id)}
                      className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 hover:border-orange bg-white dark:bg-gray-900">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{p.nom}</span>
                        {p.a_relancer && <BellRing size={13} className="text-brand-red flex-shrink-0" title="À relancer" />}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{[p.pays, `${p.nb_adultes + p.nb_enfants} pers.`].filter(Boolean).join(' · ')}</div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate">
                        {p.date_arrivee ? `Arrivée ${fmtDate(p.date_arrivee)}` : 'Dates libres'}{p.programme_nom ? ` · ${p.programme_nom}` : ''}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">{p.source_libelle} · {fmtDate(p.cree_le)}{p.responsable_nom ? ` · ${p.responsable_nom}` : ''}</div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </ApiState>

      {fiche && <FicheProspect p={fiche} peutModifier={peutModifier} userId={user?.id} onFermer={() => setOuvert(null)} onChange={rafraichir} />}
      {nouveau && <FormulaireProspect valeurs={nouveau} enCours={creer.isPending} onFermer={() => setNouveau(null)} onEnregistrer={(d) => creer.mutate(d)} />}
    </Layout>
  )
}

// ─── Fiche d'un prospect ─────────────────────────────────────────
function FicheProspect({ p, peutModifier, userId, onFermer, onChange }) {
  const { data: programmes = [] } = useProgrammes('?page_size=100')
  const [note, setNote] = useState({ type_note: 'note', texte: '' })
  const [relance, setRelance] = useState(p.prochaine_relance || '')
  const [motif, setMotif] = useState('')
  const [conversion, setConversion] = useState(null)
  const actif = ['nouveau', 'contacte', 'devis_envoye'].includes(p.statut)

  const action = (fn, ok) => useMutation({
    mutationFn: fn, onSuccess: () => { if (ok) toast.success(ok); onChange() }, onError: (e) => toast.error(e.message),
  })
  const ajouterNote = action(() => prospectsAPI.note(p.id, note), 'Échange enregistré')
  const changerStatut = action(({ statut, motif: m }) => prospectsAPI.statut(p.id, statut, m), 'Statut mis à jour')
  const majRelance = action((date) => prospectsAPI.modifier(p.id, { prochaine_relance: date || null }), 'Relance planifiée')
  const mAttribuer = action(() => prospectsAPI.modifier(p.id, { responsable: userId }), 'Prospect attribué')
  const convertir = action((data) => prospectsAPI.convertir(p.id, data), 'Client créé')

  return (
    <Modal open onClose={onFermer} size="xl" icon={Inbox} title={`${p.nom} — ${p.statut_libelle}`}
      footer={<button className="btn btn-ghost" onClick={onFermer}>Fermer</button>}>
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {p.email && <a className="btn btn-ghost btn-xs" href={`mailto:${p.email}`}><Mail size={12} /> {p.email}</a>}
            {p.telephone_e164 && <a className="btn btn-ghost btn-xs" href={`tel:${p.telephone_e164}`}><Phone size={12} /> {p.telephone}</a>}
            {p.telephone_e164 && <a className="btn btn-ghost btn-xs" target="_blank" rel="noreferrer" href={`https://wa.me/${p.telephone_e164.replace('+', '')}`}><MessageCircle size={12} /> WhatsApp</a>}
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            {[
              ['Pays', p.pays], ['Langue', p.langue === 'fr' ? 'Français' : 'Anglais'],
              ['Voyageurs', `${p.nb_adultes} adulte(s), ${p.nb_enfants} enfant(s)`],
              ['Arrivée', p.date_arrivee ? fmtDate(p.date_arrivee) : 'non précisée'], ['Durée', p.duree_jours ? `${p.duree_jours} jours` : '—'],
              ['Budget', p.budget || '—'], ['Circuit', p.programme_nom || '—'], ['Source', p.source_libelle],
              ['Reçu le', fmtDateTime(p.cree_le)], ['Responsable', p.responsable_nom || '—'],
            ].map(([k, v]) => (<Fragment key={k}><dt className="text-gray-400">{k}</dt><dd className="text-gray-800 dark:text-gray-200">{v}</dd></Fragment>))}
          </dl>
          {p.envies && <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm whitespace-pre-line">{p.envies}</div>}
          {p.client && <div className="mt-3"><Badge variant="active">Client #{p.client} — {p.client_nom}{p.programme_client ? ` · dossier PC#${p.programme_client}` : ''}</Badge></div>}
          {p.statut === 'perdu' && p.motif_perte && <p className="mt-3 text-sm text-gray-500">Motif : {p.motif_perte}</p>}

          {peutModifier && actif && (
            <div className="mt-5 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
              {!p.responsable && <button className="btn btn-ghost btn-sm" onClick={() => mAttribuer.mutate()}><Users size={13} /> Me l'attribuer</button>}
              <div className="flex items-end gap-2">
                <div className="form-group mb-0 flex-1"><label className="form-label">Prochaine relance</label>
                  <input type="date" className="form-control" value={relance} onChange={(e) => setRelance(e.target.value)} /></div>
                <button className="btn btn-ghost btn-sm" onClick={() => majRelance.mutate(relance)}><BellRing size={13} /> Planifier</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.statut !== 'contacte' && <button className="btn btn-ghost btn-sm" onClick={() => changerStatut.mutate({ statut: 'contacte' })}>Marquer « contacté »</button>}
                {p.statut !== 'devis_envoye' && <button className="btn btn-ghost btn-sm" onClick={() => changerStatut.mutate({ statut: 'devis_envoye' })}>Marquer « devis envoyé »</button>}
                <button className="btn btn-success btn-sm" onClick={() => setConversion({ titre: 'Monsieur', nationalite: '', programme: p.programme_souhaite || '', date_debut: p.date_arrivee || '', date_fin: '' })}>
                  <UserCheck size={13} /> Convertir en client
                </button>
              </div>
              <div className="flex items-end gap-2">
                <div className="form-group mb-0 flex-1"><label className="form-label">Motif si perdu</label>
                  <input className="form-control" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Prix, dates, concurrent, sans réponse…" /></div>
                <button className="btn btn-danger btn-sm" onClick={() => changerStatut.mutate({ statut: 'perdu', motif })}><XCircle size={13} /> Perdu</button>
              </div>
            </div>
          )}

          {conversion && (
            <div className="mt-4 p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 space-y-3">
              <div className="font-semibold text-sm">Créer le client {p.nom}</div>
              <div className="grid grid-cols-2 gap-3">
                <select className="form-control" value={conversion.titre} onChange={(e) => setConversion({ ...conversion, titre: e.target.value })}>
                  {['Monsieur', 'Madame', 'Mademoiselle'].map((t) => <option key={t}>{t}</option>)}
                </select>
                <input className="form-control" placeholder="Nationalité *" value={conversion.nationalite} onChange={(e) => setConversion({ ...conversion, nationalite: e.target.value })} />
              </div>
              <p className="text-xs text-gray-500">Facultatif — créer aussi le dossier (Programme Client) :</p>
              <select className="form-control" value={conversion.programme} onChange={(e) => setConversion({ ...conversion, programme: e.target.value })}>
                <option value="">— Pas encore de dossier —</option>
                {programmes.filter((x) => x.actif).map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
              </select>
              {conversion.programme && (
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" className="form-control" value={conversion.date_debut} onChange={(e) => setConversion({ ...conversion, date_debut: e.target.value })} />
                  <input type="date" className="form-control" value={conversion.date_fin} onChange={(e) => setConversion({ ...conversion, date_fin: e.target.value })} />
                </div>
              )}
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => setConversion(null)}>Annuler</button>
                <button className="btn btn-success btn-sm" disabled={convertir.isPending} onClick={() => convertir.mutate({
                  ...conversion, programme: conversion.programme || null,
                  date_debut: conversion.programme ? conversion.date_debut : null, date_fin: conversion.programme ? conversion.date_fin : null,
                })}>Confirmer la conversion</button>
              </div>
            </div>
          )}
        </div>

        <div>
          <h4 className="font-title font-bold text-sm mb-2">Échanges</h4>
          {peutModifier && (
            <div className="flex gap-2 mb-3">
              <select className="form-control !w-28 !py-1 text-sm" value={note.type_note} onChange={(e) => setNote({ ...note, type_note: e.target.value })}>
                <option value="note">Note</option><option value="appel">Appel</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option>
              </select>
              <input className="form-control !py-1 text-sm" placeholder="Résumé de l'échange…" value={note.texte}
                onChange={(e) => setNote({ ...note, texte: e.target.value })} />
              <button className="btn btn-primary btn-sm" disabled={!note.texte.trim() || ajouterNote.isPending}
                onClick={() => ajouterNote.mutate(undefined, { onSuccess: () => setNote({ ...note, texte: '' }) })}>Ajouter</button>
            </div>
          )}
          <ol className="space-y-2 max-h-[55vh] overflow-y-auto">
            {p.notes.map((n) => (
              <li key={n.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <div className="text-[11px] text-gray-400">{fmtDateTime(n.cree_le)} · {n.type_libelle}{n.auteur_nom ? ` · ${n.auteur_nom}` : ''}</div>
                <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">{n.texte}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Modal>
  )
}

// ─── Saisie manuelle (email, WhatsApp, téléphone, salon…) ────────
function FormulaireProspect({ valeurs, enCours, onFermer, onEnregistrer }) {
  const { data: programmes = [] } = useProgrammes('?page_size=100')
  const [v, setV] = useState(valeurs)
  const champ = (k) => ({ value: v[k] ?? '', onChange: (e) => setV({ ...v, [k]: e.target.value }) })
  const soumettre = () => {
    if (!v.nom.trim()) { toast.error('Le nom est obligatoire.'); return }
    onEnregistrer({ ...v, nb_adultes: Number(v.nb_adultes) || 1, nb_enfants: Number(v.nb_enfants) || 0,
      duree_jours: v.duree_jours ? Number(v.duree_jours) : null, date_arrivee: v.date_arrivee || null,
      programme_souhaite: v.programme_souhaite || null })
  }
  return (
    <Modal open onClose={onFermer} size="lg" icon={Plus} title="Saisir un prospect"
      footer={<><button className="btn btn-ghost" onClick={onFermer}>Annuler</button>
        <button className="btn btn-success" disabled={enCours} onClick={soumettre}>Enregistrer</button></>}>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group"><label className="form-label">Nom *</label><input className="form-control" {...champ('nom')} /></div>
        <div className="form-group"><label className="form-label">Source</label>
          <select className="form-control" {...champ('source')}>{SOURCES_PROSPECT.filter(([k]) => k !== 'site_web').map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-control" {...champ('email')} /></div>
        <div className="form-group"><label className="form-label">Téléphone (avec indicatif)</label><input className="form-control" {...champ('telephone')} placeholder="+33 6 …" /></div>
        <div className="form-group"><label className="form-label">Pays</label><input className="form-control" {...champ('pays')} /></div>
        <div className="form-group"><label className="form-label">Langue</label>
          <select className="form-control" {...champ('langue')}><option value="en">Anglais</option><option value="fr">Français</option></select></div>
        <div className="form-group"><label className="form-label">Adultes / enfants</label>
          <div className="grid grid-cols-2 gap-2"><input type="number" min="1" className="form-control" {...champ('nb_adultes')} /><input type="number" min="0" className="form-control" {...champ('nb_enfants')} /></div></div>
        <div className="form-group"><label className="form-label">Arrivée souhaitée / durée (jours)</label>
          <div className="grid grid-cols-2 gap-2"><input type="date" className="form-control" {...champ('date_arrivee')} /><input type="number" min="1" className="form-control" {...champ('duree_jours')} /></div></div>
        <div className="form-group"><label className="form-label">Circuit souhaité</label>
          <select className="form-control" {...champ('programme_souhaite')}><option value="">—</option>{programmes.filter((x) => x.actif).map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Budget</label><input className="form-control" {...champ('budget')} /></div>
      </div>
      <div className="form-group"><label className="form-label">Envies / demande</label><textarea rows={3} className="form-control" {...champ('envies')} /></div>
    </Modal>
  )
}