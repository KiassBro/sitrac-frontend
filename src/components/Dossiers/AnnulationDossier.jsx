/**
 * SITRAC — Fenêtre d'annulation d'un dossier client (RG 34).
 *
 * Dossier actif   : aperçu du calcul (retenue, frais, remboursement), motif obligatoire,
 *                   puis confirmation. Le dossier ne pourra plus être modifié ni facturé.
 * Dossier annulé  : détail de l'annulation ; l'Administration peut le réactiver
 *                   (erreur de manipulation), avec un motif.
 */
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Ban, RotateCcw } from 'lucide-react'
import { Modal } from '../UI/index.jsx'
import { ApiState } from '../UI/ApiLoader.jsx'
import { annulationsAPI } from '../../utils/annulationsApi'
import { fmt, fmtDate, fmtDateTime } from '../../utils/storage'

function useDiffere(valeur, delai = 400) {
  const [v, setV] = useState(valeur)
  useEffect(() => { const t = setTimeout(() => setV(valeur), delai); return () => clearTimeout(t) }, [valeur, delai])
  return v
}

function Ligne({ label, valeur, fort, couleur }) {
  return (
    <div className={`flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0 ${fort ? 'font-black text-base' : 'text-sm'} ${couleur || ''}`}>
      <span>{label}</span><strong>{valeur}</strong>
    </div>
  )
}

export default function AnnulationDossier({ pc, open, onClose }) {
  const qc = useQueryClient()
  const [taux, setTaux] = useState('')
  const [frais, setFrais] = useState(0)
  const [motif, setMotif] = useState('')
  const [confirme, setConfirme] = useState(false)
  const tauxD = useDiffere(taux)
  const fraisD = useDiffere(frais)

  useEffect(() => { if (open) { setTaux(''); setFrais(0); setMotif(''); setConfirme(false) } }, [open, pc?.id])

  const etat = useQuery({
    queryKey: ['annulation', pc?.id, tauxD, fraisD],
    queryFn: () => annulationsAPI.etat(pc.id, tauxD, fraisD),
    enabled: open && !!pc,
    keepPreviousData: true,
  })
  const d = etat.data
  const annulation = d?.annulation?.active ? d.annulation : null
  const a = d?.apercu
  useEffect(() => { if (a && taux === '') setTaux(String(+a.taux_retenue)) }, [a]) // eslint-disable-line

  const rafraichir = () => {
    qc.invalidateQueries({ queryKey: ['pcs'] })
    qc.invalidateQueries({ queryKey: ['annulation', pc?.id] })
  }
  const annuler = useMutation({
    mutationFn: () => annulationsAPI.annuler(pc.id, { motif, taux_retenue: taux, frais_non_remboursables: frais }),
    onSuccess: () => { toast.success('Dossier annulé'); rafraichir(); onClose() },
    onError: (e) => toast.error(e.message),
  })
  const reactiver = useMutation({
    mutationFn: () => annulationsAPI.reactiver(pc.id, motif),
    onSuccess: () => { toast.success('Dossier réactivé'); rafraichir(); onClose() },
    onError: (e) => toast.error(e.message),
  })

  if (!pc) return null
  return (
    <Modal open={open} onClose={onClose} size="lg" icon={annulation ? RotateCcw : Ban}
      title={annulation ? `Dossier annulé — ${pc.client_nom}` : `Annuler le dossier — ${pc.client_nom}`}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
          {!annulation && d?.peut_annuler && (
            <button className="btn btn-danger" disabled={!confirme || motif.trim().length < 5 || annuler.isPending}
              onClick={() => annuler.mutate()}>
              <Ban size={14} /> {annuler.isPending ? 'Annulation...' : "Confirmer l'annulation"}
            </button>
          )}
          {annulation && d?.peut_reactiver && (
            <button className="btn btn-primary" disabled={motif.trim().length < 5 || reactiver.isPending}
              onClick={() => reactiver.mutate()}>
              <RotateCcw size={14} /> Réactiver le dossier
            </button>
          )}
        </>
      )}>
      <ApiState isLoading={etat.isLoading} error={etat.error} onRetry={etat.refetch} loadingText="Calcul en cours...">
        {d && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {d.dossier.programme} · {fmtDate(d.dossier.date_debut)} → {fmtDate(d.dossier.date_fin)}
            </p>

            {annulation ? (
              <>
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 mb-4 text-sm">
                  Annulé le <b>{fmtDateTime(annulation.annule_le)}</b> par <b>{annulation.annule_par || '—'}</b>.<br />
                  Motif : {annulation.motif}
                </div>
                <Ligne label={`Montant de référence (${annulation.base_source_libelle})`} valeur={fmt(annulation.base_calcul)} />
                <Ligne label={`Retenue (${+annulation.taux_retenue} %)`} valeur={fmt(annulation.montant_retenu)} />
                <Ligne label="Frais non remboursables" valeur={fmt(annulation.frais_non_remboursables)} />
                <Ligne label="Déjà payé par le client" valeur={fmt(annulation.total_paye)} />
                <Ligne label="À rembourser au client" valeur={fmt(annulation.montant_a_rembourser)} fort couleur="text-brand-green" />
                {+annulation.reste_du_client > 0 && (
                  <Ligne label="Reste dû par le client" valeur={fmt(annulation.reste_du_client)} fort couleur="text-brand-red" />
                )}
                {d.peut_reactiver && (
                  <div className="form-group mt-4 mb-0">
                    <label className="form-label">Motif de la réactivation <span className="form-req">*</span></label>
                    <input className="form-control" value={motif} onChange={(e) => setMotif(e.target.value)}
                      placeholder="Ex : annulation saisie par erreur" />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="form-group mb-0">
                    <label className="form-label">Taux de retenue (%)</label>
                    <input type="number" min="0" max="100" step="0.5" className="form-control" value={taux}
                      onChange={(e) => setTaux(e.target.value)} />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">Frais non remboursables (€)</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={frais}
                      onChange={(e) => setFrais(e.target.value)} />
                    <p className="form-hint">Billets d'avion, taxes, frais bancaires…</p>
                  </div>
                </div>
                {a && (
                  <div className="mb-4">
                    <Ligne label={`Montant de référence (${a.base_source_libelle})`} valeur={fmt(a.base_calcul)} />
                    <Ligne label={`Retenue (${+a.taux_retenue} %)`} valeur={fmt(a.montant_retenu)} />
                    <Ligne label="Frais non remboursables" valeur={fmt(a.frais_non_remboursables)} />
                    <Ligne label="Déjà payé par le client" valeur={fmt(a.total_paye)} />
                    <Ligne label="À rembourser au client" valeur={fmt(a.montant_a_rembourser)} fort couleur="text-brand-green" />
                    {+a.reste_du_client > 0 && (
                      <Ligne label="Reste dû par le client" valeur={fmt(a.reste_du_client)} fort couleur="text-brand-red" />
                    )}
                  </div>
                )}
                {d.peut_annuler ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Motif de l'annulation <span className="form-req">*</span></label>
                      <textarea className="form-control" rows={2} value={motif} onChange={(e) => setMotif(e.target.value)}
                        placeholder="Ex : le client annule pour raison de santé" />
                    </div>
                    <label className="flex items-start gap-2 text-sm cursor-pointer">
                      <input type="checkbox" className="mt-0.5" checked={confirme} onChange={(e) => setConfirme(e.target.checked)} />
                      <span>
                        J'ai compris qu'un dossier annulé ne peut plus être modifié ni facturé : cotation, facture,
                        brieffing, provision et paiements sont bloqués ; le devis en attente de signature, l'échéancier
                        et les paiements en ligne en cours sont annulés. Le remboursement est effectué par Finance.
                      </span>
                    </label>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Seuls Sales, Finance et l'Administration peuvent annuler un dossier.</p>
                )}
              </>
            )}
          </>
        )}
      </ApiState>
    </Modal>
  )
}