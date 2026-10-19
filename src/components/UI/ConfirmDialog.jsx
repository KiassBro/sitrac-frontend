import { useUiStore } from '../../store/uiStore'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2, Save, Lock, Unlock, KeyRound, LogOut, Pencil, Mail, CheckCircle2, Repeat, Ticket, ShieldCheck, Info } from 'lucide-react'

// Icônes professionnelles (aucun emoji) : clé sémantique -> composant Lucide
const ICONES = {
  attention: AlertTriangle, supprimer: Trash2, enregistrer: Save, verrouiller: Lock,
  deverrouiller: Unlock, cle: KeyRound, deconnexion: LogOut, modifier: Pencil, email: Mail,
  valider: CheckCircle2, transfert: Repeat, voucher: Ticket, securite: ShieldCheck, info: Info,
}
const TEINTES = {
  danger:  'bg-red-50 text-brand-red dark:bg-red-900/30',
  warning: 'bg-orange-light text-orange dark:bg-orange/15',
  success: 'bg-green-50 text-brand-green dark:bg-green-900/30',
  info:    'bg-blue-50 text-brand-blue dark:bg-blue-900/30',
}

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
            {(() => {
              const Icone = ICONES[confirm.icon] || AlertTriangle
              return (
                <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${TEINTES[confirm.type || 'danger'] || TEINTES.danger}`}>
                  <Icone size={26} strokeWidth={2}/>
                </div>
              )
            })()}
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
