// ─────────────────────────────────────────────────────────────────
// Espace client — Champ « Pays » ou « Nationalité » (liste officielle ISO)
//
//   <ChampPaysPortail mode="pays"        id="l-pays" value={leader.pays}        onChange={v => ...} />
//   <ChampPaysPortail mode="nationalite" id="l-nat"  value={leader.nationalite} onChange={v => ...} />
//
// Affichage dans la langue du client (« Malagasy » / « Malgache »), mais la valeur
// enregistrée reste celle du référentiel SITRAC, en français (« Malgache »,
// « Madagascar ») : l'agence voit les mêmes valeurs partout.
// ─────────────────────────────────────────────────────────────────
import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown, X } from 'lucide-react'
import { usePays } from '../utils/referentielsApi'
import { ListePays } from '../components/UI/ChampPays'
import { useT } from './i18n'
import { champClasse } from './composants'

const TEXTES = {
  en: {
    pays: 'Choose a country', nationalite: 'Choose a nationality', chargement: 'Loading…',
    chercher_pays: 'Search a country…', chercher_nat: 'Search a nationality or country…',
    aucun: 'No result', effacer: 'Clear', indisponible: 'Country list unavailable. Please try again later.',
    inconnu: (v) => `“${v}” is not in the official list: please choose from the list.`,
  },
  fr: {
    pays: 'Choisir un pays', nationalite: 'Choisir une nationalité', chargement: 'Chargement…',
    chercher_pays: 'Rechercher un pays…', chercher_nat: 'Rechercher une nationalité ou un pays…',
    aucun: 'Aucun résultat', effacer: 'Effacer', indisponible: 'Liste des pays indisponible. Réessayez plus tard.',
    inconnu: (v) => `« ${v} » n'est pas dans la liste officielle : choisissez dans la liste.`,
  },
}

export default function ChampPaysPortail({ mode = 'pays', id, value, onChange, required = false, disabled = false }) {
  const { langue } = useT()
  const tx = TEXTES[langue] || TEXTES.en
  const en = langue !== 'fr'
  const { liste, isLoading, isError, depuisPays, depuisNationalite } = usePays()
  const [ouvert, setOuvert] = useState(false)
  const declencheur = useRef(null)

  const estNat = mode === 'nationalite'
  // Libellé affiché au client (sa langue) / valeur enregistrée (français, référentiel)
  const affiche = (p) => (estNat ? (en ? p.nationalite_en || p.nationalite : p.nationalite) : (en ? p.nom_en || p.nom : p.nom))
  const valeur = (p) => (estNat ? p.nationalite : p.nom)
  const choix = estNat ? depuisNationalite(value) : depuisPays(value)
  const inconnu = !!value && !choix && !isLoading && !isError

  const options = useMemo(() => {
    const base = estNat ? liste.filter((p) => p.nationalite) : liste
    return [...base].sort((a, b) => affiche(a).localeCompare(affiche(b), langue))
  }, [liste, estNat, langue]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="relative">
        <button
          type="button" id={id} ref={declencheur} disabled={disabled}
          onClick={() => setOuvert((o) => !o)}
          aria-haspopup="listbox" aria-expanded={ouvert} aria-required={required || undefined}
          className={`${champClasse} flex items-center gap-2 text-left pr-14 disabled:bg-rt-mist disabled:cursor-not-allowed
            ${inconnu ? '!border-rt-ocre' : ''}`}
        >
          {choix ? (
            <>
              <span className="text-base leading-none" aria-hidden>{choix.drapeau}</span>
              <span className="truncate">{affiche(choix)}</span>
            </>
          ) : inconnu ? (
            <>
              <AlertTriangle size={14} className="text-rt-ocre shrink-0" aria-hidden />
              <span className="truncate">{value}</span>
            </>
          ) : (
            <span className="text-rt-stone/70 truncate">{isLoading ? tx.chargement : tx[mode]}</span>
          )}
        </button>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-rt-stone">
          {value && !disabled && (
            <button type="button" onClick={() => onChange('')} className="p-0.5 rounded hover:text-rt-laterite" aria-label={tx.effacer}>
              <X size={14} />
            </button>
          )}
          <ChevronDown size={15} className="pointer-events-none" aria-hidden />
        </span>
        {/* Champ invisible : bloque l'envoi du formulaire si la valeur obligatoire manque */}
        {required && (
          <input tabIndex={-1} aria-hidden required value={choix ? value : ''} onChange={() => {}}
            onFocus={() => declencheur.current?.focus()}
            className="absolute inset-x-0 bottom-0 h-px opacity-0 pointer-events-none" />
        )}
      </div>
      {inconnu && <p className="text-xs text-rt-laterite">{tx.inconnu(value)}</p>}
      {isError && <p className="text-xs text-rt-laterite">{tx.indisponible}</p>}

      {ouvert && (
        <ListePays
          theme="portail"
          ancre={declencheur}
          options={options}
          selection={choix?.code}
          aucunResultat={tx.aucun}
          placeholder={estNat ? tx.chercher_nat : tx.chercher_pays}
          rendu={(p) => (
            <>
              <span className="text-base leading-none" aria-hidden>{p.drapeau}</span>
              <span className="truncate">{affiche(p)}</span>
              {estNat && <span className="text-xs text-rt-stone truncate">{en ? p.nom_en || p.nom : p.nom}</span>}
            </>
          )}
          onChoisir={(p) => { onChange(valeur(p)); setOuvert(false); declencheur.current?.focus() }}
          onFermer={() => { setOuvert(false); declencheur.current?.focus() }}
        />
      )}
    </>
  )
}
