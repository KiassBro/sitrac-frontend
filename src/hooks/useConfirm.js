import { useUiStore } from '../store/uiStore'

export function useConfirm() {
  const { showConfirm } = useUiStore()

  return {
    confirm: showConfirm,
    confirmDelete: (label, onConfirm) => showConfirm({
      icon:'🗑️', type:'danger', title:'Supprimer',
      msg:`Voulez-vous vraiment supprimer "${label}" ?\nCette action est irréversible.`,
      confirmText:'Oui, supprimer', onConfirm,
    }),
    confirmSave: (onConfirm) => showConfirm({
      icon:'💾', type:'success', title:'Enregistrer',
      msg:'Voulez-vous enregistrer ces modifications ?',
      confirmText:'Oui, enregistrer', onConfirm,
    }),
    confirmToggle: (label, isActive, onConfirm) => showConfirm({
      icon: isActive ? '🔒' : '🔓',
      type: isActive ? 'warning' : 'success',
      title: isActive ? 'Désactiver' : 'Activer',
      msg:`Voulez-vous ${isActive ? 'désactiver' : 'activer'} "${label}" ?`,
      confirmText: isActive ? 'Oui, désactiver' : 'Oui, activer',
      onConfirm,
    }),
  }
}
