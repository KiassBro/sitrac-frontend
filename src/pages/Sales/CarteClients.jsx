/**
 * SITRAC — Cartographie des clients : nombre de clients par pays.
 *  - le nombre est affiché sur chaque pays (pastille), les pays les plus représentés
 *    sont plus foncés et ont une pastille plus grande ;
 *  - mise à jour automatique (toutes les minutes, au retour sur l'onglet et dès qu'un
 *    client est ajouté ou modifié dans SITRAC) ;
 *  - un clic sur un pays (ou dans le classement) affiche ses clients.
 * Fond de carte : Natural Earth via « world-atlas » (embarqué, aucun service externe).
 */
import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { geoArea, geoCentroid, geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import monde from 'world-atlas/countries-110m.json'
import {
  Globe2, Home, Loader2, MapPin, Minus, Plus, RefreshCw, Trophy, Users, X, AlertTriangle, Flag,
} from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { salesAPI } from '../../utils/api'
import CODES from '../../data/pays-carte.json'          // code ISO -> [code numérique, latitude, longitude]

const L = 960, H = 500
const projection = geoNaturalEarth1().fitExtent([[8, 8], [L - 8, H - 8]], { type: 'Sphere' })
const chemin = geoPath(projection)
const PAYS = feature(monde, monde.objects.countries).features.filter((f) => f.id !== '010')   // sans l'Antarctique
const PAR_NUMERO = Object.fromEntries(PAYS.filter((f) => f.id).map((f) => [f.id, f]))

// Palette SITRAC : du plus clair (peu de clients) au vert foncé (beaucoup)
const NUANCES = ['#DCEBE2', '#B3D4C0', '#7FB396', '#3F8A63', '#1F4D3A']
const niveau = (n, max) => (n <= 0 ? -1 : Math.min(4, Math.max(0, Math.ceil((Math.log(n + 1) / Math.log(max + 1)) * 5) - 1)))

// Vues prédéfinies [lon min, lat min, lon max, lat max]
const VUES = {
  Monde: null,
  Europe: [-12, 35, 32, 62],
  'Afrique & océan Indien': [-20, -36, 65, 30],
  Amériques: [-130, -50, -35, 60],
  'Asie & Océanie': [60, -45, 180, 55],
}
function cadre(boite) {
  if (!boite) return [0, 0, L, H]
  const [a, b] = projection([boite[0], boite[3]]), [c, d] = projection([boite[2], boite[1]])
  const w = c - a, h = d - b, ratio = L / H
  const larg = Math.max(w, h * ratio), haut = larg / ratio
  return [a + w / 2 - larg / 2, b + h / 2 - haut / 2, larg, haut]
}

/** Point où poser la pastille : centre du plus grand morceau du pays (ex. la France métropolitaine). */
function ancre(code) {
  const info = CODES[code]
  const f = info && PAR_NUMERO[info[0]]
  if (f) {
    let geo = f
    if (f.geometry.type === 'MultiPolygon') {
      const morceaux = f.geometry.coordinates.map((c) => ({ type: 'Polygon', coordinates: c }))
      geo = morceaux.reduce((m, p) => (geoArea(p) > geoArea(m) ? p : m))
    }
    return projection(geoCentroid(geo))
  }
  return info ? projection([info[2], info[1]]) : null      // petits pays absents du fond (Maurice, Réunion…)
}

const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`

export default function CarteClients() {
  const [source, setSource] = useState('residence')
  const [vue, setVue] = useState('Monde')
  const [boite, setBoite] = useState([0, 0, L, H])
  const [survol, setSurvol] = useState(null)        // { code, x, y }
  const [choix, setChoix] = useState(null)
  const [voirNonLocalises, setVoirNonLocalises] = useState(false)
  const zone = useRef(null)

  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['clients', 'par-pays', source],
    queryFn: () => salesAPI.getClientsParPays(source),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  })

  const pays = useMemo(() => data?.pays || [], [data])
  const max = pays[0]?.total || 1
  const parNumero = useMemo(() => Object.fromEntries(pays.filter((p) => CODES[p.code]?.[0]).map((p) => [CODES[p.code][0], p])), [pays])
  const paysDe = (f) => (f.id ? parNumero[f.id] : undefined)
  const pastilles = useMemo(() => pays.map((p, rang) => ({ ...p, rang, xy: ancre(p.code) })).filter((p) => p.xy), [pays])
  const selection = pays.find((p) => p.code === choix)
  const k = boite[2] / L                                  // échelle : pastilles de taille constante à l'écran
  const rayon = (p) => (7 + 11 * Math.sqrt(p.total / max)) * k

  // Noms des pays affichés sous les pastilles, sans chevauchement (les plus gros d'abord)
  const nomsVisibles = useMemo(() => {
    const places = pastilles.map((p) => {
      const r = rayon(p)
      return [p.xy[0] - r, p.xy[1] - r, p.xy[0] + r, p.xy[1] + r]
    })
    const visibles = new Set()
    for (const p of pastilles) {
      const r = rayon(p), larg = p.nom.length * 5.2 * k, y = p.xy[1] + r + 2 * k
      const cadreNom = [p.xy[0] - larg / 2, y, p.xy[0] + larg / 2, y + 10 * k]
      const touche = places.some((b) => !(cadreNom[2] < b[0] || cadreNom[0] > b[2] || cadreNom[3] < b[1] || cadreNom[1] > b[3]))
      if (!touche && visibles.size < 12) { visibles.add(p.code); places.push(cadreNom) }
    }
    return visibles
  }, [pastilles, k, max])

  const allerVers = (nom) => { setVue(nom); setBoite(cadre(VUES[nom])) }
  const zoomer = (f) => setBoite(([x, y, w, h]) => {
    const nw = Math.min(L, Math.max(L / 12, w * f)), nh = nw * H / L
    return [Math.max(-L * 0.2, Math.min(x + (w - nw) / 2, L - nw * 0.8)), Math.max(-H * 0.2, Math.min(y + (h - nh) / 2, H - nh * 0.8)), nw, nh]
  })
  const suivre = (e, code) => {
    const r = zone.current?.getBoundingClientRect()
    if (r) setSurvol({ code, x: e.clientX - r.left, y: e.clientY - r.top })
  }
  const infoSurvol = survol && pays.find((p) => p.code === survol.code)
  const nomSurvol = survol && (infoSurvol?.nom || survol.nom)

  return (
    <Layout breadcrumb={['SITRAC', 'Clients', 'Cartographie']}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="page-title flex items-center gap-2"><Globe2 size={22} className="text-orange" /> Cartographie des clients</h1>
          <p className="page-sub">Répartition de la clientèle par pays — mise à jour automatiquement</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-white dark:bg-gray-900 text-sm" role="group" aria-label="Pays pris en compte">
            {[['residence', 'Pays de résidence'], ['nationalite', 'Nationalité']].map(([v, lib]) => (
              <button key={v} onClick={() => { setSource(v); setChoix(null) }}
                className={`px-3 py-1.5 rounded-md font-semibold transition ${source === v ? 'bg-orange text-white' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}>
                {lib}
              </button>
            ))}
          </div>
          <button onClick={() => refetch()} className="btn btn-ghost btn-sm" title="Actualiser">
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Chiffres clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          [Users, 'Clients', data?.total_clients ?? '—'],
          [Flag, 'Pays représentés', data?.nb_pays ?? '—'],
          [Trophy, 'Premier pays', pays[0] ? `${pays[0].nom} (${pays[0].total})` : '—'],
          [AlertTriangle, 'Sans pays connu', data?.non_localises?.length ?? '—', () => setVoirNonLocalises((v) => !v)],
        ].map(([Icone, lib, val, clic]) => (
          <button key={lib} type="button" onClick={clic} disabled={!clic}
            className="card p-4 flex items-center gap-3 text-left disabled:cursor-default enabled:hover:border-orange transition">
            <span className="w-10 h-10 rounded-xl bg-orange/10 text-orange grid place-items-center shrink-0"><Icone size={19} /></span>
            <span className="min-w-0">
              <span className="block text-xs text-gray-500">{lib}</span>
              <span className="block font-bold text-gray-900 dark:text-white truncate">{val}</span>
            </span>
          </button>
        ))}
      </div>

      {voirNonLocalises && data?.non_localises?.length > 0 && (
        <div className="card p-4 mb-5 text-sm">
          <p className="font-semibold mb-2">Clients sans pays reconnu — complétez leur fiche (pays ou nationalité) pour les placer sur la carte :</p>
          <p className="text-gray-600 dark:text-gray-400">{data.non_localises.map((c) => c.nom).join(' · ')}</p>
        </div>
      )}

      <div className="grid xl:grid-cols-[1fr_320px] gap-5">
        {/* Carte */}
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-1.5 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            {Object.keys(VUES).map((nom) => (
              <button key={nom} onClick={() => allerVers(nom)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition
                  ${vue === nom ? 'border-orange bg-orange/10 text-orange' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange hover:text-orange'}`}>
                {nom}
              </button>
            ))}
            <span className="ml-auto flex gap-1">
              <button onClick={() => { setVue(''); zoomer(0.7) }} className="w-7 h-7 rounded-md border border-gray-200 dark:border-gray-700 grid place-items-center hover:text-orange" aria-label="Zoomer"><Plus size={14} /></button>
              <button onClick={() => { setVue(''); zoomer(1.4) }} className="w-7 h-7 rounded-md border border-gray-200 dark:border-gray-700 grid place-items-center hover:text-orange" aria-label="Dézoomer"><Minus size={14} /></button>
              <button onClick={() => allerVers('Monde')} className="w-7 h-7 rounded-md border border-gray-200 dark:border-gray-700 grid place-items-center hover:text-orange" aria-label="Vue d'ensemble"><Home size={14} /></button>
            </span>
          </div>

          <div ref={zone} className="relative bg-[#F4F8FB] dark:bg-gray-950" onMouseLeave={() => setSurvol(null)}>
            {isLoading && <div className="absolute inset-0 grid place-items-center z-10"><Loader2 className="animate-spin text-gray-400" /></div>}
            {isError && <div className="absolute inset-0 grid place-items-center z-10 text-sm text-red-600">Impossible de charger les données.</div>}
            <svg viewBox={boite.join(' ')} className="w-full h-auto block select-none" style={{ aspectRatio: `${L} / ${H}`, transition: 'all .2s' }} role="img"
              aria-label="Carte du monde : nombre de clients par pays">
              <path d={chemin({ type: 'Sphere' })} className="fill-[#EAF2F7] dark:fill-gray-900" />
              {PAYS.map((f) => {
                const p = paysDe(f)
                const n = p ? niveau(p.total, max) : -1
                const actif = p && (p.code === choix || p.code === survol?.code)
                return (
                  <path key={f.id || f.properties?.name} d={chemin(f)}
                    fill={n >= 0 ? NUANCES[n] : undefined}
                    className={`${n < 0 ? 'fill-white dark:fill-gray-800' : ''} stroke-[#C9D3CD] dark:stroke-gray-700 transition-[fill] ${p ? 'cursor-pointer' : ''}`}
                    strokeWidth={(actif ? 1.6 : 0.5) * k} stroke={actif ? '#E8862A' : undefined}
                    onMouseMove={(e) => (p ? suivre(e, p.code) : setSurvol({ code: null, nom: f.properties?.name, x: 0, y: 0, vide: true }))}
                    onClick={() => p && setChoix(p.code)} />
                )
              })}
              {/* Pastilles : nombre de clients visible sans cliquer */}
              {[...pastilles].reverse().map((p) => {
                const r = rayon(p)
                const top = nomsVisibles.has(p.code)
                return (
                  <g key={p.code} transform={`translate(${p.xy[0]},${p.xy[1]})`} className="cursor-pointer"
                    onMouseMove={(e) => suivre(e, p.code)} onClick={() => setChoix(p.code)}>
                    <circle r={r} fill={p.code === choix ? '#1F4D3A' : '#E8862A'} stroke="#fff" strokeWidth={1.5 * k}
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.25))' }} />
                    <text textAnchor="middle" dominantBaseline="central" fill="#fff" fontWeight="700"
                      fontSize={(p.total > 99 ? 8.5 : 10.5) * k} style={{ pointerEvents: 'none' }}>{p.total}</text>
                    {top && (
                      <text y={r + 8 * k} textAnchor="middle" fontSize={9 * k} fontWeight="700"
                        className="fill-gray-800 dark:fill-gray-100" stroke="white" strokeWidth={2.5 * k} paintOrder="stroke"
                        style={{ pointerEvents: 'none' }}>{p.nom}</text>
                    )}
                  </g>
                )
              })}
            </svg>

            {survol && !survol.vide && nomSurvol && (
              <div className="pointer-events-none absolute z-20 rounded-lg bg-gray-900/90 text-white text-xs px-2.5 py-1.5 shadow-lg whitespace-nowrap"
                style={{ left: survol.x + 12, top: survol.y + 12 }}>
                <strong>{nomSurvol}</strong> : {pluriel(infoSurvol?.total || 0, 'client')}
                {infoSurvol?.pax ? ` · ${infoSurvol.pax} PAX` : ''}
              </div>
            )}

            {/* Légende */}
            <div className="absolute left-3 bottom-3 rounded-lg bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 px-3 py-2 text-[11px] text-gray-600 dark:text-gray-300">
              <p className="font-semibold mb-1">Nombre de clients</p>
              <div className="flex items-center gap-1">
                <span>peu</span>
                {NUANCES.map((c) => <span key={c} className="w-5 h-2.5 rounded-sm" style={{ background: c }} />)}
                <span>beaucoup</span>
              </div>
            </div>
          </div>
          <p className="px-4 py-2 text-[11px] text-gray-400 border-t border-gray-100 dark:border-gray-800">
            {source === 'residence'
              ? `Pays de l'adresse du client${data?.deduits_de_la_nationalite ? ` (${data.deduits_de_la_nationalite} client(s) sans adresse placé(s) selon leur nationalité)` : ''}.`
              : 'Pays de la nationalité du client.'}
            {dataUpdatedAt ? ` Mis à jour à ${new Date(dataUpdatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.` : ''}
          </p>
        </div>

        {/* Classement / détail */}
        <div className="card flex flex-col max-h-[640px]">
          {selection ? (
            <>
              <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><MapPin size={15} className="text-orange" /> {selection.nom}</p>
                  <p className="text-xs text-gray-500">{pluriel(selection.total, 'client')} · {selection.pax} PAX</p>
                </div>
                <button onClick={() => setChoix(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400" aria-label="Fermer"><X size={16} /></button>
              </div>
              <ul className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {selection.clients.map((c) => (
                  <li key={c.id} className="px-4 py-2.5 text-sm">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{c.nom}</p>
                    <p className="text-xs text-gray-500">
                      {[c.ville, c.nationalite, c.nb_pax ? `${c.nb_pax} PAX` : '', c.type_groupe].filter(Boolean).join(' · ')}
                    </p>
                    {c.email && <a href={`mailto:${c.email}`} className="text-xs text-orange hover:underline break-all">{c.email}</a>}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="font-bold text-gray-900 dark:text-white">Classement des pays</p>
                <p className="text-xs text-gray-500">Cliquez sur un pays pour voir ses clients</p>
              </div>
              <ol className="flex-1 overflow-y-auto">
                {pays.map((p, i) => (
                  <li key={p.code}>
                    <button onClick={() => setChoix(p.code)} onMouseEnter={() => setSurvol({ code: p.code, x: -999, y: -999 })}
                      onMouseLeave={() => setSurvol(null)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className={`w-5 text-xs font-bold ${i < 3 ? 'text-orange' : 'text-gray-400'}`}>{i + 1}</span>
                          <span className="truncate font-medium text-gray-800 dark:text-gray-200">{p.nom}</span>
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white shrink-0">{pluriel(p.total, 'client')}</span>
                      </div>
                      <div className="ml-7 mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(p.total / max) * 100}%`, background: NUANCES[Math.max(1, niveau(p.total, max))] }} />
                      </div>
                    </button>
                  </li>
                ))}
                {!isLoading && !pays.length && <li className="p-6 text-center text-sm text-gray-400">Aucun client localisé pour le moment.</li>}
              </ol>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
