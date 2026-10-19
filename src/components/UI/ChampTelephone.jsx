import CodePays from './CodePays'
// ─────────────────────────────────────────────────────────────────
// SITRAC — Champ téléphone international : indicatif (drapeau) + numéro
//
//   <ChampTelephone value={fd.telephone} onChange={v => setF('telephone', v)} paysDefaut="MG" />
//
// - L'indicatif suit le pays du client (paysDefaut) tant qu'aucun numéro n'est saisi.
// - La valeur enregistrée est au format international : « +261 34 12 345 67 ».
// - Le numéro est vérifié par le serveur (libphonenumber) pendant la saisie ;
//   s'il est valide, il est mis en forme en quittant le champ.
// ─────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { usePays, verifierTelephone } from '../../utils/referentielsApi'
import { ListePays } from './ChampPays'

const chiffres = (t) => String(t || '').replace(/\D/g, '')

// Découpe « +261 34 12 345 67 » en { code: 'MG', national: '34 12 345 67' }
function decouper(valeur, liste, paysDefaut) {
  const texte = String(valeur || '').trim()
  if (!texte) return { code: paysDefaut, national: '' }
  if (!texte.startsWith('+') && !texte.startsWith('00')) return { code: paysDefaut, national: texte }
  const sansPrefixe = texte.startsWith('00') ? texte.slice(2) : texte.slice(1)
  const tout = chiffres(sansPrefixe)
  let meilleur = null
  for (const p of liste) {
    const ind = chiffres(p.indicatif)
    if (!ind || !tout.startsWith(ind)) continue
    const mieux = !meilleur
      || ind.length > chiffres(meilleur.indicatif).length
      || (ind.length === chiffres(meilleur.indicatif).length
          && (p.code === paysDefaut || (p.indicatif_principal && meilleur.code !== paysDefaut)))
    if (mieux) meilleur = p
  }
  if (!meilleur) return { code: paysDefaut, national: texte }
  // Retire l'indicatif du texte saisi en gardant la mise en forme du reste
  let aRetirer = chiffres(meilleur.indicatif).length
  let i = 0
  const corps = sansPrefixe
  while (i < corps.length && aRetirer > 0) { if (/\d/.test(corps[i])) aRetirer--; i++ }
  return { code: meilleur.code, national: corps.slice(i).trim() }
}

export default function ChampTelephone({ value, onChange, paysDefaut = 'MG', placeholder = 'Numéro', disabled = false, id }) {
  const { liste, parCode } = usePays()
  const [code, setCode] = useState(paysDefaut || 'MG')
  const [national, setNational] = useState('')
  const [ouvert, setOuvert] = useState(false)
  const [verif, setVerif] = useState(null)         // { valide, international, message } | 'encours'
  const emis = useRef(null)                         // dernière valeur envoyée au parent
  const bouton = useRef(null)
  const champ = useRef(null)

  const pays = parCode(code)
  const options = useMemo(() => liste.filter(p => p.indicatif), [liste])

  // Valeur venant du parent (ouverture d'une fiche, réinitialisation du formulaire)
  useEffect(() => {
    if (!liste.length || value === emis.current) return
    const d = decouper(value, liste, paysDefaut || 'MG')
    setCode(d.code || 'MG')
    setNational(d.national)
    emis.current = value
  }, [value, liste]) // eslint-disable-line react-hooks/exhaustive-deps

  // Le pays du client change et aucun numéro n'est saisi : l'indicatif suit
  useEffect(() => {
    if (paysDefaut && !chiffres(national)) setCode(paysDefaut)
  }, [paysDefaut]) // eslint-disable-line react-hooks/exhaustive-deps

  const emettre = (codePays, numero) => {
    const p = parCode(codePays)
    const brut = numero.trim()
    let valeur = ''
    if (brut) valeur = brut.startsWith('+') ? brut : `${p?.indicatif || ''} ${brut}`.trim()
    emis.current = valeur
    onChange(valeur)
  }

  // Vérification par le serveur, 600 ms après la dernière frappe
  useEffect(() => {
    if (chiffres(national).length < 4) { setVerif(null); return }
    setVerif('encours')
    const minuterie = setTimeout(() => {
      verifierTelephone(national.startsWith('+') ? national : `${pays?.indicatif || ''} ${national}`, code)
        .then(setVerif)
        .catch(() => setVerif(null))
    }, 600)
    return () => clearTimeout(minuterie)
  }, [national, code]) // eslint-disable-line react-hooks/exhaustive-deps

  const saisir = (texte) => {
    // Numéro collé avec son indicatif : on reconnaît le pays
    if (texte.trim().startsWith('+') || texte.trim().startsWith('00')) {
      const d = decouper(texte, liste, code)
      if (d.code && d.code !== code) {
        setCode(d.code); setNational(d.national); emettre(d.code, d.national); return
      }
    }
    setNational(texte)
    emettre(code, texte)
  }

  const quitter = () => {
    if (verif && verif !== 'encours' && verif.valide && verif.international) {
      const d = decouper(verif.international, liste, verif.pays || code)
      setCode(d.code); setNational(d.national); emettre(d.code, d.national)
    }
  }

  const choisirPays = (p) => {
    setCode(p.code)
    setOuvert(false)
    emettre(p.code, national)
    champ.current?.focus()
  }

  return (
    <>
      <div className="flex">
        <button
          type="button"
          ref={bouton}
          disabled={disabled}
          onClick={() => setOuvert(o => !o)}
          className="form-control !w-auto flex items-center gap-1.5 !rounded-r-none !border-r-0 px-2.5 whitespace-nowrap"
          aria-label="Indicatif du pays"
          title={pays ? `${pays.nom} (${pays.indicatif})` : 'Indicatif'}
        >
          <CodePays code={pays?.code}/>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{pays?.indicatif || '+'}</span>
          <ChevronDown size={13} className="text-gray-400"/>
        </button>
        <input
          ref={champ}
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          disabled={disabled}
          className="form-control !rounded-l-none flex-1 min-w-0"
          placeholder={placeholder}
          value={national}
          onChange={e => saisir(e.target.value)}
          onBlur={quitter}
        />
      </div>

      {verif === 'encours' && (
        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1"><Loader2 size={11} className="animate-spin"/> Vérification…</p>
      )}
      {verif && verif !== 'encours' && verif.valide && (
        <p className="text-[11px] text-brand-green mt-1 flex items-center gap-1">
          <CheckCircle2 size={11}/> {verif.international}
          {verif.pays && verif.pays !== code && parCode(verif.pays) && ` · ${parCode(verif.pays).nom}`}
        </p>
      )}
      {verif && verif !== 'encours' && !verif.valide && verif.message && (
        <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1"><AlertTriangle size={11}/> {verif.message}</p>
      )}

      {ouvert && (
        <ListePays
          ancre={bouton}
          options={options}
          selection={code}
          rendu={(p) => (
            <>
              <CodePays code={p.code}/>
              <span className="truncate flex-1">{p.nom}</span>
              <span className="text-xs font-semibold text-gray-500">{p.indicatif}</span>
            </>
          )}
          placeholder="Rechercher un pays ou un indicatif…"
          onChoisir={choisirPays}
          onFermer={() => { setOuvert(false); bouton.current?.focus() }}
        />
      )}
    </>
  )
}
