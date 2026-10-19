import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'


// Communes
import Login           from './pages/Login'
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Profile = lazy(() => import('./pages/Profile'))
const Chatbot = lazy(() => import('./pages/Chatbot'))
const Messages = lazy(() => import('./pages/Messages'))

// Sales
const Destinations = lazy(() => import('./pages/Sales/Destinations'))
const Programmes = lazy(() => import('./pages/Sales/Programmes'))
const InformationsGenerales = lazy(() => import('./pages/Sales/InformationsGenerales'))
const ProgrammeClient = lazy(() => import('./pages/Sales/ProgrammeClient'))
const Cotation = lazy(() => import('./pages/Sales/Cotation'))
const FacturePro = lazy(() => import('./pages/Sales/FacturePro'))
const CotationLibre = lazy(() => import('./pages/Sales/CotationLibre'))
const FactureProLibre = lazy(() => import('./pages/Sales/FactureProLibre'))

// Booking
const Brieffings = lazy(() => import('./pages/Booking/Brieffings'))
const Provision = lazy(() => import('./pages/Booking/Provision'))
const DossierVenteBooking = lazy(() => import('./pages/Booking/DossierVente'))

// Finance
const Paiement = lazy(() => import('./pages/Finance/Paiement'))
const FactureDefinitive = lazy(() => import('./pages/Finance/FactureDefinitive'))
const Cloture = lazy(() => import('./pages/Finance/Cloture'))
const Recu = lazy(() => import('./pages/Finance/Recu'))
const DossierVenteFinance = lazy(() => import('./pages/Finance/DossierVente'))
const DossierBookingFinance = lazy(() => import('./pages/Finance/DossierBooking'))


// Administration
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'))
const Utilisateurs = lazy(() => import('./pages/Admin/Utilisateurs'))
const Constantes = lazy(() => import('./pages/Admin/Constantes'))
const Historique = lazy(() => import('./pages/Admin/Historique'))
const Statistiques = lazy(() => import('./pages/Admin/Statistiques'))
const Portefeuilles = lazy(() => import('./pages/Admin/Portefeuilles'))

// Superviseur
const Journal = lazy(() => import('./pages/Superviseur/Journal'))
const SuperviseurInsert = lazy(() => import('./pages/Superviseur/Insert'))
const SuperviseurUpdate = lazy(() => import('./pages/Superviseur/Update'))
const SuperviseurDelete = lazy(() => import('./pages/Superviseur/Delete'))
const SuperviseurStats = lazy(() => import('./pages/Superviseur/Stats'))


// Client & Communication — page du personnel
const RelationClient = lazy(() => import('./pages/RelationClient/RelationClient'))
const Prestataires = lazy(() => import('./pages/Prestataires/Prestataires'))
const Planning = lazy(() => import('./pages/Ressources/Planning'))
const Prospects = lazy(() => import('./pages/Prospects/Prospects'))
const Satisfaction = lazy(() => import('./pages/Satisfaction/Satisfaction'))
const Avis = lazy(() => import('./pages/Public/Avis'))
const ExportsComptables = lazy(() => import('./pages/Finance/ExportsComptables'))

// Espace client externe : chargé à la demande, jamais inclus dans le bundle du personnel.
// Authentification propre (jeton du portail), indépendante de useAuthStore.
const portail = (nom) => lazy(() => import('./portail/routes').then((m) => ({ default: m[nom] })))
const PortailConnexion   = portail('Connexion')
const PortailProfil      = portail('Profil')
const PortailDossier     = portail('Dossier')
const PortailVoyageurs   = portail('Voyageurs')
const PortailConfirmation= portail('Confirmation')
const PortailCarnet      = portail('Carnet')
const PortailPayRetour   = portail('PaiementRetour')
const PortailPaySimu     = portail('PaiementSimulation')
// Plateforme « Espace voyageurs » : accueil public + demande de devis
const PortailEntree      = lazy(() => import('./portail/Accueil').then((m) => ({ default: m.EntreePortail })))
const PortailDemandeDevis= lazy(() => import('./portail/DemandeDevis'))
const RequirePortail     = portail('RequirePortail')
const P = (el, protege = true) => (
  <Suspense fallback={null}>{protege ? <RequirePortail>{el}</RequirePortail> : el}</Suspense>
)

function RequireAuth({ children, depts }) {
  const { user } = useAuthStore()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (depts?.length && !depts.includes(user.dept)) return <Navigate to="/dashboard" replace />
  return children
}
// Ancienne adresse du formulaire : renvoie vers l'espace voyageurs (en gardant ?circuit=…)
function VersDemandeDevis() {
  const { search } = useLocation()
  return <Navigate to={`/portail/demande-devis${search}`} replace />
}
function RequireGuest({ children }) {
  const { user } = useAuthStore()
  return user ? <Navigate to="/dashboard" replace /> : children
}
const SALES   = ['Sales','Administration']
const BOOKING = ['Booking','Administration']
const FINANCE = ['Finance','Administration']
const ADMIN   = ['Administration']
const SUPER   = ['Superviseur','Administration']

export default function App() {
  const { initTheme, user } = useAuthStore()
  useEffect(() => { initTheme() }, [])

  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-gray-400">Chargement…</div>}>
    <Routes>
      <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />

      {/* Communes */}
      <Route path="/dashboard"     element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
      <Route path="/profile"       element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/chatbot"       element={<RequireAuth><Chatbot /></RequireAuth>} />
      <Route path="/messages"      element={<RequireAuth><Messages /></RequireAuth>} />

      {/* Sales */}
      <Route path="/sales/destinations"     element={<RequireAuth depts={SALES}><Destinations /></RequireAuth>} />
      <Route path="/sales/programmes"       element={<RequireAuth depts={SALES}><Programmes /></RequireAuth>} />
      <Route path="/sales/gi"               element={<RequireAuth depts={SALES}><InformationsGenerales /></RequireAuth>} />
      <Route path="/sales/pc"               element={<RequireAuth depts={SALES}><ProgrammeClient /></RequireAuth>} />
      <Route path="/sales/cotation"         element={<RequireAuth depts={SALES}><Cotation /></RequireAuth>} />
      <Route path="/sales/facture-pro"      element={<RequireAuth depts={SALES}><FacturePro /></RequireAuth>} />
      <Route path="/sales/cotation-libre"   element={<RequireAuth depts={SALES}><CotationLibre /></RequireAuth>} />
      <Route path="/sales/facturepro-libre" element={<RequireAuth depts={SALES}><FactureProLibre /></RequireAuth>} />

      {/* Booking */}
      <Route path="/booking/briefings"    element={<RequireAuth depts={BOOKING}><Brieffings /></RequireAuth>} />
      <Route path="/booking/provision"    element={<RequireAuth depts={BOOKING}><Provision /></RequireAuth>} />
      <Route path="/booking/dossier-vente"
      element={<RequireAuth depts={BOOKING}><DossierVenteBooking /></RequireAuth>} />

      {/* Finance */}
      <Route path="/finance/paiement"     element={<RequireAuth depts={FINANCE}><Paiement /></RequireAuth>} />
      <Route path="/finance/facture-def"  element={<RequireAuth depts={FINANCE}><FactureDefinitive /></RequireAuth>} />
      <Route path="/finance/cloture"      element={<RequireAuth depts={FINANCE}><Cloture /></RequireAuth>} />
      <Route path="/finance/recu"         element={<RequireAuth depts={FINANCE}><Recu /></RequireAuth>} />
      <Route path="/finance/dossier-vente"
      element={<RequireAuth depts={FINANCE}><DossierVenteFinance /></RequireAuth>} />
      <Route path="/finance/dossier-booking"
      element={<RequireAuth depts={FINANCE}><DossierBookingFinance /></RequireAuth>} />
      <Route path="/finance/exports"
      element={<RequireAuth depts={['Finance','Administration','Superviseur']}><ExportsComptables /></RequireAuth>} />
    
      {/* Administration */}
      <Route path="/admin"               element={<RequireAuth depts={ADMIN}><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/utilisateurs"  element={<RequireAuth depts={ADMIN}><Utilisateurs /></RequireAuth>} />
      <Route path="/admin/constantes"    element={<RequireAuth depts={ADMIN}><Constantes /></RequireAuth>} />
      <Route path="/admin/historique"    element={<RequireAuth depts={ADMIN}><Historique /></RequireAuth>} />
      <Route path="/admin/statistiques"  element={<RequireAuth depts={ADMIN}><Statistiques /></RequireAuth>} />
      <Route path="/admin/portefeuilles" element={<RequireAuth depts={ADMIN}><Portefeuilles /></RequireAuth>} />

      {/* Superviseur */}
      <Route path="/superviseur"         element={<RequireAuth depts={SUPER}><Journal /></RequireAuth>} />
      <Route path="/superviseur/insert"  element={<RequireAuth depts={SUPER}><SuperviseurInsert /></RequireAuth>} />
      <Route path="/superviseur/update"  element={<RequireAuth depts={SUPER}><SuperviseurUpdate /></RequireAuth>} />
      <Route path="/superviseur/delete"  element={<RequireAuth depts={SUPER}><SuperviseurDelete /></RequireAuth>} />
      <Route path="/superviseur/stats"   element={<RequireAuth depts={SUPER}><SuperviseurStats /></RequireAuth>} />

      {/* Client & Communication (personnel) */}
      <Route path="/relation-client" element={<RequireAuth depts={['Sales','Booking','Finance','Administration','Superviseur']}><RelationClient /></RequireAuth>} />
      <Route path="/prestataires"    element={<RequireAuth depts={['Sales','Booking','Finance','Administration','Superviseur']}><Prestataires /></RequireAuth>} />
      <Route path="/planning"        element={<RequireAuth depts={['Sales','Booking','Finance','Administration','Superviseur']}><Planning /></RequireAuth>} />
      <Route path="/prospects"       element={<RequireAuth depts={['Sales','Administration','Superviseur']}><Prospects /></RequireAuth>} />
      <Route path="/satisfaction"    element={<RequireAuth depts={['Sales','Booking','Finance','Administration','Superviseur']}><Satisfaction /></RequireAuth>} />

      {/* Ancienne adresse du formulaire de demande de devis → espace voyageurs */}
      <Route path="/demande-devis"   element={<VersDemandeDevis />} />
      {/* Questionnaire de satisfaction (lien personnel reçu après le voyage) */}
      <Route path="/avis/:jeton"     element={<Avis />} />

      {/* Espace voyageurs (clients) : accueil public, demande de devis, puis espace connecté */}
      <Route path="/confirmer/:jeton"                element={P(<PortailConfirmation />, false)} />
      <Route path="/portail/connexion"               element={P(<PortailConnexion />, false)} />
      <Route path="/portail/paiement/retour/:uuid"   element={P(<PortailPayRetour />, false)} />
      <Route path="/portail/paiement/simulation/:uuid" element={P(<PortailPaySimu />, false)} />
      <Route path="/portail"                         element={P(<PortailEntree />, false)} />
      <Route path="/portail/demande-devis"           element={P(<PortailDemandeDevis />, false)} />
      <Route path="/portail/profil"                  element={P(<PortailProfil />)} />
      <Route path="/portail/dossiers/:id"            element={P(<PortailDossier />)} />
      <Route path="/portail/dossiers/:id/voyageurs"  element={P(<PortailVoyageurs />)} />
      <Route path="/portail/dossiers/:id/carnet"     element={P(<PortailCarnet />)} />
      <Route path="/portail/confirmer/:uuid"         element={P(<PortailConfirmation />)} />
      <Route path="/portail/*"                       element={<Navigate to="/portail" replace />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </Suspense>
  )
}