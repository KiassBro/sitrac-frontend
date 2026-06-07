import { Loader2, WifiOff, RefreshCw } from 'lucide-react'

/**
 * Composant affiché pendant le chargement API
 */
export function ApiLoader({ text = 'Chargement...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <Loader2 size={36} className="animate-spin text-orange mb-4" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  )
}

/**
 * Composant affiché en cas d'erreur API
 */
export function ApiError({ error, onRetry }) {
  const isNetwork = !navigator.onLine || error?.message?.includes('fetch')
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
        <WifiOff size={28} className="text-brand-red" />
      </div>
      <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
        {isNetwork ? 'Serveur inaccessible' : 'Erreur de chargement'}
      </h3>
      <p className="text-sm text-gray-400 mb-4 max-w-xs">
        {isNetwork
          ? 'Vérifiez que le backend Django est démarré sur localhost:8000'
          : (error?.message || 'Une erreur est survenue')}
      </p>
      {onRetry && (
        <button className="btn btn-ghost btn-sm" onClick={onRetry}>
          <RefreshCw size={14} /> Réessayer
        </button>
      )}
      <div className="mt-4 text-xs text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-2">
        <code>python manage.py runserver</code>
      </div>
    </div>
  )
}

/**
 * Wrapper qui gère loading + error + contenu
 */
export function ApiState({ isLoading, error, onRetry, loadingText, children }) {
  if (isLoading) return <ApiLoader text={loadingText} />
  if (error)     return <ApiError error={error} onRetry={onRetry} />
  return children
}
