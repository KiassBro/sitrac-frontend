// ─────────────────────────────────────────────────────────────────
// SITRAC — Champ « Pays » ou « Nationalité » : liste ISO avec recherche
//
//   <ChampPays mode="pays"        value={fd.pays}        onChange={v => setF('pays', v)} />
//   <ChampPays mode="nationalite" value={fd.nationalite} onChange={v => setF('nationalite', v)} />
//
// La valeur enregistrée reste un texte, au format du référentiel :
//   pays → « Madagascar », nationalité → « Malgache ».
// La recherche ignore accents et majuscules, et accepte le nom anglais,
// le code ISO (MG, MDG) ou l'indicatif (+261).
// ─────────────────────────────────────────────────────────────────
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X, AlertTriangle } from 'lucide-react'
import { usePays, cle } from '../../utils/referentielsApi'

export default function ChampPays({
  mode = 'pays', value, onChange, placeholder, disabled = false, effacable = true, id,
}) {
  const { liste, isLoading, isError, depuisPays, depuisNationalite } = usePays()
  const [ouvert, setOuvert] = useState(false)
  const declencheur = useRef(null)

  const estNat = mode === 'nationalite'
  const libelle = (p) => (estNat ? p.nationalite : p.nom)
  const choix = estNat ? depuisNationalite(value) : depuisPays(value)

  const options = useMemo(() => {
    const base = estNat ? liste.filter(p => p.nationalite) : liste
    return estNat ? [...base].sort((a, b) => a.nationalite.localeCompare(b.nationalite, 'fr')) : base
  }, [liste, estNat])

  const texteDefaut = placeholder || (estNat ? 'Choisir une nationalité' : 'Choisir un pays')
  const inconnu = !!value && !choix && !isLoading && !isError

  return (
    <>
      <div className="relative">
        <button
          type="button"
          id={id}
          ref={declencheur}
          disabled={disabled}
          onClick={() => setOuvert(o => !o)}
          className={`form-control w-full flex items-center gap-2 text-left pr-14
            ${inconnu ? 'border-amber-400 dark:border-amber-500' : ''}
            ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          aria-haspopup="listbox"
          aria-expanded={ouvert}
        >
          {choix ? (
            <>
              <span className="text-base leading-none">{choix.drapeau}</span>
              <span className="truncate text-gray-900 dark:text-white">{libelle(choix)}</span>
              {estNat && <span className="text-xs text-gray-400 truncate">· {choix.nom}</span>}
            </>
          ) : inconnu ? (
            <>
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0"/>
              <span className="truncate text-gray-700 dark:text-gray-300">{value}</span>
              <span className="text-xs text-amber-600 whitespace-nowrap">à corriger</span>
            </>
          ) : (
            <span className="text-gray-400 truncate">{isLoading ? 'Chargement…' : texteDefaut}</span>
          )}
        </button>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400">
          {effacable && value && !disabled && (
            <button type="button" onClick={() => onChange('', null)}
              className="p-0.5 rounded hover:text-brand-red" aria-label="Effacer">
              <X size={14}/>
            </button>
          )}
          <ChevronDown size={15} className="pointer-events-none"/>
        </span>
      </div>
      {inconnu && (
        <p className="text-[11px] text-amber-600 mt-1">
          « {value} » n'est pas dans la liste officielle : choisissez la bonne valeur.
        </p>
      )}
      {isError && <p className="text-[11px] text-brand-red mt-1">Liste des pays indisponible (serveur injoignable).</p>}

      {ouvert && (
        <ListePays
          ancre={declencheur}
          options={options}
          selection={choix?.code}
          rendu={(p) => (
            <>
              <span className="text-base leading-none">{p.drapeau}</span>
              <span className="truncate">{libelle(p)}</span>
              {estNat && <span className="text-xs text-gray-400 truncate">{p.nom}</span>}
            </>
          )}
          placeholder={estNat ? 'Rechercher une nationalité ou un pays…' : 'Rechercher un pays, un code ou un indicatif…'}
          onChoisir={(p) => { onChange(libelle(p), p); setOuvert(false); declencheur.current?.focus() }}
          onFermer={() => { setOuvert(false); declencheur.current?.focus() }}
        />
      )}
    </>
  )
}

// ─── Liste déroulante (affichée au-dessus de tout, même dans une fenêtre modale) ───
// theme : 'sitrac' (application interne) ou 'portail' (espace client, couleurs Ramartour)
const THEMES = {
  sitrac: {
    boite: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl',
    entete: 'border-gray-100 dark:border-gray-800', saisie: 'text-gray-900 dark:text-white placeholder:text-gray-400',
    actif: 'bg-orange-light dark:bg-orange/10', choisi: 'font-semibold text-orange-dark dark:text-orange',
    normal: 'text-gray-700 dark:text-gray-200', vide: 'text-gray-400', loupe: 'text-gray-400',
  },
  portail: {
    boite: 'bg-white border border-rt-line rounded-lg',
    entete: 'border-rt-line', saisie: 'text-rt-ink placeholder:text-rt-stone/60',
    actif: 'bg-rt-mist', choisi: 'font-semibold text-rt-canopy', normal: 'text-rt-ink', vide: 'text-rt-stone',
    loupe: 'text-rt-stone',
  },
}

export function ListePays({ ancre, options, selection, rendu, placeholder, onChoisir, onFermer, largeurMin = 280,
                            theme = 'sitrac', aucunResultat = 'Aucun résultat' }) {
  const th = THEMES[theme] || THEMES.sitrac
  const [recherche, setRecherche] = useState('')
  const [actif, setActif] = useState(() => Math.max(0, options.findIndex(p => p.code === selection)))
  const [position, setPosition] = useState(null)
  const boite = useRef(null)
  const liste = useRef(null)

  const filtrees = useMemo(() => {
    const q = cle(recherche)
    if (!q) return options
    const commence = [], contient = []
    for (const p of options) {
      const champs = [p.nom, p.nom_en, p.nationalite, p.nationalite_en, p.code, p.alpha3, p.indicatif].map(cle)
      if (champs.some(c => c.startsWith(q))) commence.push(p)
      else if (champs.some(c => c.includes(q))) contient.push(p)
    }
    return [...commence, ...contient]
  }, [options, recherche])

  // Position calculée à partir du champ ; s'ouvre vers le haut s'il manque de place en bas
  useLayoutEffect(() => {
    const placer = () => {
      const r = ancre.current?.getBoundingClientRect()
      if (!r) return
      const hauteur = 320
      const versLeHaut = window.innerHeight - r.bottom < hauteur && r.top > hauteur
      const largeur = Math.max(r.width, largeurMin)
      const gauche = Math.min(r.left, window.innerWidth - largeur - 8)
      setPosition({ left: Math.max(8, gauche), width: largeur,
                    ...(versLeHaut ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }) })
    }
    placer()
    window.addEventListener('resize', placer)
    window.addEventListener('scroll', placer, true)
    return () => { window.removeEventListener('resize', placer); window.removeEventListener('scroll', placer, true) }
  }, [ancre, largeurMin])

  // Fermer en cliquant ailleurs
  useEffect(() => {
    const clic = (e) => {
      if (!boite.current?.contains(e.target) && !ancre.current?.contains(e.target)) onFermer()
    }
    document.addEventListener('mousedown', clic)
    return () => document.removeEventListener('mousedown', clic)
  }, [ancre, onFermer])

  useEffect(() => {
    liste.current?.querySelector(`[data-index="${actif}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [actif, position])

  const clavier = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActif(i => Math.min(i + 1, filtrees.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActif(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtrees[actif]) onChoisir(filtrees[actif]) }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onFermer() }
    else if (e.key === 'Tab') onFermer()
  }

  if (!position) return null
  return createPortal(
    <div ref={boite} style={{ position: 'fixed', zIndex: 1100, ...position }}
      className={`${th.boite} shadow-2xl overflow-hidden`}>
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${th.entete}`}>
        <Search size={14} className={`${th.loupe} flex-shrink-0`}/>
        <input autoFocus value={recherche} onChange={e => { setRecherche(e.target.value); setActif(0) }} onKeyDown={clavier}
          placeholder={placeholder}
          className={`w-full bg-transparent outline-none text-sm py-1 ${th.saisie}`}/>
      </div>
      <ul ref={liste} role="listbox" className="max-h-64 overflow-y-auto py-1">
        {filtrees.length === 0 && <li className={`px-3 py-3 text-sm text-center ${th.vide}`}>{aucunResultat}</li>}
        {filtrees.map((p, i) => (
          <li key={p.code} data-index={i} role="option" aria-selected={p.code === selection}
            onMouseEnter={() => setActif(i)}
            onMouseDown={(e) => { e.preventDefault(); onChoisir(p) }}
            className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer
              ${i === actif ? th.actif : ''}
              ${p.code === selection ? th.choisi : th.normal}`}>
            {rendu(p)}
          </li>
        ))}
      </ul>
    </div>,
    document.body
  )
}
