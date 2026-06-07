import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const SIZES = { sm:'max-w-md', md:'max-w-xl', lg:'max-w-3xl', xl:'max-w-5xl', full:'max-w-7xl' }

export default function Modal({ open, onClose, title, icon: Icon, size='md', children, footer }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          onClick={e => { if (e.target === e.currentTarget) onClose?.() }}
        >
          <motion.div
            className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-modal w-full ${SIZES[size]} my-4`}
            initial={{ scale:.94, opacity:0, y:10 }} animate={{ scale:1, opacity:1, y:0 }}
            exit={{ scale:.94, opacity:0, y:10 }}
            transition={{ type:'spring', damping:28, stiffness:300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
              <h2 className="font-title font-bold text-base text-gray-900 dark:text-white flex items-center gap-2.5">
                {Icon && <Icon size={18} className="text-orange" />}
                {title}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-brand-red hover:border-brand-red transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2.5 rounded-b-2xl">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
