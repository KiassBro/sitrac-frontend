import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle, FileText, ShieldCheck } from 'lucide-react'
import { apiConfirmation, SessionPortail } from './api'
import { formatDate, formatMontant, useLangue, useT } from './i18n'
import { Bloc, Bouton, Champ, champClasse, Chargement, Itineraire, Message, PortailLayout, ZoneSignature } from './composants'

/**
 * Confirmation d'un devis par le client.
 * Deux accès : /confirmer/:jeton (lien de l'email, sans compte) et
 * /portail/confirmer/:uuid (depuis l'espace client connecté).
 * Rien n'est enregistré à l'ouverture de la page : seules les actions
 * explicites (demander un code, signer, refuser) sont envoyées au serveur.
 */
export default function Confirmation() {
  const { jeton, uuid } = useParams()
  const api = useMemo(() => apiConfirmation({ jeton, uuid }), [jeton, uuid])
  const { t, langue } = useT()
  const { setLangue } = useLangue()
  const langueAppliquee = useRef(false)

  const [data, setData] = useState(null)
  const [erreurChargement, setErreurChargement] = useState(null)
  const [nom, setNom] = useState('')
  const [signature, setSignature] = useState('')
  const [accepte, setAccepte] = useState(false)
  const [code, setCode] = useState('')
  const [codeInfo, setCodeInfo] = useState(null)
  const [modeRefus, setModeRefus] = useState(false)
  const [motif, setMotif] = useState('')
  const [action, setAction] = useState(null)
  const [erreur, setErreur] = useState('')
  const [voirConditions, setVoirConditions] = useState(false)

  const charger = () => api.lire().then((d) => {
    setData(d)
    if (!langueAppliquee.current && !localStorage.getItem('sitrac_portail_langue')) setLangue(d.langue)
    langueAppliquee.current = true
    return d
  })

  useEffect(() => {
    charger()
      .then((d) => { if (d.statut === 'envoyee') api.consulte().catch(() => {}) })
      .catch((e) => setErreurChargement(e))
  }, [api])

  const executer = async (nomAction, fn) => {
    setErreur(''); setAction(nomAction)
    try { await fn() } catch (e) { setErreur(e.message || t('erreur')) } finally { setAction(null) }
  }
  const demanderCode = (canal) => executer('code', async () => {
    const r = await api.code(canal)
    setCodeInfo(r); setCode('')
  })
  const signer = (e) => {
    e.preventDefault()
    executer('signer', async () => {
      await api.accepter({ code, signataire_nom: nom, accepte_conditions: accepte, signature_image: signature })
      await charger()
    })
  }
  const refuser = (e) => {
    e.preventDefault()
    executer('refuser', async () => { await api.refuser(motif); await charger() })
  }

  if (erreurChargement) {
    return (
      <PortailLayout connecte={!!uuid}>
        <Bloc><h1 className="font-title font-bold text-2xl mb-2">{t('lien_invalide')}</h1><p className="text-rt-stone">{t('lien_invalide_suite')}</p></Bloc>
      </PortailLayout>
    )
  }
  if (!data) return <PortailLayout connecte={!!uuid}><Chargement /></PortailLayout>

  const d = data.devis
  const actif = ['envoyee', 'consultee'].includes(data.statut)
  const lienEspace = uuid || SessionPortail.get() ? '/portail' : '/portail/connexion'
  const peutSigner = nom.trim().length >= 2 && accepte && code.replace(/\D/g, '').length === 6

  return (
    <PortailLayout connecte={!!uuid}>
      <p className="text-sm text-rt-stone mb-1">{d.client}</p>
      <h1 className="font-title font-bold text-[28px] leading-tight mb-1">{d.programme}</h1>
      <p className="text-rt-stone mb-6">
        {t('du_au', { a: formatDate(d.date_debut, langue), b: formatDate(d.date_fin, langue) })} · {t('voyageurs', { n: d.nb_pax })}
      </p>
      <div className="mb-8"><Itineraire etapes={d.etapes} /></div>

      {data.statut === 'acceptee' && (
        <div className="mb-6">
          <Bloc>
            <div className="flex gap-3">
              <CheckCircle className="text-rt-canopy shrink-0 mt-0.5" size={24} aria-hidden />
              <div>
                <h2 className="font-title font-semibold text-xl">{t('merci_signe')}</h2>
                <p className="text-rt-stone mt-1 mb-4">{t('merci_signe_suite')}</p>
                {data.decision && <p className="text-sm mb-4">{t('devis_signe', { nom: data.decision.signataire, date: formatDate(data.decision.le, langue, true) })}</p>}
                <div className="flex flex-wrap gap-3">
                  <Link to={lienEspace}><Bouton>{t('acceder_espace')}</Bouton></Link>
                  <Bouton variante="secondaire" onClick={() => api.ouvrirPdf()}><FileText size={16} aria-hidden />{t('telecharger_signe')}</Bouton>
                </div>
              </div>
            </div>
          </Bloc>
        </div>
      )}
      {data.statut === 'refusee' && <div className="mb-6"><Message type="ok"><strong>{t('merci_refus')}</strong> {t('merci_refus_suite')}</Message></div>}
      {data.statut === 'expiree' && <div className="mb-6"><Message type="attention">{t('devis_expire')}</Message></div>}
      {data.statut === 'annulee' && <div className="mb-6"><Message type="attention">{t('devis_remplace')}</Message></div>}

      {actif && (
        <ol className="flex gap-6 mb-5 text-sm" aria-label="Steps">
          <li className="flex items-center gap-2 font-semibold"><span className="w-6 h-6 rounded-full bg-rt-canopy text-white grid place-items-center text-xs">1</span>{t('conf_etape1')}</li>
          <li className="flex items-center gap-2 font-semibold"><span className="w-6 h-6 rounded-full bg-rt-ocre text-rt-ink grid place-items-center text-xs">2</span>{t('conf_etape2')}</li>
        </ol>
      )}

      <div className="flex flex-col gap-5">
        <Bloc titre={`${t('votre_devis')} ${d.ref}`} action={
          <Bouton variante="discret" onClick={() => api.ouvrirPdf()}><FileText size={15} aria-hidden />{t('voir_pdf')}</Bouton>}>
          {actif && <p className="text-[15px] mb-4">{t('conf_intro')}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{t('lignes')}</caption>
              <tbody>
                {d.lignes.map((l, i) => (
                  <tr key={i} className="border-b border-rt-line">
                    <td className="py-2 pr-3 align-top">
                      {l.service}
                      <span className="block text-xs text-rt-stone">{l.date ? `${formatDate(l.date, langue)} · ` : ''}{l.nombre} × {formatMontant(l.prix_unitaire, langue, d.devise)}</span>
                    </td>
                    <td className="py-2 text-right align-top whitespace-nowrap">{formatMontant(l.total, langue, d.devise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="mt-3 ml-auto max-w-xs text-sm">
            {Number(d.remise) > 0 && <>
              <div className="flex justify-between py-0.5"><dt className="text-rt-stone">{t('sous_total')}</dt><dd>{formatMontant(d.total_ht, langue, d.devise)}</dd></div>
              <div className="flex justify-between py-0.5"><dt className="text-rt-stone">{t('remise')}</dt><dd>− {formatMontant(d.remise, langue, d.devise)}</dd></div>
            </>}
            <div className="flex justify-between pt-2 mt-1 border-t-2 border-rt-canopy text-lg font-semibold"><dt>{t('total')}</dt><dd>{formatMontant(d.total, langue, d.devise)}</dd></div>
          </dl>

          {data.echeancier.length > 0 && data.statut !== 'acceptee' && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">{t('echeancier')}</h3>
              <ul className="text-sm divide-y divide-rt-line border-y border-rt-line">
                {data.echeancier.map((e, i) => (
                  <li key={i} className="flex justify-between py-2">
                    <span className="first-letter:uppercase">{e.libelle} <span className="text-rt-stone">· {t('avant_le', { d: formatDate(e.date_limite, langue) })}</span></span>
                    <span>{formatMontant(e.montant, langue, d.devise)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 text-sm">
            <button type="button" onClick={() => setVoirConditions(!voirConditions)} aria-expanded={voirConditions}
              className="font-semibold text-rt-canopy hover:underline">
              {t('conditions')} — {voirConditions ? t('masquer') : t('lire')}
            </button>
            {voirConditions && <p className="mt-2 whitespace-pre-line text-rt-stone leading-relaxed max-w-prose">{data.conditions.texte}</p>}
          </div>
        </Bloc>

        {actif && !modeRefus && (
          <Bloc titre={t('accepter_titre')}>
            <form onSubmit={signer} className="flex flex-col gap-5">
              <Champ label={t('nom_signataire')} id="nom">
                <input id="nom" autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} className={champClasse} required />
              </Champ>
              <Champ label={t('signature')} id="sig"><ZoneSignature onChange={setSignature} /></Champ>
              <label className="flex items-start gap-3 text-[15px]">
                <input type="checkbox" className="mt-1 w-4 h-4 accent-rt-canopy" checked={accepte} onChange={(e) => setAccepte(e.target.checked)} />
                <span>{t('j_accepte')}</span>
              </label>

              <div className="bg-rt-mist rounded-md p-4 flex flex-col gap-3">
                <p className="flex items-center gap-2 text-sm font-medium"><ShieldCheck size={16} className="text-rt-canopy" aria-hidden />{t('envoyer_code')}</p>
                <div className="flex flex-wrap gap-2">
                  <Bouton type="button" variante="secondaire" onClick={() => demanderCode('email')} chargement={action === 'code'}>
                    {t('code_par_email')} ({data.email_masque})
                  </Bouton>
                  {data.sms_disponible && <Bouton type="button" variante="secondaire" onClick={() => demanderCode('sms')} disabled={action === 'code'}>{t('code_par_sms')}</Bouton>}
                </div>
                {codeInfo && (
                  <>
                    <p className="text-sm text-rt-stone">{t('code_envoye_a', { d: codeInfo.destination, n: codeInfo.duree_minutes })}</p>
                    <Champ label={t('code')} id="code">
                      <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code}
                        onChange={(e) => setCode(e.target.value)} className={`${champClasse} max-w-[12rem] tracking-[0.4em] text-xl font-semibold`} />
                    </Champ>
                  </>
                )}
              </div>

              {erreur && <Message type="erreur">{erreur}</Message>}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Bouton type="submit" disabled={!peutSigner} chargement={action === 'signer'} className="px-6">{t('signer')}</Bouton>
                <Bouton type="button" variante="discret" onClick={() => { setModeRefus(true); setErreur('') }}>{t('refuser')}</Bouton>
              </div>
              <p className="text-xs text-rt-stone">{t('valable', { d: formatDate(data.expire_le, langue) })}</p>
            </form>
          </Bloc>
        )}

        {actif && modeRefus && (
          <Bloc titre={t('refuser_titre')}>
            <form onSubmit={refuser} className="flex flex-col gap-4">
              <Champ label={t('refuser_titre')} id="motif" aide={t('refuser_aide')}>
                <textarea id="motif" rows={4} value={motif} onChange={(e) => setMotif(e.target.value)} className={champClasse} required minLength={3} />
              </Champ>
              {erreur && <Message type="erreur">{erreur}</Message>}
              <div className="flex gap-3">
                <Bouton type="submit" variante="danger" chargement={action === 'refuser'}>{t('confirmer_refus')}</Bouton>
                <Bouton type="button" variante="discret" onClick={() => setModeRefus(false)}>{t('annuler')}</Bouton>
              </div>
            </form>
          </Bloc>
        )}
      </div>
    </PortailLayout>
  )
}
