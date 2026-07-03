import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'


// Communes
import Login           from './pages/Login'
import Dashboard       from './pages/Dashboard'
import Notifications   from './pages/Notifications'
import Profile         from './pages/Profile'
import Chatbot         from './pages/Chatbot'

// Sales
import Destinations          from './pages/Sales/Destinations'
import Programmes            from './pages/Sales/Programmes'
import InformationsGenerales from './pages/Sales/InformationsGenerales'
import ProgrammeClient       from './pages/Sales/ProgrammeClient'
import Cotation              from './pages/Sales/Cotation'
import FacturePro            from './pages/Sales/FacturePro'
import CotationLibre         from './pages/Sales/CotationLibre'
import FactureProLibre       from './pages/Sales/FactureProLibre'

// Booking
import Brieffings            from './pages/Booking/Brieffings'
import Provision             from './pages/Booking/Provision'
import DossierVenteBooking   from './pages/Booking/DossierVente'

// Finance
import Paiement              from './pages/Finance/Paiement'
import FactureDefinitive     from './pages/Finance/FactureDefinitive'
import Cloture               from './pages/Finance/Cloture'
import Recu                  from './pages/Finance/Recu'
import DossierVenteFinance   from './pages/Finance/DossierVente'
import DossierBookingFinance from './pages/Finance/DossierBooking'


// Administration
import AdminDashboard        from './pages/Admin/AdminDashboard'
import Utilisateurs          from './pages/Admin/Utilisateurs'
import Constantes            from './pages/Admin/Constantes'
import Historique            from './pages/Admin/Historique'
import Statistiques          from './pages/Admin/Statistiques'

// Superviseur
import Journal               from './pages/Superviseur/Journal'
import SuperviseurInsert     from './pages/Superviseur/Insert'
import SuperviseurUpdate     from './pages/Superviseur/Update'
import SuperviseurDelete     from './pages/Superviseur/Delete'
import SuperviseurStats      from './pages/Superviseur/Stats'

// Icônes pour les routes DossierVente (lecture seule)
import { Folder, FolderOpen, Calculator, FileText, PlusCircle, Edit, Trash2, BarChart2 } from 'lucide-react'
import PlaceholderPage from './pages/PlaceholderPage'

function RequireAuth({ children, depts }) {
  const { user } = useAuthStore()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (depts?.length && !depts.includes(user.dept)) return <Navigate to="/dashboard" replace />
  return children
}
function RequireGuest({ children }) {
  const { user } = useAuthStore()
  return user ? <Navigate to="/dashboard" replace /> : children
}
const PH = (title, bc, desc, Icon, depts) => (
  <RequireAuth depts={depts}>
    <PlaceholderPage title={title} breadcrumb={bc} desc={desc} icon={Icon} />
  </RequireAuth>
)

const SALES   = ['Sales','Administration']
const BOOKING = ['Booking','Administration']
const FINANCE = ['Finance','Administration']
const ADMIN   = ['Administration']
const SUPER   = ['Superviseur','Administration']

export default function App() {
  const { initTheme, user } = useAuthStore()
  useEffect(() => { initTheme() }, [])

  return (
    <Routes>
      <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />

      {/* Communes */}
      <Route path="/dashboard"     element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
      <Route path="/profile"       element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/chatbot"       element={<RequireAuth><Chatbot /></RequireAuth>} />

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
      <Route path="/finance/dossier-vente"
      element={<RequireAuth depts={FINANCE}><DossierVenteFinance /></RequireAuth>} />
      <Route path="/finance/dossier-booking"
      element={<RequireAuth depts={FINANCE}><DossierBookingFinance /></RequireAuth>} /> 
    
      {/* Administration */}
      <Route path="/admin"               element={<RequireAuth depts={ADMIN}><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/utilisateurs"  element={<RequireAuth depts={ADMIN}><Utilisateurs /></RequireAuth>} />
      <Route path="/admin/constantes"    element={<RequireAuth depts={ADMIN}><Constantes /></RequireAuth>} />
      <Route path="/admin/historique"    element={<RequireAuth depts={ADMIN}><Historique /></RequireAuth>} />
      <Route path="/admin/statistiques"  element={<RequireAuth depts={ADMIN}><Statistiques /></RequireAuth>} />

      {/* Superviseur */}
      <Route path="/superviseur"         element={<RequireAuth depts={SUPER}><Journal /></RequireAuth>} />
      <Route path="/superviseur/insert"  element={<RequireAuth depts={SUPER}><SuperviseurInsert /></RequireAuth>} />
      <Route path="/superviseur/update"  element={<RequireAuth depts={SUPER}><SuperviseurUpdate /></RequireAuth>} />
      <Route path="/superviseur/delete"  element={<RequireAuth depts={SUPER}><SuperviseurDelete /></RequireAuth>} />
      <Route path="/superviseur/stats"   element={<RequireAuth depts={SUPER}><SuperviseurStats /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
