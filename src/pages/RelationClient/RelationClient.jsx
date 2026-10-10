import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Handshake, Send, Copy, FileText, Download, Upload, Trash2, Eye, EyeOff, Link as LinkIcon,
  UserCheck, UserX, Mail, MessageCircle, Phone, RefreshCw, Plus, X, Check,
} from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { SearchInput } from '../../components/UI/index.jsx'
import { relationClientAPI } from '../../utils/api'
import { useAuthStore } from '../../store/authStore'

const fmtEur = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(v || 0))
const fmtD = (v) => (v ? new Date(v.length === 10 ? `${v}T12:00:00` : v).toLocaleDateString('fr-FR') : '—')
const fmtDH = (v) => (v ? new Date(v).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—')

const CONF = {
  envoyee:  ['Envoyé', 'badge-info'],   consultee: ['Consulté', 'badge-pending'], acceptee: ['Signé', 'badge-active'],
  refusee:  ['Refusé', 'badge-inactive'], expiree: ['Expiré', 'badge-inactive'], annulee: ['Annulé', 'bg-gray-100 text-gray-500'],
}
const EVT = {
  envoyee: 'Envoyé au client', consultee: 'Ouvert par le client', code_envoye: 'Code de signature envoyé',
  code_verifie: 'Code vérifié', acceptee: 'Accepté et signé', refusee: 'Refusé par le client',
  annulee: 'Annulé', expiree: 'Lien expiré',
}
const ECH = { payee: ['Payée', 'badge-active'], en_retard: ['En retard', 'badge-inactive'], partielle: ['Partielle', 'badge-pending'], a_payer: ['À payer', 'badge-info'] }
const TX = { payee: 'badge-active', en_attente: 'badge-pending', creee: 'badge-pending', echouee: 'badge-inactive', annulee: 'badge-inactive', expiree: 'badge-inactive' }
const MSG = { envoye: 'badge-info', delivre: 'badge-active', planifie: 'badge-pending', echec: 'badge-inactive', ignore: 'bg-gray-100 text-gray-500' }
const TYPES_DOC = [['programme_final', 'Programme final'], ['voucher', 'Voucher'], ['billet', 'Billet / e-ticket'],
  ['conditions', 'Conditions de vente'], ['assurance', 'Assurance'], ['autre', 'Autre']]

function Badge({ cls, children }) { return <span className={`badge ${cls}`}>{children}</span> }

function copier(texte, message = 'Lien copié') {
  navigator.clipboard?.writeText(texte).then(() => toast.success(message), () => window.prompt('Copiez le lien :', texte))
}

export default function RelationClient() {
  const { user } = useAuthStore()
  const dept = user?.dept
  const droits = {
    devis: ['Sales', 'Administration'].includes(dept),
    echeances: ['Sales', 'Finance', 'Administration'].includes(dept),
    documents: dept !== 'Superviseur',
    compte: ['Sales', 'Administration'].includes(dept),
  }
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [recherche, setRecherche] = useState('')
  useEffect(() => { const h = setTimeout(() => setRecherche(search), 300); return () => clearTimeout(h) }, [search])
  const pcId = params.get('pc')

  const liste = useQuery({ queryKey: ['rc-dossiers', recherche], queryFn: () => relationClientAPI.getDossiers(recherche) })
  const synthese = useQuery({ queryKey: ['rc-synthese', pcId], queryFn: () => relationClientAPI.getSynthese(pcId), enabled: !!pcId })

  return (
    <Layout breadcrumb={['SITRAC', 'Relation client', 'Suivi client & paiements']}>
      <div className="mb-5">
        <h1 className="page-title"><Handshake size={22} className="text-orange" /> Suivi client & paiements</h1>
        <p className="page-sub">Envoi des devis à signer, échéancier et paiements en ligne, espace client, documents et messages envoyés.</p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-5 items-start">
        <div className="card">
          <div className="card-header"><SearchInput value={search} onChange={setSearch} placeholder="Client, programme, n° dossier…" /></div>
          <ul className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {liste.isLoading && <li className="p-4 text-sm text-gray-400">Chargement…</li>}
            {liste.error && <li className="p-4 text-sm text-brand-red">{liste.error.message}</li>}
            {(liste.data || []).map((d) => (
              <li key={d.id}>
                <button onClick={() => setParams({ pc: d.id })}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 ${String(d.id) === pcId ? 'bg-orange-light/60 dark:bg-gray-800' : ''}`}>
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{d.client}</span>
                    <span className="text-xs text-gray-400">PC#{d.id}</span>
                  </div>
                  <div className="text-xs text-gray-500">{d.programme} · départ {fmtD(d.date_debut)}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {d.confirmation && <Badge cls={CONF[d.confirmation][1]}>Devis {CONF[d.confirmation][0].toLowerCase()}</Badge>}
                    {!d.confirmation && d.facture_pro && <Badge cls="bg-gray-100 text-gray-500">FP {d.facture_pro}</Badge>}
                    {d.en_retard && <Badge cls="badge-inactive">Échéance en retard</Badge>}
                    {d.reste > 0 && !d.en_retard && <Badge cls="badge-pending">Reste {fmtEur(d.reste)}</Badge>}
                    {d.echeances > 0 && Number(d.reste) === 0 && <Badge cls="badge-active">Soldé</Badge>}
                    {d.compte_portail && <Badge cls="badge-info">Espace client</Badge>}
                  </div>
                </button>
              </li>
            ))}
            {liste.data && !liste.data.length && <li className="p-4 text-sm text-gray-400">Aucun dossier.</li>}
          </ul>
        </div>

        <div className="flex flex-col gap-5 min-w-0">
          {!pcId && <div className="card card-body text-gray-500">Choisissez un dossier dans la liste.</div>}
          {pcId && synthese.isLoading && <div className="card card-body text-gray-400">Chargement…</div>}
          {pcId && synthese.error && <div className="card card-body text-brand-red">{synthese.error.message}</div>}
          {synthese.data && <Detail s={synthese.data} pcId={pcId} droits={droits} />}
        </div>
      </div>
    </Layout>
  )
}

function Detail({ s, pcId, droits }) {
  const qc = useQueryClient()
  const rafraichir = () => { qc.invalidateQueries({ queryKey: ['rc-synthese', pcId] }); qc.invalidateQueries({ queryKey: ['rc-dossiers'] }) }
  const d = s.dossier
  const smsActifs = !!s.sms_whatsapp_actifs   // SMS_WHATSAPP_ACTIFS côté serveur
  return (
    <>
      <div className="card card-body">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h2 className="font-title font-bold text-lg text-gray-900 dark:text-white">{s.client.nom} — {d.programme}</h2>
            <p className="text-sm text-gray-500">PC#{d.id} · du {fmtD(d.date_debut)} au {fmtD(d.date_fin)} · {d.nb_pax} pax
              {d.facture_pro && <> · Facture pro {d.facture_pro.statut} ({fmtEur(d.facture_pro.total)})</>}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={rafraichir}><RefreshCw size={14} /> Actualiser</button>
        </div>
      </div>
      <SectionDevis s={s} pcId={pcId} peut={droits.devis} smsActifs={smsActifs} onChange={rafraichir} />
      <SectionPaiements s={s} pcId={pcId} peut={droits.echeances} onChange={rafraichir} />
      <div className="grid xl:grid-cols-2 gap-5">
        <SectionClient s={s} peut={droits.compte} smsActifs={smsActifs} onChange={rafraichir} />
        <SectionDocuments s={s} pcId={pcId} peut={droits.documents} onChange={rafraichir} />
      </div>
      <SectionMessages s={s} />
    </>
  )
}

/* ── Devis à signer ───────────────────────────────────────────── */
function SectionDevis({ s, pcId, peut, smsActifs, onChange }) {
  const fp = s.dossier.facture_pro
  const [email, setEmail] = useState('')
  const [canaux, setCanaux] = useState({ email: true, sms: true, whatsapp: true })
  const [lien, setLien] = useState(null)
  const [ouvert, setOuvert] = useState(null)
  const envoyable = fp && ['valide', 'verrouille'].includes(fp.statut)
  const active = s.confirmations.find((c) => ['envoyee', 'consultee'].includes(c.statut))
  const signee = s.confirmations.find((c) => c.statut === 'acceptee')

  const envoyer = useMutation({
    mutationFn: () => relationClientAPI.envoyerDevis(pcId, {
      email: email || undefined,
      canaux: smsActifs ? Object.keys(canaux).filter((k) => canaux[k]) : ['email'],
    }),
    onSuccess: (r) => { setLien(r.lien); toast.success(r.resume); onChange() },
    onError: (e) => toast.error(e.message),
  })
  const annuler = useMutation({
    mutationFn: (uuid) => relationClientAPI.annulerDemande(uuid, 'Annulée par l\'agence.'),
    onSuccess: () => { toast.success('Demande annulée'); onChange() }, onError: (e) => toast.error(e.message),
  })

  return (
    <div className="card">
      <div className="card-header"><h3 className="font-bold text-gray-900 dark:text-white">Devis à confirmer et signer</h3></div>
      <div className="card-body">
        {!fp && <p className="text-sm text-gray-500">Ce dossier n'a pas encore de facture pro.</p>}
        {fp && !envoyable && <p className="text-sm text-gray-500">La facture pro est en brouillon : validez-la pour pouvoir l'envoyer au client.</p>}
        {signee && <p className="text-sm text-brand-green-dark mb-3">Devis signé par {signee.signataire_nom} le {fmtDH(signee.decision_le)}. L'échéancier a été créé.</p>}

        {envoyable && peut && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 mb-4">
            <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <label className="form-label" htmlFor="rc-email">Adresse d'envoi</label>
                <input id="rc-email" className="form-control" type="email" placeholder={s.client.email || 'email du client'} value={email} onChange={(e) => setEmail(e.target.value)} />
                {smsActifs ? (
                  <>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                      {[['email', 'Email (avec PDF)'], ['sms', 'SMS'], ['whatsapp', 'WhatsApp']].map(([k, l]) => (
                        <label key={k} className="flex items-center gap-1.5">
                          <input type="checkbox" checked={canaux[k]} disabled={k === 'email'} onChange={(e) => setCanaux({ ...canaux, [k]: e.target.checked })} /> {l}
                        </label>
                      ))}
                    </div>
                    <p className="form-hint">SMS et WhatsApp ne partent que si le client a donné son accord et que son numéro est valide.</p>
                  </>
                ) : (
                  <p className="form-hint">Le devis est envoyé par email, avec le PDF en pièce jointe.</p>
                )}
              </div>
              <button className="btn btn-primary" disabled={envoyer.isPending} onClick={() => {
                if (!active || window.confirm('Un devis est déjà en attente de réponse : le renvoyer annulera le lien précédent. Continuer ?')) envoyer.mutate()
              }}>
                <Send size={15} /> {active || signee ? 'Renvoyer au client' : 'Envoyer au client'}
              </button>
            </div>
            {lien && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-gray-500">Lien personnel du client (affiché une seule fois) :</span>
                <code className="text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded border truncate max-w-full">{lien}</code>
                <button className="btn btn-ghost btn-xs" onClick={() => copier(lien)}><Copy size={12} /> Copier</button>
              </div>
            )}
          </div>
        )}

        {!!s.confirmations.length && (
          <table className="tbl">
            <thead><tr><th>Envoi</th><th>Statut</th><th>Montant</th><th>Réponse</th><th /></tr></thead>
            <tbody>
              {s.confirmations.map((c) => (
                <FragmentConf key={c.uuid} c={c} ouvert={ouvert === c.uuid} basculer={() => setOuvert(ouvert === c.uuid ? null : c.uuid)}
                  peut={peut} annuler={() => window.confirm('Annuler cette demande ? Le lien du client ne fonctionnera plus.') && annuler.mutate(c.uuid)} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function FragmentConf({ c, ouvert, basculer, peut, annuler }) {
  const [lib, cls] = CONF[c.statut]
  return (
    <>
      <tr>
        <td className="text-xs">{fmtDH(c.envoyee_le)}<div className="text-gray-400">{c.email_destinataire}{c.envoyee_par_nom ? ` · ${c.envoyee_par_nom}` : ''}</div></td>
        <td><Badge cls={cls}>{lib}</Badge></td>
        <td>{fmtEur(c.montant)}</td>
        <td className="text-xs max-w-xs">
          {c.statut === 'acceptee' && <>Signé par <b>{c.signataire_nom}</b><br />{fmtDH(c.decision_le)}</>}
          {c.statut === 'refusee' && <>« {c.motif_refus} »<br />{fmtDH(c.decision_le)}</>}
          {['envoyee', 'consultee'].includes(c.statut) && <>Expire le {fmtD(c.expire_le)}</>}
        </td>
        <td className="whitespace-nowrap text-right">
          <button className="btn btn-ghost btn-xs" onClick={basculer}>{ouvert ? 'Masquer' : 'Historique'}</button>{' '}
          <button className="btn btn-ghost btn-xs" title="PDF envoyé" onClick={() => relationClientAPI.downloadPdfDemande(c.uuid, false, `devis-${c.uuid.slice(0, 8)}.pdf`).catch((e) => toast.error(e.message))}><FileText size={12} /></button>{' '}
          {c.a_pdf_signe && <button className="btn btn-success btn-xs" title="PDF signé avec certificat" onClick={() => relationClientAPI.downloadPdfDemande(c.uuid, true, `devis-signe-${c.uuid.slice(0, 8)}.pdf`).catch((e) => toast.error(e.message))}><Download size={12} /> Signé</button>}{' '}
          {peut && ['envoyee', 'consultee'].includes(c.statut) && <button className="btn btn-danger btn-xs" onClick={annuler}><X size={12} /></button>}
        </td>
      </tr>
      {ouvert && (
        <tr><td colSpan={5} className="bg-gray-50 dark:bg-gray-800/50">
          <ol className="text-xs space-y-1">
            {c.evenements.map((e, i) => (
              <li key={i}><span className="text-gray-400 inline-block w-32">{fmtDH(e.horodatage)}</span> {EVT[e.type_evenement] || e.type_evenement}
                {e.ip && <span className="text-gray-400"> · IP {e.ip}</span>}
                {e.details?.raison && <span className="text-gray-500"> — {e.details.raison}</span>}
                {e.details?.canal && <span className="text-gray-500"> ({e.details.canal})</span>}
              </li>
            ))}
          </ol>
          <p className="text-[11px] text-gray-400 mt-2 break-all">Empreinte du PDF envoyé (SHA-256) : {c.pdf_sha256}{c.conditions_version && ` · conditions ${c.conditions_version}`}</p>
        </td></tr>
      )}
    </>
  )
}

/* ── Échéancier et paiements ──────────────────────────────────── */
function SectionPaiements({ s, pcId, peut, onChange }) {
  const p = s.paiements
  const [ajout, setAjout] = useState(false)
  const [edition, setEdition] = useState(null)
  const [form, setForm] = useState({ type_echeance: 'autre', libelle: '', montant: '', date_limite: '' })
  const err = (e) => toast.error(e.message)
  const generer = useMutation({
    mutationFn: (opts) => relationClientAPI.genererEcheancier(pcId, opts),
    onSuccess: () => { toast.success('Échéancier généré'); onChange() },
    onError: (e) => {
      if (e.status === 409 && window.confirm(`${e.message}\n\nContinuer ?`)) generer.mutate({ remplacer: true, forcer: true })
      else if (e.status !== 409) err(e)
    },
  })
  const ajouter = useMutation({ mutationFn: () => relationClientAPI.ajouterEcheance(pcId, form),
    onSuccess: () => { setAjout(false); setForm({ type_echeance: 'autre', libelle: '', montant: '', date_limite: '' }); onChange() }, onError: err })
  const modifier = useMutation({ mutationFn: ({ id, data }) => relationClientAPI.modifierEcheance(id, data),
    onSuccess: () => { setEdition(null); onChange() }, onError: err })
  const annuler = useMutation({ mutationFn: (id) => relationClientAPI.annulerEcheance(id), onSuccess: onChange, onError: err })
  const lien = useMutation({ mutationFn: (id) => relationClientAPI.lienPaiement(pcId, id),
    onSuccess: (r) => { copier(r.url, 'Lien de paiement copié : vous pouvez l\'envoyer au client'); onChange() }, onError: err })

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-bold text-gray-900 dark:text-white">Échéancier et paiements</h3>
        <div className="flex gap-2 text-sm text-gray-500">
          <span>Total {fmtEur(p.total_du)}</span>·<span>Payé {fmtEur(p.total_paye)}</span>·<b className="text-gray-800 dark:text-gray-200">Reste {fmtEur(p.reste)}</b>
        </div>
      </div>
      <div className="card-body">
        {p.cloture && <p className="text-sm text-gray-500 mb-3">Dossier clôturé : plus aucun paiement ne peut être enregistré.</p>}
        {!p.echeances.length && (
          <p className="text-sm text-gray-500 mb-3">
            Pas encore d'échéancier. Il est créé automatiquement quand le client signe son devis (acompte de 50 % si le départ est dans plus de 30 jours, puis solde avant l'arrivée).
          </p>
        )}
        {!!p.echeances.length && (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Échéance</th><th>Date limite</th><th className="text-right">Montant</th><th className="text-right">Reste</th><th>Statut</th><th /></tr></thead>
              <tbody>
                {p.echeances.map((e) => edition?.id === e.id ? (
                  <tr key={e.id}>
                    <td><input className="form-control" value={edition.libelle} onChange={(ev) => setEdition({ ...edition, libelle: ev.target.value })} /></td>
                    <td><input type="date" className="form-control" value={edition.date_limite} onChange={(ev) => setEdition({ ...edition, date_limite: ev.target.value })} /></td>
                    <td><input type="number" step="0.01" className="form-control text-right" value={edition.montant} onChange={(ev) => setEdition({ ...edition, montant: ev.target.value })} /></td>
                    <td colSpan={2} />
                    <td className="whitespace-nowrap">
                      <button className="btn btn-success btn-xs" onClick={() => modifier.mutate({ id: e.id, data: { libelle: edition.libelle, date_limite: edition.date_limite, montant: edition.montant } })}><Check size={12} /></button>{' '}
                      <button className="btn btn-ghost btn-xs" onClick={() => setEdition(null)}><X size={12} /></button>
                    </td>
                  </tr>
                ) : (
                  <tr key={e.id}>
                    <td className="first-letter:uppercase">{e.libelle || e.type}{e.source === 'manuel' && <span className="text-xs text-gray-400"> (manuel)</span>}</td>
                    <td>{fmtD(e.date_limite)}</td>
                    <td className="text-right">{fmtEur(e.montant)}</td>
                    <td className="text-right">{fmtEur(e.reste)}</td>
                    <td><Badge cls={ECH[e.statut][1]}>{ECH[e.statut][0]}</Badge></td>
                    <td className="whitespace-nowrap text-right">
                      {peut && Number(e.reste) > 0 && !p.cloture && <button className="btn btn-ghost btn-xs" title="Créer un lien de paiement à envoyer au client" onClick={() => lien.mutate(e.id)}><LinkIcon size={12} /> Lien</button>}{' '}
                      {peut && <button className="btn btn-ghost btn-xs" onClick={() => setEdition({ id: e.id, libelle: e.libelle, date_limite: e.date_limite, montant: e.montant })}>Modifier</button>}{' '}
                      {peut && <button className="btn btn-ghost btn-xs" onClick={() => window.confirm('Annuler cette échéance ?') && annuler.mutate(e.id)}><Trash2 size={12} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="form-hint mt-2">Les paiements saisis dans « Paiement Client » (espèces, virement…) sont imputés automatiquement sur les échéances, par ordre de date.</p>

        {peut && !p.cloture && (
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="btn btn-ghost btn-sm" onClick={() => generer.mutate({ remplacer: p.echeances.length > 0 })}>
              <RefreshCw size={13} /> {p.echeances.length ? 'Recalculer l\'échéancier standard' : 'Générer l\'échéancier standard'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setAjout(!ajout)}><Plus size={13} /> Ajouter une échéance</button>
          </div>
        )}
        {ajout && (
          <form className="grid sm:grid-cols-5 gap-2 mt-3 items-end" onSubmit={(e) => { e.preventDefault(); ajouter.mutate() }}>
            <select className="form-control" value={form.type_echeance} onChange={(e) => setForm({ ...form, type_echeance: e.target.value })}>
              <option value="acompte">Acompte</option><option value="solde">Solde</option><option value="total">Paiement total</option><option value="autre">Autre</option>
            </select>
            <input className="form-control" placeholder="Libellé (vu par le client)" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
            <input className="form-control" type="number" step="0.01" min="0.01" required placeholder="Montant €" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} />
            <input className="form-control" type="date" required value={form.date_limite} onChange={(e) => setForm({ ...form, date_limite: e.target.value })} />
            <button className="btn btn-primary" type="submit" disabled={ajouter.isPending}>Ajouter</button>
          </form>
        )}

        {!!p.transactions.length && (
          <>
            <h4 className="font-semibold text-sm mt-6 mb-2 text-gray-700 dark:text-gray-300">Paiements en ligne ({p.fournisseur})</h4>
            <table className="tbl">
              <thead><tr><th>Date</th><th>Montant</th><th>Statut</th><th>Origine</th><th>Référence</th></tr></thead>
              <tbody>
                {p.transactions.map((t) => (
                  <tr key={t.uuid}>
                    <td className="text-xs">{fmtDH(t.cree_le)}</td><td>{fmtEur(t.montant)}</td>
                    <td><Badge cls={TX[t.statut]}>{t.statut_libelle}</Badge></td>
                    <td className="text-xs">{t.initiee_par === 'portail' ? 'Espace client' : 'Lien envoyé par l\'agence'}</td>
                    <td className="text-xs text-gray-400">{t.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Client : préférences et espace client ────────────────────── */
function SectionClient({ s, peut, smsActifs, onChange }) {
  const c = s.client
  const compte = s.compte_portail
  const [prefs, setPrefs] = useState({ langue: c.langue, accepte_sms: c.accepte_sms, accepte_whatsapp: c.accepte_whatsapp })
  useEffect(() => setPrefs({ langue: c.langue, accepte_sms: c.accepte_sms, accepte_whatsapp: c.accepte_whatsapp }), [c])
  const err = (e) => toast.error(e.message)
  const inviter = useMutation({ mutationFn: () => relationClientAPI.inviterPortail(c.id),
    onSuccess: (r) => { toast.success(`Invitation envoyée à ${r.email}`); onChange() }, onError: err })
  const desactiver = useMutation({ mutationFn: () => relationClientAPI.desactiverPortail(c.id),
    onSuccess: () => { toast.success('Accès désactivé'); onChange() }, onError: err })
  const sauver = useMutation({ mutationFn: () => relationClientAPI.majPreferences(c.id, prefs),
    onSuccess: () => { toast.success('Préférences enregistrées'); onChange() }, onError: err })
  const modifie = prefs.langue !== c.langue || prefs.accepte_sms !== c.accepte_sms || prefs.accepte_whatsapp !== c.accepte_whatsapp

  return (
    <div className="card">
      <div className="card-header"><h3 className="font-bold text-gray-900 dark:text-white">Client et espace client</h3></div>
      <div className="card-body text-sm space-y-4">
        <div className="space-y-1">
          <p className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {c.email || <span className="text-brand-red">Aucun email</span>}</p>
          <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400" />
            {c.telephone || '—'} {c.telephone && (c.telephone_e164
              ? <Badge cls="badge-active">{c.telephone_e164}</Badge>
              : <Badge cls="badge-inactive">format international invalide</Badge>)}
          </p>
          {c.telephone_sejour && <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> Pendant le séjour : {c.telephone_sejour}</p>}
        </div>

        <div className={`grid gap-3 items-end ${smsActifs ? 'grid-cols-3' : 'grid-cols-1 max-w-[12rem]'}`}>
          <div>
            <label className="form-label" htmlFor="rc-langue">Langue</label>
            <select id="rc-langue" className="form-control" disabled={!peut} value={prefs.langue} onChange={(e) => setPrefs({ ...prefs, langue: e.target.value })}>
              <option value="en">English</option><option value="fr">Français</option>
            </select>
          </div>
          {smsActifs && <>
            <label className="flex items-center gap-2 pb-2"><input type="checkbox" disabled={!peut} checked={prefs.accepte_sms} onChange={(e) => setPrefs({ ...prefs, accepte_sms: e.target.checked })} /> SMS</label>
            <label className="flex items-center gap-2 pb-2"><input type="checkbox" disabled={!peut} checked={prefs.accepte_whatsapp} onChange={(e) => setPrefs({ ...prefs, accepte_whatsapp: e.target.checked })} /> WhatsApp</label>
          </>}
        </div>
        {smsActifs && <p className="form-hint -mt-2">Cochez SMS/WhatsApp uniquement si le client l'a accepté (il peut aussi le faire lui-même dans son espace).</p>}
        {peut && modifie && <button className="btn btn-primary btn-sm" onClick={() => sauver.mutate()}>Enregistrer les préférences</button>}

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          {compte ? (
            <>
              <p>Espace client : <Badge cls={compte.actif ? 'badge-active' : 'badge-inactive'}>{compte.actif ? 'actif' : 'désactivé'}</Badge> ({compte.email})</p>
              <p className="text-xs text-gray-500 mt-1">Invité le {fmtDH(compte.invite_le)} · dernière connexion {fmtDH(compte.derniere_connexion)}</p>
            </>
          ) : <p className="text-gray-500">Pas encore d'espace client. Il est créé automatiquement à la signature du devis.</p>}
          {peut && (
            <div className="flex gap-2 mt-3">
              <button className="btn btn-ghost btn-sm" disabled={!c.email || inviter.isPending} onClick={() => inviter.mutate()}>
                <UserCheck size={13} /> {compte ? 'Renvoyer l\'invitation' : 'Inviter dans l\'espace client'}
              </button>
              {compte?.actif && <button className="btn btn-ghost btn-sm" onClick={() => window.confirm('Désactiver l\'accès de ce client à son espace ?') && desactiver.mutate()}><UserX size={13} /> Désactiver</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Documents destinés au client ─────────────────────────────── */
function SectionDocuments({ s, pcId, peut, onChange }) {
  const [fichier, setFichier] = useState(null)
  const [titre, setTitre] = useState('')
  const [type, setType] = useState('voucher')
  const [visible, setVisible] = useState(true)
  const err = (e) => toast.error(e.message)
  const envoyer = useMutation({
    mutationFn: () => relationClientAPI.uploadDocument(pcId, fichier, { titre: titre || fichier.name, type_doc: type, visible_client: visible ? 'true' : 'false' }),
    onSuccess: () => { toast.success('Document ajouté'); setFichier(null); setTitre(''); onChange() }, onError: err,
  })
  const basculer = useMutation({ mutationFn: (doc) => relationClientAPI.modifierDocument(doc.uuid, { visible_client: !doc.visible_client }), onSuccess: onChange, onError: err })
  const supprimer = useMutation({ mutationFn: (uuid) => relationClientAPI.supprimerDocument(uuid), onSuccess: onChange, onError: err })

  return (
    <div className="card">
      <div className="card-header"><h3 className="font-bold text-gray-900 dark:text-white">Documents pour le client</h3></div>
      <div className="card-body text-sm">
        {peut && (
          <form className="space-y-2 mb-4" onSubmit={(e) => { e.preventDefault(); if (fichier) envoyer.mutate() }}>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-sm" onChange={(e) => setFichier(e.target.files?.[0] || null)} />
            <div className="grid grid-cols-2 gap-2">
              <input className="form-control" placeholder="Titre vu par le client" value={titre} onChange={(e) => setTitre(e.target.value)} />
              <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>{TYPES_DOC.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2"><input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} /> Visible dans l'espace client</label>
              <button className="btn btn-primary btn-sm" disabled={!fichier || envoyer.isPending}><Upload size={13} /> Ajouter</button>
            </div>
            <p className="form-hint">PDF, JPG ou PNG, 15 Mo maximum.</p>
          </form>
        )}
        {!s.documents.length && <p className="text-gray-500">Aucun document.</p>}
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {s.documents.map((doc) => (
            <li key={doc.uuid} className="py-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{doc.titre}</p>
                <p className="text-xs text-gray-400">{doc.type_libelle} · {fmtD(doc.cree_le)}{doc.premier_telechargement_le ? ` · téléchargé par le client le ${fmtD(doc.premier_telechargement_le)}` : ''}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button className="btn btn-ghost btn-xs" title="Télécharger" onClick={() => relationClientAPI.downloadDocument(doc.uuid, doc.nom_original || doc.titre).catch(err)}><Download size={12} /></button>
                {peut && <button className="btn btn-ghost btn-xs" title={doc.visible_client ? 'Masquer au client' : 'Montrer au client'} onClick={() => basculer.mutate(doc)}>{doc.visible_client ? <Eye size={12} /> : <EyeOff size={12} />}</button>}
                {peut && <button className="btn btn-ghost btn-xs" title="Supprimer" onClick={() => window.confirm('Supprimer ce document ?') && supprimer.mutate(doc.uuid)}><Trash2 size={12} /></button>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ── Messages envoyés et activité du client ───────────────────── */
const CANAL = { email: Mail, sms: Phone, whatsapp: MessageCircle }
const ACTIONS = { connexion: 'Connexion', dossier_consulte: 'Dossier consulté', pdf_telecharge: 'PDF téléchargé',
  document_telecharge: 'Document téléchargé', paiement_initie: 'Paiement en ligne commencé', profil_modifie: 'Coordonnées modifiées',
  voyageurs_modifies: 'Informations voyageurs complétées' }

function SectionMessages({ s }) {
  const [onglet, setOnglet] = useState('messages')
  const items = useMemo(() => (onglet === 'messages' ? s.messages : s.journal_client), [onglet, s])
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex gap-2">
          <button className={`btn btn-sm ${onglet === 'messages' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOnglet('messages')}>Messages envoyés ({s.messages.length})</button>
          <button className={`btn btn-sm ${onglet === 'journal' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOnglet('journal')}>Activité du client ({s.journal_client.length})</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        {!items.length && <p className="card-body text-sm text-gray-500">Rien pour le moment.</p>}
        {onglet === 'messages' && !!items.length && (
          <table className="tbl">
            <thead><tr><th>Date</th><th>Canal</th><th>Destinataire</th><th>Objet / texte</th><th>Statut</th></tr></thead>
            <tbody>
              {items.map((m) => {
                const Ico = CANAL[m.canal] || Mail
                return (
                  <tr key={m.id}>
                    <td className="text-xs whitespace-nowrap">{fmtDH(m.envoye_le || m.cree_le)}</td>
                    <td><Ico size={14} className="text-gray-500" aria-label={m.canal} /></td>
                    <td className="text-xs">{m.destinataire}</td>
                    <td className="text-xs max-w-md truncate" title={m.corps}>{m.sujet || m.corps}</td>
                    <td><Badge cls={MSG[m.statut]}>{m.statut}</Badge>
                      {m.statut === 'planifie' && <div className="text-[11px] text-gray-400">heure locale du client : {fmtDH(m.planifie_pour)}</div>}
                      {m.erreur && <div className="text-[11px] text-brand-red max-w-xs">{m.erreur}</div>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {onglet === 'journal' && !!items.length && (
          <table className="tbl">
            <thead><tr><th>Date</th><th>Action</th><th>IP</th></tr></thead>
            <tbody>{items.map((j, i) => <tr key={i}><td className="text-xs">{fmtDH(j.date)}</td><td>{ACTIONS[j.action] || j.action}</td><td className="text-xs text-gray-400">{j.ip}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}
