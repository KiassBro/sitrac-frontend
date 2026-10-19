/**
 * SITRAC — Messagerie interne du personnel (type Messenger).
 * Réception par rafraîchissement automatique : conversations toutes les 5 s,
 * conversation ouverte toutes les 3 s (seulement quand l'onglet est visible).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Check, CheckCheck, Download, FileSpreadsheet, FileText, FolderOpen, Loader2, MessageSquarePlus,
  MessagesSquare, Paperclip, Search, Send, Users, X,
} from 'lucide-react'
import Layout from '../components/Layout/Layout'
import Modal from '../components/UI/Modal'
import { messagerieAPI } from '../utils/api'
import { useAuthStore } from '../store/authStore'
import { useProgrammeClients } from '../hooks/useApi'

const COULEURS = {
  Sales: '#F5A623', Booking: '#27AE60', Finance: '#2980B9', Administration: '#8E44AD', Superviseur: '#2C3E50',
}
const DEPARTEMENTS = ['Sales', 'Booking', 'Finance', 'Administration', 'Superviseur']

const initiales = (nom = '') => nom.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join('').toUpperCase() || '?'

function Avatar({ nom, departement, groupe = false, taille = 40 }) {
  return (
    <span className="shrink-0 rounded-full grid place-items-center text-white font-bold"
      style={{ width: taille, height: taille, fontSize: taille * 0.36,
               background: groupe ? '#1F4D3A' : (COULEURS[departement] || '#94A3B8') }}>
      {groupe ? <Users size={taille * 0.45} /> : initiales(nom)}
    </span>
  )
}

const heure = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
function quand(d) {
  const date = new Date(d), maintenant = new Date()
  if (date.toDateString() === maintenant.toDateString()) return heure(d)
  const hier = new Date(maintenant); hier.setDate(hier.getDate() - 1)
  if (date.toDateString() === hier.toDateString()) return 'Hier'
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}
function jourLibelle(d) {
  const date = new Date(d), maintenant = new Date()
  if (date.toDateString() === maintenant.toDateString()) return "Aujourd'hui"
  const hier = new Date(maintenant); hier.setDate(hier.getDate() - 1)
  if (date.toDateString() === hier.toDateString()) return 'Hier'
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/* ── Pièces jointes ──────────────────────────────────────────── */
const ACCEPTES = '.pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.csv,.txt'
const TAILLE_MAX = 10 * 1024 * 1024
const taille = (o) => (o < 1024 * 1024 ? `${Math.max(1, Math.round(o / 1024))} Ko` : `${(o / 1024 / 1024).toFixed(1)} Mo`)
const IconeFichier = ({ nom }) => (/\.(xlsx|csv)$/i.test(nom) ? <FileSpreadsheet size={20} /> : <FileText size={20} />)

function PieceJointe({ message, moi }) {
  const pj = message.piece_jointe
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!pj.image) return undefined
    let lien = null, actif = true
    messagerieAPI.fichierBlob(message.id).then((b) => { if (actif) { lien = URL.createObjectURL(b); setUrl(lien) } }).catch(() => {})
    return () => { actif = false; if (lien) URL.revokeObjectURL(lien) }
  }, [message.id, pj.image])
  const telecharger = () => messagerieAPI.telecharger(message.id, pj.nom).catch((e) => toast.error(e.message))

  if (pj.image) {
    return (
      <button type="button" onClick={() => url && window.open(url, '_blank', 'noopener')} title={`${pj.nom} — ouvrir`}
        className="block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        {url ? <img src={url} alt={pj.nom} className="max-w-[260px] max-h-[260px] object-cover" />
             : <span className="w-[200px] h-[140px] grid place-items-center"><Loader2 className="animate-spin text-gray-400" /></span>}
      </button>
    )
  }
  return (
    <button type="button" onClick={telecharger} title="Télécharger"
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left min-w-[220px] max-w-[300px] border transition
        ${moi ? 'bg-orange/90 border-orange text-white hover:bg-orange' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-orange'}`}>
      <span className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${moi ? 'bg-white/20' : 'bg-orange/10 text-orange'}`}><IconeFichier nom={pj.nom} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold truncate">{pj.nom}</span>
        <span className={`block text-[11px] ${moi ? 'text-white/80' : 'text-gray-500'}`}>{taille(pj.taille)}</span>
      </span>
      <Download size={16} className="shrink-0 opacity-80" />
    </button>
  )
}

/* ── Nouvelle conversation ───────────────────────────────────── */
function NouvelleConversation({ open, onClose, onCree }) {
  const [recherche, setRecherche] = useState('')
  const [choisis, setChoisis] = useState([])
  const [titre, setTitre] = useState('')
  const [dossier, setDossier] = useState('')
  const [enCours, setEnCours] = useState(false)
  const { data: contacts = [] } = useQuery({ queryKey: ['messagerie-contacts'], queryFn: messagerieAPI.contacts, enabled: open })
  const { data: dossiers = [], isError } = useProgrammeClients()

  useEffect(() => { if (!open) { setRecherche(''); setChoisis([]); setTitre(''); setDossier('') } }, [open])

  const filtres = contacts.filter((c) => c.nom.toLowerCase().includes(recherche.toLowerCase())
                                     || c.departement.toLowerCase().includes(recherche.toLowerCase()))
  const basculer = (id) => setChoisis((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))
  const toutDept = (dept) => {
    const ids = contacts.filter((c) => c.departement === dept).map((c) => c.id)
    const tous = ids.every((id) => choisis.includes(id))
    setChoisis((l) => (tous ? l.filter((x) => !ids.includes(x)) : [...new Set([...l, ...ids])]))
  }
  const groupe = choisis.length > 1 || dossier

  const creer = async () => {
    setEnCours(true)
    try {
      const conv = await messagerieAPI.ouvrir({ participants: choisis, titre: groupe ? titre : '',
                                                programme_client: dossier || null })
      onCree(conv)
    } catch (e) {
      toast.error(e.message || 'Conversation impossible à créer')
    } finally { setEnCours(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle conversation" icon={MessageSquarePlus} size="md"
      footer={(
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" disabled={!choisis.length || enCours} onClick={creer}>
            {enCours ? <Loader2 size={15} className="animate-spin" /> : <MessagesSquare size={15} />}
            {choisis.length > 1 ? `Créer le groupe (${choisis.length + 1})` : 'Écrire'}
          </button>
        </div>
      )}>
      <div className="space-y-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-control pl-9" placeholder="Rechercher une personne ou un département"
            value={recherche} onChange={(e) => setRecherche(e.target.value)} autoFocus />
        </div>

        <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
          {DEPARTEMENTS.map((dept) => {
            const gens = filtres.filter((c) => c.departement === dept)
            if (!gens.length) return null
            const tous = gens.every((c) => choisis.includes(c.id))
            return (
              <div key={dept}>
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{dept}</span>
                  <button type="button" onClick={() => toutDept(dept)} className="text-xs font-semibold text-orange hover:underline">
                    {tous ? 'Retirer tout' : 'Tout le département'}
                  </button>
                </div>
                {gens.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <input type="checkbox" className="accent-orange w-4 h-4" checked={choisis.includes(c.id)} onChange={() => basculer(c.id)} />
                    <Avatar nom={c.nom} departement={c.departement} taille={30} />
                    <span className="text-sm text-gray-800 dark:text-gray-200">{c.nom}</span>
                  </label>
                ))}
              </div>
            )
          })}
          {!filtres.length && <p className="p-4 text-sm text-gray-400 text-center">Aucune personne trouvée.</p>}
        </div>

        {groupe && (
          <div>
            <label className="form-label">Nom du groupe (facultatif)</label>
            <input className="form-control" maxLength={120} placeholder="Ex. : Préparation départ MERCIER"
              value={titre} onChange={(e) => setTitre(e.target.value)} />
          </div>
        )}
        {!isError && dossiers.length > 0 && (
          <div>
            <label className="form-label">Dossier concerné (facultatif)</label>
            <select className="form-control" value={dossier} onChange={(e) => setDossier(e.target.value)}>
              <option value="">— Aucun —</option>
              {dossiers.map((d) => (
                <option key={d.id} value={d.id}>N° {d.id} — {d.client_nom || ''} · {d.programme_nom || ''}</option>
              ))}
            </select>
            <p className="form-hint">La conversation affichera le dossier, pour que tout le monde parle du même voyage.</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ── Conversation ouverte ────────────────────────────────────── */
function Fil({ conversation, onRetour }) {
  const qc = useQueryClient()
  const [messages, setMessages] = useState([])
  const [vu, setVu] = useState(0)
  const [plusAnciens, setPlusAnciens] = useState(false)
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [fichier, setFichier] = useState(null)
  const champFichier = useRef(null)
  const [chargement, setChargement] = useState(true)
  const bas = useRef(null)
  const zone = useRef(null)
  const dernierId = messages.length ? messages[messages.length - 1].id : 0
  const id = conversation.id

  useEffect(() => {
    let actif = true
    setChargement(true); setMessages([])
    messagerieAPI.messages(id).then((r) => {
      if (!actif) return
      setMessages(r.messages); setVu(r.vu_jusqu_a); setPlusAnciens(r.plus_anciens); setChargement(false)
      qc.invalidateQueries({ queryKey: ['messagerie-non-lus'] })
    }).catch(() => setChargement(false))
    return () => { actif = false }
  }, [id, qc])

  // Rafraîchissement : nouveaux messages et « Vu »
  useEffect(() => {
    if (chargement) return
    const h = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      messagerieAPI.messages(id, dernierId).then((r) => {
        setVu(r.vu_jusqu_a)
        if (r.messages.length) {
          setMessages((l) => [...l, ...r.messages.filter((m) => !l.some((x) => x.id === m.id))])
          qc.invalidateQueries({ queryKey: ['messagerie-non-lus'] })
        }
      }).catch(() => {})
    }, 3000)
    return () => clearInterval(h)
  }, [id, dernierId, chargement, qc])

  useEffect(() => { bas.current?.scrollIntoView({ block: 'end' }) }, [dernierId])

  const chargerAnciens = async () => {
    const r = await messagerieAPI.anciens(id, messages[0].id)
    const hauteur = zone.current?.scrollHeight || 0
    setMessages((l) => [...r.messages, ...l]); setPlusAnciens(r.plus_anciens)
    requestAnimationFrame(() => { if (zone.current) zone.current.scrollTop = zone.current.scrollHeight - hauteur })
  }

  const choisirFichier = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.size > TAILLE_MAX) { toast.error('Fichier trop volumineux (10 Mo au maximum).'); return }
    setFichier(f)
  }

  const envoyer = async () => {
    const t = texte.trim()
    if ((!t && !fichier) || envoi) return
    setEnvoi(true)
    try {
      const m = fichier ? await messagerieAPI.envoyerFichier(id, t, fichier) : await messagerieAPI.envoyer(id, t)
      setMessages((l) => [...l, m]); setTexte(''); setFichier(null)
      qc.invalidateQueries({ queryKey: ['messagerie-conversations'] })
    } catch (e) {
      toast.error(e.message || "Message non envoyé")
    } finally { setEnvoi(false) }
  }

  const monDernier = [...messages].reverse().find((m) => m.moi)
  const groupe = conversation.type === 'groupe'

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* En-tête */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button onClick={onRetour} className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Retour">
          <ArrowLeft size={18} />
        </button>
        <Avatar nom={conversation.titre} departement={conversation.participants[0]?.departement} groupe={groupe} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{conversation.titre}</p>
          <p className="text-xs text-gray-500 truncate">
            {groupe ? conversation.participants.map((p) => p.nom).join(', ') : conversation.participants[0]?.departement}
          </p>
        </div>
        {conversation.dossier && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange/10 text-orange">
            <FolderOpen size={13} /> {conversation.dossier.libelle}
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={zone} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-1 bg-gray-50/60 dark:bg-gray-950/40">
        {chargement && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>}
        {plusAnciens && (
          <div className="flex justify-center pb-2">
            <button onClick={chargerAnciens} className="text-xs font-semibold text-orange hover:underline">Messages plus anciens</button>
          </div>
        )}
        {!chargement && !messages.length && (
          <p className="text-center text-sm text-gray-400 py-10">Aucun message. Écrivez le premier !</p>
        )}
        {messages.map((m, i) => {
          const prec = messages[i - 1]
          const nouveauJour = !prec || new Date(prec.cree_le).toDateString() !== new Date(m.cree_le).toDateString()
          const suite = prec && !nouveauJour && prec.auteur_id === m.auteur_id
                        && new Date(m.cree_le) - new Date(prec.cree_le) < 5 * 60 * 1000
          return (
            <div key={m.id}>
              {nouveauJour && (
                <div className="flex justify-center my-3">
                  <span className="text-[11px] font-semibold text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-0.5 first-letter:uppercase">
                    {jourLibelle(m.cree_le)}
                  </span>
                </div>
              )}
              <div className={`flex items-end gap-2 ${m.moi ? 'justify-end' : 'justify-start'} ${suite ? 'mt-0.5' : 'mt-3'}`}>
                {!m.moi && (suite ? <span className="w-7 shrink-0" /> : <Avatar nom={m.auteur} departement={m.departement} taille={28} />)}
                <div className={`max-w-[75%] ${m.moi ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!m.moi && groupe && !suite && <span className="text-[11px] text-gray-500 ml-1 mb-0.5">{m.auteur}</span>}
                  {m.piece_jointe && <div className={m.texte ? 'mb-1' : ''}><PieceJointe message={m} moi={m.moi} /></div>}
                  {m.texte && (
                    <div title={new Date(m.cree_le).toLocaleString('fr-FR')}
                      className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words
                        ${m.moi ? 'bg-orange text-white rounded-br-md'
                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'}`}>
                      {m.texte}
                    </div>
                  )}
                  {(!messages[i + 1] || messages[i + 1].auteur_id !== m.auteur_id) && (
                    <span className="text-[10px] text-gray-400 mt-0.5 mx-1 flex items-center gap-1">
                      {heure(m.cree_le)}
                      {m.moi && m.id === monDernier?.id && (vu >= m.id
                        ? <><CheckCheck size={12} className="text-brand-green" /> {groupe ? 'Vu par tous' : 'Vu'}</>
                        : <><Check size={12} /> Envoyé</>)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bas} />
      </div>

      {/* Saisie */}
      {fichier && (
        <div className="px-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="inline-flex items-center gap-2 max-w-full rounded-lg bg-gray-100 dark:bg-gray-800 pl-2.5 pr-1 py-1 text-sm">
            <Paperclip size={14} className="text-orange shrink-0" />
            <span className="truncate">{fichier.name}</span>
            <span className="text-xs text-gray-500 shrink-0">{taille(fichier.size)}</span>
            <button onClick={() => setFichier(null)} aria-label="Retirer la pièce jointe"
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"><X size={14} /></button>
          </div>
        </div>
      )}
      <div className={`p-3 flex items-end gap-2 ${fichier ? '' : 'border-t border-gray-200 dark:border-gray-700'}`}>
        <input ref={champFichier} type="file" accept={ACCEPTES} className="hidden" onChange={choisirFichier} />
        <button onClick={() => champFichier.current?.click()} disabled={envoi} aria-label="Joindre un fichier"
          title="Joindre un fichier (PDF, image, Word, Excel — 10 Mo max.)"
          className="w-11 h-11 shrink-0 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 grid place-items-center hover:text-orange hover:border-orange transition disabled:opacity-40">
          <Paperclip size={17} />
        </button>
        <textarea rows={1} value={texte} maxLength={4000}
          onChange={(e) => { setTexte(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px` }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer() } }}
          placeholder={fichier ? 'Ajouter un message (facultatif)…' : 'Écrire un message…'}
          className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm
                     focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/20" style={{ minHeight: 42, maxHeight: 140 }} />
        <button onClick={envoyer} disabled={(!texte.trim() && !fichier) || envoi} aria-label="Envoyer"
          className="w-11 h-11 shrink-0 rounded-xl bg-orange text-white grid place-items-center hover:bg-orange-dark disabled:opacity-40 transition">
          {envoi ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
        </button>
      </div>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────── */
export default function Messages() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [actifId, setActifId] = useState(null)
  const [recherche, setRecherche] = useState('')
  const [nouvelle, setNouvelle] = useState(false)
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['messagerie-conversations'], queryFn: messagerieAPI.conversations,
    refetchInterval: 5000, refetchIntervalInBackground: false,
  })
  const actif = conversations.find((c) => c.id === actifId)

  const liste = useMemo(() => conversations.filter((c) =>
    `${c.titre} ${c.dossier?.libelle || ''}`.toLowerCase().includes(recherche.toLowerCase())), [conversations, recherche])

  const ouverte = (conv) => {
    setNouvelle(false)
    qc.invalidateQueries({ queryKey: ['messagerie-conversations'] }).then(() => setActifId(conv.id))
  }

  return (
    <Layout breadcrumb={['SITRAC', 'Messages']}>
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2"><MessagesSquare size={22} className="text-orange" /> Messages</h1>
          <p className="page-sub">Discussions internes entre les membres de l'agence — les clients n'y ont pas accès</p>
        </div>
        <button className="btn btn-primary" onClick={() => setNouvelle(true)}>
          <MessageSquarePlus size={16} /> <span className="hidden sm:inline">Nouvelle conversation</span>
        </button>
      </div>

      <div className="card overflow-hidden grid md:grid-cols-[320px_1fr]" style={{ height: 'calc(100vh - 190px)', minHeight: 420 }}>
        {/* Liste */}
        <div className={`flex flex-col min-h-0 border-r border-gray-200 dark:border-gray-700 ${actif ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="form-control pl-8 py-2" placeholder="Rechercher" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {isLoading && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>}
            {!isLoading && !liste.length && (
              <div className="text-center px-6 py-12 text-sm text-gray-400">
                <MessagesSquare size={30} className="mx-auto mb-2 opacity-50" />
                {conversations.length ? 'Aucun résultat.' : 'Aucune conversation pour le moment.'}
                {!conversations.length && (
                  <button className="block mx-auto mt-3 text-orange font-semibold hover:underline" onClick={() => setNouvelle(true)}>
                    Démarrer une conversation
                  </button>
                )}
              </div>
            )}
            {liste.map((c) => (
              <button key={c.id} onClick={() => setActifId(c.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-3 border-b border-gray-100 dark:border-gray-800 transition
                  ${c.id === actifId ? 'bg-orange/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}>
                <Avatar nom={c.titre} departement={c.participants[0]?.departement} groupe={c.type === 'groupe'} taille={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${c.non_lus ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-gray-200'}`}>{c.titre}</span>
                    <span className={`text-[11px] shrink-0 ${c.non_lus ? 'text-orange font-semibold' : 'text-gray-400'}`}>{quand(c.dernier_message_le)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className={`truncate text-xs ${c.non_lus ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500'}`}>
                      {c.dernier_message ? `${c.dernier_message.moi ? 'Vous : ' : (c.type === 'groupe' ? `${c.dernier_message.auteur.split(' ')[0]} : ` : '')}${c.dernier_message.texte}` : 'Nouvelle conversation'}
                    </span>
                    {c.non_lus > 0 && (
                      <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-orange text-white text-[10px] font-bold grid place-items-center">{c.non_lus}</span>
                    )}
                  </div>
                  {c.dossier && <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-gray-500"><FolderOpen size={11} /> {c.dossier.libelle}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Fil */}
        <div className={`min-h-0 ${actif ? 'flex' : 'hidden md:flex'} flex-col`}>
          {actif ? <Fil key={actif.id} conversation={actif} onRetour={() => setActifId(null)} /> : (
            <div className="flex-1 grid place-items-center text-center p-8">
              <div>
                <span className="w-16 h-16 rounded-2xl bg-orange/10 text-orange grid place-items-center mx-auto mb-4"><MessagesSquare size={30} /></span>
                <p className="font-semibold text-gray-800 dark:text-gray-200">Bonjour {user?.name?.split(' ')[0] || ''}</p>
                <p className="text-sm text-gray-500 mt-1 max-w-xs">Choisissez une conversation ou démarrez-en une avec un collègue, un département entier ou autour d'un dossier.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <NouvelleConversation open={nouvelle} onClose={() => setNouvelle(false)} onCree={ouverte} />
    </Layout>
  )
}
