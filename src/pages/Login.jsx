import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Lock, LogIn, Eye, EyeOff, Wifi, WifiOff } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [loginVal,  setLoginVal]  = useState('')
  const [passVal,   setPassVal]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [error,     setError]     = useState('')
  const [backendOk, setBackendOk] = useState(null)
  const { login, loading, initTheme, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    initTheme()
    if (user) navigate('/dashboard', { replace: true })
    // Vérification connectivité backend
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/auth/login/`, { method: 'OPTIONS' })
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false))
  }, [])

  const handleLogin = async () => {
    setError('')
    if (!loginVal.trim() || !passVal.trim()) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    const result = await login(loginVal.trim(), passVal.trim())
    if (result.ok) navigate(result.redirect, { replace: true })
    else { setError(result.msg); setPassVal('') }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-5 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-orange/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-brand-green/8 blur-3xl pointer-events-none" />

      <motion.div
        className="w-full max-w-[420px] relative z-10"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
      >
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-modal border border-gray-200 dark:border-gray-800 overflow-hidden">

          {/* En-tête avec logo */}
          <div className="bg-gradient-to-br from-orange to-orange-dark px-10 py-9 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="relative z-10 flex items-center gap-5">
              <img src="/logo.jpg" alt="Ramartour"
                className="w-[72px] h-[72px] rounded-2xl object-cover shadow-lg border-2 border-white/30 flex-shrink-0"
                onError={e => e.target.style.display = 'none'} />
              <div>
                <div className="font-title font-black text-3xl text-white tracking-wider leading-none">SITRAC</div>
                <div className="text-white/80 text-[11px] mt-1.5 leading-tight">
                  Système Informatisé pour le<br />Traitement des Relations Clients
                </div>
                <div className="text-white/90 text-xs font-semibold mt-2">📍 Ramartour Madagascar</div>
              </div>
            </div>
          </div>

          <div className="px-10 py-8">
            {/* Statut backend */}
            {backendOk !== null && (
              <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-5 font-medium
                ${backendOk
                  ? 'bg-green-50 dark:bg-green-900/20 text-brand-green border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-brand-red border border-red-200 dark:border-red-800'}`}>
                {backendOk ? <Wifi size={13} /> : <WifiOff size={13} />}
                {backendOk
                  ? 'Serveur connecté'
                  : 'Serveur inaccessible — démarrez Django : python manage.py runserver'}
              </div>
            )}

            <h2 className="font-title font-bold text-xl text-gray-900 dark:text-white mb-1">Bienvenue 👋</h2>
            <p className="text-sm text-gray-400 mb-6">Connectez-vous à votre espace de travail</p>

            {error && (
              <motion.div
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-brand-red rounded-lg px-4 py-3 text-sm mb-4 flex items-center gap-2"
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              >
                ❌ {error}
              </motion.div>
            )}

            {/* Login */}
            <div className="form-group">
              <label className="form-label">Login</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" value={loginVal}
                  onChange={e => setLoginVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="form-control pl-9" placeholder="Votre identifiant"
                  autoComplete="username" autoFocus
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'} value={passVal}
                  onChange={e => setPassVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="form-control pl-9 pr-10" placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin} disabled={loading}
              className="w-full btn btn-success btn-lg justify-center mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                : <LogIn size={16} />
              }
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>

            <p className="text-center text-xs text-gray-400 mt-6">
              Ramartour Madagascar © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
