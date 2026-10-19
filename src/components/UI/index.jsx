export { default as Modal }          from './Modal'
import { Search, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
export { default as ConfirmDialog }  from './ConfirmDialog'

// ── Toggle switch ──────────────────────────────────────────────
export function Toggle({ checked, onChange, label }) {
  return (
    <div className="flex items-center gap-2">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange?.(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-brand-green' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
      {label && <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>}
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────────
export function Badge({ children, variant = 'info', className = '' }) {
  const variants = {
    active:   'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
    inactive: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
    pending:  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    info:     'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
    purple:   'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400',
    gray:     'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    success:  'bg-green-100 text-green-800',
    danger:   'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${variants[variant] || variants.info} ${className}`}>
      {children}
    </span>
  )
}

// ── Stat card ──────────────────────────────────────────────────
export function StatCard({ icon: Icon, value, label, color = 'orange' }) {
  const colors = {
    orange: 'bg-orange-light text-orange',
    green:  'bg-green-100 text-brand-green',
    blue:   'bg-blue-100 text-brand-blue',
    purple: 'bg-purple-100 text-brand-purple',
    red:    'bg-red-100 text-brand-red',
  }
  return (
    <div className="card p-5 flex items-center gap-4 hover:-translate-y-1 transition-transform">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color] || colors.orange}`}>
        {Icon && <Icon size={20} />}
      </div>
      <div>
        <div className="font-title font-black text-2xl text-gray-900 dark:text-white leading-none">{value}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="text-center py-16 text-gray-400">
      {Icon && <Icon size={48} className="mx-auto mb-4 opacity-30" />}
      <div className="font-bold text-gray-600 dark:text-gray-400 text-base mb-1">{title}</div>
      {desc  && <div className="text-sm mb-4">{desc}</div>}
      {action}
    </div>
  )
}

// ── Pagination ──────────────────────────────────────────────────
export function Pagination({ page, total, perPage = 10, onChange }) {
  const pages = Math.ceil(total / perPage) || 1
  const start = (page - 1) * perPage + 1
  const end   = Math.min(page * perPage, total)
  const range = Array.from({ length: Math.min(pages, 7) }, (_, i) => {
    if (pages <= 7) return i + 1
    if (page <= 4)  return i + 1
    if (page >= pages - 3) return pages - 6 + i
    return page - 3 + i
  })

  const btn = (n, label, disabled) => (
    <button
      key={label || n}
      onClick={() => !disabled && onChange(n)}
      disabled={disabled}
      className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors
        ${n === page ? 'bg-orange text-white border-orange' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-orange hover:text-orange'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {label || n}
    </button>
  )

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-4 py-3 border-t border-gray-200 dark:border-gray-700">
      {btn(1, '«', page === 1)}
      {btn(page - 1, '‹', page === 1)}
      {range.map(n => btn(n, null, false))}
      {btn(page + 1, '›', page === pages)}
      {btn(pages, '»', page === pages)}
      <span className="text-xs text-gray-400 ml-2">{start}–{end} / {total}</span>
    </div>
  )
}

// ── Alert ──────────────────────────────────────────────────────
export function Alert({ type = 'info', children }) {
  const styles = {
    info:    'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    warning: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
    danger:  'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
  }
  const Icone = { info: Info, warning: AlertTriangle, success: CheckCircle2, danger: XCircle }[type] || Info
  return (
    <div className={`flex items-start gap-2.5 p-3.5 rounded-lg border text-sm mb-4 ${styles[type]}`}>
      <Icone size={16} className="flex-shrink-0 mt-0.5"/>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

// ── Search input ───────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Rechercher...' }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-control pl-8 w-52"
      />
    </div>
  )
}
