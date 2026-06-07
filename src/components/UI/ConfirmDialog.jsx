import { useUiStore } from '../../store/uiStore'
import { motion, AnimatePresence } from 'framer-motion'

const TYPE_STYLES = {
  danger:  { btn: 'btn-danger',  ring: 'ring-red-200'   },
  warning: { btn: 'btn-primary', ring: 'ring-orange-200' },
  success: { btn: 'btn-success', ring: 'ring-green-200'  },
  info:    { btn: 'btn-info',    ring: 'ring-blue-200'   },
}

export default function ConfirmDialog() {
  const { confirm, closeConfirm, doConfirm } = useUiStore()

  return (
    <AnimatePresence>
      {confirm && (
        <motion.div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={e => { if (e.target === e.currentTarget) closeConfirm() }}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-modal w-full max-w-sm text-center p-8"
            initial={{ scale: .92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .92, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="text-5xl mb-4">{confirm.icon || '⚠️'}</div>
            <h3 className="font-title font-black text-lg text-gray-900 dark:text-white mb-2">
              {confirm.title || 'Confirmation'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed whitespace-pre-line">
              {confirm.msg || 'Êtes-vous sûr ?'}
            </p>
            <div className="flex gap-3 justify-center">
              {!confirm.cancelHide && (
                <button className="btn btn-ghost flex-1" onClick={closeConfirm}>
                  Annuler
                </button>
              )}
              <button
                className={`btn ${TYPE_STYLES[confirm.type || 'danger']?.btn || 'btn-danger'} flex-1`}
                onClick={doConfirm}
              >
                {confirm.confirmText || 'Confirmer'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
