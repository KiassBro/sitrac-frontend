import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, BookOpenText, CheckCircle2, Clock, CreditCard, Download, FileText, Info, Landmark, ShieldCheck, XCircle } from 'lucide-react'
import { portailAPI } from './api'
import { formatDate, formatMontant, useT } from './i18n'
import { Bloc, Bouton, Champ, champClasse, Chargement, Itineraire, Message, PortailLayout } from './composants'
import { Statut } from './PagesCompte'
import ChampPaysPortail from './ChampPaysPortail'

/* ── Dossier (un voyage) ──────────────────────────────────────── */
export function Dossier() {
  const { id } = useParams()
  const { t, langue } = useT()
  const { data: d, isLoading, error } = useQuery({ queryKey: ['portail', 'dossier', id], queryFn: () => portailAPI.dossier(id) })
  const [paiementEnCours, setPaiementEnCours] = useState(null)
  const [erreurPaiement, setErreurPaiement] = useState('')

  const payer = async (echeanceId) => {
    setErreurPaiement(''); setPaiementEnCours(echeanceId)
    try {
      const r = await portailAPI.payer(id, echeanceId)
      window.location.assign(r.url)
    } catch (e) { setErreurPaiement(e.message); setPaiementEnCours(null) }
  }
  const ouvrir = (quoi) => portailAPI.ouvrirPdf(id, quoi).catch(() => setErreurPaiement(t('erreur')))

  if (isLoading) return <PortailLayout><Chargement /></PortailLayout>
  if (error) return <PortailLayout><Message type="erreur">{error.message}</Message></PortailLayout>

  const conf = d.devis?.confirmation
  const p = d.paiements
  const libelleStatut = { payee: t('paye'), en_retard: t('en_retard'), partielle: t('partiel'), a_payer: t('a_payer') }

  return (
    <PortailLayout>
      <Link to="/portail" className="inline-flex items-center gap-1 text-sm text-rt-canopy hover:underline mb-5">
        <ArrowLeft size={15} aria-hidden /> {t('retour')}
      </Link>

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="font-title font-bold text-[28px] leading-tight">{d.programme.nom}</h1>
          <Statut statut={d.statut} />
        </div>
        <p className="text-rt-stone mb-6">
          {t('du_au', { a: formatDate(d.date_debut, langue), b: formatDate(d.date_fin, langue) })} · {t('voyageurs', { n: d.nb_pax })}
        </p>
        <Itineraire etapes={d.programme.etapes} />
      </header>

      <div className="flex flex-col gap-5">
        {d.devis && (
          <Bloc titre={t('votre_devis')} action={
            <Bouton variante="discret" onClick={() => ouvrir('devis')}><FileText size={15} aria-hidden />{t('voir_pdf')}</Bouton>}>
            <p className="text-[15px] mb-3">
              {d.devis.ref} — <strong>{formatMontant(d.devis.total, langue)}</strong>
            </p>
            {conf && ['envoyee', 'consultee'].includes(conf.statut) && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-rt-ocre-lt rounded-md px-4 py-3">
                <span>{t('devis_a_confirmer')}</span>
                <Link to={`/portail/confirmer/${conf.uuid}`}><Bouton>{t('confirmer_devis')}</Bouton></Link>
              </div>
            )}
            {conf?.statut === 'acceptee' && <p className="text-sm text-rt-canopy">{t('devis_signe', { nom: conf.signataire, date: formatDate(conf.decision_le, langue, true) })}</p>}
            {conf?.statut === 'refusee' && <p className="text-sm text-rt-stone">{t('devis_refuse')}</p>}
            {conf?.statut === 'expiree' && <p className="text-sm text-rt-stone">{t('devis_expire')}</p>}
            {conf?.statut === 'annulee' && <p className="text-sm text-rt-stone">{t('devis_remplace')}</p>}
          </Bloc>
        )}

        <Bloc titre={t('paiements')}>
          {!p.echeances.length ? <p className="text-rt-stone">{t('aucune_echeance')}</p> : (
            <>
              <dl className="grid grid-cols-3 gap-3 mb-5 text-sm">
                <div><dt className="text-rt-stone">{t('total_du')}</dt><dd className="font-semibold text-base">{formatMontant(p.total_du, langue, p.devise)}</dd></div>
                <div><dt className="text-rt-stone">{t('deja_paye')}</dt><dd className="font-semibold text-base">{formatMontant(p.total_paye, langue, p.devise)}</dd></div>
                <div><dt className="text-rt-stone">{t('reste_a_payer')}</dt><dd className="font-semibold text-base">{formatMontant(p.reste, langue, p.devise)}</dd></div>
              </dl>
              <ul className="divide-y divide-rt-line border-y border-rt-line">
                {p.echeances.map((e) => (
                  <li key={e.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium first-letter:uppercase">{e.libelle}</p>
                      <p className="text-sm text-rt-stone">
                        {formatMontant(e.montant, langue, e.devise)} · {t('avant_le', { d: formatDate(e.date_limite, langue) })} ·{' '}
                        <span className={e.statut === 'en_retard' ? 'text-rt-laterite font-medium' : ''}>{libelleStatut[e.statut]}</span>
                      </p>
                    </div>
                    {Number(e.reste) > 0 && p.paiement_en_ligne && (
                      <Bouton onClick={() => payer(e.id)} chargement={paiementEnCours === e.id} disabled={paiementEnCours !== null}>
                        <CreditCard size={16} aria-hidden />{t('payer', { m: formatMontant(e.reste, langue, e.devise) })}
                      </Bouton>
                    )}
                  </li>
                ))}
              </ul>
              {erreurPaiement && <div className="mt-3"><Message type="erreur">{erreurPaiement}</Message></div>}
              <p className="text-xs text-rt-stone mt-3">{t('carte_info')}</p>
              {p.virement && (
                <div className="mt-4 flex gap-3 text-sm bg-rt-mist rounded-md p-3">
                  <Landmark size={18} className="shrink-0 text-rt-canopy" aria-hidden />
                  <div><p>{t('virement')}</p><p className="font-medium mt-1 whitespace-pre-line">{p.virement}</p></div>
                </div>
              )}
            </>
          )}
          {d.facture && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>{t('facture')} {d.facture.ref} — {formatMontant(d.facture.total, langue)}</span>
              <Bouton variante="discret" onClick={() => ouvrir('facture')}><FileText size={15} aria-hidden />{t('voir_pdf')}</Bouton>
            </div>
          )}
        </Bloc>

        <Bloc titre={t('voyageurs_titre')}>
          {d.voyageurs_modifiables ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[15px] max-w-md">{t('voyageurs_intro')}</p>
              <Link to={`/portail/dossiers/${id}/voyageurs`}><Bouton variante="secondaire">{t('completer')}</Bouton></Link>
            </div>
          ) : <p className="text-rt-stone">{t('voyageurs_verrouille')}</p>}
        </Bloc>

        {/* Carnet de route : programme jour par jour, contacts, vols, vouchers (aussi en PDF hors connexion) */}
        <Bloc titre={langue === 'fr' ? 'Carnet de route' : 'Travel book'}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] max-w-md">
              {langue === 'fr'
                ? 'Votre programme jour par jour, les contacts de votre guide et de votre chauffeur, vos vols et vos vouchers — à garder sur votre téléphone.'
                : 'Your day-by-day programme, your guide and driver contacts, flights and vouchers — to keep on your phone.'}
            </p>
            <Link to={`/portail/dossiers/${id}/carnet`}><Bouton variante="secondaire"><BookOpenText size={15} aria-hidden />{langue === 'fr' ? 'Ouvrir' : 'Open'}</Bouton></Link>
          </div>
        </Bloc>

        <Bloc titre={t('documents')}>
          {!d.documents.length ? <p className="text-rt-stone">{t('aucun_document')}</p> : (
            <ul className="divide-y divide-rt-line">
              {d.documents.map((doc) => (
                <li key={doc.uuid} className="py-2.5 flex items-center justify-between gap-3">
                  <div><p className="font-medium">{doc.titre}</p><p className="text-xs text-rt-stone">{doc.type_libelle} · {formatDate(doc.date, langue)}</p></div>
                  <Bouton variante="discret" onClick={() => portailAPI.document(doc.uuid, doc.titre)}><Download size={15} aria-hidden />{t('telecharger')}</Bouton>
                </li>
              ))}
            </ul>
          )}
        </Bloc>

        {d.historique.length > 0 && (
          <Bloc titre={t('historique')}>
            <ol className="relative border-l-2 border-rt-line ml-1.5 flex flex-col gap-3">
              {d.historique.map((h, i) => (
                <li key={i} className="pl-4 relative">
                  <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-rt-canopy" aria-hidden />
                  <p className="text-sm">{libelleHistorique(h, t, langue)}</p>
                  <p className="text-xs text-rt-stone">{formatDate(h.date, langue, true)}</p>
                </li>
              ))}
            </ol>
          </Bloc>
        )}
      </div>
    </PortailLayout>
  )
}

function libelleHistorique(h, t, langue) {
  if (h.type === 'message') return t('h_message', { s: h.details.sujet })
  if (h.type === 'paiement') return t('h_paiement', { m: formatMontant(h.details.montant, langue) })
  if (h.type === 'document') return t('h_document', { t: h.details.titre })
  return t(`h_${h.type}`)
}

/* ── Voyageurs (le client complète le « GI ») ─────────────────── */
const LEADER_CHAMPS = [
  ['nom', 'nom'], ['nationalite', 'nationalite'], ['date_naissance', 'naissance', 'date'], ['num_document', 'passeport'],
  ['adresse', 'adresse'], ['code_postal', 'cp'], ['ville', 'ville'], ['pays', 'pays'],
  ['assurance_voyage', 'ass_voyage'], ['assurance_sante', 'ass_sante'], ['urgence_nom', 'urgence_nom'], ['urgence_tel', 'urgence_tel', 'tel'],
]
const PAX_CHAMPS = [['nom', 'nom'], ['nationalite', 'nationalite'], ['date_naissance', 'naissance', 'date'], ['num_document', 'passeport'],
  ['telephone', 'telephone', 'tel'], ['email', 'email', 'email']]
const VOLS = [['arr', 'vol_arr'], ['dep', 'vol_dep']]
// Champs choisis dans la liste officielle des pays (au lieu d'une saisie libre)
const LISTE_PAYS = { pays: 'pays', nationalite: 'nationalite' }

function SelectTitre({ value, onChange, id }) {
  const { t } = useT()
  return (
    <select id={id} value={value || 'Madame'} onChange={onChange} className={champClasse}>
      <option value="Monsieur">{t('mr')}</option><option value="Madame">{t('mme')}</option><option value="Mademoiselle">{t('mlle')}</option>
    </select>
  )
}

export function Voyageurs() {
  const { id } = useParams()
  const { t } = useT()
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['portail', 'voyageurs', id], queryFn: () => portailAPI.voyageurs(id) })
  const [leader, setLeader] = useState(null)
  const [pax, setPax] = useState([])
  const [etat, setEtat] = useState({ enCours: false, ok: false, erreur: '', details: null })
  useEffect(() => { if (data) { setLeader(data.leader); setPax(data.pax) } }, [data])

  const enregistrer = async (e) => {
    e.preventDefault()
    setEtat({ enCours: true, ok: false, erreur: '', details: null })
    // Une date vide doit être envoyée comme null ; les textes vides restent des chaînes vides.
    const propre = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === '' && k.includes('date') ? null : v]))
    try {
      const r = await portailAPI.majVoyageurs(id, { leader: propre(leader), pax: pax.map(propre) })
      qc.setQueryData(['portail', 'voyageurs', id], r)
      setEtat({ enCours: false, ok: true, erreur: '', details: null })
    } catch (err) { setEtat({ enCours: false, ok: false, erreur: err.message, details: err.data }) }
  }

  if (isLoading || (!leader && !error)) return <PortailLayout><Chargement /></PortailLayout>
  if (error) return <PortailLayout><Message type="erreur">{error.message}</Message></PortailLayout>
  const lectureSeule = !data.modifiable
  const setL = (k) => (ev) => setLeader({ ...leader, [k]: ev.target.value })
  const setP = (i, k) => (ev) => setPax(pax.map((p, j) => (j === i ? { ...p, [k]: ev.target.value } : p)))
  // Les champs pays / nationalité renvoient directement la valeur choisie
  const valL = (k) => (v) => setLeader({ ...leader, [k]: v })
  const valP = (i, k) => (v) => setPax(pax.map((p, j) => (j === i ? { ...p, [k]: v } : p)))
  // Erreur renvoyée par le serveur pour un voyageur (liste dans l'ordre du formulaire)
  const erreurPax = (i, k) => {
    const e = etat.details?.pax?.[i]?.[k] ?? (Array.isArray(etat.details?.pax) ? null : etat.details?.[k])
    return Array.isArray(e) ? e[0] : e
  }

  return (
    <PortailLayout>
      <Link to={`/portail/dossiers/${id}`} className="inline-flex items-center gap-1 text-sm text-rt-canopy hover:underline mb-5">
        <ArrowLeft size={15} aria-hidden /> {t('retour')}
      </Link>
      <h1 className="font-title font-bold text-2xl mb-1">{t('voyageurs_titre')}</h1>
      <p className="text-rt-stone mb-6">{t('prevu', { n: data.nb_pax_prevu })}. {t('voyageurs_intro')}</p>
      {lectureSeule && <div className="mb-5"><Message type="attention">{t('voyageurs_verrouille')}</Message></div>}

      <form onSubmit={enregistrer} className="flex flex-col gap-5">
        <fieldset disabled={lectureSeule} className="contents">
          <Bloc titre={t('leader')}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Champ label={t('titre')} id="l-titre"><SelectTitre id="l-titre" value={leader.titre} onChange={setL('titre')} /></Champ>
              {LEADER_CHAMPS.map(([k, lbl, type]) => (
                <Champ key={k} label={t(lbl)} id={`l-${k}`} erreur={(etat.details?.leader || etat.details)?.[k]?.[0]}>
                  {LISTE_PAYS[k]
                    ? <ChampPaysPortail mode={LISTE_PAYS[k]} id={`l-${k}`} value={leader[k] || ''} onChange={valL(k)} disabled={lectureSeule} />
                    : <input id={`l-${k}`} type={type || 'text'} value={leader[k] || ''} onChange={setL(k)} className={champClasse} />}
                </Champ>
              ))}
              <div className="sm:col-span-2">
                <Champ label={t('medical')} id="l-med">
                  <textarea id="l-med" rows={2} value={leader.observation_med || ''} onChange={setL('observation_med')} className={champClasse} />
                </Champ>
              </div>
            </div>
          </Bloc>

          <Bloc titre={t('vols')}>
            {VOLS.map(([suffixe, lbl]) => (
              <div key={suffixe} className="mb-4 last:mb-0">
                <p className="font-medium mb-2">{t(lbl)}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[['dep', 'depart'], ['dest', 'destination'], ['date', 'date'], ['cie', 'compagnie']].map(([c, l]) => {
                    const k = `vol_${suffixe}_${c}`
                    return (
                      <Champ key={k} label={t(l)} id={k}>
                        <input id={k} type={c === 'date' ? 'date' : 'text'} value={leader[k] || ''} onChange={setL(k)} className={champClasse} />
                      </Champ>
                    )
                  })}
                </div>
              </div>
            ))}
          </Bloc>

          <Bloc titre={t('autres')} action={!lectureSeule && (
            <Bouton type="button" variante="discret" onClick={() => setPax([...pax, { titre: 'Madame', nom: '', nationalite: '' }])}>+ {t('ajouter_voyageur')}</Bouton>)}>
            {!pax.length && <p className="text-rt-stone text-sm">—</p>}
            <div className="flex flex-col gap-6">
              {pax.map((p, i) => (
                <div key={p.id || `n${i}`} className="border-t border-rt-line pt-4 first:border-0 first:pt-0">
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-medium">{p.nom || `${t('voyageurs_titre')} ${i + 2}`}</p>
                    {!lectureSeule && <button type="button" onClick={() => setPax(pax.filter((_, j) => j !== i))} className="text-sm text-rt-laterite hover:underline">{t('retirer')}</button>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Champ label={t('titre')} id={`p${i}-titre`}><SelectTitre id={`p${i}-titre`} value={p.titre} onChange={setP(i, 'titre')} /></Champ>
                    {PAX_CHAMPS.map(([k, lbl, type]) => (
                      <Champ key={k} label={t(lbl)} id={`p${i}-${k}`} erreur={erreurPax(i, k)}>
                        {LISTE_PAYS[k]
                          ? <ChampPaysPortail mode={LISTE_PAYS[k]} id={`p${i}-${k}`} required value={p[k] || ''} onChange={valP(i, k)} disabled={lectureSeule} />
                          : <input id={`p${i}-${k}`} type={type || 'text'} required={k === 'nom'} value={p[k] || ''} onChange={setP(i, k)} className={champClasse} />}
                      </Champ>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Bloc>
        </fieldset>
        {etat.erreur && <Message type="erreur">{etat.erreur}</Message>}
        {etat.ok && <Message type="ok">{t('enregistre')}</Message>}
        {!lectureSeule && <div><Bouton type="submit" chargement={etat.enCours}>{t('enregistrer')}</Bouton></div>}
      </form>
    </PortailLayout>
  )
}

/* ── Retour de paiement et page de simulation ─────────────────── */
const TONS = {
  ok:      { Icone: CheckCircle2,  classe: 'bg-rt-canopy/10 text-rt-canopy' },
  attente: { Icone: Clock,         classe: 'bg-rt-ocre-lt text-rt-ocre' },
  info:    { Icone: Info,          classe: 'bg-rt-mist text-rt-canopy' },
  echec:   { Icone: XCircle,       classe: 'bg-rt-laterite/10 text-rt-laterite' },
}

/** En-tête d'état (icône + titre + texte) commun aux pages de retour de paiement. */
function EtatPaiement({ ton, titre, children }) {
  const { Icone, classe } = TONS[ton]
  return (
    <div className="flex flex-col items-center text-center mb-6">
      <span className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${classe}`}>
        <Icone size={28} aria-hidden />
      </span>
      <h1 className="font-title font-bold text-2xl mb-2">{titre}</h1>
      {children && <p className="text-rt-stone max-w-md">{children}</p>}
    </div>
  )
}

/** Récapitulatif du paiement : montant, voyage, dossier et référence. */
function RecapPaiement({ tx, langue }) {
  const fr = langue === 'fr'
  const lignes = [
    [fr ? 'Montant' : 'Amount', <strong key="m" className="text-base">{formatMontant(tx.montant, langue, tx.devise)}</strong>],
    [fr ? 'Voyage' : 'Trip', tx.programme],
    [fr ? 'Dossier' : 'Booking', `n° ${tx.dossier}`],
    [fr ? 'Référence' : 'Reference', <span key="r" className="font-mono text-xs">{String(tx.uuid).slice(0, 8).toUpperCase()}</span>],
  ]
  return (
    <dl className="border border-rt-line rounded-md divide-y divide-rt-line text-sm mb-6">
      {lignes.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
          <dt className="text-rt-stone">{k}</dt><dd className="text-right min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function MentionSecurite({ fr }) {
  return (
    <p className="flex items-center justify-center gap-1.5 text-xs text-rt-stone mt-6">
      <ShieldCheck size={14} className="text-rt-canopy" aria-hidden />
      {fr ? 'Paiement sécurisé — vos données de carte ne transitent jamais par nos serveurs.'
          : 'Secure payment — your card details never go through our servers.'}
    </p>
  )
}

export function PaiementRetour() {
  const { uuid } = useParams()
  const [recherche] = useSearchParams()
  const annuleParClient = recherche.get('annule') === '1'   // bouton « retour » sur la page de paiement
  const { t, langue } = useT()
  const fr = langue === 'fr'
  const [tx, setTx] = useState(null)
  const [essais, setEssais] = useState(0)
  useEffect(() => {
    let annule = false
    portailAPI.transaction(uuid).then((r) => { if (!annule) setTx(r) }).catch(() => {})
    return () => { annule = true }
  }, [uuid, essais])
  const enAttente = tx && ['creee', 'en_attente'].includes(tx.statut)
  useEffect(() => {
    if (enAttente && !annuleParClient && essais < 10) {
      const h = setTimeout(() => setEssais((n) => n + 1), 3000)
      return () => clearTimeout(h)
    }
  }, [tx, essais, enAttente, annuleParClient])

  const versEspace = (variante) => tx && (
    <Link to={`/portail/dossiers/${tx.dossier}`}>
      <Bouton variante={variante}><ArrowLeft size={15} aria-hidden />{t('acceder_espace')}</Bouton>
    </Link>
  )

  return (
    <PortailLayout connecte={false}>
      <div className="max-w-xl mx-auto">
        <Bloc>
          {!tx ? <Chargement /> : tx.statut === 'payee' ? (
            <>
              <EtatPaiement ton="ok" titre={t('pay_retour_ok')}>
                {fr ? 'Un reçu vous est envoyé par email. Votre espace voyage est à jour.'
                    : 'A receipt is on its way to your inbox. Your travel space is up to date.'}
              </EtatPaiement>
              <RecapPaiement tx={tx} langue={langue} />
              <div className="flex justify-center">{versEspace()}</div>
            </>
          ) : enAttente && annuleParClient ? (
            <>
              <EtatPaiement ton="info" titre={fr ? 'Paiement non finalisé' : 'Payment not completed'}>
                {fr ? "Aucun montant n'a été débité. Vous pouvez reprendre le paiement maintenant ou plus tard depuis votre espace voyage."
                    : 'No money was taken. You can resume the payment now or later from your travel space.'}
              </EtatPaiement>
              <RecapPaiement tx={tx} langue={langue} />
              <div className="flex flex-wrap justify-center gap-3">
                {tx.url_paiement && (
                  <a href={tx.url_paiement}><Bouton><CreditCard size={15} aria-hidden />{fr ? 'Reprendre le paiement' : 'Resume payment'}</Bouton></a>
                )}
                {versEspace('secondaire')}
              </div>
            </>
          ) : enAttente && essais >= 10 ? (
            <>
              <EtatPaiement ton="attente" titre={fr ? 'Confirmation en cours' : 'Confirmation in progress'}>
                {fr ? 'Votre banque ou le service de paiement met un peu de temps à confirmer. Vous recevrez un email dès que le paiement sera validé.'
                    : 'Your bank or the payment service is taking a little longer to confirm. You will receive an email as soon as the payment is validated.'}
              </EtatPaiement>
              <RecapPaiement tx={tx} langue={langue} />
              <div className="flex justify-center">{versEspace()}</div>
            </>
          ) : enAttente ? (
            <div className="py-6"><Chargement /><p className="text-sm text-rt-stone text-center mt-3">{t('pay_retour_attente')}</p></div>
          ) : (
            <>
              <EtatPaiement ton="echec" titre={t('pay_retour_echec')}>{t('pay_retour_echec_suite')}</EtatPaiement>
              <RecapPaiement tx={tx} langue={langue} />
              <div className="flex justify-center">{versEspace()}</div>
            </>
          )}
          <MentionSecurite fr={fr} />
        </Bloc>
      </div>
    </PortailLayout>
  )
}

export function PaiementSimulation() {
  const { uuid } = useParams()
  const { t, langue } = useT()
  const [tx, setTx] = useState(null)
  const [enCours, setEnCours] = useState(false)
  useEffect(() => { portailAPI.transaction(uuid).then(setTx).catch(() => setTx(false)) }, [uuid])
  const simuler = async (resultat) => {
    setEnCours(true)
    try { await portailAPI.simuler(uuid, resultat) } finally { window.location.assign(`/portail/paiement/retour/${uuid}`) }
  }
  return (
    <PortailLayout connecte={false}>
      <div className="max-w-xl mx-auto">
        <Bloc titre={t('pay_simulation')}>
          <Message type="attention">{t('pay_simulation_aide')}</Message>
          {tx && (
            <div className="mt-5">
              <RecapPaiement tx={tx} langue={langue} />
              <div className="flex flex-wrap gap-3">
                <Bouton onClick={() => simuler('payee')} chargement={enCours}><CheckCircle2 size={15} aria-hidden />{t('simuler_ok')}</Bouton>
                <Bouton variante="danger" onClick={() => simuler('echouee')} disabled={enCours}><XCircle size={15} aria-hidden />{t('simuler_echec')}</Bouton>
              </div>
            </div>
          )}
          {tx === false && <Message type="erreur">{t('erreur')}</Message>}
        </Bloc>
      </div>
    </PortailLayout>
  )
}
