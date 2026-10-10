/**
 * SITRAC — Espace voyageurs : « Demander un devis » (/portail/demande-devis).
 *
 * Formulaire en 4 étapes, sans compte : le voyage, les envies, les coordonnées,
 * le récapitulatif. Chaque demande crée un prospect dans SITRAC (page Prospects),
 * envoie un accusé de réception au voyageur et prévient l'équipe Sales.
 * Les choix « envies » sont transmis à l'agence en français, quelle que soit la
 * langue du visiteur. Un champ invisible piège les robots de spam.
 * Un client déjà connecté retrouve ses coordonnées pré-remplies.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock, Compass, Heart, Mail, Minus, Pencil,
  Plus, ShieldCheck, Sparkles, UserRound, Users,
} from 'lucide-react'
import { portailAPI, SessionPortail } from './api'
import { formatDate, useT } from './i18n'
import { Bloc, Bouton, Champ, champClasse, EnTetePage, Message, PortailLayout, remonterEnHaut } from './composants'
import ChampPaysPortail from './ChampPaysPortail'
import { usePays } from '../utils/referentielsApi'
import { devisPublicAPI } from '../utils/prospectsApi'

const T = {
  en: {
    surtitre: 'Quote request', titre: 'Plan your trip to Madagascar',
    intro: 'Four short steps. A consultant replies within 48 hours with a first tailor-made proposal — free and without obligation.',
    etapes: ['Your trip', 'Your wishes', 'Your details', 'Summary'],
    // étape 1
    circuit: 'A circuit that interests you', sur_mesure: 'Tailor-made', sur_mesure_texte: 'Not sure yet? We design it with you.',
    voyageurs: 'Travellers', adultes: 'Adults', adultes_aide: '12 years and over', enfants: 'Children', enfants_aide: 'Under 12',
    arrivee: 'Preferred arrival date', arrivee_aide: 'Approximate is fine', duree: 'Length of stay', jours: 'days', autre_duree: 'Other',
    // étape 2
    interets: 'What would you love to do?', interets_aide: 'Choose as many as you like.',
    rythme: 'Pace of travel', hebergement: 'Accommodation', budget: 'Indicative budget per person (excluding international flights)',
    budget_autre: 'Or an amount', envies: 'Anything else we should know?',
    envies_aide: 'Special occasion, must-see places, mobility, diet…',
    // étape 3
    nom: 'Full name', email: 'Email address', telephone: 'Mobile phone', tel_aide: 'With country code, e.g.',
    pays: 'Country of residence', facultatif: 'optional',
    // étape 4
    recap: 'Please check your request', modifier: 'Edit', non_precise: 'Not specified',
    consentement: 'I agree to be contacted by Ramartour about this request.',
    // navigation
    precedent: 'Back', suivant: 'Continue', envoyer: 'Send my request',
    // résumé latéral
    votre_projet: 'Your project', garanties: ['Reply within 48 hours', 'Free and without obligation', 'A local team in Antananarivo'],
    // validation
    err_nom: 'Please enter your full name.', err_email: 'Please enter a valid email address.',
    err_date: 'The arrival date is in the past.', err_duree: 'Between 1 and 90 days.', err_adultes: 'At least 1 adult.',
    err_consentement: 'Please tick the box to let us reply to you.', err_general: 'Please check the highlighted fields.',
    // fin
    merci: 'Thank you, your request is on its way!', reference: 'Reference',
    merci_texte: 'We have sent you a confirmation email. A consultant will get back to you within 48 hours.',
    suite_titre: 'What happens next',
    suite: ['A consultant studies your wishes', 'You receive a tailor-made proposal by email', 'You confirm and pay online from your space'],
    accueil: 'Back to home', mes_voyages: 'My trips', autre: 'Send another request',
  },
  fr: {
    surtitre: 'Demande de devis', titre: 'Préparez votre voyage à Madagascar',
    intro: 'Quatre étapes rapides. Un conseiller vous répond sous 48 heures avec une première proposition sur mesure, gratuite et sans engagement.',
    etapes: ['Votre voyage', 'Vos envies', 'Vos coordonnées', 'Récapitulatif'],
    circuit: 'Un circuit qui vous intéresse', sur_mesure: 'Sur mesure', sur_mesure_texte: 'Pas encore d’idée précise ? Nous le construisons avec vous.',
    voyageurs: 'Voyageurs', adultes: 'Adultes', adultes_aide: '12 ans et plus', enfants: 'Enfants', enfants_aide: 'Moins de 12 ans',
    arrivee: "Date d'arrivée souhaitée", arrivee_aide: 'Une date approximative suffit', duree: 'Durée du séjour', jours: 'jours', autre_duree: 'Autre',
    interets: "Qu'aimeriez-vous faire ?", interets_aide: 'Choisissez-en autant que vous voulez.',
    rythme: 'Rythme du voyage', hebergement: 'Hébergement', budget: 'Budget indicatif par personne (hors vols internationaux)',
    budget_autre: 'Ou un montant', envies: 'Autre chose à nous dire ?',
    envies_aide: 'Occasion spéciale, lieux incontournables, mobilité, régime alimentaire…',
    nom: 'Nom complet', email: 'Adresse email', telephone: 'Téléphone mobile', tel_aide: "Avec l'indicatif du pays, ex.",
    pays: 'Pays de résidence', facultatif: 'facultatif',
    recap: 'Vérifiez votre demande', modifier: 'Modifier', non_precise: 'Non précisé',
    consentement: "J'accepte d'être recontacté(e) par Ramartour au sujet de cette demande.",
    precedent: 'Retour', suivant: 'Continuer', envoyer: 'Envoyer ma demande',
    votre_projet: 'Votre projet', garanties: ['Réponse sous 48 heures', 'Gratuit et sans engagement', 'Une équipe locale à Antananarivo'],
    err_nom: 'Indiquez votre nom complet.', err_email: 'Indiquez une adresse email valide.',
    err_date: "La date d'arrivée est déjà passée.", err_duree: 'Entre 1 et 90 jours.', err_adultes: 'Au moins 1 adulte.',
    err_consentement: 'Cochez la case pour que nous puissions vous répondre.', err_general: 'Merci de vérifier les champs signalés.',
    merci: 'Merci, votre demande est bien partie !', reference: 'Référence',
    merci_texte: 'Un email de confirmation vous a été envoyé. Un conseiller vous répondra sous 48 heures.',
    suite_titre: 'La suite',
    suite: ['Un conseiller étudie vos envies', 'Vous recevez une proposition sur mesure par email', 'Vous confirmez et payez en ligne depuis votre espace'],
    accueil: "Retour à l'accueil", mes_voyages: 'Mes voyages', autre: 'Faire une autre demande',
  },
}

// Choix proposés : [clé, anglais, français]. L'agence reçoit toujours le libellé français.
const INTERETS = [
  ['faune', 'Lemurs & wildlife', 'Lémuriens et faune'], ['plages', 'Beaches & islands', 'Plages et îles'],
  ['randonnee', 'Hiking & national parks', 'Randonnée et parcs nationaux'], ['culture', 'Culture & villages', 'Culture et villages'],
  ['baobabs', 'Baobabs & landscapes', 'Baobabs et paysages'], ['plongee', 'Diving & snorkelling', 'Plongée et snorkeling'],
  ['photo', 'Photography', 'Photographie'], ['gastronomie', 'Local food', 'Gastronomie locale'],
]
const RYTHMES = [['tranquille', 'Relaxed', 'Tranquille'], ['equilibre', 'Balanced', 'Équilibré'], ['intense', 'Active', 'Soutenu']]
const HEBERGEMENTS = [['simple', 'Simple & authentic', 'Simple et authentique'], ['confort', 'Comfortable', 'Confort'],
  ['charme', 'Boutique & charm', 'Charme'], ['luxe', 'Luxury', 'Luxe']]
const BUDGETS = ['< 1 500 €', '1 500 – 2 500 €', '2 500 – 4 000 €', '> 4 000 €']
const DUREES = [7, 10, 14, 21]

const VIDE = {
  programme_souhaite: '', nb_adultes: 2, nb_enfants: 0, date_arrivee: '', duree_jours: '',
  interets: [], rythme: '', hebergement: '', budget: '', envies: '',
  nom: '', email: '', telephone: '', pays: '', consentement: true, site_web_confirmation: '',
}
const CHAMPS_PAR_ETAPE = {
  0: ['programme_souhaite', 'nb_adultes', 'nb_enfants', 'date_arrivee', 'duree_jours'],
  1: ['budget', 'envies'],
  2: ['nom', 'email', 'telephone', 'pays'],
}
const aujourdhui = () => new Date().toISOString().slice(0, 10)
const emailValide = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())
const libelle = (liste, cle, langue) => { const x = liste.find((l) => l[0] === cle); return x ? x[langue === 'fr' ? 2 : 1] : '' }

export default function DemandeDevis() {
  const { langue } = useT()
  const t = T[langue] || T.en
  const session = SessionPortail.get()
  const [params] = useSearchParams()
  const [v, setV] = useState(() => ({ ...VIDE, programme_souhaite: params.get('circuit') || '' }))
  const [etape, setEtape] = useState(0)
  const [erreurs, setErreurs] = useState({})
  const [envoi, setEnvoi] = useState(false)
  const [reference, setReference] = useState(null)
  const { data: circuits = [] } = useQuery({ queryKey: ['devis-programmes'], queryFn: devisPublicAPI.programmes, staleTime: 300000 })
  const { depuisPays } = usePays()
  // Client connecté : coordonnées pré-remplies
  const { data: moi } = useQuery({ queryKey: ['portail', 'moi'], queryFn: portailAPI.moi, enabled: !!session })
  useEffect(() => {
    if (!session) return
    setV((x) => ({
      ...x,
      nom: x.nom || session.client?.nom || '', email: x.email || moi?.email || session.client?.email || '',
      telephone: x.telephone || moi?.telephone_e164 || moi?.telephone || '',
    }))
  }, [moi]) // eslint-disable-line react-hooks/exhaustive-deps

  const maj = (k, val) => { setV((x) => ({ ...x, [k]: val })); setErreurs((e) => ({ ...e, [k]: undefined, general: undefined })) }
  const basculerInteret = (k) => maj('interets', v.interets.includes(k) ? v.interets.filter((i) => i !== k) : [...v.interets, k])
  const circuit = circuits.find((c) => String(c.id) === String(v.programme_souhaite))
  const indicatif = depuisPays(v.pays)?.indicatif

  // ── Validation locale de l'étape ───────────────────────────────
  const verifier = (n) => {
    const e = {}
    if (n === 0) {
      if (!(Number(v.nb_adultes) >= 1)) e.nb_adultes = t.err_adultes
      if (v.date_arrivee && v.date_arrivee < aujourdhui()) e.date_arrivee = t.err_date
      if (v.duree_jours !== '' && !(Number(v.duree_jours) >= 1 && Number(v.duree_jours) <= 90)) e.duree_jours = t.err_duree
    }
    if (n === 2) {
      if (v.nom.trim().length < 2) e.nom = t.err_nom
      if (!emailValide(v.email)) e.email = t.err_email
    }
    if (n === 3 && !v.consentement) e.consentement = t.err_consentement
    setErreurs(e)
    return !Object.keys(e).length
  }
  const aller = (n) => { setEtape(n); remonterEnHaut() }
  const suivant = () => { if (verifier(etape)) aller(etape + 1) }

  // Les envies sont transmises à l'agence en français, en clair
  const enviesPourAgence = () => {
    const lignes = []
    if (v.interets.length) lignes.push(`Centres d'intérêt : ${v.interets.map((k) => libelle(INTERETS, k, 'fr')).join(', ')}`)
    if (v.rythme) lignes.push(`Rythme : ${libelle(RYTHMES, v.rythme, 'fr')}`)
    if (v.hebergement) lignes.push(`Hébergement : ${libelle(HEBERGEMENTS, v.hebergement, 'fr')}`)
    if (v.envies.trim()) lignes.push((lignes.length ? '\n' : '') + v.envies.trim())
    return lignes.join('\n')
  }

  const envoyer = async () => {
    if (!verifier(3)) return
    setEnvoi(true)
    try {
      const r = await devisPublicAPI.envoyer({
        nom: v.nom.trim(), email: v.email.trim(), telephone: v.telephone.trim(), pays: v.pays, langue,
        nb_adultes: Number(v.nb_adultes) || 1, nb_enfants: Number(v.nb_enfants) || 0,
        date_arrivee: v.date_arrivee || null, duree_jours: v.duree_jours ? Number(v.duree_jours) : null,
        programme_souhaite: v.programme_souhaite || null,
        budget: v.budget ? `${v.budget} / pers.` : '', envies: enviesPourAgence(),
        consentement: v.consentement, site_web_confirmation: v.site_web_confirmation,
      })
      setReference(r.reference)
      remonterEnHaut()
    } catch (ex) {
      const champs = ex.champs && typeof ex.champs === 'object' ? ex.champs : {}
      const e = Object.fromEntries(Object.entries(champs).map(([k, m]) => [k, Array.isArray(m) ? m[0] : m]))
      if (!Object.keys(e).length || e.detail || e.non_field_errors) e.general = e.detail || e.non_field_errors || ex.message
      setErreurs(e)
      const fautive = [0, 1, 2].find((n) => CHAMPS_PAR_ETAPE[n].some((k) => e[k]))
      if (fautive !== undefined) aller(fautive)
    } finally { setEnvoi(false) }
  }

  if (reference) return <Merci t={t} reference={reference} connecte={!!session} recommencer={() => { setV(VIDE); setEtape(0); setReference(null) }} />

  return (
    <PortailLayout large>
      <EnTetePage surtitre={t.surtitre} titre={t.titre} texte={t.intro} />
      <Progression etapes={t.etapes} actuelle={etape} aller={(n) => n < etape && aller(n)} />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start mt-6">
        <div className="flex flex-col gap-5 min-w-0">
          {(erreurs.general || (Object.values(erreurs).some(Boolean) && etape === 3 && !erreurs.consentement)) && (
            <Message type="erreur">{erreurs.general || t.err_general}</Message>
          )}

          {etape === 0 && (
            <>
              <Bloc titre={t.circuit} icone={Compass}>
                <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label={t.circuit}>
                  <CarteChoix choisi={!v.programme_souhaite} onClick={() => maj('programme_souhaite', '')}
                    titre={t.sur_mesure} texte={t.sur_mesure_texte} icone={Sparkles} />
                  {circuits.map((c) => (
                    <CarteChoix key={c.id} choisi={String(v.programme_souhaite) === String(c.id)} onClick={() => maj('programme_souhaite', String(c.id))}
                      titre={c.nom} etiquette={c.type_prog} texte={c.etapes?.length ? c.etapes.join(' · ') : c.description} />
                  ))}
                </div>
              </Bloc>
              <Bloc titre={t.voyageurs} icone={Users}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Compteur id="nb_adultes" label={t.adultes} aide={t.adultes_aide} valeur={v.nb_adultes} min={1} max={60}
                    onChange={(n) => maj('nb_adultes', n)} erreur={erreurs.nb_adultes} />
                  <Compteur id="nb_enfants" label={t.enfants} aide={t.enfants_aide} valeur={v.nb_enfants} min={0} max={30}
                    onChange={(n) => maj('nb_enfants', n)} erreur={erreurs.nb_enfants} />
                </div>
              </Bloc>
              <Bloc titre={t.duree} icone={CalendarDays}>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Champ label={t.arrivee} id="date_arrivee" aide={t.arrivee_aide} erreur={erreurs.date_arrivee}>
                    <input id="date_arrivee" type="date" min={aujourdhui()} value={v.date_arrivee}
                      onChange={(e) => maj('date_arrivee', e.target.value)} className={champClasse} />
                  </Champ>
                  <Champ label={t.duree} id="duree_jours" erreur={erreurs.duree_jours}>
                    <div className="flex flex-wrap gap-2">
                      {DUREES.map((d) => (
                        <Puce key={d} choisi={Number(v.duree_jours) === d} onClick={() => maj('duree_jours', Number(v.duree_jours) === d ? '' : d)}>
                          {d} {t.jours}
                        </Puce>
                      ))}
                      <input id="duree_jours" type="number" min="1" max="90" inputMode="numeric" placeholder={t.autre_duree}
                        value={DUREES.includes(Number(v.duree_jours)) ? '' : v.duree_jours}
                        onChange={(e) => maj('duree_jours', e.target.value)} className={`${champClasse} !w-24 !py-1.5`} />
                    </div>
                  </Champ>
                </div>
              </Bloc>
            </>
          )}

          {etape === 1 && (
            <>
              <Bloc titre={t.interets} icone={Heart}>
                <p className="text-sm text-rt-stone -mt-2 mb-4">{t.interets_aide}</p>
                <div className="flex flex-wrap gap-2">
                  {INTERETS.map(([k, en, fr]) => (
                    <Puce key={k} choisi={v.interets.includes(k)} onClick={() => basculerInteret(k)} coche>{langue === 'fr' ? fr : en}</Puce>
                  ))}
                </div>
              </Bloc>
              <Bloc>
                <div className="grid sm:grid-cols-2 gap-6">
                  <GroupePuces titre={t.rythme} liste={RYTHMES} valeur={v.rythme} langue={langue} onChange={(k) => maj('rythme', k)} />
                  <GroupePuces titre={t.hebergement} liste={HEBERGEMENTS} valeur={v.hebergement} langue={langue} onChange={(k) => maj('hebergement', k)} />
                </div>
                <div className="mt-6">
                  <p className="text-[13px] font-medium mb-2">{t.budget}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {BUDGETS.map((b) => <Puce key={b} choisi={v.budget === b} onClick={() => maj('budget', v.budget === b ? '' : b)}>{b}</Puce>)}
                    <input aria-label={t.budget_autre} placeholder={t.budget_autre} value={BUDGETS.includes(v.budget) ? '' : v.budget}
                      onChange={(e) => maj('budget', e.target.value)} className={`${champClasse} !w-40 !py-1.5`} maxLength={60} />
                  </div>
                </div>
                <div className="mt-6">
                  <Champ label={t.envies} id="envies" aide={t.envies_aide} erreur={erreurs.envies}>
                    <textarea id="envies" rows={4} value={v.envies} onChange={(e) => maj('envies', e.target.value)} className={champClasse} maxLength={3000} />
                  </Champ>
                </div>
              </Bloc>
            </>
          )}

          {etape === 2 && (
            <Bloc titre={t.etapes[2]} icone={UserRound}>
              <div className="grid sm:grid-cols-2 gap-4">
                <Champ label={`${t.nom} *`} id="nom" erreur={erreurs.nom}>
                  <input id="nom" autoComplete="name" value={v.nom} onChange={(e) => maj('nom', e.target.value)} className={champClasse} maxLength={150} />
                </Champ>
                <Champ label={`${t.email} *`} id="email" erreur={erreurs.email}>
                  <input id="email" type="email" autoComplete="email" value={v.email} onChange={(e) => maj('email', e.target.value)} className={champClasse} />
                </Champ>
                <Champ label={`${t.pays} (${t.facultatif})`} id="pays" erreur={erreurs.pays}>
                  <ChampPaysPortail mode="pays" id="pays" value={v.pays} onChange={(val) => maj('pays', val)} />
                </Champ>
                <Champ label={`${t.telephone} (${t.facultatif})`} id="telephone" erreur={erreurs.telephone}
                  aide={`${t.tel_aide} ${indicatif || '+33'} …`}>
                  <input id="telephone" type="tel" autoComplete="tel" inputMode="tel" value={v.telephone}
                    onChange={(e) => maj('telephone', e.target.value)} className={champClasse} placeholder={indicatif ? `${indicatif} …` : ''} />
                </Champ>
              </div>
              {/* Piège à robots : invisible pour un humain */}
              <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
                <label htmlFor="site_web_confirmation">Website</label>
                <input id="site_web_confirmation" tabIndex={-1} autoComplete="off" value={v.site_web_confirmation}
                  onChange={(e) => maj('site_web_confirmation', e.target.value)} />
              </div>
            </Bloc>
          )}

          {etape === 3 && (
            <Bloc titre={t.recap} icone={Check}>
              <dl className="divide-y divide-rt-line">
                <LigneRecap titre={t.etapes[0]} modifier={() => aller(0)} t={t} valeurs={[
                  circuit ? circuit.nom : t.sur_mesure,
                  `${v.nb_adultes} ${t.adultes.toLowerCase()}${Number(v.nb_enfants) ? `, ${v.nb_enfants} ${t.enfants.toLowerCase()}` : ''}`,
                  v.date_arrivee ? formatDate(v.date_arrivee, langue) : null,
                  v.duree_jours ? `${v.duree_jours} ${t.jours}` : null,
                ]} />
                <LigneRecap titre={t.etapes[1]} modifier={() => aller(1)} t={t} valeurs={[
                  v.interets.map((k) => libelle(INTERETS, k, langue)).join(', ') || null,
                  [libelle(RYTHMES, v.rythme, langue), libelle(HEBERGEMENTS, v.hebergement, langue)].filter(Boolean).join(' · ') || null,
                  v.budget ? `${v.budget} / pers.` : null, v.envies.trim() || null,
                ]} />
                <LigneRecap titre={t.etapes[2]} modifier={() => aller(2)} t={t} valeurs={[
                  v.nom, v.email, v.telephone || null, v.pays ? (depuisPays(v.pays)?.[langue === 'fr' ? 'nom' : 'nom_en'] || v.pays) : null,
                ]} />
              </dl>
              <label className="mt-5 flex items-start gap-3 text-[15px] cursor-pointer">
                <input type="checkbox" className="mt-1 accent-rt-canopy w-4 h-4" checked={v.consentement}
                  onChange={(e) => maj('consentement', e.target.checked)} />
                {t.consentement}
              </label>
              {erreurs.consentement && <p className="text-xs text-rt-laterite mt-1" role="alert">{erreurs.consentement}</p>}
            </Bloc>
          )}

          <div className="flex items-center justify-between gap-3">
            {etape > 0
              ? <Bouton variante="secondaire" onClick={() => aller(etape - 1)}><ArrowLeft size={16} aria-hidden /> {t.precedent}</Bouton>
              : <span />}
            {etape < 3
              ? <Bouton onClick={suivant}>{t.suivant} <ArrowRight size={16} aria-hidden /></Bouton>
              : <Bouton onClick={envoyer} chargement={envoi} disabled={!v.consentement}><Mail size={16} aria-hidden /> {t.envoyer}</Bouton>}
          </div>
        </div>

        <Resume t={t} v={v} circuit={circuit} langue={langue} />
      </div>
    </PortailLayout>
  )
}

/* ── Éléments du formulaire ───────────────────────────────────── */
function Progression({ etapes, actuelle, aller }) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Progress">
      {etapes.map((e, i) => {
        const fait = i < actuelle, encours = i === actuelle
        return (
          <li key={e}>
            <button type="button" onClick={() => aller(i)} disabled={!fait} aria-current={encours ? 'step' : undefined}
              className="w-full text-left group disabled:cursor-default">
              <span className={`block h-1.5 rounded-full transition-colors ${fait || encours ? 'bg-rt-canopy' : 'bg-rt-line'}`} />
              <span className="mt-2 flex items-center gap-2 text-sm">
                <span className={`w-6 h-6 shrink-0 rounded-full grid place-items-center text-xs font-bold transition
                  ${fait ? 'bg-rt-canopy text-white' : encours ? 'bg-rt-ocre text-rt-ink' : 'bg-white border border-rt-line text-rt-stone'}`}>
                  {fait ? <Check size={13} aria-hidden /> : i + 1}
                </span>
                <span className={`hidden sm:inline truncate ${encours ? 'font-semibold text-rt-ink' : fait ? 'text-rt-canopy group-hover:underline' : 'text-rt-stone'}`}>{e}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function CarteChoix({ choisi, onClick, titre, texte, etiquette, icone: Icone }) {
  return (
    <button type="button" role="radio" aria-checked={choisi} onClick={onClick}
      className={`relative text-left rounded-xl border p-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rt-canopy
        ${choisi ? 'border-rt-canopy bg-rt-mist ring-1 ring-rt-canopy' : 'border-rt-line bg-white hover:border-rt-canopy/50'}`}>
      <span className={`absolute top-3 right-3 w-5 h-5 rounded-full grid place-items-center border transition
        ${choisi ? 'bg-rt-canopy border-rt-canopy text-white' : 'border-rt-line'}`}>{choisi && <Check size={12} aria-hidden />}</span>
      {Icone && <Icone size={18} className="text-rt-ocre mb-1.5" aria-hidden />}
      {etiquette && <span className="block text-[11px] uppercase tracking-wider text-rt-stone font-semibold mb-0.5 pr-6">{etiquette}</span>}
      <span className="block font-semibold text-rt-ink pr-6 leading-snug">{titre}</span>
      {texte && <span className="block text-xs text-rt-stone mt-1 leading-snug line-clamp-2">{texte}</span>}
    </button>
  )
}

function Puce({ choisi, onClick, children, coche = false }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={choisi}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition
        focus:outline-none focus-visible:ring-2 focus-visible:ring-rt-canopy
        ${choisi ? 'bg-rt-canopy border-rt-canopy text-white' : 'bg-white border-rt-line text-rt-ink hover:border-rt-canopy/60'}`}>
      {coche && choisi && <Check size={14} aria-hidden />}
      {children}
    </button>
  )
}

function GroupePuces({ titre, liste, valeur, langue, onChange }) {
  return (
    <div>
      <p className="text-[13px] font-medium mb-2">{titre}</p>
      <div className="flex flex-wrap gap-2">
        {liste.map(([k, en, fr]) => (
          <Puce key={k} choisi={valeur === k} onClick={() => onChange(valeur === k ? '' : k)}>{langue === 'fr' ? fr : en}</Puce>
        ))}
      </div>
    </div>
  )
}

function Compteur({ id, label, aide, valeur, min, max, onChange, erreur }) {
  const n = Number(valeur) || 0
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-rt-line px-4 py-3">
      <div>
        <label htmlFor={id} className="block font-medium">{label}</label>
        <span className="block text-xs text-rt-stone">{aide}</span>
        {erreur && <span className="block text-xs text-rt-laterite" role="alert">{erreur}</span>}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(min, n - 1))} disabled={n <= min} aria-label={`${label} −`}
          className="w-9 h-9 rounded-full border border-rt-line grid place-items-center text-rt-canopy hover:bg-rt-mist disabled:opacity-40">
          <Minus size={16} aria-hidden />
        </button>
        <input id={id} type="number" min={min} max={max} value={n} inputMode="numeric"
          onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))}
          className="w-12 text-center font-title font-semibold text-lg bg-transparent focus:outline-none" />
        <button type="button" onClick={() => onChange(Math.min(max, n + 1))} disabled={n >= max} aria-label={`${label} +`}
          className="w-9 h-9 rounded-full border border-rt-line grid place-items-center text-rt-canopy hover:bg-rt-mist disabled:opacity-40">
          <Plus size={16} aria-hidden />
        </button>
      </div>
    </div>
  )
}

function LigneRecap({ titre, valeurs, modifier, t }) {
  const presentes = valeurs.filter(Boolean)
  return (
    <div className="py-3.5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wider font-semibold text-rt-stone mb-1">{titre}</dt>
        <dd className="text-[15px] space-y-0.5">
          {presentes.length ? presentes.map((x, i) => <p key={i} className="whitespace-pre-line break-words">{x}</p>) : <p className="text-rt-stone">{t.non_precise}</p>}
        </dd>
      </div>
      <button type="button" onClick={modifier} className="shrink-0 inline-flex items-center gap-1 text-sm text-rt-canopy hover:underline">
        <Pencil size={13} aria-hidden /> {t.modifier}
      </button>
    </div>
  )
}

function Resume({ t, v, circuit, langue }) {
  const lignes = [
    [Compass, circuit ? circuit.nom : t.sur_mesure],
    [Users, `${v.nb_adultes} ${t.adultes.toLowerCase()}${Number(v.nb_enfants) ? ` · ${v.nb_enfants} ${t.enfants.toLowerCase()}` : ''}`],
    [CalendarDays, v.date_arrivee ? formatDate(v.date_arrivee, langue) : null],
    [Clock, v.duree_jours ? `${v.duree_jours} ${t.jours}` : null],
    [Heart, v.interets.length ? v.interets.map((k) => libelle(INTERETS, k, langue)).join(', ') : null],
  ].filter(([, x]) => x)
  return (
    <aside className="lg:sticky lg:top-24 flex flex-col gap-4">
      <div className="rounded-2xl bg-gradient-to-br from-rt-canopy-dk to-rt-canopy text-white p-6 shadow-xl shadow-rt-canopy/20">
        <p className="font-title font-semibold text-lg mb-4">{t.votre_projet}</p>
        <ul className="flex flex-col gap-3 text-sm">
          {lignes.map(([Icone, texte], i) => (
            <li key={i} className="flex items-start gap-2.5"><Icone size={16} className="mt-0.5 text-rt-ocre shrink-0" aria-hidden /> <span className="text-white/90">{texte}</span></li>
          ))}
        </ul>
      </div>
      <ul className="rounded-2xl bg-white border border-rt-line p-5 flex flex-col gap-2.5 text-sm">
        {t.garanties.map((g) => <li key={g} className="flex items-center gap-2.5"><ShieldCheck size={16} className="text-rt-canopy shrink-0" aria-hidden /> {g}</li>)}
      </ul>
    </aside>
  )
}

function Merci({ t, reference, connecte, recommencer }) {
  return (
    <PortailLayout>
      <Bloc>
        <div className="text-center py-6 sm:py-10 max-w-lg mx-auto">
          <span className="mx-auto w-16 h-16 rounded-full bg-rt-mist text-rt-canopy grid place-items-center mb-5 animate-scale-in motion-reduce:animate-none">
            <CheckCircle2 size={36} aria-hidden />
          </span>
          <h1 className="font-title text-2xl sm:text-[28px] font-bold leading-tight">{t.merci}</h1>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-rt-ocre-lt px-4 py-1.5 text-sm font-semibold">
            {t.reference} <span className="font-mono tracking-wider">{reference}</span>
          </p>
          <p className="text-rt-stone mt-4">{t.merci_texte}</p>
          <div className="text-left mt-8 rounded-2xl border border-rt-line p-5">
            <p className="font-title font-semibold mb-3">{t.suite_titre}</p>
            <ol className="flex flex-col gap-3">
              {t.suite.map((s, i) => (
                <li key={s} className="flex items-start gap-3 text-sm">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-rt-canopy text-white grid place-items-center text-xs font-bold">{i + 1}</span>{s}
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/portail"><Bouton variante="sombre">{connecte ? t.mes_voyages : t.accueil}</Bouton></Link>
            <Bouton variante="secondaire" onClick={recommencer}>{t.autre}</Bouton>
          </div>
        </div>
      </Bloc>
    </PortailLayout>
  )
}
