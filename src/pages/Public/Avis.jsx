/**
 * SITRAC — Questionnaire de satisfaction public (/avis/:jeton).
 *
 * Ouvert depuis l'email envoyé 2 jours après le retour. En anglais ou en français
 * (langue du client, modifiable en haut à droite). 2 minutes : note globale
 * obligatoire, le reste est facultatif.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Star } from 'lucide-react'
import { Bloc, Bouton, Champ, champClasse, Chargement, Message, PortailLayout } from '../../portail/composants'
import { useLangue } from '../../portail/i18n'
import { avisPublicAPI } from '../../utils/satisfactionApi'

const T = {
  en: {
    titre: 'How was your trip?', intro: 'Thank you for travelling with us, {client}. Your feedback on "{programme}" takes 2 minutes and helps us improve every trip.',
    globale: 'Overall, how would you rate your trip? *', organisation: 'Organisation and communication before the trip',
    guide: 'Your guide', chauffeur: 'Your driver', vehicule: 'Vehicle comfort and condition',
    hebergements: 'Your accommodation and activities', commentaire_p: 'A word about this place (optional)',
    recommandation: 'How likely are you to recommend Ramartour to a friend?', peu: 'Not likely', tres: 'Very likely',
    forts: 'What did you enjoy most?', ameliorer: 'What could we improve?',
    publication: 'Ramartour may publish my comment (first name and country only).',
    envoyer: 'Send my feedback', merci: 'Thank you!', merci_texte: 'Your feedback has been sent to our team. Misaotra betsaka — thank you very much!',
    deja: 'You have already answered this questionnaire. Thank you!', expire: 'This questionnaire has expired. You can still write to us at info@ramartour.com.',
    introuvable: 'This link is not valid.',
  },
  fr: {
    titre: 'Comment s\'est passé votre voyage ?', intro: 'Merci d\'avoir voyagé avec nous, {client}. Votre avis sur « {programme} » prend 2 minutes et nous aide à améliorer chaque voyage.',
    globale: 'Dans l\'ensemble, quelle note donnez-vous à votre voyage ? *', organisation: 'Organisation et communication avant le voyage',
    guide: 'Votre guide', chauffeur: 'Votre chauffeur', vehicule: 'Confort et état du véhicule',
    hebergements: 'Vos hébergements et activités', commentaire_p: 'Un mot sur ce lieu (facultatif)',
    recommandation: 'Recommanderiez-vous Ramartour à un proche ?', peu: 'Pas du tout', tres: 'Absolument',
    forts: 'Qu\'avez-vous préféré ?', ameliorer: 'Que pourrions-nous améliorer ?',
    publication: 'Ramartour peut publier mon commentaire (prénom et pays uniquement).',
    envoyer: 'Envoyer mon avis', merci: 'Merci !', merci_texte: 'Votre avis a bien été transmis à notre équipe. Misaotra betsaka — merci beaucoup !',
    deja: 'Vous avez déjà répondu à ce questionnaire. Merci !', expire: 'Ce questionnaire a expiré. Vous pouvez toujours nous écrire à info@ramartour.com.',
    introuvable: 'Ce lien n\'est pas valable.',
  },
}

function Etoiles({ valeur, onChange, label }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={valeur === n} aria-label={`${n}/5`}
          onClick={() => onChange(valeur === n ? null : n)}
          className="p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-rt-canopy rounded">
          <Star size={28} className={n <= (valeur || 0) ? 'fill-rt-ocre text-rt-ocre' : 'text-rt-line'} />
        </button>
      ))}
    </div>
  )
}

export default function Avis() {
  const { jeton } = useParams()
  const { langue, setLangue } = useLangue()
  const t = T[langue] || T.en
  const [d, setD] = useState(null)
  const [erreurChargement, setErreurChargement] = useState('')
  const [r, setR] = useState({ note_globale: null, note_organisation: null, note_guide: null, note_chauffeur: null,
    note_vehicule: null, recommandation: null, points_forts: '', a_ameliorer: '', accepte_publication: false, prestations: {} })
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [fini, setFini] = useState(false)

  useEffect(() => {
    avisPublicAPI.lire(jeton).then((x) => { setD(x); if (x.langue) setLangue(x.langue) })
      .catch((e) => setErreurChargement(e.status === 404 ? 'introuvable' : e.message))
  }, [jeton]) // eslint-disable-line

  const soumettre = async (e) => {
    e.preventDefault()
    setEnvoi(true); setErreur('')
    try {
      await avisPublicAPI.repondre(jeton, { ...r, prestations: Object.entries(r.prestations).map(([id, v]) => ({ id: Number(id), ...v })) })
      setFini(true); window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (ex) { setErreur(ex.message) } finally { setEnvoi(false) }
  }
  const prest = (id, k, v) => setR({ ...r, prestations: { ...r.prestations, [id]: { ...(r.prestations[id] || {}), [k]: v } } })

  if (erreurChargement) return <PortailLayout connecte={false}><Message type="erreur">{erreurChargement === 'introuvable' ? t.introuvable : erreurChargement}</Message></PortailLayout>
  if (!d) return <PortailLayout connecte={false}><Chargement /></PortailLayout>
  if (fini || d.repondue || d.expiree) {
    return (
      <PortailLayout connecte={false}>
        <Bloc><div className="text-center py-6">
          <CheckCircle2 size={44} className="mx-auto text-rt-canopy mb-3" aria-hidden />
          <h1 className="font-title text-2xl font-bold mb-2">{fini ? t.merci : ''}</h1>
          <p className="text-rt-stone max-w-md mx-auto">{fini ? t.merci_texte : d.repondue ? t.deja : t.expire}</p>
        </div></Bloc>
      </PortailLayout>
    )
  }

  const ligne = (cle, label) => (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-rt-line last:border-0">
      <span className="text-[15px]">{label}</span>
      <Etoiles valeur={r[cle]} label={label} onChange={(v) => setR({ ...r, [cle]: v })} />
    </div>
  )

  return (
    <PortailLayout connecte={false}>
      <h1 className="font-title text-2xl font-bold mb-2">{t.titre}</h1>
      <p className="text-rt-stone mb-6">{t.intro.replace('{client}', d.client).replace('{programme}', d.programme)}</p>
      <form onSubmit={soumettre} className="space-y-5">
        {erreur && <Message type="erreur">{erreur}</Message>}
        <Bloc>
          <div className="mb-4">
            <div className="font-semibold mb-2">{t.globale}</div>
            <Etoiles valeur={r.note_globale} label={t.globale} onChange={(v) => setR({ ...r, note_globale: v })} />
          </div>
          {ligne('note_organisation', t.organisation)}
          {ligne('note_guide', `${t.guide}${d.guide ? ` — ${d.guide}` : ''}`)}
          {ligne('note_chauffeur', `${t.chauffeur}${d.chauffeur ? ` — ${d.chauffeur}` : ''}`)}
          {ligne('note_vehicule', t.vehicule)}
        </Bloc>

        {d.prestations.length > 0 && (
          <Bloc titre={t.hebergements}>
            <div className="space-y-4">
              {d.prestations.map((p) => (
                <div key={p.id} className="border-b border-rt-line last:border-0 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{p.nom}</span>
                    <Etoiles valeur={r.prestations[p.id]?.note} label={p.nom} onChange={(v) => prest(p.id, 'note', v)} />
                  </div>
                  <input className={`${champClasse} mt-2`} placeholder={t.commentaire_p} value={r.prestations[p.id]?.commentaire || ''}
                    onChange={(e) => prest(p.id, 'commentaire', e.target.value)} />
                </div>
              ))}
            </div>
          </Bloc>
        )}

        <Bloc titre={t.recommandation}>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 11 }, (_, n) => (
              <button key={n} type="button" onClick={() => setR({ ...r, recommandation: n })} aria-pressed={r.recommandation === n}
                className={`w-10 h-10 rounded-md border text-sm font-semibold ${r.recommandation === n ? 'bg-rt-canopy text-white border-rt-canopy' : 'bg-white border-rt-line text-rt-ink hover:border-rt-canopy'}`}>
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-rt-stone mt-1 max-w-[470px]"><span>{t.peu}</span><span>{t.tres}</span></div>
        </Bloc>

        <Bloc>
          <div className="space-y-4">
            <Champ label={t.forts} id="forts"><textarea id="forts" rows={3} className={champClasse} value={r.points_forts} onChange={(e) => setR({ ...r, points_forts: e.target.value })} /></Champ>
            <Champ label={t.ameliorer} id="ameliorer"><textarea id="ameliorer" rows={3} className={champClasse} value={r.a_ameliorer} onChange={(e) => setR({ ...r, a_ameliorer: e.target.value })} /></Champ>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5" checked={r.accepte_publication} onChange={(e) => setR({ ...r, accepte_publication: e.target.checked })} />
              {t.publication}
            </label>
          </div>
        </Bloc>

        <Bouton type="submit" chargement={envoi} disabled={!r.note_globale} className="w-full sm:w-auto">{t.envoyer}</Bouton>
      </form>
    </PortailLayout>
  )
}