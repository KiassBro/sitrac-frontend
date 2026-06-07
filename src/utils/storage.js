// ─── LocalStorage helpers ───────────────────────────────────────
export function getData(key, def = null) {
  try {
    const raw = localStorage.getItem('sitrac_' + key)
    return raw ? JSON.parse(raw) : def
  } catch { return def }
}

export function setData(key, val) {
  try { localStorage.setItem('sitrac_' + key, JSON.stringify(val)) } catch {}
}

// ─── Audit log ─────────────────────────────────────────────────
export function logAction(action, table, detail, data = null) {
  const user = getData('auth', null)
  const logs = getData('audit', [])
  logs.unshift({
    id: Date.now() + Math.random(),
    ts: new Date().toISOString(),
    action, table, detail,
    user: user?.login || '?',
    dept: user?.dept  || '?',
    data,
  })
  if (logs.length > 500) logs.length = 500
  setData('audit', logs)
}

// ─── Format helpers ─────────────────────────────────────────────
export function fmt(n) {
  return Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}
export function fmtAr(n) {
  return Number(n || 0).toLocaleString('fr-FR') + ' Ar'
}
export function fmtDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('fr-FR') } catch { return d }
}
export function fmtDateTime(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleString('fr-FR') } catch { return d }
}
export function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return "À l'instant"
  if (m < 60)  return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24)  return `Il y a ${h}h`
  const day = Math.floor(h / 24)
  if (day < 7) return `Il y a ${day} jour${day > 1 ? 's' : ''}`
  return fmtDate(new Date(ts).toISOString())
}
export function today() {
  return new Date().toISOString().split('T')[0]
}
