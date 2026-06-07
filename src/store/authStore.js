import { create } from 'zustand'
import { authAPI, TokenManager } from '../utils/api'

const DEPT_COLORS = {
  Sales:          '#F5A623',
  Booking:        '#27AE60',
  Finance:        '#2980B9',
  Administration: '#8E44AD',
  Superviseur:    '#2C3E50',
}

const DEPT_REDIRECTS = {
  Sales:          '/sales/destinations',
  Booking:        '/booking/briefings',
  Finance:        '/finance/paiement',
  Administration: '/admin',
  Superviseur:    '/superviseur',
}

function getUserFromStorage() {
  try { return JSON.parse(localStorage.getItem('sitrac_user')) } catch { return null }
}
function saveUserToStorage(u) {
  localStorage.setItem('sitrac_user', JSON.stringify(u))
}

export const useAuthStore = create((set, get) => ({
  user:             getUserFromStorage(),
  loading:          false,
  theme:            localStorage.getItem('sitrac_theme') || 'light',
  sidebarCollapsed: localStorage.getItem('sitrac_sidebar') === 'true',

  // ── Login via API Django ───────────────────────────────────────
  login: async (loginVal, password) => {
    set({ loading: true })
    try {
      const data = await authAPI.login(loginVal.trim().toLowerCase(), password)

      const user = {
        id:         data.user.id,
        login:      data.user.login,
        name:       data.user.nom_complet,
        dept:       data.user.departement,
        email:      data.user.email,
        color:      DEPT_COLORS[data.user.departement] || '#F5A623',
      }

      TokenManager.setTokens(data.access, data.refresh)
      saveUserToStorage(user)
      set({ user, loading: false })

      return { ok: true, redirect: DEPT_REDIRECTS[user.dept] || '/dashboard' }
    } catch (err) {
      set({ loading: false })
      return { ok: false, msg: err.message || 'Login ou mot de passe incorrect.' }
    }
  },

  // ── Logout via API ────────────────────────────────────────────
  logout: async () => {
    try {
      const refresh = TokenManager.getRefresh()
      if (refresh) await authAPI.logout(refresh)
    } catch { /* ignore */ } finally {
      TokenManager.clearTokens()
      set({ user: null })
    }
  },

  // ── Refresh profil depuis l'API ───────────────────────────────
  refreshMe: async () => {
    try {
      const me   = await authAPI.me()
      const user = {
        ...get().user,
        name:  me.nom_complet,
        email: me.email,
        dept:  me.departement,
      }
      saveUserToStorage(user)
      set({ user })
    } catch { /* silence */ }
  },

  // ── Thème ─────────────────────────────────────────────────────
  setTheme: (theme) => {
    localStorage.setItem('sitrac_theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
  initTheme: () => {
    const t = localStorage.getItem('sitrac_theme') || 'light'
    document.documentElement.classList.toggle('dark', t === 'dark')
    set({ theme: t })
  },

  // ── Sidebar ───────────────────────────────────────────────────
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed
    localStorage.setItem('sitrac_sidebar', String(next))
    set({ sidebarCollapsed: next })
  },
}))

export { DEPT_COLORS }
