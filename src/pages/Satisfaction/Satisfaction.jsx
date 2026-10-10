/**
 * SITRAC — Satisfaction des voyageurs (questionnaire après le voyage).
 *
 * Résultats : note moyenne, recommandation (NPS), taux de réponse, classements par
 * circuit, guide, chauffeur et hébergement, derniers commentaires.
 * Envois : voyages terminés sans questionnaire (l'envoi est aussi automatique chaque
 * jour avec la commande « envoyer_enquetes ») et état des derniers envois.
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Star, Send, ThumbsUp, MessageSquareQuote, Mail } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { StatCard, Badge, EmptyState } from '../../components/UI/index.jsx'
import { ApiState } from '../../components/UI/ApiLoader.jsx'
import { useAuthStore } from '../../store/authStore'
import { satisfactionAPI } from '../../utils/satisfactionApi'
import { fmtDate, fmtDateTime } from '../../utils/storage'

const etoiles = (n) => (n == null ? '—' : `${(+n).toFixed(1)} ★`)

function Classement({ titre, lignes }) {
  return (
    <div className="card">
      <div className="card-header"><h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">{titre}</h3></div>
      {!lignes.length ? <p className="text-sm text-gray-400 p-4">Pas encore de note.</p> : (
        <table className="tbl text-sm">
          <tbody>
            {lignes.map((l) => (
              <tr key={l.nom}>
                <td className="font-medium">{l.nom}</td>
                <td className={`text-right font-bold ${l.note >= 4.5 ? 'text-brand-green' : l.note < 3.5 ? 'text-brand-red' : ''}`}>{etoiles(l.note)}</td>
                <td className="text-right text-xs text-gray-400 w-20">{l.nb} avis</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function Satisfaction() {
  const { user } = useAuthStore()
  const peutEnvoyer = ['Sales', 'Booking', 'Administration'].includes(user?.dept)
  const qc = useQueryClient()
  const anneeCourante = new Date().getFullYear()
  const [annee, setAnnee] = useState('')
  const [onglet, setOnglet] = useState('resultats')

  const res = useQuery({ queryKey: ['satisfaction', annee], queryFn: () => satisfactionAPI.resultats(annee) })
  const aEnvoyer = useQuery({ queryKey: ['satisfaction-a-envoyer'], queryFn: satisfactionAPI.aEnvoyer })
  const enquetes = useQuery({ queryKey: ['satisfaction-enquetes'], queryFn: satisfactionAPI.enquetes, enabled: onglet === 'envois' })
  const envoyer = useMutation({
    mutationFn: (pc) => satisfactionAPI.envoyer(pc),
    onSuccess: (r) => { toast.success(`Questionnaire envoyé à ${r.email}`); qc.invalidateQueries({ queryKey: ['satisfaction-a-envoyer'] }); qc.invalidateQueries({ queryKey: ['satisfaction-enquetes'] }); qc.invalidateQueries({ queryKey: ['satisfaction'] }) },
    onError: (e) => toast.error(e.message),
  })
  const r = res.data

  return (
    <Layout breadcrumb={['SITRAC', 'Relation client', 'Satisfaction voyageurs']}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title"><Star size={22} className="text-orange" /> Satisfaction des voyageurs</h1>
          <p className="page-sub">Questionnaire envoyé 2 jours après le retour, rappel à 7 jours.</p>
        </div>
        <select className="form-control !w-auto !py-1.5 text-sm" value={annee} onChange={(e) => setAnnee(e.target.value)}>
          <option value="">Toutes les années</option>
          {[anneeCourante + 1, anneeCourante, anneeCourante - 1, anneeCourante - 2].map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Star} value={etoiles(r?.moyennes?.globale)} label="Note globale moyenne" color="orange" />
        <StatCard icon={ThumbsUp} value={r?.nps != null ? r.nps : '—'} label="Recommandation (NPS, de −100 à +100)" color="green" />
        <StatCard icon={Mail} value={r?.taux_reponse != null ? `${r.taux_reponse} %` : '—'} label={`Taux de réponse (${r?.reponses ?? 0}/${r?.envoyees ?? 0})`} color="blue" />
        <StatCard icon={Send} value={aEnvoyer.data?.length ?? '—'} label="Voyages terminés sans questionnaire" color="purple" />
      </div>

      <div className="flex gap-2 mb-4">
        {[['resultats', 'Résultats'], ['commentaires', 'Commentaires'], ['envois', 'Envois']].map(([k, l]) => (
          <button key={k} className={`btn btn-sm ${onglet === k ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOnglet(k)}>{l}</button>
        ))}
      </div>

      {onglet === 'resultats' && (
        <ApiState isLoading={res.isLoading} error={res.error} onRetry={res.refetch} loadingText="Calcul des résultats...">
          {r && (
            <>
              <div className="card mb-4 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[['Organisation', r.moyennes.organisation], ['Guides', r.moyennes.guide], ['Chauffeurs', r.moyennes.chauffeur], ['Véhicules', r.moyennes.vehicule]].map(([k, v]) => (
                  <div key={k}><div className="text-xs text-gray-400 uppercase font-bold">{k}</div><div className="text-xl font-black">{etoiles(v)}</div></div>
                ))}
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <Classement titre="Par circuit (note globale)" lignes={r.par_circuit} />
                <Classement titre="Par hébergement / activité" lignes={r.par_prestataire} />
                <Classement titre="Par guide" lignes={r.par_guide} />
                <Classement titre="Par chauffeur" lignes={r.par_chauffeur} />
              </div>
            </>
          )}
        </ApiState>
      )}

      {onglet === 'commentaires' && (
        <ApiState isLoading={res.isLoading} error={res.error} onRetry={res.refetch}>
          {!r?.commentaires.length ? <EmptyState icon={MessageSquareQuote} title="Aucun commentaire" desc="Les commentaires des voyageurs apparaîtront ici." /> : (
            <div className="space-y-3">
              {r.commentaires.map((c) => (
                <div key={c.id} className="card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="text-sm"><b>{c.client}</b> · {c.programme} · PC#{c.pc}</div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold text-orange">{etoiles(c.note)}</span>
                      {c.recommandation != null && <Badge variant={c.recommandation >= 9 ? 'active' : c.recommandation <= 6 ? 'inactive' : 'pending'}>Reco {c.recommandation}/10</Badge>}
                      {c.publication && <Badge variant="info">Publiable</Badge>}
                      <span className="text-xs text-gray-400">{fmtDateTime(c.date)}</span>
                    </div>
                  </div>
                  {c.points_forts && <p className="text-sm"><span className="text-brand-green font-semibold">+ </span>{c.points_forts}</p>}
                  {c.a_ameliorer && <p className="text-sm mt-1"><span className="text-brand-red font-semibold">− </span>{c.a_ameliorer}</p>}
                </div>
              ))}
            </div>
          )}
        </ApiState>
      )}

      {onglet === 'envois' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card">
            <div className="card-header"><h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Voyages terminés sans questionnaire</h3></div>
            <ApiState isLoading={aEnvoyer.isLoading} error={aEnvoyer.error} onRetry={aEnvoyer.refetch}>
              {!aEnvoyer.data?.length ? <p className="text-sm text-gray-400 p-4">Aucun : tous les voyages terminés récemment ont reçu leur questionnaire.</p> : (
                <table className="tbl text-sm"><tbody>
                  {aEnvoyer.data.map((x) => (
                    <tr key={x.pc}>
                      <td><b>{x.client}</b><div className="text-xs text-gray-400">{x.programme} · retour {fmtDate(x.date_fin)}</div></td>
                      <td className="text-right">{peutEnvoyer && <button className="btn btn-primary btn-xs" disabled={envoyer.isPending} onClick={() => envoyer.mutate(x.pc)}><Send size={12} /> Envoyer</button>}</td>
                    </tr>
                  ))}
                </tbody></table>
              )}
            </ApiState>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200">Derniers envois</h3></div>
            <ApiState isLoading={enquetes.isLoading} error={enquetes.error} onRetry={enquetes.refetch}>
              {!enquetes.data?.length ? <p className="text-sm text-gray-400 p-4">Aucun questionnaire envoyé pour l'instant.</p> : (
                <table className="tbl text-sm"><tbody>
                  {enquetes.data.map((e) => (
                    <tr key={e.id}>
                      <td><b>{e.client}</b><div className="text-xs text-gray-400">{e.programme} · envoyé le {fmtDate(e.envoyee_le)}{e.rappel_le ? ' · rappel envoyé' : ''}</div></td>
                      <td className="text-right">
                        {e.repondue_le ? <Badge variant="active">{etoiles(e.note_globale)}</Badge>
                          : e.expiree ? <Badge variant="inactive">Expiré</Badge> : <Badge variant="pending">En attente</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody></table>
              )}
            </ApiState>
          </div>
        </div>
      )}
    </Layout>
  )
}