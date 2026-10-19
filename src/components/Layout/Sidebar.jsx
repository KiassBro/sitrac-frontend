import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useUiStore } from '../../store/uiStore'
import { useProgrammeClients, useDestinations, useProgrammes } from '../../hooks/useApi'
import {
  LayoutGrid, Bell, User, MapPin, Route, Calculator, FileText,
  Users, Car, BarChart2, ClipboardList, Package, FileCheck,
  CreditCard, FolderOpen, Receipt, Shield, Settings,
  History, Database, PlusCircle, Edit, Trash2,
  LogOut, Folder, Bot, Handshake, Building2, CalendarRange, Inbox, Star, FileSpreadsheet,
  Briefcase
} from 'lucide-react'

// Référentiel des prestataires (hôtels, transporteurs, guides, parcs…)
const PRESTATAIRES = { to:'/prestataires', icon:Building2, label:'Prestataires' }
// Planning des chauffeurs, guides et véhicules
const PLANNING = { to:'/planning', icon:CalendarRange, label:'Planning ressources' }
// Demandes de devis (prospects), avant le dossier client
const PROSPECTS = { to:'/prospects', icon:Inbox, label:'Prospects' }
// Journaux et écritures pour la comptabilité
const EXPORTS_COMPTA = { to:'/finance/exports', icon:FileSpreadsheet, label:'Exports comptables' }

// Client & Communication : confirmation des devis, échéancier, espace client, messages
const RELATION_CLIENT = [
  { section: 'Relation client' },
  { to:'/relation-client',         icon:Handshake,      label:'Suivi client & paiements' },
  { to:'/satisfaction',            icon:Star,           label:'Satisfaction voyageurs' },
]

const DEPT_LINKS = {
  Sales: [
    { section: 'Base de données' },
    { to:'/sales/destinations',    icon:MapPin,         label:'Destinations'          },
    { to:'/sales/programmes',      icon:Route,          label:'Programmes'            },
    PRESTATAIRES,
    PLANNING,
    { to:'/sales/cotation-libre',  icon:Calculator,     label:'Cotation Libre'        },
    { to:'/sales/facturepro-libre',icon:FileText,       label:'Facture Pro Libre'     },
    { section: 'Dossier Client' },
    PROSPECTS,
    { to:'/sales/gi',              icon:User,           label:'Informations Générales'},
    { to:'/sales/pc',              icon:Car,            label:'Programme Client'      },
    { to:'/sales/cotation',        icon:FileText,       label:'Cotation'              },
    { to:'/sales/facture-pro',     icon:BarChart2,      label:'Facture Pro'           },
    ...RELATION_CLIENT,
  ],
  Booking: [
    { section: 'Dossier Booking' },
    { to:'/booking/briefings',      icon:ClipboardList,  label:'Brieffing'             },
    { to:'/booking/provision',      icon:Package,        label:'Provision'             },
    { section: 'Lecture seule' },
    { to:'/booking/dossier-vente',  icon:Folder,         label:'Dossiers de vente'     },
    { section: 'Référentiel' },
    PRESTATAIRES,
    PLANNING,
    ...RELATION_CLIENT,
  ],
  Finance: [
    { section: 'Dossier Finance' },
    { to:'/finance/facture-def',    icon:FileCheck,      label:'Facture Définitive'    },
    { to:'/finance/paiement',       icon:CreditCard,     label:'Paiement Client'       },
    { to:'/finance/cloture',        icon:FolderOpen,     label:'Clôture'               },
    { to:'/finance/recu',           icon:Receipt,        label:'Reçu'                  },
    EXPORTS_COMPTA,
    { section: 'Lecture seule' },
    { to:'/finance/dossier-vente',  icon:Folder,         label:'Dossiers de vente'     },
    { to:'/finance/dossier-booking',icon:FolderOpen,     label:'Dossiers Booking'      },
    { section: 'Référentiel' },
    PRESTATAIRES,
    PLANNING,
    ...RELATION_CLIENT,
  ],
  Administration: [
    { section: 'Base de données' },
    { to:'/sales/destinations',    icon:MapPin,          label:'Destinations'          },
    { to:'/sales/programmes',      icon:Route,           label:'Programmes'            },
    PRESTATAIRES,
    PLANNING,
    { section: 'Dossier Client' },
    PROSPECTS,
    { to:'/sales/gi',              icon:User,            label:'Informations Générales'},
    { to:'/sales/pc',              icon:Car,             label:'Programme Client'      },
    { to:'/sales/cotation',        icon:FileText,        label:'Cotation'              },
    { to:'/sales/facture-pro',     icon:BarChart2,       label:'Facture Pro'           },
    { section: 'Dossier Booking' },
    { to:'/booking/briefings',     icon:ClipboardList,   label:'Brieffing'             },
    { to:'/booking/provision',     icon:Package,         label:'Provision'             },
    { section: 'Dossier Finance' },
    { to:'/finance/facture-def',   icon:FileCheck,       label:'Facture Définitive'    },
    { to:'/finance/paiement',      icon:CreditCard,      label:'Paiement Client'       },
    { to:'/finance/cloture',       icon:FolderOpen,      label:'Clôture'               },
    { to:'/finance/recu',          icon:Receipt,         label:'Reçu'                  },
    EXPORTS_COMPTA,
    ...RELATION_CLIENT,
    { section: 'Administration' },
    { to:'/admin',                 icon:Shield,          label:'Tableau de bord Admin' },
    { to:'/admin/utilisateurs',    icon:Settings,        label:'Utilisateurs'          },
    // RG 29 : répartition et réattribution des clients entre commerciaux
    { to:'/admin/portefeuilles',   icon:Briefcase,       label:'Portefeuilles commerciaux' },
    { to:'/admin/constantes',      icon:Settings,        label:'Constantes'            },
    { to:'/admin/historique',      icon:History,         label:'Historiques Sessions'  },
    { to:'/admin/statistiques',    icon:BarChart2,       label:'Statistiques'          },
  ],
  Superviseur: [
    { section: 'Supervision BD' },
    { to:'/superviseur',           icon:Database,        label:'Journal des actions'   },
    { to:'/superviseur/insert',    icon:PlusCircle,      label:'INSERT'                },
    { to:'/superviseur/update',    icon:Edit,            label:'UPDATE'                },
    { to:'/superviseur/delete',    icon:Trash2,          label:'DELETE'                },
    { to:'/superviseur/stats',     icon:BarChart2,       label:'Statistiques'          },
    PROSPECTS,
    EXPORTS_COMPTA,
    { section: 'Référentiel' },
    PRESTATAIRES,
    PLANNING,
    ...RELATION_CLIENT,
  ],
}

export default function Sidebar() {
  const { user, sidebarCollapsed } = useAuthStore()
  const { showConfirm } = useUiStore()
  const navigate = useNavigate()

  // Les hooks sont appelés avant tout « return » (règle des hooks React) :
  // sinon React plante à la déconnexion, quand `user` passe à null.
  const { data: pcs   = [] } = useProgrammeClients()
  const { data: dests = [] } = useDestinations()
  const { data: progs = [] } = useProgrammes()

  if (!user) return null

  const notifCount = (() => {
    let count = 0
    const dept = user.dept
    if (dept === 'Sales' || dept === 'Administration') {
      count += pcs.filter(p => !p.a_cotation).length
      count += pcs.filter(p => p.a_cotation && !p.a_facture_pro).length
    }
    if (dept === 'Booking' || dept === 'Administration') {
      count += pcs.filter(p => p.a_facture_pro && !p.a_brieffing).length
    }
    if (dept === 'Finance' || dept === 'Administration') {
      count += pcs.filter(p => p.a_facture_pro && !p.a_facture_def).length
    }
    try {
      const read = new Set(JSON.parse(sessionStorage.getItem('sitrac_notif_read') || '[]'))
      return Math.max(0, count - read.size)
    } catch { return count }
  })()

  const links = DEPT_LINKS[user.dept] || []

  const handleLogout = () => {
    showConfirm({
      icon:'deconnexion', type:'danger', title:'Déconnexion',
      msg:'Êtes-vous sûr de vouloir vous déconnecter ?',
      confirmText:'Oui, déconnecter',
      onConfirm: () => {
        useAuthStore.getState().logout()
        navigate('/login')
      }
    })
  }

  return (
    <aside
      className={`fixed top-0 left-0 h-full flex flex-col bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-700 shadow-sm z-[300]
        overflow-hidden
        ${sidebarCollapsed ? 'w-[68px]' : 'w-[260px]'}`}
      style={{
        // Transition uniquement sur la largeur (pas de transform : l'élément
        // fixe reste attaché à la fenêtre, y compris sous Microsoft Edge)
        transition: 'width 300ms ease',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200
        dark:border-gray-700 min-h-[68px]">
        <img src="/logo.jpg" alt="Ramartour"
          className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow-sm"
          onError={e => { e.target.style.display='none' }}/>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <div className="font-title font-black text-base text-orange leading-none">
              SITRAC
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Ramartour Madagascar</div>
          </div>
        )}
      </div>

      {/* User */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-200
        dark:border-gray-700">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center
          font-black text-sm text-white flex-shrink-0"
          style={{ background: user.color }}>
          {user.login[0].toUpperCase()}
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
              {user.name}
            </div>
            <div className="text-xs text-gray-400">{user.dept}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2">

        {/* ── Liens communs à tous les départements ── */}
        <NavLink to="/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive?'active':''}`}>
          <LayoutGrid size={17} className="flex-shrink-0"/>
          {!sidebarCollapsed && <span>Tableau de bord</span>}
        </NavLink>

        <NavLink to="/notifications"
          className={({ isActive }) => `sidebar-link ${isActive?'active':''}`}>
          <Bell size={17} className="flex-shrink-0"/>
          {!sidebarCollapsed && (
            <>
              <span className="flex-1">Notifications</span>
              {notifCount > 0 && (
                <span className="bg-orange text-white text-[10px] font-black
                  px-2 py-0.5 rounded-full">
                  {notifCount}
                </span>
              )}
            </>
          )}
        </NavLink>

        <NavLink to="/profile"
          className={({ isActive }) => `sidebar-link ${isActive?'active':''}`}>
          <User size={17} className="flex-shrink-0"/>
          {!sidebarCollapsed && <span>Mon Profil</span>}
        </NavLink>

        {/* NOUVEAU — Assistant IA visible par tous */}
        <NavLink to="/chatbot"
          className={({ isActive }) => `sidebar-link ${isActive?'active':''}`}>
          <Bot size={17} className="flex-shrink-0 text-orange"/>
          {!sidebarCollapsed && (
            <span className="flex items-center gap-2 flex-1">
              Assistant IA
              <span className="text-[9px] font-bold bg-orange/10 text-orange
                px-1.5 py-0.5 rounded-full border border-orange/20">
                NOUVEAU
              </span>
            </span>
          )}
        </NavLink>

        {/* ── Liens spécifiques au département ── */}
        {links.map((item, i) => {
          if (item.section) {
            return !sidebarCollapsed ? (
              <div key={i} className="text-[10px] font-black uppercase tracking-widest
                text-gray-400 px-2 pt-4 pb-1">
                {item.section}
              </div>
            ) : <div key={i} className="my-1 border-t border-gray-100 dark:border-gray-800"/>
          }
          const Ic = item.icon
          return (
            <NavLink key={item.to} to={item.to}
              title={sidebarCollapsed ? item.label : undefined}
              className={({ isActive }) => `sidebar-link ${isActive?'active':''}`}>
              <Ic size={16} className="flex-shrink-0"/>
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2.5 pb-3 border-t border-gray-200 dark:border-gray-700 pt-2">
        <button onClick={handleLogout}
          className="sidebar-link w-full text-brand-red hover:bg-red-50
            dark:hover:bg-red-900/20">
          <LogOut size={16} className="flex-shrink-0"/>
          {!sidebarCollapsed && <span>Déconnexion</span>}
        </button>
      </div>

    </aside>
  )
}