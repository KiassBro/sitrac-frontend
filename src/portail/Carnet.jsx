/**
 * SITRAC — Carnet de route du voyageur (espace client, /portail/dossiers/:id/carnet).
 *
 * Tout ce qu'il faut pendant le voyage, sur le téléphone : contacts (appel ou WhatsApp
 * en un geste), vols, programme jour par jour avec le jour en cours mis en avant,
 * vouchers. Le bouton « PDF » enregistre le carnet sur le téléphone : il reste
 * consultable sans connexion, ce qui est précieux en brousse.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BedDouble, Download, MapPin, MessageCircle, Phone, Plane, Ticket, UserRound } from 'lucide-react'
import { portailAPI, SessionPortail } from './api'
import { formatDate, useLangue } from './i18n'
import { Bloc, Bouton, Chargement, Message, PortailLayout } from './composants'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const T = {
  en: {
    titre: 'Travel book', retour: 'Back to my trip', pdf: 'Save as PDF (works offline)',
    hors_ligne: 'Tip: save the PDF on your phone before leaving — network coverage is limited in some regions.',
    contacts: 'Useful contacts', agence: 'Your agency', guide: 'Your guide', chauffeur: 'Your driver', vehicule: 'Vehicle',
    urgence: 'Your emergency contact', parle: 'speaks', appeler: 'Call', vols: 'Flights', arrivee: 'Arrival',
    depart: 'Departure', domestique: 'Domestic flight', programme: 'Day by day', jour: 'Day', aujourdhui: 'Today',
    hebergement: 'Accommodation', reserve: 'Booked for you', vouchers: 'Your vouchers', telecharger: 'Download',
    indisponible: 'Your travel book will be available as soon as the organisation of your trip is finalised.',
  },
  fr: {
    titre: 'Carnet de route', retour: 'Retour à mon voyage', pdf: 'Enregistrer en PDF (sans connexion)',
    hors_ligne: 'Conseil : enregistrez le PDF sur votre téléphone avant de partir — le réseau est limité dans certaines régions.',
    contacts: 'Contacts utiles', agence: 'Votre agence', guide: 'Votre guide', chauffeur: 'Votre chauffeur', vehicule: 'Véhicule',
    urgence: 'Votre contact d\'urgence', parle: 'parle', appeler: 'Appeler', vols: 'Vols', arrivee: 'Arrivée',
    depart: 'Retour', domestique: 'Vol intérieur', programme: 'Jour par jour', jour: 'Jour', aujourdhui: 'Aujourd\'hui',
    hebergement: 'Hébergement', reserve: 'Réservé pour vous', vouchers: 'Vos vouchers', telecharger: 'Télécharger',
    indisponible: 'Votre carnet de route sera disponible dès que l\'organisation de votre voyage sera finalisée.',
  },
}
const tel = (n) => (n || '').replace(/[^\d+]/g, '')
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

async function appel(chemin, blob = false) {
  const s = SessionPortail.get()
  if (!s) { window.location.assign('/portail/connexion'); throw new Error('Session expirée') }
  const rep = await fetch(`${BASE_URL}${chemin}`, { headers: { Authorization: `Bearer ${s.token}` } })
  if (rep.status === 401) { SessionPortail.clear(); window.location.assign('/portail/connexion'); throw new Error('Session expirée') }
  if (blob) { if (!rep.ok) throw new Error(`HTTP ${rep.status}`); return rep.blob() }
  const data = await rep.json().catch(() => ({}))
  if (!rep.ok) { const e = new Error(data.detail || `HTTP ${rep.status}`); e.status = rep.status; throw e }
  return data
}

function Contact({ titre, nom, telephone, whatsapp, extra, t }) {
  if (!nom && !telephone) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 border-b border-rt-line last:border-0">
      <div>
        <p className="text-xs text-rt-stone">{titre}</p>
        <p className="font-semibold">{nom}</p>
        {extra && <p className="text-xs text-rt-stone">{extra}</p>}
      </div>
      <div className="flex gap-2">
        {telephone && <a href={`tel:${tel(telephone)}`}><Bouton variante="secondaire"><Phone size={15} aria-hidden />{t.appeler}</Bouton></a>}
        {whatsapp && <a href={`https://wa.me/${tel(whatsapp).replace('+', '')}`} target="_blank" rel="noreferrer">
          <Bouton variante="discret"><MessageCircle size={15} aria-hidden />WhatsApp</Bouton></a>}
      </div>
    </div>
  )
}

export function Carnet() {
  const { id } = useParams()
  const { langue } = useLangue()
  const t = T[langue] || T.en
  const [enregistrement, setEnregistrement] = useState(false)
  const aujourdhuiRef = useRef(null)
  const { data: c, isLoading, error } = useQuery({ queryKey: ['portail', 'carnet', id], queryFn: () => appel(`/portail/carnet/${id}/`), retry: false })
  const aujourdhui = iso(new Date())

  useEffect(() => { aujourdhuiRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [c])

  const enregistrerPdf = async () => {
    setEnregistrement(true)
    try {
      const blob = await appel(`/portail/carnet/${id}/pdf/?langue=${langue}`, true)
      const url = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement('a'), { href: url, download: `carnet-de-route-PC${id}.pdf` })
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } finally { setEnregistrement(false) }
  }

  return (
    <PortailLayout>
      <Link to={`/portail/dossiers/${id}`} className="inline-flex items-center gap-1 text-sm text-rt-canopy hover:underline mb-5">
        <ArrowLeft size={15} aria-hidden /> {t.retour}
      </Link>
      {isLoading ? <Chargement /> : error ? (
        <Message type={error.status === 409 ? 'info' : 'erreur'}>{error.status === 409 ? t.indisponible : error.message}</Message>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-title font-bold text-2xl">{t.titre}</h1>
            <p className="text-rt-stone">{c.programme} · {formatDate(c.date_debut, langue)} → {formatDate(c.date_fin, langue)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Bouton onClick={enregistrerPdf} chargement={enregistrement}><Download size={16} aria-hidden />{t.pdf}</Bouton>
            </div>
            <p className="text-xs text-rt-stone mt-2">{t.hors_ligne}</p>
          </div>

          <Bloc titre={t.contacts}>
            <Contact t={t} titre={t.agence} nom={c.contacts.agence.nom} telephone={c.contacts.agence.telephone}
              whatsapp={c.contacts.agence.whatsapp} extra={c.contacts.agence.email} />
            {c.contacts.guide && <Contact t={t} titre={t.guide} nom={c.contacts.guide.nom} telephone={c.contacts.guide.telephone}
              whatsapp={c.contacts.guide.telephone} extra={c.contacts.guide.langues ? `${t.parle} ${c.contacts.guide.langues}` : ''} />}
            {c.contacts.chauffeur && <Contact t={t} titre={t.chauffeur} nom={c.contacts.chauffeur.nom} telephone={c.contacts.chauffeur.telephone} />}
            {c.contacts.vehicule && <Contact t={t} titre={t.vehicule} nom={c.contacts.vehicule.nom} extra={c.contacts.vehicule.immatriculation} />}
            {(c.urgence.nom || c.urgence.telephone) && <Contact t={t} titre={t.urgence} nom={c.urgence.nom} telephone={c.urgence.telephone} />}
          </Bloc>

          {c.vols.length > 0 && (
            <Bloc titre={t.vols}>
              <ul className="divide-y divide-rt-line">
                {c.vols.map((v, i) => (
                  <li key={i} className="py-2.5 flex items-start gap-3">
                    <Plane size={18} className="text-rt-canopy mt-0.5 shrink-0" aria-hidden />
                    <div>
                      <p className="font-semibold">{t[v.type]} · {formatDate(v.date, langue)}</p>
                      <p className="text-sm">{v.de} → {v.vers}</p>
                      {(v.compagnie || v.numero) && <p className="text-xs text-rt-stone">{v.compagnie} {v.numero}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </Bloc>
          )}

          <Bloc titre={t.programme}>
            <ol className="flex flex-col gap-3">
              {c.jours.map((j) => {
                const estAujourdhui = j.date === aujourdhui
                return (
                  <li key={j.numero} ref={estAujourdhui ? aujourdhuiRef : null}
                    className={`rounded-md border p-3 ${estAujourdhui ? 'border-rt-ocre bg-rt-mist' : 'border-rt-line'}`}>
                    <p className="text-sm">
                      <span className="font-bold text-rt-ocre">{t.jour} {j.numero}</span> · {formatDate(j.date, langue)}
                      {estAujourdhui && <span className="ml-2 text-xs font-bold text-white bg-rt-ocre rounded px-1.5 py-0.5">{t.aujourdhui}</span>}
                    </p>
                    {j.itineraire && <p className="font-semibold mt-1 flex items-center gap-1.5"><MapPin size={15} aria-hidden className="text-rt-canopy" />{j.itineraire}</p>}
                    {j.hebergement && <p className="text-sm mt-1 flex items-center gap-1.5"><BedDouble size={15} aria-hidden className="text-rt-stone" />{t.hebergement} : {j.hebergement}</p>}
                    {j.prestations.map((p, i) => (
                      <p key={i} className="text-sm mt-1 flex items-start gap-1.5">
                        <Ticket size={15} aria-hidden className="text-rt-stone mt-0.5 shrink-0" />
                        <span>{t.reserve} : <b>{p.nom}</b>{p.detail ? ` — ${p.detail}` : ''}
                          {p.telephone && <> · <a className="text-rt-canopy underline" href={`tel:${tel(p.telephone)}`}>{p.telephone}</a></>}</span>
                      </p>
                    ))}
                  </li>
                )
              })}
            </ol>
          </Bloc>

          {c.vouchers.length > 0 && (
            <Bloc titre={t.vouchers}>
              <ul className="divide-y divide-rt-line">
                {c.vouchers.map((v) => (
                  <li key={v.uuid} className="py-2.5 flex items-center justify-between gap-3">
                    <span className="font-medium flex items-center gap-2"><UserRound size={15} aria-hidden className="text-rt-stone" />{v.titre}</span>
                    <Bouton variante="discret" onClick={() => portailAPI.document(v.uuid, `${v.titre}.pdf`)}><Download size={15} aria-hidden />{t.telecharger}</Bouton>
                  </li>
                ))}
              </ul>
            </Bloc>
          )}
        </div>
      )}
    </PortailLayout>
  )
}