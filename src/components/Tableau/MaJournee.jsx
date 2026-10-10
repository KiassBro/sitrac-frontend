/**
 * SITRAC — « Ma journée » : actions du jour pour le département de l'utilisateur.
 *
 * Affiché en haut du tableau de bord. Chaque carte regroupe une action à mener
 * (devis refusés, départs sans brieffing, échéances en retard, conflits de planning…),
 * du plus urgent au moins urgent, avec les 5 premiers dossiers concernés et un lien
 * vers la page où agir. Actualisé toutes les 5 minutes.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AlertOctagon, AlertTriangle, Info, CheckCircle2, ChevronRight, CalendarCheck } from 'lucide-react'
import { api } from '../../utils/api'

const STYLE = {
  urgent:    { bord: 'border-l-brand-red',  icone: AlertOctagon,  couleur: 'text-brand-red',  fond: 'bg-red-50 dark:bg-red-900/20' },
  attention: { bord: 'border-l-orange',     icone: AlertTriangle, couleur: 'text-orange',     fond: 'bg-orange-light dark:bg-orange/10' },
  info:      { bord: 'border-l-brand-blue', icone: Info,          couleur: 'text-brand-blue', fond: 'bg-blue-50 dark:bg-blue-900/20' },
}
const euro = (v) => `${Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`

export default function MaJournee() {
  const navigate = useNavigate()
  const [tout, setTout] = useState(false)
  const { data, isLoading, error } = useQuery({
    queryKey: ['ma-journee'],
    queryFn: () => api.get('/tableau-de-bord/ma-journee/'),
    refetchInterval: 5 * 60 * 1000,
  })

  if (isLoading) return <div className="card p-5 mb-6 text-sm text-gray-400">Préparation de votre journée…</div>
  if (error || !data) return null

  const blocs = tout ? data.blocs : data.blocs.slice(0, 6)
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-orange rounded-full" />
          <h2 className="font-title font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
            <CalendarCheck size={15} /> Ma journée
          </h2>
          {data.urgents > 0 && (
            <span className="text-xs font-bold text-white bg-brand-red px-2 py-0.5 rounded-full">{data.urgents} urgent{data.urgents > 1 ? 's' : ''}</span>
          )}
        </div>
        {data.blocs.length > 6 && (
          <button className="text-xs text-orange hover:underline" onClick={() => setTout(!tout)}>
            {tout ? 'Réduire' : `Tout afficher (${data.blocs.length})`}
          </button>
        )}
      </div>

      {data.blocs.length === 0 ? (
        <div className="card p-5 flex items-center gap-3 text-sm text-brand-green">
          <CheckCircle2 size={20} /> Rien d'urgent aujourd'hui : toutes les actions de votre département sont à jour.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {blocs.map((b) => {
            const s = STYLE[b.niveau]
            const Icone = s.icone
            return (
              <div key={b.cle} className={`card border-l-4 ${s.bord} !p-0 flex flex-col`}>
                <button className={`flex items-start gap-2 p-3 text-left ${s.fond} rounded-tr-xl`} onClick={() => navigate(b.lien)}>
                  <Icone size={16} className={`${s.couleur} mt-0.5 flex-shrink-0`} />
                  <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200">{b.titre}</span>
                  <span className={`text-lg font-black ${s.couleur}`}>{b.nombre}</span>
                </button>
                {b.montant != null && Number(b.montant) > 0 && (
                  <div className="px-3 pt-2 text-xs text-gray-500">Total : <b className="text-gray-800 dark:text-gray-200">{euro(b.montant)}</b></div>
                )}
                <ul className="px-3 py-2 space-y-1 flex-1">
                  {b.details.map((d, i) => (
                    <li key={i}>
                      <button className="w-full text-left text-xs hover:text-orange flex items-start gap-1" onClick={() => navigate(d.lien)}>
                        <ChevronRight size={12} className="mt-0.5 flex-shrink-0 text-gray-300" />
                        <span><b className="text-gray-700 dark:text-gray-300">{d.libelle}</b> <span className="text-gray-400">· {d.info}</span></span>
                      </button>
                    </li>
                  ))}
                  {b.nombre > b.details.length && <li className="text-[11px] text-gray-400 pl-4">… et {b.nombre - b.details.length} autre(s)</li>}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}