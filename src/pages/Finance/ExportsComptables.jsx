/**
 * SITRAC — Exports comptables.
 *
 * Choix d'une période (mois, trimestre, année ou dates libres), aperçu des journaux
 * avec leurs totaux, puis téléchargement en CSV (import dans un logiciel comptable,
 * séparateur « ; », virgule décimale) ou en Excel, ou d'un classeur Excel complet.
 * Les écritures sont en partie double : le contrôle « Débit = Crédit » est affiché.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FileSpreadsheet, Download, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { StatCard } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { exportsAPI } from '../../utils/exportsApi'
import { fmt } from '../../utils/storage'

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const auj = new Date()
const PERIODES = {
  mois:        () => [new Date(auj.getFullYear(), auj.getMonth(), 1), new Date(auj.getFullYear(), auj.getMonth() + 1, 0)],
  mois_dernier:() => [new Date(auj.getFullYear(), auj.getMonth() - 1, 1), new Date(auj.getFullYear(), auj.getMonth(), 0)],
  trimestre:   () => { const t = Math.floor(auj.getMonth() / 3) * 3; return [new Date(auj.getFullYear(), t, 1), new Date(auj.getFullYear(), t + 3, 0)] },
  annee:       () => [new Date(auj.getFullYear(), 0, 1), new Date(auj.getFullYear(), 11, 31)],
}
const LIBELLES = { mois: 'Ce mois', mois_dernier: 'Mois dernier', trimestre: 'Ce trimestre', annee: 'Cette année' }
const DESCRIPTIONS = {
  ventes: 'Factures définitives émises sur la période.',
  encaissements: 'Paiements clients reçus, y compris en ligne.',
  depenses: 'Dépenses réelles des dossiers clôturés (coût des voyages).',
  reglements: 'Reçus de paiement aux prestataires.',
  creances: 'Sommes restant dues par les clients à la date de fin, par ancienneté.',
  marges: 'Recettes, dépenses et bénéfice des dossiers clôturés.',
  ecritures: 'Écritures en partie double, prêtes à importer dans le logiciel comptable.',
}

export default function ExportsComptables() {
  const [choix, setChoix] = useState('mois')
  const [[debut, fin], setPeriode] = useState(() => PERIODES.mois().map(iso))
  const [enCours, setEnCours] = useState('')

  const apercu = useQuery({ queryKey: ['exports-apercu', debut, fin], queryFn: () => exportsAPI.apercu(debut, fin), enabled: !!debut && !!fin })
  const a = apercu.data

  const choisir = (k) => { setChoix(k); setPeriode(PERIODES[k]().map(iso)) }
  const telecharger = async (cle, fn) => {
    setEnCours(cle)
    try { await fn() } catch (e) { toast.error(e.message) } finally { setEnCours('') }
  }
  const total = (cle) => a?.journaux.find((j) => j.cle === cle)

  return (
    <Layout breadcrumb={['SITRAC', 'Finance', 'Exports comptables']}>
      <div className="mb-5">
        <h1 className="page-title"><FileSpreadsheet size={22} className="text-orange" /> Exports comptables</h1>
        <p className="page-sub">Journaux et écritures de la période, à transmettre au comptable ou à importer dans le logiciel de comptabilité.</p>
      </div>

      <div className="card mb-5 p-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {Object.keys(PERIODES).map((k) => (
            <button key={k} className={`btn btn-sm ${choix === k ? 'btn-primary' : 'btn-ghost'}`} onClick={() => choisir(k)}>{LIBELLES[k]}</button>
          ))}
        </div>
        <div className="flex items-end gap-2 ml-auto">
          <div><label className="form-label text-xs">Du</label>
            <input type="date" className="form-control !py-1.5 text-sm" value={debut} onChange={(e) => { setChoix(''); setPeriode([e.target.value, fin]) }} /></div>
          <div><label className="form-label text-xs">Au</label>
            <input type="date" className="form-control !py-1.5 text-sm" value={fin} onChange={(e) => { setChoix(''); setPeriode([debut, e.target.value]) }} /></div>
          <button className="btn btn-success btn-sm" disabled={!!enCours} onClick={() => telecharger('classeur', () => exportsAPI.classeur(debut, fin))}>
            <Download size={14} /> {enCours === 'classeur' ? 'Préparation…' : 'Classeur Excel complet'}
          </button>
        </div>
      </div>

      <ApiState isLoading={apercu.isLoading} error={apercu.error} onRetry={apercu.refetch} loadingText="Calcul des journaux...">
        {a && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <StatCard icon={FileSpreadsheet} value={fmt(total('ventes')?.total)} label={`Ventes (${total('ventes')?.lignes} factures)`} color="orange" />
              <StatCard icon={FileSpreadsheet} value={fmt(total('encaissements')?.total)} label={`Encaissements (${total('encaissements')?.lignes})`} color="green" />
              <StatCard icon={FileSpreadsheet} value={fmt(total('depenses')?.total)} label="Dépenses des dossiers clôturés" color="red" />
              <StatCard icon={FileSpreadsheet} value={fmt(total('creances')?.total)} label={`Reste dû par les clients au ${fin.split('-').reverse().join('/')}`} color="blue" />
            </div>

            <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${a.equilibre ? 'bg-green-50 dark:bg-green-900/20 text-brand-green' : 'bg-red-50 dark:bg-red-900/20 text-brand-red'}`}>
              {a.equilibre ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              Écritures {a.equilibre ? 'équilibrées' : 'déséquilibrées'} : total débit {fmt(a.total_debit)} — total crédit {fmt(a.total_credit)}
            </div>

            <div className="card">
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead><tr><th>Journal</th><th className="text-center">Lignes</th><th className="text-right">Total</th><th className="text-right">Télécharger</th></tr></thead>
                  <tbody>
                    {a.journaux.map((j) => (
                      <tr key={j.cle}>
                        <td><div className="font-semibold text-gray-900 dark:text-white">{j.titre}</div><div className="text-xs text-gray-400">{DESCRIPTIONS[j.cle]}</div></td>
                        <td className="text-center">{j.lignes}</td>
                        <td className="text-right font-semibold">{j.cle === 'ecritures' ? `${fmt(j.total)} (débit)` : fmt(j.total)}</td>
                        <td className="text-right whitespace-nowrap">
                          <button className="btn btn-ghost btn-xs" disabled={!!enCours} onClick={() => telecharger(`${j.cle}-csv`, () => exportsAPI.journal(j.cle, debut, fin, 'csv'))}>
                            <Download size={12} /> CSV
                          </button>{' '}
                          <button className="btn btn-ghost btn-xs" disabled={!!enCours} onClick={() => telecharger(`${j.cle}-xlsx`, () => exportsAPI.journal(j.cle, debut, fin, 'xlsx'))}>
                            <Download size={12} /> Excel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card mt-4 p-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="font-semibold mb-2 flex items-center gap-2"><BookOpen size={15} className="text-orange" /> Comptes utilisés pour les écritures</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                {[['Clients', a.comptes.clients], ['Prestations de services (ventes)', a.comptes.ventes], ['Banque', a.comptes.banque],
                  ['Caisse (paiements en espèces)', a.comptes.caisse], ['Fournisseurs', a.comptes.fournisseurs], ['Achats de prestations', a.comptes.achats]].map(([l, c]) => (
                  <div key={l}><span className="font-mono font-bold text-brand-blue">{c}</span> {l}</div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Comptes auxiliaires : C + n° client, F + n° de fiche prestataire. Plan de comptes à valider avec le comptable de l'agence ; chaque compte se modifie dans le fichier .env.</p>
            </div>
          </>
        )}
      </ApiState>
    </Layout>
  )
}