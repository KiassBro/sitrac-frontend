import { useAuthStore } from '../../store/authStore'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'
import ConfirmDialog from '../UI/ConfirmDialog'

export default function Layout({ children, breadcrumb }) {
  const { sidebarCollapsed } = useAuthStore()
  const w = sidebarCollapsed ? 68 : 260

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div
        className="flex flex-col flex-1 min-h-screen"
        style={{
          marginLeft: w,
          transition: 'margin-left 300ms ease',
        }}
      >
        <Topbar breadcrumb={breadcrumb} sidebarWidth={w}/>

        {/* ✅ paddingTop: 64px = hauteur h-16 de la Topbar fixed */}
        <main
          className="flex-1 p-6"
          style={{ paddingTop: 'calc(64px + 1.5rem)' }}
        >
          {children}
        </main>
      </div>
      <ConfirmDialog />
    </div>
  )
}