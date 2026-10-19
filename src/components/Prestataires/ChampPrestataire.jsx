/**
 * SITRAC — Champ « Prestataire » relié au référentiel.
 *
 * Remplace un simple <input> de formulaire (react-hook-form) :
 *   - propose les prestataires actifs du référentiel pendant la saisie ;
 *   - si le nom saisi est une ancienne orthographe connue, propose le nom officiel ;
 *   - affiche les tarifs de la fiche : un clic recopie le prix dans le champ montant ;
 *   - la saisie libre reste possible (prestataire ponctuel non référencé).
 *
 * Le nom est enregistré en texte comme avant : aucune donnée existante n'est
 * modifiée, et les statistiques du référentiel le reconnaissent automatiquement.
 *
 * Utilisation :
 *   <ChampPrestataire form={lgMethods} name="prestataire" champMontant="montant" />
 *   <ChampPrestataire form={{ register, watch, setValue }} name="hotels"
 *                     champMontant="dbl" categories={['hebergement']} />
 */
import { useEffect, useId, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Info } from 'lucide-react'
import { prestatairesAPI } from '../../utils/prestatairesApi'

export const normaliserNom = (t) => (t || '')
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const euro = (v) => `${Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

export default function ChampPrestataire({
  form, name = 'prestataire', champMontant, categories, required = false, parPersonne = false, dateService,
  placeholder = 'Choisir dans le référentiel ou saisir un nom', className = 'form-control',
}) {
  const idListe = useId()
  const { register, watch, setValue } = form
  const valeur = watch ? watch(name) : ''

  const { data = [] } = useQuery({
    queryKey: ['prestataires-selection'],
    queryFn: () => prestatairesAPI.selection(),
    staleTime: 5 * 60 * 1000,
  })
  const proposes = useMemo(
    () => (categories?.length ? data.filter((p) => categories.includes(p.categorie)) : data),
    [data, categories],
  )

  // Retrouve la fiche : nom officiel OU ancienne orthographe rattachée
  const saisie = normaliserNom(valeur)
  const fiche = saisie ? data.find((p) => normaliserNom(p.nom) === saisie
    || (p.alias || []).some((a) => normaliserNom(a) === saisie)) : null
  const estAlias = fiche && normaliserNom(fiche.nom) !== saisie

  // Prix d'un tarif ramené au bon montant :
  // en cotation (parPersonne), une chambre double « par nuit (chambre) » est partagée par 2 personnes.
  const prixApplicable = (t) => {
    const prix = Number(t.prix || 0)
    return parPersonne && t.unite_code === 'nuit' ? Math.round(prix / 2 * 100) / 100 : prix
  }
  const appliquerPrix = (t) => {
    if (champMontant && setValue) setValue(champMontant, prixApplicable(t), { shouldDirty: true })
  }

  // Tarif proposé d'office : celui valable à la date de la prestation (ou aujourd'hui),
  // de préférence « toute l'année », sinon le premier de la fiche.
  const tarifParDefaut = (f) => {
    const jour = (dateService || new Date().toISOString()).slice(0, 10)
    const valables = (f?.tarifs || []).filter((t) =>
      (!t.date_debut || t.date_debut <= jour) && (!t.date_fin || t.date_fin >= jour))
    const liste = valables.length ? valables : (f?.tarifs || [])
    return liste.find((t) => t.saison === "Toute l'année") || liste[0] || null
  }

  // Dès qu'un prestataire du référentiel est choisi, son tarif est recopié
  // automatiquement — sans écraser un montant déjà saisi.
  const montantActuel = champMontant && watch ? watch(champMontant) : undefined
  const ficheId = fiche?.id
  useEffect(() => {
    if (!ficheId || !champMontant || !setValue) return
    if (Number(montantActuel || 0) !== 0) return
    const t = tarifParDefaut(fiche)
    if (t) appliquerPrix(t)
  }, [ficheId])

  return (
    <div>
      <input className={className} list={idListe} autoComplete="off" placeholder={placeholder}
        {...register(name, required ? { required: true } : {})} />
      <datalist id={idListe}>
        {proposes.map((p) => (
          <option key={p.id} value={p.nom}>{[p.categorie_libelle, p.ville].filter(Boolean).join(' · ')}</option>
        ))}
      </datalist>

      {fiche && (
        <div className="mt-1.5 text-xs">
          <div className="flex items-center gap-1 text-brand-green font-semibold">
            <Check size={12} /> Fiche « {fiche.nom} »
            {estAlias && setValue && (
              <button type="button" className="ml-2 underline text-orange font-normal"
                onClick={() => setValue(name, fiche.nom, { shouldDirty: true })}>
                utiliser le nom officiel
              </button>
            )}
          </div>
          {fiche.tarifs.length > 0 && champMontant && (
            <div className="flex flex-wrap gap-1 mt-1">
              {fiche.tarifs.map((t) => (
                <button key={t.id} type="button" title="Recopier ce prix"
                  className="px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 hover:border-orange hover:text-orange"
                  onClick={() => appliquerPrix(t)}>
                  {t.libelle} · {euro(t.prix)} {t.unite}{t.saison !== "Toute l'année" ? ` (${t.saison})` : ''}
                  {parPersonne && t.unite_code === 'nuit' ? ` → ${euro(prixApplicable(t))} / pers.` : ''}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {!fiche && saisie.length >= 3 && data.length > 0 && (
        <div className="mt-1 text-xs text-gray-400 flex items-center gap-1">
          <Info size={11} /> Absent du référentiel : il apparaîtra dans « Prestataires → Noms à rattacher ».
        </div>
      )}
    </div>
  )
}