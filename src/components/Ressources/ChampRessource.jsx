/**
 * SITRAC — Champ « chauffeur / guide / voiture » du brieffing, relié au planning.
 *
 * - propose les ressources actives du type demandé ;
 * - vérifie la disponibilité sur les dates du voyage et signale en rouge une
 *   double affectation ou une indisponibilité (congé, entretien…) ;
 * - la saisie libre reste possible : l'agent décide, SITRAC prévient.
 */
import { useEffect, useId, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Check, Info } from 'lucide-react'
import { ressourcesAPI } from '../../utils/ressourcesApi'
import { fmtDate } from '../../utils/storage'

export default function ChampRessource({ form, name, type, debut, fin, exclurePc, placeholder }) {
  const idListe = useId()
  const valeur = (form.watch(name) || '').trim()
  const [differe, setDiffere] = useState(valeur)
  useEffect(() => { const t = setTimeout(() => setDiffere(valeur), 500); return () => clearTimeout(t) }, [valeur])

  const { data: liste = [] } = useQuery({
    queryKey: ['ressources', type], queryFn: () => ressourcesAPI.liste(type), staleTime: 5 * 60 * 1000,
  })
  const { data: verif } = useQuery({
    queryKey: ['ressource-verif', type, differe, debut, fin, exclurePc],
    queryFn: () => ressourcesAPI.verifier({ type, texte: differe, debut, fin, exclurePc }),
    enabled: differe.length >= 2 && !!debut,
  })

  return (
    <div>
      <input className="form-control" list={idListe} autoComplete="off" placeholder={placeholder}
        {...form.register(name)} />
      <datalist id={idListe}>
        {liste.filter((r) => r.actif).map((r) => (
          <option key={r.id} value={r.type_ressource === 'vehicule' && r.immatriculation ? `${r.nom} (${r.immatriculation})` : r.nom}>
            {[r.telephone, r.langues, r.capacite ? `${r.capacite} places` : ''].filter(Boolean).join(' · ')}
          </option>
        ))}
      </datalist>
      {verif && differe.length >= 2 && (
        <div className="mt-1 text-xs space-y-0.5">
          {verif.fiche ? (
            <div className="flex items-center gap-1 text-brand-green font-semibold">
              <Check size={12} /> {verif.fiche.nom}
              {verif.fiche.capacite ? <span className="font-normal text-gray-500">· {verif.fiche.capacite} places</span> : null}
              {verif.fiche.langues ? <span className="font-normal text-gray-500">· {verif.fiche.langues}</span> : null}
              {!verif.fiche.actif && <span className="text-orange font-normal">· fiche désactivée</span>}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-400"><Info size={11} /> Absent des ressources : conflits vérifiés sur le nom saisi.</div>
          )}
          {verif.conflits.map((c, i) => (
            <div key={i} className="flex items-start gap-1 text-brand-red font-semibold">
              <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
              Déjà affecté à PC#{c.pc} {c.client} ({c.programme}) du {fmtDate(c.debut)} au {fmtDate(c.fin)}
            </div>
          ))}
          {verif.indisponibilites.map((d, i) => (
            <div key={`i${i}`} className="flex items-start gap-1 text-brand-red font-semibold">
              <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
              Indisponible du {fmtDate(d.debut)} au {fmtDate(d.fin)}{d.motif ? ` (${d.motif})` : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}