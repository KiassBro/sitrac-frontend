import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Lock, Eye, EyeOff, ArrowRight, FileText, Briefcase, Wallet, AlertTriangle,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import fondBaobabs from '../assets/Baobab.webp'

// Messages qui défilent sur l'image (fonctionnalités réelles de SITRAC)
const MESSAGES = [
  { titre: 'Chaque voyage commence par une relation client soignée.',
    texte: 'Dossiers clients, programmes et suivi réunis dans un seul espace.' },
  { titre: 'Du premier devis au carnet de route.',
    texte: 'Cotations, factures pro, vouchers et documents de voyage, sans ressaisie.' },
  { titre: 'Sales, Booking et Finance, enfin connectés.',
    texte: 'Chaque département voit ce qui le concerne, au bon moment.' },
]
const DUREE_MESSAGE = 6000

const ATOUTS = [
  { icone: FileText,  libelle: 'Devis & factures' },
  { icone: Briefcase, libelle: 'Dossiers & briefings' },
  { icone: Wallet,    libelle: 'Paiements & relances' },
]

export default function Login() {
  const navigate           = useNavigate()
  const { login: doLogin } = useAuthStore()
  const [form, setForm]    = useState({ login: '', password: '', remember: false })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [majuscules, setMajuscules] = useState(false)
  const [indice, setIndice] = useState(0)

  // Défilement des messages sur l'image
  useEffect(() => {
    const t = setInterval(() => setIndice(i => (i + 1) % MESSAGES.length), DUREE_MESSAGE)
    return () => clearInterval(t)
  }, [indice])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.login || !form.password) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    setLoading(true)
    try {
      // doLogin ne lève pas d'erreur : il renvoie { ok, msg }
      const res = await doLogin(form.login, form.password)
      if (res.ok) navigate('/dashboard')
      else toast.error(res.msg || 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  const verifierMajuscules = (e) => {
    if (e.getModifierState) setMajuscules(e.getModifierState('CapsLock'))
  }

  const message = MESSAGES[indice]

  return (
    <>
      <style>{STYLES}</style>

      <div className="lg-page">

        {/* ═══════════════ IMAGE + TEXTES ANIMÉS ═══════════════ */}
        <section className="lg-visuel" aria-label="Ramartour Madagascar">
          <div className="lg-visuel-image" style={{ backgroundImage: `url(${fondBaobabs})` }}/>
          <div className="lg-visuel-voile"/>

          <div className="lg-visuel-haut lg-entree" style={{ '--delai': '0.1s' }}>
            <span className="lg-pastille">
              <span className="lg-pastille-point"/>
              SITRAC · Version 2.0
            </span>
          </div>

          <div className="lg-visuel-contenu">
            <p className="lg-surtitre lg-entree" style={{ '--delai': '0.25s' }}>
              Ramartour Madagascar<span className="lg-surtitre-suite"> · Agence de tourisme</span>
            </p>

            <div className="lg-rotation" aria-live="polite">
              <h1 key={`t${indice}`} className="lg-titre">{message.titre}</h1>
              <p  key={`p${indice}`} className="lg-texte">{message.texte}</p>
            </div>

            <ul className="lg-atouts">
              {ATOUTS.map((a, i) => {
                const Icone = a.icone
                return (
                  <li key={a.libelle} className="lg-atout lg-entree" style={{ '--delai': `${0.6 + i * 0.12}s` }}>
                    <Icone size={14} strokeWidth={2}/> {a.libelle}
                  </li>
                )
              })}
            </ul>

            <div className="lg-indicateurs">
              {MESSAGES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`lg-indicateur ${i === indice ? 'actif' : ''}`}
                  onClick={() => setIndice(i)}
                  aria-label={`Message ${i + 1}`}
                >
                  <span key={i === indice ? `on${indice}` : 'off'} className="lg-indicateur-barre"
                    style={{ animationDuration: `${DUREE_MESSAGE}ms` }}/>
                </button>
              ))}
            </div>
          </div>

          <p className="lg-visuel-signature lg-entree" style={{ '--delai': '0.9s' }}>
            Système Informatisé pour le Traitement des Relations Clients
          </p>
        </section>

        {/* ═══════════════ FORMULAIRE ═══════════════ */}
        <main className="lg-panneau">
          <div className="lg-carte">

            <div className="lg-logo lg-entree" style={{ '--delai': '0.15s' }}>
              <img
                src="/logo.jpg"
                alt="Ramartour Madagascar"
                onError={e => { e.currentTarget.parentElement.classList.add('lg-logo-absent') }}
              />
              <span className="lg-logo-secours">Ramartour</span>
            </div>

            <div className="lg-entete lg-entree" style={{ '--delai': '0.25s' }}>
              <h2>Bon retour parmi nous</h2>
              <p>Connectez-vous à votre espace SITRAC</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Identifiant */}
              <div className="lg-champ lg-entree" style={{ '--delai': '0.35s' }}>
                <label htmlFor="lg-login">Identifiant</label>
                <div className="lg-saisie">
                  <User size={17} strokeWidth={1.8} className="lg-saisie-icone"/>
                  <input
                    id="lg-login"
                    type="text"
                    placeholder="Votre identifiant"
                    value={form.login}
                    onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="lg-champ lg-entree" style={{ '--delai': '0.45s' }}>
                <div className="lg-champ-ligne">
                  <label htmlFor="lg-password">Mot de passe</label>
                  <button
                    type="button"
                    className="lg-lien"
                    onClick={() => toast('Contactez l\'Administration pour réinitialiser votre mot de passe.')}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="lg-saisie">
                  <Lock size={17} strokeWidth={1.8} className="lg-saisie-icone"/>
                  <input
                    id="lg-password"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Votre mot de passe"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    onKeyUp={verifierMajuscules}
                    onKeyDown={verifierMajuscules}
                    onBlur={() => setMajuscules(false)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="lg-oeil"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPwd ? <EyeOff size={17} strokeWidth={1.8}/> : <Eye size={17} strokeWidth={1.8}/>}
                  </button>
                </div>
                {majuscules && (
                  <p className="lg-alerte"><AlertTriangle size={13}/> Verrouillage des majuscules activé</p>
                )}
              </div>

              {/* Rester connecté */}
              <label className="lg-case lg-entree" style={{ '--delai': '0.55s' }}>
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))}
                />
                <span>Rester connecté</span>
              </label>

              {/* Bouton */}
              <button type="submit" className="lg-bouton lg-entree" style={{ '--delai': '0.65s' }} disabled={loading}>
                {loading ? (
                  <><span className="lg-roue"/> Vérification…</>
                ) : (
                  <>Se connecter <ArrowRight size={17} strokeWidth={2.5} className="lg-bouton-fleche"/></>
                )}
              </button>
            </form>

            <p className="lg-pied lg-entree" style={{ '--delai': '0.8s' }}>
              © {new Date().getFullYear()} Ramartour Madagascar · Usage interne uniquement
            </p>
          </div>
        </main>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Styles de la page (préfixe lg- pour ne rien toucher au reste de l'application)
// ─────────────────────────────────────────────────────────────────
const STYLES = `
  .lg-page {
    --orange: #F5A623;
    --orange-fonce: #E8850A;
    --encre: #111827;
    --gris: #6B7280;
    --bord: #E5E7EB;
    position: fixed; inset: 0;
    display: flex;
    background: #F7F7F5;
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    color: var(--encre);
    overflow: hidden;
  }

  /* ── Entrées animées ─────────────────────────────── */
  .lg-entree {
    opacity: 0;
    animation: lg-monter .8s cubic-bezier(.2,.7,.2,1) forwards;
    animation-delay: var(--delai, 0s);
  }
  @keyframes lg-monter {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: none; }
  }

  /* ── Partie gauche : image ───────────────────────── */
  .lg-visuel {
    position: relative;
    flex: 1 1 58%;
    min-width: 0;
    overflow: hidden;
    color: #fff;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 48px 56px;
    isolation: isolate;
  }
  .lg-visuel-image {
    position: absolute; inset: -2%;
    background-size: cover;
    background-position: 60% center;
    z-index: -2;
    animation: lg-zoom 28s ease-in-out infinite alternate;
    will-change: transform;
  }
  @keyframes lg-zoom {
    from { transform: scale(1.02) translate3d(0, 0, 0); }
    to   { transform: scale(1.12) translate3d(-1.5%, -1%, 0); }
  }
  .lg-visuel-voile {
    position: absolute; inset: 0; z-index: -1;
    background:
      linear-gradient(180deg, rgba(10,12,24,.45) 0%, rgba(10,12,24,0) 28%),
      linear-gradient(90deg, rgba(10,10,20,.35) 0%, rgba(10,10,20,0) 60%),
      linear-gradient(0deg, rgba(10,10,20,.88) 0%, rgba(10,10,20,.55) 34%, rgba(10,10,20,0) 64%);
  }
  .lg-visuel-haut { position: absolute; top: 40px; left: 56px; }
  .lg-pastille {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 14px;
    border-radius: 999px;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.22);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    font-size: 11.5px; font-weight: 600; letter-spacing: 1.4px; text-transform: uppercase;
  }
  .lg-pastille-point {
    width: 7px; height: 7px; border-radius: 50%;
    background: #4ADE80;
    box-shadow: 0 0 0 0 rgba(74,222,128,.6);
    animation: lg-pouls 2.4s infinite;
  }
  @keyframes lg-pouls {
    0%   { box-shadow: 0 0 0 0 rgba(74,222,128,.55); }
    70%  { box-shadow: 0 0 0 9px rgba(74,222,128,0); }
    100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
  }

  .lg-visuel-contenu { max-width: 600px; }
  .lg-surtitre {
    display: flex; align-items: center; gap: 12px;
    margin: 0 0 18px;
    font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;
    color: rgba(255,255,255,.92);
    text-shadow: 0 1px 12px rgba(0,0,0,.45);
  }
  .lg-surtitre::before {
    content: ''; flex: 0 0 auto; width: 34px; height: 2px; border-radius: 2px;
    background: var(--orange);
  }
  .lg-rotation { min-height: 168px; }
  .lg-titre {
    margin: 0 0 14px;
    font-family: 'Montserrat', 'Segoe UI', sans-serif;
    font-size: clamp(28px, 3.1vw, 44px);
    line-height: 1.12;
    font-weight: 800;
    letter-spacing: -.5px;
    text-shadow: 0 2px 24px rgba(0,0,0,.25);
    animation: lg-message .9s cubic-bezier(.2,.7,.2,1) both;
  }
  .lg-texte {
    margin: 0;
    font-size: 16px; line-height: 1.6;
    color: rgba(255,255,255,.82);
    max-width: 480px;
    animation: lg-message .9s cubic-bezier(.2,.7,.2,1) .15s both;
  }
  @keyframes lg-message {
    from { opacity: 0; transform: translateY(18px); filter: blur(6px); }
    to   { opacity: 1; transform: none; filter: blur(0); }
  }

  .lg-atouts { list-style: none; margin: 26px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 10px; }
  .lg-atout {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 14px;
    border-radius: 10px;
    background: rgba(255,255,255,.10);
    border: 1px solid rgba(255,255,255,.18);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    font-size: 13px; font-weight: 500;
    transition: background .2s, transform .2s;
  }
  .lg-atout svg { color: var(--orange); }
  .lg-atout:hover { background: rgba(255,255,255,.18); transform: translateY(-2px); }

  .lg-indicateurs { display: flex; gap: 8px; margin-top: 30px; }
  .lg-indicateur {
    position: relative; width: 34px; height: 4px; padding: 0;
    border: none; border-radius: 4px; cursor: pointer; overflow: hidden;
    background: rgba(255,255,255,.28);
    transition: width .35s ease;
  }
  .lg-indicateur.actif { width: 56px; }
  .lg-indicateur-barre {
    position: absolute; inset: 0; width: 0;
    background: var(--orange); border-radius: 4px;
  }
  .lg-indicateur.actif .lg-indicateur-barre { animation: lg-progression linear forwards; }
  @keyframes lg-progression { from { width: 0; } to { width: 100%; } }

  .lg-visuel-signature {
    margin: 34px 0 0;
    padding-top: 18px;
    border-top: 1px solid rgba(255,255,255,.14);
    font-size: 12.5px; color: rgba(255,255,255,.6);
    letter-spacing: .3px;
  }

  /* ── Partie droite : formulaire ──────────────────── */
  .lg-panneau {
    flex: 0 0 min(500px, 42%);
    display: flex; align-items: center; justify-content: center;
    padding: 40px 56px;
    background: #fff;
    overflow-y: auto;
    position: relative;
    box-shadow: -24px 0 60px rgba(17,24,39,.08);
  }
  .lg-panneau::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, var(--orange), var(--orange-fonce), var(--orange));
    background-size: 200% 100%;
    animation: lg-reflet 6s linear infinite;
  }
  @keyframes lg-reflet { from { background-position: 0% 0; } to { background-position: 200% 0; } }

  .lg-carte { width: 100%; max-width: 380px; }

  .lg-logo {
    display: flex; justify-content: center;
    margin: 0 auto 26px;
  }
  .lg-logo img {
    width: 132px; height: auto;
    display: block;
    animation: lg-flotter 6s ease-in-out infinite;
  }
  @keyframes lg-flotter {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-4px); }
  }
  .lg-logo-secours { display: none; }
  .lg-logo-absent img { display: none; }
  .lg-logo-absent .lg-logo-secours {
    display: block;
    font-family: 'Montserrat', sans-serif; font-size: 28px; font-weight: 800; color: var(--orange-fonce);
  }

  .lg-entete { text-align: center; margin-bottom: 30px; }
  .lg-entete h2 {
    margin: 0 0 6px;
    font-family: 'Montserrat', 'Segoe UI', sans-serif;
    font-size: 24px; font-weight: 800; letter-spacing: -.3px;
  }
  .lg-entete p { margin: 0; font-size: 14px; color: var(--gris); }

  .lg-champ { margin-bottom: 18px; }
  .lg-champ label, .lg-champ-ligne label {
    display: block; margin-bottom: 8px;
    font-size: 13px; font-weight: 600; color: #374151;
  }
  .lg-champ-ligne { display: flex; justify-content: space-between; align-items: baseline; }
  .lg-lien {
    background: none; border: none; padding: 0; cursor: pointer;
    font-size: 12.5px; font-weight: 600; color: var(--orange-fonce);
    transition: color .15s;
  }
  .lg-lien:hover { color: #B45309; text-decoration: underline; }

  .lg-saisie { position: relative; }
  .lg-saisie-icone {
    position: absolute; left: 15px; top: 50%; transform: translateY(-50%);
    color: #9CA3AF; pointer-events: none; transition: color .2s;
  }
  .lg-saisie input {
    width: 100%; box-sizing: border-box;
    padding: 14px 46px 14px 46px;
    border: 1.5px solid var(--bord);
    border-radius: 12px;
    background: #F9FAFB;
    font-size: 15px; font-family: inherit; color: var(--encre);
    outline: none;
    transition: border-color .2s, box-shadow .2s, background .2s;
  }
  .lg-saisie input::placeholder { color: #A8AEB9; }
  .lg-saisie input:hover { border-color: #D1D5DB; }
  .lg-saisie input:focus {
    border-color: var(--orange);
    background: #fff;
    box-shadow: 0 0 0 4px rgba(245,166,35,.16);
  }
  .lg-saisie:focus-within .lg-saisie-icone { color: var(--orange-fonce); }
  .lg-oeil {
    position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
    display: flex; align-items: center; justify-content: center;
    width: 34px; height: 34px;
    background: none; border: none; border-radius: 8px; cursor: pointer;
    color: #9CA3AF; transition: color .15s, background .15s;
  }
  .lg-oeil:hover { color: #374151; background: #F3F4F6; }

  .lg-alerte {
    display: flex; align-items: center; gap: 6px;
    margin: 8px 0 0; font-size: 12.5px; color: #B45309;
    animation: lg-monter .3s ease both;
  }

  .lg-case {
    display: inline-flex; align-items: center; gap: 10px;
    margin: 4px 0 26px; cursor: pointer;
    font-size: 13.5px; color: #4B5563; user-select: none;
  }
  .lg-case input { width: 17px; height: 17px; accent-color: var(--orange); cursor: pointer; }

  .lg-bouton {
    position: relative; overflow: hidden;
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 15px 20px;
    border: none; border-radius: 12px; cursor: pointer;
    background: linear-gradient(135deg, #F7B23B 0%, var(--orange) 45%, var(--orange-fonce) 100%);
    color: #1C1C1C;
    font-family: 'Montserrat', 'Segoe UI', sans-serif;
    font-size: 14.5px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase;
    box-shadow: 0 10px 24px -8px rgba(232,133,10,.6);
    transition: transform .15s, box-shadow .2s, filter .2s;
  }
  .lg-bouton::after {
    content: ''; position: absolute; top: 0; left: -60%;
    width: 40%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
    transform: skewX(-20deg);
    transition: left .6s ease;
  }
  .lg-bouton:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 28px -8px rgba(232,133,10,.7); }
  .lg-bouton:hover:not(:disabled)::after { left: 120%; }
  .lg-bouton:active:not(:disabled) { transform: translateY(1px); }
  .lg-bouton:disabled { cursor: not-allowed; filter: grayscale(.4) brightness(.95); box-shadow: none; }
  .lg-bouton-fleche { transition: transform .2s; }
  .lg-bouton:hover .lg-bouton-fleche { transform: translateX(4px); }
  .lg-roue {
    width: 17px; height: 17px; border-radius: 50%;
    border: 2px solid rgba(0,0,0,.18); border-top-color: #1C1C1C;
    animation: lg-tourner .7s linear infinite;
  }
  @keyframes lg-tourner { to { transform: rotate(360deg); } }

  .lg-pied { margin: 34px 0 0; text-align: center; font-size: 11.5px; color: #9CA3AF; }

  /* ── Tablette ─────────────────────────────────────── */
  @media (max-width: 1100px) {
    .lg-visuel { padding: 40px; }
    .lg-visuel-haut { left: 40px; top: 32px; }
    .lg-panneau { padding: 40px 36px; }
  }

  /* ── Mobile : image en bandeau, formulaire en carte ─ */
  @media (max-width: 860px) {
    .lg-page { position: static; flex-direction: column; min-height: 100vh; min-height: 100dvh; overflow: visible; }
    .lg-visuel {
      flex: 0 0 auto;
      min-height: 300px; height: 38vh;
      padding: 28px 24px 52px;
    }
    .lg-visuel-haut { top: 20px; left: 24px; }
    .lg-surtitre { margin-bottom: 10px; font-size: 10.5px; letter-spacing: 2px; }
    .lg-surtitre::before { width: 22px; }
    .lg-surtitre-suite { display: none; }
    .lg-rotation { min-height: 0; }
    .lg-titre { font-size: 23px; margin-bottom: 0; }
    .lg-texte, .lg-atouts, .lg-visuel-signature { display: none; }
    .lg-indicateurs { margin-top: 16px; }
    .lg-panneau {
      flex: 1 0 auto;
      margin-top: -28px;
      border-radius: 26px 26px 0 0;
      padding: 32px 24px 28px;
      box-shadow: 0 -12px 40px rgba(17,24,39,.12);
      z-index: 1;
    }
    .lg-panneau::before { display: none; }
    .lg-logo { margin-bottom: 18px; }
    .lg-logo img { width: 112px; }
    .lg-entete { margin-bottom: 24px; }
    .lg-entete h2 { font-size: 21px; }
    .lg-saisie input { font-size: 16px; }   /* évite le zoom automatique sur iPhone */
  }

  /* ── Animations réduites (préférence du système) ─── */
  @media (prefers-reduced-motion: reduce) {
    .lg-page *, .lg-page *::before, .lg-page *::after {
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: .01ms !important;
    }
    .lg-visuel-image { animation: none; }
  }
`