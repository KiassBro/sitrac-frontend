/**
 * SITRAC — Préremplir la facture pro à partir de la cotation du dossier.
 *
 * La cotation donne le TOTAL 5 (prix par PAX, vols compris). Cette fenêtre
 * propose les lignes de facture correspondantes :
 *   - une ligne « Circuit » : prix par PAX × nombre de PAX ;
 *   - en option, les vols sur une ligne séparée (montant FLIGHT de la cotation) ;
 *   - en option, une marge en % appliquée aux prix.
 * Les lignes proposées restent modifiables avant « Tout enregistrer » :
 * rien n'est enregistré tant que l'agent ne valide pas la facture pro.
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calculator } from 'lucide-react'
import { Modal } from '../UI/index.jsx'
import { ApiState } from '../UI/ApiLoader.jsx'
import { salesAPI } from '../../utils/api'
import { fmt, fmtDate } from '../../utils/storage'

const arrondi = (v) => Math.round((+v || 0) * 100) / 100

export default function GenererDepuisCotation({ pc, open, onClose, onAppliquer, aDejaDesLignes }) {
  const [marge, setMarge] = useState(0)
  const [volsSepares, setVolsSepares] = useState(false)
  const [mode, setMode] = useState('remplacer')

  const { data: cot, isLoading, error, refetch } = useQuery({
    queryKey: ['cotation', pc.id, 'pour-fp'],
    queryFn: () => salesAPI.getCotation(pc.id),
    enabled: open,
    retry: false,
  })

  const pax = +pc.nb_pax || 1
  const lignes = useMemo(() => {
    if (!cot) return []
    const coef = 1 + (+marge || 0) / 100
    const total5 = +cot.total5 || 0
    const vols = +cot.flight || 0
    const periode = `du ${fmtDate(pc.date_debut)} au ${fmtDate(pc.date_fin)}`
    const res = [{
      date: pc.date_debut || '',
      service: `Circuit « ${pc.programme_nom} » ${periode}${volsSepares && vols ? ', hors vols' : ''}`,
      nombre: pax,
      prix_unitaire: arrondi((volsSepares ? total5 - vols : total5) * coef),
    }]
    if (volsSepares && vols > 0) {
      res.push({ date: pc.date_debut || '', service: 'Vols domestiques', nombre: pax, prix_unitaire: arrondi(vols * coef) })
    }
    return res
  }, [cot, marge, volsSepares, pc, pax])

  const total = lignes.reduce((s, l) => s + l.nombre * l.prix_unitaire, 0)

  return (
    <Modal open={open} onClose={onClose} size="lg" icon={Calculator} title="Préremplir depuis la cotation"
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn-success" disabled={!cot || !lignes.length}
            onClick={() => onAppliquer(lignes, mode)}>
            Utiliser ces lignes
          </button>
        </>
      )}>
      <ApiState isLoading={isLoading} error={error} onRetry={refetch} loadingText="Lecture de la cotation...">
        {cot && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <div className="text-xs text-gray-500">TOTAL 5 (par PAX)</div>
                <div className="font-bold text-base">{fmt(cot.total5)}</div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <div className="text-xs text-gray-500">dont vols (FLIGHT)</div>
                <div className="font-bold text-base">{fmt(cot.flight)}</div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <div className="text-xs text-gray-500">Nombre de PAX</div>
                <div className="font-bold text-base">{pax}</div>
              </div>
            </div>
            {cot.statut === 'brouillon' && (
              <p className="text-xs text-orange mb-3">
                La cotation est encore en brouillon : vérifiez qu'elle est définitive avant de facturer.
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="form-group mb-0">
                <label className="form-label">Marge appliquée (%)</label>
                <input type="number" step="0.5" className="form-control" value={marge}
                  onChange={(e) => setMarge(e.target.value)} />
              </div>
              <div className="form-group mb-0 flex items-end">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={volsSepares} disabled={!(+cot.flight > 0)}
                    onChange={(e) => setVolsSepares(e.target.checked)} />
                  Facturer les vols sur une ligne séparée
                </label>
              </div>
            </div>

            <table className="tbl text-xs mb-3">
              <thead><tr><th>Date</th><th>Prestation</th><th className="text-right">Nombre</th><th className="text-right">Prix unit.</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {lignes.map((l, i) => (
                  <tr key={i}>
                    <td>{fmtDate(l.date)}</td><td>{l.service}</td>
                    <td className="text-right">{l.nombre}</td><td className="text-right">{fmt(l.prix_unitaire)}</td>
                    <td className="text-right font-semibold">{fmt(l.nombre * l.prix_unitaire)}</td>
                  </tr>
                ))}
                <tr><td colSpan={4} className="text-right font-bold">Total</td><td className="text-right font-black text-brand-green">{fmt(total)}</td></tr>
              </tbody>
            </table>

            {aDejaDesLignes && (
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={mode === 'remplacer'} onChange={() => setMode('remplacer')} />
                  Remplacer les lignes actuelles
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={mode === 'ajouter'} onChange={() => setMode('ajouter')} />
                  Ajouter à la suite
                </label>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3">
              Les lignes restent modifiables. Rien n'est enregistré avant « Tout enregistrer ».
            </p>
          </>
        )}
      </ApiState>
    </Modal>
  )
}