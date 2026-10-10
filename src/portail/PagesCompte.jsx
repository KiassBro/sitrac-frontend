import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CalendarDays, CreditCard, FileSignature, Map, Sparkles, Users, Wallet } from 'lucide-react'
import { portailAPI, SessionPortail } from './api'
import { useLangue, useT, formatDate, formatMontant } from './i18n'
import { Bloc, Bouton, Champ, champClasse, Chargement, EnTetePage, IMAGE_FOND, Message, PortailLayout } from './composants'

export function RequirePortail({ children }) {
  const location = useLocation()
  if (!SessionPortail.get()) return <Navigate to="/portail/connexion" state={{ depuis: location.pathname }} replace />
  return children
}

/* ── Connexion par code ───────────────────────────────────────── */
export function Connexion() {
  const { t } = useT()
  const { setLangue } = useLangue()
  const navigate = useNavigate()
  const location = useLocation()
  const [etape, setEtape] = useState('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [duree, setDuree] = useState(10)
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  const demander = async (e) => {
    e?.preventDefault()
    setErreur(''); setChargement(true)
    try {
      const r = await portailAPI.demanderCode(email.trim())
      setDuree(r.duree_minutes || 10)
      setEtape('code'); setCode('')
    } catch (err) { setErreur(err.message || t('erreur')) }
    finally { setChargement(false) }
  }
  const valider = async (e) => {
    e.preventDefault()
    setErreur(''); setChargement(true)
    try {
      const r = await portailAPI.connexion(email.trim(), code)
      SessionPortail.set({ token: r.token, expire_le: r.expire_le, client: r.client })
      if (r.client?.langue) setLangue(r.client.langue)
      navigate(location.state?.depuis || '/portail', { replace: true })
    } catch (err) { setErreur(err.message || t('erreur')) }
    finally { setChargement(false) }
  }

  const atouts = [[FileSignature, t('atout_signer')], [CreditCard, t('atout_payer')], [Users, t('atout_voyageurs')], [Map, t('atout_carnet')]]
  return (
    <PortailLayout connecte={false} large bandeau={false}>
      <div className="grid lg:grid-cols-[1fr_1.05fr] rounded-3xl overflow-hidden bg-white border border-rt-line/80 shadow-[0_20px_60px_-25px_rgba(23,58,44,0.35)]">
        {/* Photo et rappel de ce que contient l'espace */}
        <div className="relative hidden md:flex flex-col justify-end min-h-[520px] p-9 text-white">
          <img src={IMAGE_FOND} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-rt-canopy-dk via-rt-canopy-dk/70 to-rt-canopy-dk/10" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-rt-ocre mb-2">{t('espace')}</p>
            <p className="font-title font-bold text-[28px] leading-tight mb-5">{t('connexion_cote_titre')}</p>
            <ul className="flex flex-col gap-3">
              {atouts.map(([Icone, texte]) => (
                <li key={texte} className="flex items-center gap-3 text-white/90">
                  <span className="w-8 h-8 rounded-lg bg-white/15 grid place-items-center shrink-0"><Icone size={16} aria-hidden /></span>{texte}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-7 sm:p-10 lg:p-12 flex flex-col justify-center">
          <h1 className="font-title font-bold text-[26px] sm:text-[28px] leading-tight mb-2">{t('connexion_titre')}</h1>
          <p className="text-rt-stone mb-7">{t('connexion_intro')}</p>
          {etape === 'email' ? (
            <form onSubmit={demander} className="flex flex-col gap-4">
              <Champ label={t('email')} id="email">
                <input id="email" type="email" required autoComplete="email" autoFocus value={email}
                  onChange={(e) => setEmail(e.target.value)} className={champClasse} />
              </Champ>
              {erreur && <Message type="erreur">{erreur}</Message>}
              <Bouton type="submit" chargement={chargement} className="w-full sm:w-auto">{t('recevoir_code')}</Bouton>
            </form>
          ) : (
            <form onSubmit={valider} className="flex flex-col gap-4">
              <Message>{t('code_envoye', { n: duree })}</Message>
              <Champ label={t('code')} id="code">
                <input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7}
                  required autoFocus value={code} onChange={(e) => setCode(e.target.value)}
                  className={`${champClasse} tracking-[0.4em] text-xl font-semibold`} />
              </Champ>
              {erreur && <Message type="erreur">{erreur}</Message>}
              <Bouton type="submit" chargement={chargement} className="w-full sm:w-auto">{t('se_connecter')}</Bouton>
              <div className="flex justify-between text-sm">
                <button type="button" className="text-rt-canopy hover:underline" onClick={() => setEtape('email')}>{t('autre_email')}</button>
                <button type="button" className="text-rt-canopy hover:underline" onClick={demander}>{t('renvoyer')}</button>
              </div>
            </form>
          )}
          <div className="mt-8 pt-6 border-t border-rt-line flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-rt-stone">{t('pas_encore_client')}</span>
            <Link to="/portail/demande-devis" className="inline-flex items-center gap-1.5 font-semibold text-rt-canopy hover:underline">
              <Sparkles size={15} aria-hidden /> {t('demander_devis')}
            </Link>
          </div>
        </div>
      </div>
    </PortailLayout>
  )
}

/* ── Liste des voyages ────────────────────────────────────────── */
const COULEUR_STATUT = {
  a_confirmer: 'bg-rt-ocre-lt text-rt-ink', confirme: 'bg-rt-mist text-rt-canopy', regle: 'bg-rt-canopy text-white',
  termine: 'bg-rt-mist text-rt-stone', en_preparation: 'bg-rt-mist text-rt-stone',
}
export function Statut({ statut }) {
  const { t } = useT()
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${COULEUR_STATUT[statut] || ''}`}>{t(`statut_${statut}`)}</span>
}

export function MesVoyages() {
  const { t, langue } = useT()
  const session = SessionPortail.get()
  const { data, isLoading, error } = useQuery({ queryKey: ['portail', 'dossiers'], queryFn: portailAPI.dossiers })
  const nom = session?.client?.nom
  return (
    <PortailLayout>
      <EnTetePage surtitre={nom ? `${t('bonjour')}, ${nom}` : t('espace')} titre={t('mes_voyages')} texte={t('mes_voyages_intro')}
        action={<Link to="/portail/demande-devis"><Bouton variante="secondaire"><Sparkles size={16} aria-hidden /> {t('nouveau_projet')}</Bouton></Link>} />
      {isLoading && <Chargement />}
      {error && <Message type="erreur">{error.message}</Message>}

      {data && !data.length && (
        <div className="relative overflow-hidden rounded-2xl border border-rt-line bg-white">
          <img src={IMAGE_FOND} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-[0.08]" />
          <div className="relative p-8 sm:p-10 text-center max-w-lg mx-auto">
            <span className="mx-auto w-14 h-14 rounded-2xl bg-rt-ocre-lt text-rt-canopy grid place-items-center mb-4"><Map size={26} aria-hidden /></span>
            <p className="text-rt-stone">{t('aucun_voyage')}</p>
            <Link to="/portail/demande-devis" className="inline-block mt-5"><Bouton>{t('demander_devis')} <ArrowRight size={16} aria-hidden /></Bouton></Link>
          </div>
        </div>
      )}

      <ul className="grid gap-4">
        {(data || []).map((d, i) => (
          <li key={d.id} className="animate-fade-up motion-reduce:animate-none" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
            <Link to={`/portail/dossiers/${d.id}`}
              className="group block bg-white border border-rt-line/80 rounded-2xl overflow-hidden transition hover:-translate-y-0.5
                         hover:shadow-[0_18px_40px_-20px_rgba(23,58,44,0.35)] hover:border-rt-canopy/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-rt-canopy">
              <div className="flex">
                <span className={`w-1.5 shrink-0 ${d.statut === 'a_confirmer' ? 'bg-rt-ocre' : d.statut === 'termine' ? 'bg-rt-line' : 'bg-rt-canopy'}`} aria-hidden />
                <div className="flex-1 min-w-0 px-5 sm:px-6 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-title font-semibold text-lg sm:text-xl text-rt-ink">{d.programme}</span>
                    <Statut statut={d.statut} />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-rt-stone">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} aria-hidden /> {t('du_au', { a: formatDate(d.date_debut, langue), b: formatDate(d.date_fin, langue) })}</span>
                    <span className="inline-flex items-center gap-1.5"><Users size={15} aria-hidden /> {t('voyageurs', { n: d.nb_pax })}</span>
                  </div>
                  {d.reste > 0 && d.prochaine_echeance && (
                    <p className="mt-3 inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-rt-ocre-lt px-3 py-1.5 text-sm">
                      <Wallet size={15} className="text-rt-canopy" aria-hidden />
                      {t('reste', { m: formatMontant(d.reste, langue, d.devise) })} — {d.prochaine_echeance.libelle} {t('avant_le', { d: formatDate(d.prochaine_echeance.date_limite, langue) })}
                    </p>
                  )}
                </div>
                <span className="hidden sm:grid place-items-center pr-6 text-rt-canopy">
                  <ArrowRight size={20} className="transition group-hover:translate-x-1" aria-hidden />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </PortailLayout>
  )
}

/* ── Profil / préférences de communication ────────────────────── */
export function Profil() {
  const { t, langue } = useT()
  const { setLangue } = useLangue()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['portail', 'moi'], queryFn: portailAPI.moi })
  const [form, setForm] = useState(null)
  const [ok, setOk] = useState(false)
  useEffect(() => { if (data) setForm({
    langue: data.langue, telephone: data.telephone_e164 || data.telephone || '', telephone_sejour: data.telephone_sejour || '',
    accepte_sms: data.accepte_sms, accepte_whatsapp: data.accepte_whatsapp,
  }) }, [data])
  const smsActifs = !!data?.sms_whatsapp_actifs   // l'agence utilise-t-elle SMS/WhatsApp ?
  const maj = useMutation({
    mutationFn: (f) => {
      if (smsActifs) return portailAPI.majMoi(f)
      const { accepte_sms, accepte_whatsapp, ...reste } = f   // eslint-disable-line no-unused-vars
      return portailAPI.majMoi(reste)
    },
    onSuccess: (d) => { qc.setQueryData(['portail', 'moi'], d); setLangue(d.langue); setOk(true) },
  })
  const erreurs = maj.error?.data || {}
  const champ = (k) => (e) => { setOk(false); setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }) }

  return (
    <PortailLayout>
      <h1 className="font-title font-bold text-2xl mb-2">{t('profil')}</h1>
      <p className="text-rt-stone mb-6">{t('profil_intro')}</p>
      {isLoading || !form ? <Chargement /> : (
        <Bloc>
          <form className="flex flex-col gap-5 max-w-lg" onSubmit={(e) => { e.preventDefault(); maj.mutate(form) }}>
            <p className="text-sm"><span className="text-rt-stone">{t('email')} :</span> {data.email}</p>
            <Champ label={t('langue')} id="langue">
              <select id="langue" value={form.langue} onChange={champ('langue')} className={champClasse}>
                <option value="en">English</option><option value="fr">Français</option>
              </select>
            </Champ>
            <Champ label={t('mobile')} id="tel" aide={t('mobile_aide')} erreur={erreurs.telephone?.[0] || erreurs.telephone}>
              <input id="tel" type="tel" autoComplete="tel" value={form.telephone} onChange={champ('telephone')} className={champClasse} placeholder="+44 7700 900123" />
            </Champ>
            <Champ label={t('mobile_sejour')} id="tels" aide={t('mobile_sejour_aide')} erreur={erreurs.telephone_sejour?.[0]}>
              <input id="tels" type="tel" value={form.telephone_sejour} onChange={champ('telephone_sejour')} className={champClasse} placeholder="+261 34 12 345 67" />
            </Champ>
            {smsActifs && <fieldset className="flex flex-col gap-2">
              <label className="flex items-start gap-3 text-[15px]"><input type="checkbox" className="mt-1 accent-rt-canopy w-4 h-4" checked={form.accepte_sms} onChange={champ('accepte_sms')} />{t('sms_ok')}</label>
              <label className="flex items-start gap-3 text-[15px]"><input type="checkbox" className="mt-1 accent-rt-canopy w-4 h-4" checked={form.accepte_whatsapp} onChange={champ('accepte_whatsapp')} />{t('wa_ok')}</label>
              <p className="text-xs text-rt-stone">{t('consent_aide')}</p>
            </fieldset>}
            {maj.error && !Object.keys(erreurs).length && <Message type="erreur">{maj.error.message}</Message>}
            {erreurs.non_field_errors && <Message type="erreur">{erreurs.non_field_errors}</Message>}
            {ok && <Message type="ok">{t('enregistre')}</Message>}
            <div><Bouton type="submit" chargement={maj.isPending}>{t('enregistrer')}</Bouton></div>
          </form>
        </Bloc>
      )}
    </PortailLayout>
  )
}
