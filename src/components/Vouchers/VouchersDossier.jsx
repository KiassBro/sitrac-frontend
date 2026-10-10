/**
 * SITRAC — Vouchers d'un dossier (fenêtre ouverte depuis le Brieffing).
 *
 * - « Générer » : un voucher par ligne CONFIRMÉE du brieffing qui n'en a pas encore.
 * - Pour chaque voucher : télécharger le PDF, l'envoyer par email au prestataire
 *   (adresse de sa fiche du référentiel, ou saisie), le publier dans l'espace client
 *   (copie sans le tarif négocié), le régénérer après modification du brieffing, l'annuler.
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Ticket, Download, Send, Eye, EyeOff, RefreshCw, XCircle, Wand2, AlertTriangle } from 'lucide-react'
import { Modal, Badge } from '../UI/index.jsx'
import { ApiState } from '../UI/ApiLoader.jsx'
import { useConfirm } from '../../hooks/useConfirm'
import { vouchersAPI } from '../../utils/vouchersApi'
import { fmt, fmtDate, fmtDateTime } from '../../utils/storage'

const VARIANTE = { genere: 'pending', envoye: 'active', annule: 'inactive' }

export default function VouchersDossier({ pc, open, onClose }) {
  const qc = useQueryClient()
  const { confirm } = useConfirm()
  const [emailSaisi, setEmailSaisi] = useState({})
  const cle = ['vouchers', pc?.id]

  const etat = useQuery({ queryKey: cle, queryFn: () => vouchersAPI.dossier(pc.id), enabled: open && !!pc })
  const d = etat.data
  const rafraichir = () => qc.invalidateQueries({ queryKey: cle })
  const action = (fn, succes) => useMutation({
    mutationFn: fn,
    onSuccess: (r) => { toast.success(typeof succes === 'function' ? succes(r) : succes); rafraichir() },
    onError: (e) => toast.error(e.message),
  })

  const generer   = action(() => vouchersAPI.generer(pc.id),
    (r) => r.crees.length ? `${r.crees.length} voucher(s) généré(s)` : 'Aucun nouveau voucher à générer')
  const envoyer   = action(({ uuid, email }) => vouchersAPI.envoyer(uuid, email), (r) => `Voucher envoyé à ${r.envoye_a}`)
  const publier   = action(({ uuid, visible }) => vouchersAPI.publier(uuid, visible),
    (r) => r.publie_client ? 'Voucher visible dans l’espace client' : 'Voucher retiré de l’espace client')
  const regenerer = action((uuid) => vouchersAPI.regenerer(uuid),
    (r) => r.ligne_trouvee ? 'Voucher mis à jour avec le brieffing' : 'PDF régénéré (ligne introuvable dans le brieffing)')
  const annuler   = action((uuid) => vouchersAPI.annuler(uuid), 'Voucher annulé')

  if (!pc) return null
  const peut = d?.peut_agir

  return (
    <Modal open={open} onClose={onClose} size="xl" icon={Ticket} title={`Vouchers — ${pc.client_nom}`}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
          {peut && (
            <button className="btn btn-primary" disabled={!d?.a_generer?.length || generer.isPending}
              onClick={() => generer.mutate()}>
              <Wand2 size={14} /> Générer {d?.a_generer?.length ? `(${d.a_generer.length})` : ''}
            </button>
          )}
        </>
      )}>
      <ApiState isLoading={etat.isLoading} error={etat.error} onRetry={etat.refetch} loadingText="Chargement...">
        {d && (
          <>
            {!d.a_brieffing && (
              <p className="text-sm text-gray-500">Enregistrez d'abord le brieffing : les vouchers sont générés à partir de ses lignes.</p>
            )}
            {d.a_generer.length > 0 && (
              <p className="text-sm mb-3">
                <b>{d.a_generer.length}</b> ligne(s) confirmée(s) sans voucher :{' '}
                {d.a_generer.map((l) => `${l.prestataire}${l.date ? ` (${fmtDate(l.date)})` : ''}`).join(', ')}.
              </p>
            )}
            {d.non_confirmees.length > 0 && (
              <p className="text-xs text-orange mb-3 flex items-center gap-1">
                <AlertTriangle size={12} /> Non confirmées (pas de voucher tant qu'elles ne sont pas « OK ») :{' '}
                {d.non_confirmees.map((l) => l.prestataire).join(', ')}.
              </p>
            )}

            {d.vouchers.length === 0 ? (
              d.a_brieffing && <p className="text-sm text-gray-400 py-4 text-center">Aucun voucher pour ce dossier.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="tbl text-xs">
                  <thead><tr>
                    <th>N°</th><th>Date</th><th>Prestataire</th><th>Prestation</th><th className="text-right">Tarif</th>
                    <th>Statut</th><th>Espace client</th><th className="text-right">Actions</th>
                  </tr></thead>
                  <tbody>
                    {d.vouchers.map((v) => {
                      const annule = v.statut === 'annule'
                      return (
                        <tr key={v.uuid} className={annule ? 'opacity-50' : ''}>
                          <td className="font-mono font-semibold">{v.numero}</td>
                          <td>{fmtDate(v.date_service)}</td>
                          <td>
                            {v.prestataire_nom}
                            {v.orphelin && !annule && (
                              <div className="text-orange flex items-center gap-1"><AlertTriangle size={11} /> plus dans le brieffing</div>
                            )}
                          </td>
                          <td className="max-w-[160px] truncate" title={v.prestation}>{v.prestation || '—'}</td>
                          <td className="text-right">{+v.tarif ? fmt(v.tarif) : '—'}</td>
                          <td>
                            <Badge variant={VARIANTE[v.statut]}>{v.statut_libelle}</Badge>
                            {v.envoye_le && <div className="text-gray-400 mt-0.5">{fmtDateTime(v.envoye_le)} · {v.envoye_a}</div>}
                          </td>
                          <td>{v.publie_client ? <Badge variant="active">Visible</Badge> : <span className="text-gray-400">—</span>}</td>
                          <td className="text-right whitespace-nowrap">
                            <button className="btn btn-ghost btn-xs" title="Télécharger le PDF"
                              onClick={() => vouchersAPI.pdf(v.uuid, v.numero).catch((e) => toast.error(e.message))}>
                              <Download size={12} />
                            </button>
                            {peut && !annule && (
                              <>
                                {' '}
                                <button className="btn btn-ghost btn-xs" title="Envoyer au prestataire"
                                  onClick={() => {
                                    const email = v.prestataire_email || emailSaisi[v.uuid] || window.prompt(
                                      `Adresse email de « ${v.prestataire_nom} » (absente du référentiel) :`, '')
                                    if (!email) return
                                    setEmailSaisi({ ...emailSaisi, [v.uuid]: email })
                                    envoyer.mutate({ uuid: v.uuid, email: v.prestataire_email ? undefined : email })
                                  }}>
                                  <Send size={12} />
                                </button>{' '}
                                <button className="btn btn-ghost btn-xs"
                                  title={v.publie_client ? "Retirer de l'espace client" : "Publier dans l'espace client (sans le tarif)"}
                                  onClick={() => publier.mutate({ uuid: v.uuid, visible: !v.publie_client })}>
                                  {v.publie_client ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>{' '}
                                <button className="btn btn-ghost btn-xs" title="Régénérer depuis le brieffing actuel"
                                  onClick={() => regenerer.mutate(v.uuid)}>
                                  <RefreshCw size={12} />
                                </button>{' '}
                                <button className="btn btn-ghost btn-xs" title="Annuler le voucher"
                                  onClick={() => confirm({
                                    icon: '🎫', type: 'warning', title: 'Annuler le voucher',
                                    msg: `Le voucher ${v.numero} sera annulé et retiré de l'espace client. Pensez à prévenir le prestataire s'il l'a déjà reçu.`,
                                    confirmText: 'Oui, annuler', onConfirm: () => annuler.mutate(v.uuid),
                                  })}>
                                  <XCircle size={12} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3">
              Le PDF envoyé au prestataire mentionne le tarif convenu ; la copie publiée dans l'espace client ne le montre pas.
            </p>
          </>
        )}
      </ApiState>
    </Modal>
  )
}