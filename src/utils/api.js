/**
 * SITRAC — Couche API centrale
 * Gestion JWT auto-refresh, intercepteurs, erreurs
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

// ─── Gestion des tokens ────────────────────────────────────────
export const TokenManager = {
  getAccess:    ()  => localStorage.getItem('sitrac_access'),
  getRefresh:   ()  => localStorage.getItem('sitrac_refresh'),
  setAccess:    (t) => localStorage.setItem('sitrac_access', t),
  setRefresh:   (t) => localStorage.setItem('sitrac_refresh', t),
  setTokens:    (access, refresh) => {
    localStorage.setItem('sitrac_access',  access)
    localStorage.setItem('sitrac_refresh', refresh)
  },
  clearTokens:  ()  => {
    localStorage.removeItem('sitrac_access')
    localStorage.removeItem('sitrac_refresh')
    localStorage.removeItem('sitrac_user')
  },
}

// ─── Refresh silencieux ────────────────────────────────────────
let refreshingPromise = null

async function refreshAccessToken() {
  if (refreshingPromise) return refreshingPromise

  refreshingPromise = (async () => {
    const refresh = TokenManager.getRefresh()
    if (!refresh) throw new Error('No refresh token')

    const res = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) {
      TokenManager.clearTokens()
      window.location.href = '/login'
      throw new Error('Session expirée')
    }
    const data = await res.json()
    TokenManager.setAccess(data.access)
    if (data.refresh) TokenManager.setRefresh(data.refresh)
    return data.access
  })()

  refreshingPromise.finally(() => { refreshingPromise = null })
  return refreshingPromise
}

// ─── Requête centrale ──────────────────────────────────────────
export async function apiFetch(endpoint, options = {}, retry = true) {
  const url     = `${BASE_URL}${endpoint}`
  const token   = TokenManager.getAccess()

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  }

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body)
  }

  let response = await fetch(url, config)

  // Token expiré → refresh et retry
  if (response.status === 401 && retry) {
    try {
      await refreshAccessToken()
      return apiFetch(endpoint, options, false)
    } catch {
      TokenManager.clearTokens()
      window.location.href = '/login'
      throw new Error('Session expirée — redirection login')
    }
  }

  // Erreur serveur
  if (!response.ok) {
    let errorData
    try { errorData = await response.json() } catch { errorData = { detail: 'Erreur serveur' } }

    const msg = errorData.detail
      || Object.values(errorData).flat().join(' ')
      || `Erreur HTTP ${response.status}`

    const err = new Error(msg)
    err.status = response.status
    err.data   = errorData
    throw err
  }

  // 204 No Content
  if (response.status === 204) return null

  return response.json()
}

// ─── Helpers HTTP ──────────────────────────────────────────────
export const api = {
  get:    (url, opts = {}) => apiFetch(url, { method: 'GET',    ...opts }),
  post:   (url, body, opts = {}) => apiFetch(url, { method: 'POST',   body, ...opts }),
  put:    (url, body, opts = {}) => apiFetch(url, { method: 'PUT',    body, ...opts }),
  patch:  (url, body, opts = {}) => apiFetch(url, { method: 'PATCH',  body, ...opts }),
  delete: (url, opts = {}) => apiFetch(url, { method: 'DELETE', ...opts }),
}

// ─── Téléchargement de fichier authentifié ──────────────────────
// BUG CORRIGÉ : l'export CSV du Superviseur utilisait auparavant
// `window.open(url)`, une navigation de navigateur classique qui n'envoie
// PAS l'en-tête Authorization Bearer. Contre un endpoint protégé par JWT,
// cela renvoyait un 401 au lieu du fichier. downloadFile fait un vrai
// fetch authentifié puis déclenche le téléchargement via un blob.
export async function downloadFile(endpoint, filename) {
  const token = TokenManager.getAccess()
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    let msg = `Erreur HTTP ${res.status}`
    try { msg = (await res.json()).detail || msg } catch { /* réponse non-JSON */ }
    throw new Error(msg)
  }
  const blob = await res.blob()
  const url  = window.URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

// ─── Upload de fichier (multipart) authentifié ──────────────────
export async function uploadFile(endpoint, file) {
  const token = TokenManager.getAccess()
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    // Ne PAS fixer Content-Type ici : le navigateur doit générer lui-même
    // le boundary multipart/form-data.
    body: formData,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail || `Erreur HTTP ${res.status}`)
  }
  return data
}

// ─── API par domaine ───────────────────────────────────────────
export const authAPI = {
  login:          (login, password)  => api.post('/auth/login/', { login, password }),
  logout:         (refresh)          => api.post('/auth/logout/', { refresh }),
  me:             ()                 => api.get('/auth/me/'),
  changePassword: (data)             => api.post('/auth/change-password/', data),
  getUtilisateurs:(params = '')      => api.get(`/auth/utilisateurs/${params}`),
  createUser:     (data)             => api.post('/auth/utilisateurs/', data),
  updateUser:     (id, data)         => api.patch(`/auth/utilisateurs/${id}/`, data),
  deleteUser:     (id)               => api.delete(`/auth/utilisateurs/${id}/`),
  toggleUserActif:(id)               => api.patch(`/auth/utilisateurs/${id}/toggle-actif/`),
  resetPassword:  (id, pwd)          => api.post(`/auth/utilisateurs/${id}/reset-password/`, { new_password: pwd }),
  getSessions:    ()                 => api.get('/auth/sessions/'),
}

export const salesAPI = {
  // Destinations
  getDestinations: (params = '') => api.get(`/sales/destinations/${params}`),
  createDest:      (data)        => api.post('/sales/destinations/', data),
  updateDest:      (id, data)    => api.patch(`/sales/destinations/${id}/`, data),
  deleteDest:      (id)          => api.delete(`/sales/destinations/${id}/`),
  toggleDest:      (id)          => api.patch(`/sales/destinations/${id}/toggle-actif/`),

  // Programmes
  getProgrammes:   (params = '') => api.get(`/sales/programmes/${params}`),
  createProg:      (data)        => api.post('/sales/programmes/', data),
  updateProg:      (id, data)    => api.patch(`/sales/programmes/${id}/`, data),
  deleteProg:      (id)          => api.delete(`/sales/programmes/${id}/`),
  toggleProg:      (id)          => api.patch(`/sales/programmes/${id}/toggle-actif/`),

  // Clients Leaders
  getClient:       (id) => api.get(`/sales/clients/${id}/`),
  getClients:      (params = '') => api.get(`/sales/clients/${params}`),
  createClient:    (data)        => api.post('/sales/clients/', data),
  updateClient:    (id, data)    => api.patch(`/sales/clients/${id}/`, data),
  deleteClient:    (id)          => api.delete(`/sales/clients/${id}/`),
  getPax:          (clientId)    => api.get(`/sales/clients/${clientId}/pax/`),
  addPax:          (clientId, data) => api.post(`/sales/clients/${clientId}/pax/`, data),
  deletePax:       (clientId, paxId) => api.delete(`/sales/clients/${clientId}/pax/${paxId}/`),

  // Programme Clients
  getPCs:          (params = '') => api.get(`/sales/programme-clients/${params}`),
  createPC:        (data)        => api.post('/sales/programme-clients/', data),
  updatePC:        (id, data)    => api.patch(`/sales/programme-clients/${id}/`, data),
  deletePC:        (id)          => api.delete(`/sales/programme-clients/${id}/`),

  // Cotation
  getCotation:     (pcId)        => api.get(`/sales/programme-clients/${pcId}/cotation/`),
  saveCotation:    (pcId, data, exists) =>
    exists ? api.put(`/sales/programme-clients/${pcId}/cotation/`, data)
           : api.post(`/sales/programme-clients/${pcId}/cotation/`, data),
  // RG 31/32 : Export/Import CSV des lignes de cotation
  exportCotationCsv: (pcId) => downloadFile(`/sales/programme-clients/${pcId}/cotation/export-csv/`, `cotation_pc${pcId}.csv`),
  importCotationCsv: (pcId, file) => uploadFile(`/sales/programme-clients/${pcId}/cotation/import-csv/`, file),
  // RG 15 : verrouillage après validation
  validerCotation:   (pcId) => api.post(`/sales/programme-clients/${pcId}/cotation/valider/`),
  devaliderCotation: (pcId) => api.post(`/sales/programme-clients/${pcId}/cotation/devalider/`),
  // Nouvelle fonctionnalité : historique des versions de cotation
  getCotationHistorique: (pcId) => api.get(`/sales/programme-clients/${pcId}/cotation/historique/`),

  // Facture Pro
  getFacturePro:   (pcId)        => api.get(`/sales/programme-clients/${pcId}/facture-pro/`),
  saveFacturePro:  (pcId, data, exists) =>
    exists ? api.put(`/sales/programme-clients/${pcId}/facture-pro/`, data)
           : api.post(`/sales/programme-clients/${pcId}/facture-pro/`, data),
  // RG 15 : verrouillage après validation
  validerFacturePro:   (pcId) => api.post(`/sales/programme-clients/${pcId}/facture-pro/valider/`),
  devaliderFacturePro: (pcId) => api.post(`/sales/programme-clients/${pcId}/facture-pro/devalider/`),

  // ── Cotation Libre ──────────────────────────────────────────
  getCotationsLibres: (params = '') => api.get(`/sales/cotations-libres/${params}`),
  createCotLibre:     (data)        => api.post('/sales/cotations-libres/', data),
  updateCotLibre:     (id, data)    => api.put(`/sales/cotations-libres/${id}/`, data),
  deleteCotLibre:     (id)          => api.delete(`/sales/cotations-libres/${id}/`),

  // ── Facture Pro Libre ───────────────────────────────────────
  getFPLibres:   (params = '') => api.get(`/sales/factures-pro-libres/${params}`),
  createFPLibre: (data)        => api.post('/sales/factures-pro-libres/', data),
  updateFPLibre: (id, data)    => api.put(`/sales/factures-pro-libres/${id}/`, data),
  deleteFPLibre: (id)          => api.delete(`/sales/factures-pro-libres/${id}/`),
}

export const bookingAPI = {
  getDossiersVente: (params = '') => api.get(`/booking/dossiers-vente/${params}`),
  getBrieffings:    (params = '') => api.get(`/booking/brieffings/${params}`),
  createBrieffing:  (data)        => api.post('/booking/brieffings/', data),
  updateBrieffing:  (id, data)    => api.put(`/booking/brieffings/${id}/`, data),
  deleteBrieffing:  (id)          => api.delete(`/booking/brieffings/${id}/`),
  // RG 31/32 : Export/Import CSV des lignes de brieffing
  exportBrieffingCsv: (id) => downloadFile(`/booking/brieffings/${id}/export-csv/`, `brieffing_${id}.csv`),
  importBrieffingCsv: (id, file) => uploadFile(`/booking/brieffings/${id}/import-csv/`, file),

  getProvisions:    (params = '') => api.get(`/booking/provisions/${params}`),
  createProvision:  (data)        => api.post('/booking/provisions/', data),
  updateProvision:  (id, data)    => api.put(`/booking/provisions/${id}/`, data),
  // RG 31/32 : Export/Import CSV des lignes de provision
  exportProvisionCsv: (id) => downloadFile(`/booking/provisions/${id}/export-csv/`, `provision_${id}.csv`),
  importProvisionCsv: (id, file) => uploadFile(`/booking/provisions/${id}/import-csv/`, file),
}

export const financeAPI = {
  getDossiersVente:    (p = '') => api.get(`/finance/dossiers-vente/${p}`),
  getDossiersBooking:  (p = '') => api.get(`/finance/dossiers-booking/${p}`),
  getFacturesDef:      (p = '') => api.get(`/finance/factures-definitives/${p}`),
  createFactureDef:    (data)   => api.post('/finance/factures-definitives/', data),
  updateFactureDef:    (id, d)  => api.put(`/finance/factures-definitives/${id}/`, d),
  envoyerFactureDefEmail: (id, email) => api.post(`/finance/factures-definitives/${id}/envoyer-email/`, email ? { email } : {}),
  getPaiements:        (p = '') => api.get(`/finance/paiements/${p}`),
  createPaiement:      (data)   => api.post('/finance/paiements/', data),
  deletePaiement:      (id)     => api.delete(`/finance/paiements/${id}/`),
  getResumePaiements:  (pcId)   => api.get(`/finance/paiements/resume/${pcId}/`),
  getClotures:         (p = '') => api.get(`/finance/clotures/${p}`),
  createCloture:       (data)   => api.post('/finance/clotures/', data),
  updateCloture:     (id, data) => api.put(`/finance/clotures/${id}/`, data),
  getRecus:            (p = '') => api.get(`/finance/recus/${p}`),
  createRecu:          (data)   => api.post('/finance/recus/', data),
}

export const superviseurAPI = {
  getLogs:        (params = '') => api.get(`/superviseur/audit-logs/${params}`),
  getStats:       ()            => api.get('/superviseur/audit-logs/stats/'),
  // BUG CORRIGÉ : renvoyait auparavant une URL brute destinée à window.open(),
  // ce qui n'envoyait pas le token JWT et échouait avec 401. downloadFile()
  // fait un fetch authentifié puis déclenche le téléchargement.
  exportCsv:      (params = '')  => downloadFile(`/superviseur/audit-logs/export-csv/${params}`, 'sitrac_audit.csv'),
  getTables:      ()            => api.get('/superviseur/audit-logs/tables/'),
  getUsers:       ()            => api.get('/superviseur/audit-logs/utilisateurs/'),
  getConstantes:  ()            => api.get('/superviseur/constantes/'),
  createConstante:(data)        => api.post('/superviseur/constantes/', data),
  updateConstante:(id, data)    => api.patch(`/superviseur/constantes/${id}/`, data),
  getConstanteByKey: (cle)      => api.get(`/superviseur/constantes/par-cle/?cle=${cle}`),

  // Notifications persistantes (RG 28, 39, 40)
  getNotifications:  ()         => api.get('/superviseur/notifications/'),
  markNotifRead:     (id)       => api.post('/superviseur/notifications/mark-read/', { id }),
  markAllNotifsRead: ()         => api.post('/superviseur/notifications/mark-all-read/'),

  // Historique des taux de change (RG 35)
  getTauxChangeHistorique: (params = '') => api.get(`/superviseur/taux-change/${params}`),
  getTauxChangeCourant:    ()            => api.get('/superviseur/taux-change/courant/'),
  createTauxChange:        (data)        => api.post('/superviseur/taux-change/', data),

  // Tableau de bord KPI
  getKpiDashboard: (annee = '') => api.get(`/superviseur/kpi/${annee ? `?annee=${annee}` : ''}`),
}


export const chatbotAPI = {
  send: (messages) => api.post('/chatbot/', { messages }),
}