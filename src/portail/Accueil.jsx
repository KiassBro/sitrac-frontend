/**
 * SITRAC — Espace voyageurs Ramartour : page d'accueil publique (/portail).
 *
 * Deux portes d'entrée sur la même plateforme :
 *   « Demander un devis »   → /portail/demande-devis (sans compte)
 *   « Accéder à mon espace » → /portail/connexion (code reçu par email)
 * Un client déjà connecté arrive directement sur ses voyages.
 */
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight, CalendarCheck, FileSignature, Headset, Mail, Map, MapPinned, MessageCircle,
  ShieldCheck, Sparkles, UserRound,
} from 'lucide-react'
import { SessionPortail } from './api'
import { useT } from './i18n'
import { AGENCE, IMAGE_FOND, PortailLayout } from './composants'
import { MesVoyages } from './PagesCompte'
import { devisPublicAPI } from '../utils/prospectsApi'

/** /portail : les voyages du client connecté, sinon l'accueil public. */
export function EntreePortail() {
  return SessionPortail.get() ? <MesVoyages /> : <Accueil />
}

const TEXTES = {
  en: {
    surtitre: 'Tailor-made journeys in Madagascar',
    titre: 'The Madagascar you dream of, prepared by people who live there',
    intro: 'Lemurs and rainforests, baobab avenues, tsingy and turquoise lagoons: tell us about your trip, we design it with you and look after every detail.',
    cta_devis: 'Request a free quote', cta_espace: 'Access my space',
    confiance: ['Reply within 48 hours', 'Free, no obligation', 'Secure online payment'],
    etapes_titre: 'Your trip in four steps',
    etapes: [
      ['Your request', 'A few questions about your wishes, dates and budget.'],
      ['Tailor-made proposal', 'A consultant builds your itinerary and sends your quote.'],
      ['Sign and pay online', 'Confirm with an electronic signature, pay by card securely.'],
      ['Your travel book', 'Day-by-day programme, contacts, vouchers — on your phone.'],
    ],
    portes_titre: 'One place for your whole journey',
    porte_devis_titre: 'Planning a trip?',
    porte_devis_texte: 'Describe your project in a few minutes. No account needed — we reply by email.',
    porte_espace_titre: 'Already travelling with us?',
    porte_espace_texte: 'Sign in with your email address: we send you a code, no password to remember.',
    porte_espace_liste: ['Review and sign your quote', 'Pay your instalments by card', 'Complete traveller details', 'Download vouchers and your travel book'],
    circuits_titre: 'A few ideas to get started',
    circuits_texte: 'Every circuit can be adapted: length, pace, accommodation, extensions to the beach.',
    circuit_cta: 'Request this circuit',
    aide_titre: 'Would you rather talk to someone?',
    aide_texte: 'Our consultants in Antananarivo answer by email and WhatsApp.',
  },
  fr: {
    surtitre: 'Voyages sur mesure à Madagascar',
    titre: 'Le Madagascar dont vous rêvez, préparé par ceux qui y vivent',
    intro: 'Lémuriens et forêts humides, allées de baobabs, tsingy et lagons turquoise : parlez-nous de votre voyage, nous le construisons avec vous et veillons à chaque détail.',
    cta_devis: 'Demander un devis gratuit', cta_espace: 'Accéder à mon espace',
    confiance: ['Réponse sous 48 heures', 'Gratuit et sans engagement', 'Paiement en ligne sécurisé'],
    etapes_titre: 'Votre voyage en quatre étapes',
    etapes: [
      ['Votre demande', 'Quelques questions sur vos envies, vos dates et votre budget.'],
      ['Proposition sur mesure', 'Un conseiller construit votre itinéraire et vous envoie votre devis.'],
      ['Signature et paiement en ligne', 'Vous confirmez par signature électronique et payez par carte, en toute sécurité.'],
      ['Votre carnet de route', 'Programme jour par jour, contacts, vouchers — sur votre téléphone.'],
    ],
    portes_titre: 'Un seul endroit pour tout votre voyage',
    porte_devis_titre: 'Vous préparez un voyage ?',
    porte_devis_texte: 'Décrivez votre projet en quelques minutes. Sans compte : nous vous répondons par email.',
    porte_espace_titre: 'Vous voyagez déjà avec nous ?',
    porte_espace_texte: 'Connectez-vous avec votre adresse email : nous vous envoyons un code, sans mot de passe.',
    porte_espace_liste: ['Consulter et signer votre devis', 'Régler vos échéances par carte', 'Compléter les informations des voyageurs', 'Télécharger vouchers et carnet de route'],
    circuits_titre: 'Quelques idées pour commencer',
    circuits_texte: 'Chaque circuit s’adapte : durée, rythme, hébergements, extension balnéaire.',
    circuit_cta: 'Demander ce circuit',
    aide_titre: 'Vous préférez en parler ?',
    aide_texte: 'Nos conseillers à Antananarivo vous répondent par email et sur WhatsApp.',
  },
}
const ICONES_ETAPES = [Sparkles, MapPinned, FileSignature, Map]
const ICONES_CONFIANCE = [Headset, CalendarCheck, ShieldCheck]

export default function Accueil() {
  const { langue } = useT()
  const tx = TEXTES[langue] || TEXTES.en
  const { data: circuits = [] } = useQuery({ queryKey: ['devis-programmes'], queryFn: devisPublicAPI.programmes, staleTime: 300000 })
  const delai = (ms) => ({ animationDelay: `${ms}ms`, animationFillMode: 'both' })

  return (
    <PortailLayout connecte={false} pleineLargeur>
      {/* ── Photo d'accueil ───────────────────────────────────── */}
      <section className="relative min-h-[88vh] lg:min-h-[92vh] flex items-center overflow-hidden">
        <style>{'@keyframes zoomLent{from{transform:scale(1.12)}to{transform:scale(1.02)}}'}</style>
        <img src={IMAGE_FOND} alt="" aria-hidden
          className="absolute inset-0 w-full h-full object-cover motion-safe:animate-[zoomLent_20s_ease-out_both]" />
        <div className="absolute inset-0 bg-gradient-to-r from-rt-canopy-dk/95 via-rt-canopy-dk/70 to-rt-canopy-dk/10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-rt-mist to-transparent" />

        <div className="relative w-full max-w-6xl mx-auto px-5 sm:px-6 pt-28 pb-24 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          <div className="text-white">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/20 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] animate-fade-up motion-reduce:animate-none" style={delai(50)}>
              <Sparkles size={14} className="text-rt-ocre" aria-hidden /> {tx.surtitre}
            </p>
            <h1 className="mt-5 font-title font-extrabold text-[34px] leading-[1.08] sm:text-5xl lg:text-[56px] tracking-tight animate-fade-up motion-reduce:animate-none" style={delai(150)}>
              {tx.titre}
            </h1>
            <p className="mt-5 text-white/85 text-base sm:text-lg max-w-xl leading-relaxed animate-fade-up motion-reduce:animate-none" style={delai(250)}>
              {tx.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-fade-up motion-reduce:animate-none" style={delai(350)}>
              <Link to="/portail/demande-devis"
                className="group inline-flex items-center gap-2 rounded-xl bg-rt-ocre text-rt-ink px-6 py-3.5 font-semibold shadow-lg shadow-black/20 hover:brightness-95 transition">
                {tx.cta_devis} <ArrowRight size={18} className="transition group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link to="/portail/connexion"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 text-white ring-1 ring-white/35 px-6 py-3.5 font-semibold backdrop-blur hover:bg-white/20 transition">
                <UserRound size={18} aria-hidden /> {tx.cta_espace}
              </Link>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80 animate-fade-up motion-reduce:animate-none" style={delai(450)}>
              {tx.confiance.map((c, i) => {
                const Icone = ICONES_CONFIANCE[i]
                return <li key={c} className="inline-flex items-center gap-2"><Icone size={16} className="text-rt-ocre" aria-hidden /> {c}</li>
              })}
            </ul>
          </div>

          {/* Les quatre étapes, en carte vitrée */}
          <div className="hidden lg:block animate-scale-in motion-reduce:animate-none" style={delai(400)}>
            <div className="rounded-3xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md p-7 text-white shadow-2xl shadow-black/20">
              <p className="font-title font-semibold text-lg mb-5">{tx.etapes_titre}</p>
              <ol className="relative flex flex-col gap-5">
                <span className="absolute left-[19px] top-3 bottom-3 border-l-2 border-dashed border-white/25" aria-hidden />
                {tx.etapes.map(([titre, texte], i) => {
                  const Icone = ICONES_ETAPES[i]
                  return (
                    <li key={titre} className="relative flex gap-4">
                      <span className="w-10 h-10 shrink-0 rounded-full bg-rt-ocre text-rt-ink grid place-items-center shadow"><Icone size={18} aria-hidden /></span>
                      <span>
                        <span className="block font-semibold">{titre}</span>
                        <span className="block text-sm text-white/75 leading-snug">{texte}</span>
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ── Deux portes d'entrée ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 -mt-10 relative z-10">
        <h2 className="sr-only">{tx.portes_titre}</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <Link to="/portail/demande-devis"
            className="group relative overflow-hidden rounded-3xl bg-rt-canopy text-white p-7 sm:p-8 shadow-xl shadow-rt-canopy/20 transition hover:-translate-y-1">
            <Sparkles size={120} className="absolute -right-6 -bottom-6 text-white/[0.06]" aria-hidden />
            <span className="w-12 h-12 rounded-2xl bg-rt-ocre text-rt-ink grid place-items-center mb-5"><Sparkles size={22} aria-hidden /></span>
            <h3 className="font-title font-bold text-2xl">{tx.porte_devis_titre}</h3>
            <p className="mt-2 text-white/80 max-w-sm">{tx.porte_devis_texte}</p>
            <span className="mt-6 inline-flex items-center gap-2 font-semibold text-rt-ocre">
              {tx.cta_devis} <ArrowRight size={18} className="transition group-hover:translate-x-1" aria-hidden />
            </span>
          </Link>
          <Link to="/portail/connexion"
            className="group rounded-3xl bg-white border border-rt-line p-7 sm:p-8 shadow-xl shadow-rt-canopy/5 transition hover:-translate-y-1 hover:border-rt-canopy/40">
            <span className="w-12 h-12 rounded-2xl bg-rt-mist text-rt-canopy grid place-items-center mb-5"><UserRound size={22} aria-hidden /></span>
            <h3 className="font-title font-bold text-2xl text-rt-ink">{tx.porte_espace_titre}</h3>
            <p className="mt-2 text-rt-stone max-w-sm">{tx.porte_espace_texte}</p>
            <ul className="mt-4 grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-rt-ink">
              {tx.porte_espace_liste.map((l) => (
                <li key={l} className="flex items-start gap-2"><ShieldCheck size={15} className="mt-0.5 text-rt-canopy shrink-0" aria-hidden /> {l}</li>
              ))}
            </ul>
            <span className="mt-6 inline-flex items-center gap-2 font-semibold text-rt-canopy">
              {tx.cta_espace} <ArrowRight size={18} className="transition group-hover:translate-x-1" aria-hidden />
            </span>
          </Link>
        </div>
      </section>

      {/* ── Étapes (téléphone et tablette) ────────────────────── */}
      <section className="lg:hidden max-w-6xl mx-auto px-5 sm:px-6 pt-14">
        <h2 className="font-title font-bold text-2xl mb-6">{tx.etapes_titre}</h2>
        <ol className="grid sm:grid-cols-2 gap-4">
          {tx.etapes.map(([titre, texte], i) => {
            const Icone = ICONES_ETAPES[i]
            return (
              <li key={titre} className="rounded-2xl bg-white border border-rt-line p-5 flex gap-4">
                <span className="w-10 h-10 shrink-0 rounded-full bg-rt-ocre-lt text-rt-canopy grid place-items-center"><Icone size={18} aria-hidden /></span>
                <span><span className="block font-semibold">{i + 1}. {titre}</span><span className="block text-sm text-rt-stone">{texte}</span></span>
              </li>
            )
          })}
        </ol>
      </section>

      {/* ── Circuits (programmes actifs de SITRAC) ─────────────── */}
      {circuits.length > 0 && (
        <section className="max-w-6xl mx-auto px-5 sm:px-6 pt-16">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <h2 className="font-title font-bold text-2xl sm:text-3xl">{tx.circuits_titre}</h2>
              <p className="text-rt-stone mt-1">{tx.circuits_texte}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {circuits.slice(0, 6).map((c) => (
              <Link key={c.id} to={`/portail/demande-devis?circuit=${c.id}`}
                className="group flex flex-col rounded-2xl bg-white border border-rt-line p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-rt-canopy/10 hover:border-rt-canopy/40">
                {c.type_prog && <span className="self-start rounded-full bg-rt-ocre-lt text-rt-ink text-xs font-semibold px-2.5 py-1 mb-3">{c.type_prog}</span>}
                <h3 className="font-title font-semibold text-lg leading-snug">{c.nom}</h3>
                {c.etapes?.length > 0 && (
                  <p className="mt-2 text-sm text-rt-canopy flex items-start gap-1.5">
                    <MapPinned size={15} className="mt-0.5 shrink-0" aria-hidden />
                    <span>{c.etapes.join(' · ')}</span>
                  </p>
                )}
                {c.description && <p className="mt-2 text-sm text-rt-stone leading-relaxed">{c.description}</p>}
                <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rt-canopy">
                  {tx.circuit_cta} <ArrowRight size={16} className="transition group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Contact ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16">
        <div className="rounded-3xl bg-rt-ocre-lt border border-rt-ocre/30 p-7 sm:p-9 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="font-title font-bold text-2xl">{tx.aide_titre}</h2>
            <p className="text-rt-stone mt-1">{tx.aide_texte}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={`mailto:${AGENCE.email}`} className="inline-flex items-center gap-2 rounded-xl bg-white border border-rt-line px-5 py-3 font-semibold text-rt-canopy hover:border-rt-canopy transition">
              <Mail size={18} aria-hidden /> {AGENCE.email}
            </a>
            <a href={`https://wa.me/${AGENCE.whatsapp.replace('+', '')}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-rt-canopy text-white px-5 py-3 font-semibold hover:bg-rt-canopy-dk transition">
              <MessageCircle size={18} aria-hidden /> WhatsApp
            </a>
          </div>
        </div>
      </section>
    </PortailLayout>
  )
}
