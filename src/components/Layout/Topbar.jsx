import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Moon, Sun, Bell, ChevronDown, User, KeyRound, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUiStore } from '../../store/uiStore'

export default function Topbar({ breadcrumb = [] }) {
  const { user, theme, toggleTheme, toggleSidebar, logout } = useAuthStore()
  const { showConfirm } = useUiStore()
  const navigate = useNavigate()
  const [dropOpen, setDropOpen] = useState(false)

  if (!user) return null

  // Badge de notification calculé depuis sessionStorage (set par Notifications.jsx)
  const notifCount = (() => {
    try {
      const read = new Set(JSON.parse(sessionStorage.getItem('sitrac_notif_read') || '[]'))
      // Simple indicateur visuel : si des notifications non lues existent
      return read.size > 0 ? 0 : 1  // 1 = "voir les notifications"
    } catch { return 0 }
  })()

  const handleLogout = () => {
    setDropOpen(false)
    showConfirm({
      icon:'👋', type:'danger', title:'Déconnexion',
      msg:'Êtes-vous sûr de vouloir vous déconnecter de SITRAC ?',
      confirmText:'Oui, déconnecter',
      onConfirm: () => { logout(); navigate('/login') }
    })
  }

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 sticky top-0 z-[200] shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-orange hover:border-orange transition-colors"
        >
          <Menu size={17} />
        </button>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm flex-wrap">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className={i === breadcrumb.length - 1
                ? 'font-semibold text-gray-800 dark:text-gray-200'
                : 'text-gray-400 dark:text-gray-500'
              }>{b}</span>
              {i < breadcrumb.length - 1 && <span className="text-gray-300 dark:text-gray-600 text-xs">›</span>}
            </span>
          ))}
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-orange transition-colors"
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifs */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-orange transition-colors"
        >
          <Bell size={15} />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange rounded-full border-2 border-white dark:border-gray-900" />
          )}
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropOpen(o => !o)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
              style={{ background: user.color }}
            >
              {user.login[0].toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:block">
              {user.name}
            </span>
            <ChevronDown size={13} className="text-gray-400" />
          </button>

          {dropOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="text-xs text-gray-400">Connecté en tant que</div>
                  <div className="font-bold text-sm text-gray-800 dark:text-gray-200">{user.login}</div>
                  <div className="text-xs text-gray-400">{user.dept}</div>
                </div>
                <button
                  onClick={() => { setDropOpen(false); navigate('/profile') }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <User size={15} /> Mon Profil
                </button>
                <button
                  onClick={() => { setDropOpen(false); navigate('/profile?tab=password') }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <KeyRound size={15} /> Changer MDP
                </button>
                <div className="border-t border-gray-100 dark:border-gray-800" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-red hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={15} /> Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
