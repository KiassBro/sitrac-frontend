/**
 * SITRAC — Espace voyageurs Ramartour : mise en page et éléments communs.
 *
 * Une seule plateforme pour les clients :
 *   - partie publique : accueil, demande de devis, connexion, signature d'un devis, retour de paiement ;
 *   - partie connectée : menu latéral (comme l'application de l'agence), voyages, coordonnées…
 *
 * <PortailLayout> choisit seul la bonne présentation :
 *   connecte (défaut) + session ouverte → menu latéral
 *   sinon                                → en-tête public + pied de page
 */
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Compass, Loader, LogOut, Mail, Menu, MessageCircle, Sparkles, UserRound, X,
} from 'lucide-react'
import fondBaobabs from '../assets/Baobab.png'
import { SessionPortail } from './api'
import { useLangue, useT } from './i18n'

export const AGENCE = {
  nom: 'Ramartour Madagascar',
  email: 'info@ramartour.com',
  whatsapp: '+261320213368',
  whatsappAffiche: '+261 32 02 133 68',
}
export const IMAGE_FOND = fondBaobabs
const lienWhatsApp = `https://wa.me/${AGENCE.whatsapp.replace('+', '')}`

// Selon la feuille de style globale, la page défile sur window ou sur <body> : on gère les deux.
const positionDefilement = () => Math.max(window.scrollY || 0, document.documentElement.scrollTop || 0, document.body.scrollTop || 0)
export const remonterEnHaut = () => { window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0 }

/* ── Logo ─────────────────────────────────────────────────────── */
export function Logo({ clair = false, compact = false }) {
  const { t } = useT()
  const [image, setImage] = useState(true)
  return (
    <span className="flex items-center gap-3 min-w-0">
      <span className={`shrink-0 rounded-xl overflow-hidden bg-white shadow-sm ring-1 ${clair ? 'ring-white/20' : 'ring-rt-line'}
                        ${compact ? 'w-9 h-9' : 'w-11 h-11'} grid place-items-center`}>
        {image
          ? <img src="/logo.jpg" alt="" className="w-full h-full object-contain" onError={() => setImage(false)} />
          : <span className="font-title font-extrabold text-rt-canopy text-lg">R</span>}
      </span>
      <span className="min-w-0 leading-tight">
        <span className={`block font-title font-bold tracking-tight truncate ${clair ? 'text-white' : 'text-rt-ink'} ${compact ? 'text-[15px]' : 'text-base'}`}>
          {AGENCE.nom}
        </span>
        <span className={`block text-[11px] uppercase tracking-[0.14em] ${clair ? 'text-white/65' : 'text-rt-stone'}`}>{t('espace')}</span>
      </span>
    </span>
  )
}

export function ChoixLangue({ clair = false }) {
  const { langue, setLangue } = useLangue()
  return (
    <div className={`inline-flex items-center rounded-full p-0.5 text-xs font-semibold ${clair ? 'bg-white/10' : 'bg-rt-mist'}`}
      role="group" aria-label="Language">
      {['en', 'fr'].map((l) => (
        <button key={l} type="button" onClick={() => setLangue(l)} aria-pressed={langue === l}
          className={`px-2.5 py-1 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rt-ocre ${
            langue === l ? (clair ? 'bg-white text-rt-canopy-dk' : 'bg-white text-rt-ink shadow-sm')
                         : (clair ? 'text-white/70 hover:text-white' : 'text-rt-stone hover:text-rt-ink')}`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

/* ── Mise en page ─────────────────────────────────────────────── */
export function PortailLayout({ children, connecte = true, pleineLargeur = false, bandeau = true, large = false }) {
  const session = SessionPortail.get()
  if (connecte && session) return <LayoutClient session={session} large={large}>{children}</LayoutClient>
  return <LayoutPublic pleineLargeur={pleineLargeur} bandeau={bandeau} large={large}>{children}</LayoutPublic>
}

const MENU = [
  { to: '/portail', fin: true, icone: Compass, cle: 'mes_voyages' },
  { to: '/portail/demande-devis', icone: Sparkles, cle: 'demander_devis' },
  { to: '/portail/profil', icone: UserRound, cle: 'profil' },
]

function LayoutClient({ session, large, children }) {
  const { t } = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const [ouvert, setOuvert] = useState(false)
  useEffect(() => { setOuvert(false); remonterEnHaut() }, [location.pathname])
  const deconnexion = () => { SessionPortail.clear(); navigate('/portail') }
  const nom = (session.client?.nom || '').trim()

  const navigation = (
    <nav className="flex flex-col gap-1" aria-label={t('menu')}>
      {MENU.map(({ to, fin, icone: Icone, cle }) => (
        <NavLink key={to} to={to} end={fin}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] transition
            ${isActive ? 'bg-white text-rt-canopy-dk font-semibold shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
          <Icone size={18} aria-hidden className="shrink-0" />
          {t(cle)}
        </NavLink>
      ))}
    </nav>
  )
  const contact = (
    <div className="rounded-2xl bg-white/[0.07] ring-1 ring-white/10 p-4 text-sm">
      <p className="text-white/70 mb-2.5 leading-snug">{t('besoin_aide')}</p>
      <a href={`mailto:${AGENCE.email}`} className="flex items-center gap-2 text-white hover:text-rt-ocre py-1 break-all">
        <Mail size={15} aria-hidden className="shrink-0" /> {AGENCE.email}
      </a>
      <a href={lienWhatsApp} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white hover:text-rt-ocre py-1">
        <MessageCircle size={15} aria-hidden className="shrink-0" /> {AGENCE.whatsappAffiche}
      </a>
    </div>
  )

  return (
    <div className="min-h-screen bg-rt-mist text-rt-ink font-sans lg:flex">
      {/* Menu latéral (ordinateur) */}
      <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 h-screen sticky top-0 overflow-y-auto text-white
                        bg-gradient-to-b from-rt-canopy-dk via-rt-canopy-dk to-rt-canopy relative">
        <img src={IMAGE_FOND} alt="" aria-hidden
          className="absolute inset-x-0 bottom-0 h-72 w-full object-cover opacity-[0.14] pointer-events-none select-none
                     [mask-image:linear-gradient(to_top,black,transparent)]" />
        <div className="relative flex flex-col gap-7 p-6 min-h-full">
          <Link to="/portail" className="block"><Logo clair /></Link>
          {nom && (
            <div className="rounded-2xl bg-white/[0.07] ring-1 ring-white/10 px-4 py-3">
              <p className="text-xs text-white/60">{t('bonjour')}</p>
              <p className="font-title font-semibold truncate">{nom}</p>
            </div>
          )}
          {navigation}
          <div className="mt-auto flex flex-col gap-4">
            {contact}
            <div className="flex items-center justify-between">
              <ChoixLangue clair />
              <button onClick={deconnexion} className="inline-flex items-center gap-1.5 text-sm text-white/75 hover:text-white">
                <LogOut size={15} aria-hidden /> {t('deconnexion')}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Barre du haut (téléphone, tablette) */}
      <header className="lg:hidden sticky top-0 z-30 bg-rt-canopy-dk text-white shadow-md">
        <div className="px-4 h-16 flex items-center justify-between gap-3">
          <Link to="/portail" className="min-w-0"><Logo clair compact /></Link>
          <button onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert} aria-label={t('menu')}
            className="p-2 -mr-2 rounded-lg hover:bg-white/10">
            {ouvert ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {ouvert && (
          <div className="px-4 pb-5 flex flex-col gap-4 animate-fade-in border-t border-white/10 pt-4">
            {navigation}
            {contact}
            <div className="flex items-center justify-between">
              <ChoixLangue clair />
              <button onClick={deconnexion} className="inline-flex items-center gap-1.5 text-sm text-white/80">
                <LogOut size={15} aria-hidden /> {t('deconnexion')}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 min-w-0">
        <div className={`${large ? 'max-w-6xl' : 'max-w-4xl'} mx-auto px-4 sm:px-8 py-7 sm:py-10 animate-fade-up motion-reduce:animate-none`}>{children}</div>
      </main>
    </div>
  )
}

function LayoutPublic({ children, pleineLargeur, bandeau, large }) {
  const { t } = useT()
  const session = SessionPortail.get()
  const location = useLocation()
  const [defile, setDefile] = useState(false)
  useEffect(() => { remonterEnHaut() }, [location.pathname])
  useEffect(() => {
    const f = () => setDefile(positionDefilement() > 8)
    f(); window.addEventListener('scroll', f, { passive: true, capture: true })
    return () => window.removeEventListener('scroll', f, { capture: true })
  }, [])
  const transparent = pleineLargeur && !defile   // accueil : en-tête posé sur la photo

  return (
    <div className="min-h-screen bg-rt-mist text-rt-ink font-sans flex flex-col">
      <header className={`${pleineLargeur ? 'fixed' : 'sticky'} top-0 inset-x-0 z-30 transition-colors duration-300
        ${transparent ? 'bg-transparent' : 'bg-white/90 backdrop-blur border-b border-rt-line shadow-[0_1px_12px_rgba(23,58,44,0.06)]'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-[72px] flex items-center justify-between gap-3">
          <Link to="/portail" className="min-w-0"><Logo clair={transparent} compact /></Link>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <NavLink to="/portail/demande-devis"
              className={({ isActive }) => `hidden md:inline text-sm font-medium transition ${transparent ? 'text-white/85 hover:text-white' : isActive ? 'text-rt-canopy' : 'text-rt-stone hover:text-rt-ink'}`}>
              {t('demander_devis')}
            </NavLink>
            <Link to={session ? '/portail' : '/portail/connexion'}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-2 text-sm font-semibold transition
                ${transparent ? 'bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25' : 'bg-rt-canopy text-white hover:bg-rt-canopy-dk'}`}>
              <UserRound size={15} aria-hidden /> <span className="hidden sm:inline">{t('mon_espace')}</span>
            </Link>
            <ChoixLangue clair={transparent} />
          </div>
        </div>
      </header>

      {!pleineLargeur && bandeau && (
        <div className="relative h-24 sm:h-32 overflow-hidden" aria-hidden>
          <img src={IMAGE_FOND} alt="" className="absolute inset-0 w-full h-full object-cover object-[center_40%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-rt-canopy-dk/90 via-rt-canopy-dk/60 to-rt-canopy-dk/25" />
          <div className={`relative ${large ? 'max-w-6xl' : 'max-w-3xl'} mx-auto px-5 h-full flex items-end pb-4 sm:pb-5`}>
            <p className="text-white/90 text-xs sm:text-sm uppercase tracking-[0.22em] font-semibold">{t('signature_marque')}</p>
          </div>
        </div>
      )}

      <main className={`flex-1 w-full ${pleineLargeur ? '' : `${large ? 'max-w-6xl' : 'max-w-3xl'} mx-auto px-4 sm:px-5 py-8 sm:py-10 animate-fade-up motion-reduce:animate-none`}`}>
        {children}
      </main>
      <PiedDePage />
    </div>
  )
}

export function PiedDePage() {
  const { t } = useT()
  return (
    <footer className="bg-rt-canopy-dk text-white/80">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 grid gap-8 sm:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Logo clair compact />
          <p className="text-sm text-white/60 max-w-xs leading-relaxed">{t('pied_texte')}</p>
        </div>
        <div className="text-sm">
          <p className="font-title font-semibold text-white mb-3">{t('contact_titre')}</p>
          <a href={`mailto:${AGENCE.email}`} className="flex items-center gap-2 py-1 hover:text-rt-ocre break-all">
            <Mail size={15} aria-hidden className="shrink-0" /> {AGENCE.email}
          </a>
          <a href={lienWhatsApp} target="_blank" rel="noreferrer" className="flex items-center gap-2 py-1 hover:text-rt-ocre">
            <MessageCircle size={15} aria-hidden className="shrink-0" /> WhatsApp {AGENCE.whatsappAffiche}
          </a>
        </div>
        <div className="text-sm">
          <p className="font-title font-semibold text-white mb-3">{t('espace')}</p>
          <Link to="/portail/demande-devis" className="block py-1 hover:text-rt-ocre">{t('demander_devis')}</Link>
          <Link to="/portail/connexion" className="block py-1 hover:text-rt-ocre">{t('mon_espace')}</Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="max-w-6xl mx-auto px-5 sm:px-6 py-4 text-xs text-white/50">© {new Date().getFullYear()} {AGENCE.nom}</p>
      </div>
    </footer>
  )
}

/* ── Éléments ─────────────────────────────────────────────────── */
export function Bloc({ titre, action, children, className = '', icone: Icone }) {
  return (
    <section className={`bg-white border border-rt-line/80 rounded-2xl shadow-[0_1px_3px_rgba(23,58,44,0.05),0_10px_28px_-14px_rgba(23,58,44,0.18)] ${className}`}>
      {titre && (
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 pt-5">
          <h2 className="font-title font-semibold text-[17px] text-rt-ink flex items-center gap-2.5">
            {Icone && <span className="w-8 h-8 rounded-lg bg-rt-mist text-rt-canopy grid place-items-center"><Icone size={17} aria-hidden /></span>}
            {titre}
          </h2>
          {action}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}

export function Bouton({ variante = 'principal', className = '', chargement = false, children, ...props }) {
  const styles = {
    principal:  'bg-rt-ocre text-rt-ink shadow-sm hover:brightness-95 hover:shadow active:translate-y-px',
    secondaire: 'bg-white text-rt-canopy border border-rt-canopy/70 hover:bg-rt-mist',
    sombre:     'bg-rt-canopy text-white hover:bg-rt-canopy-dk shadow-sm',
    discret:    'bg-transparent text-rt-canopy hover:underline px-0',
    danger:     'bg-white text-rt-laterite border border-rt-laterite/60 hover:bg-rt-laterite-lt',
  }
  return (
    <button {...props} disabled={props.disabled || chargement}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-rt-canopy focus-visible:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed ${styles[variante]} ${className}`}>
      {chargement && <Loader size={16} className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function Champ({ label, aide, erreur, id, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-rt-ink">{label}</label>
      {children}
      {aide && !erreur && <p className="text-xs text-rt-stone">{aide}</p>}
      {erreur && <p className="text-xs text-rt-laterite" role="alert">{erreur}</p>}
    </div>
  )
}

export const champClasse =
  'w-full rounded-xl border border-rt-line bg-white px-3.5 py-2.5 text-[15px] text-rt-ink placeholder:text-rt-stone/60 transition ' +
  'focus:outline-none focus:border-rt-canopy focus:ring-4 focus:ring-rt-canopy/10'

export function Message({ type = 'info', children }) {
  const s = { info: 'bg-rt-mist border-rt-line', ok: 'bg-rt-mist border-rt-canopy/40', erreur: 'bg-rt-laterite-lt border-rt-laterite/40 text-rt-laterite', attention: 'bg-rt-ocre-lt border-rt-ocre/50' }
  return <div role={type === 'erreur' ? 'alert' : 'status'} className={`border rounded-xl px-4 py-3 text-sm ${s[type]}`}>{children}</div>
}

export function Chargement() {
  const { t } = useT()
  return <p className="flex items-center gap-2 text-rt-stone py-10"><Loader size={18} className="animate-spin" aria-hidden /> {t('chargement')}</p>
}

/** En-tête de page : petit surtitre, titre, texte et action à droite. */
export function EnTetePage({ surtitre, titre, texte, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
      <div className="min-w-0">
        {surtitre && <p className="text-xs uppercase tracking-[0.18em] font-semibold text-rt-ocre mb-1.5">{surtitre}</p>}
        <h1 className="font-title font-bold text-[26px] sm:text-[30px] leading-tight text-rt-ink">{titre}</h1>
        {texte && <p className="text-rt-stone mt-1.5 max-w-xl">{texte}</p>}
      </div>
      {action}
    </div>
  )
}

/**
 * L'itinéraire du voyage, étape par étape — l'élément qui donne son
 * identité à l'espace client : c'est ce que le client achète.
 */
export function Itineraire({ etapes = [] }) {
  if (!etapes.length) return null
  return (
    <ol className="flex flex-wrap items-start gap-y-4" aria-label="Itinerary">
      {etapes.map((e, i) => (
        <li key={`${e.code}-${i}`} className="flex items-start">
          <div className="flex flex-col items-center min-w-[64px] max-w-[110px]">
            <span className={`w-3 h-3 rounded-full border-2 ${i === 0 || i === etapes.length - 1 ? 'bg-rt-ocre border-rt-ocre' : 'bg-white border-rt-canopy'}`} aria-hidden />
            <span className="mt-2 text-[13px] font-medium text-center leading-tight">{e.ville}</span>
          </div>
          {i < etapes.length - 1 && <span className="mt-[5px] w-8 sm:w-12 border-t-2 border-dashed border-rt-canopy/50" aria-hidden />}
        </li>
      ))}
    </ol>
  )
}

/** Zone de signature manuscrite (souris, doigt, stylet) → PNG base64. */
export function ZoneSignature({ onChange }) {
  const { t } = useT()
  const canvas = useRef(null)
  const dessine = useRef(false)
  const [vide, setVide] = useState(true)

  useEffect(() => {
    const c = canvas.current
    const ratio = window.devicePixelRatio || 1
    c.width = c.offsetWidth * ratio
    c.height = c.offsetHeight * ratio
    const ctx = c.getContext('2d')
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1E2A24'
  }, [])

  const point = (ev) => {
    const r = canvas.current.getBoundingClientRect()
    return { x: ev.clientX - r.left, y: ev.clientY - r.top }
  }
  const debut = (ev) => {
    ev.preventDefault()
    canvas.current.setPointerCapture(ev.pointerId)
    dessine.current = true
    const { x, y } = point(ev)
    const ctx = canvas.current.getContext('2d')
    ctx.beginPath(); ctx.moveTo(x, y)
  }
  const trace = (ev) => {
    if (!dessine.current) return
    const { x, y } = point(ev)
    const ctx = canvas.current.getContext('2d')
    ctx.lineTo(x, y); ctx.stroke()
  }
  const fin = () => {
    if (!dessine.current) return
    dessine.current = false
    setVide(false)
    onChange(canvas.current.toDataURL('image/png'))
  }
  const effacer = () => {
    const c = canvas.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
    setVide(true)
    onChange('')
  }

  return (
    <div>
      <div className="relative">
        <canvas ref={canvas} onPointerDown={debut} onPointerMove={trace} onPointerUp={fin} onPointerLeave={fin}
          className="w-full h-36 bg-white border border-rt-line rounded-xl touch-none cursor-crosshair"
          aria-label={t('signature')} role="img" />
        <span className="absolute left-4 right-4 bottom-8 border-b border-rt-line pointer-events-none" aria-hidden />
      </div>
      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-rt-stone">{t('signature_aide')}</p>
        {!vide && <button type="button" onClick={effacer} className="text-xs text-rt-canopy hover:underline">{t('effacer')}</button>}
      </div>
    </div>
  )
}
