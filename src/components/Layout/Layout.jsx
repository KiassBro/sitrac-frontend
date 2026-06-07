import { useAuthStore } from '../../store/authStore'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'
import ConfirmDialog from '../UI/ConfirmDialog'

export default function Layout({ children, breadcrumb }) {
  const { sidebarCollapsed } = useAuthStore()
  const w = sidebarCollapsed ? 68 : 260

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Sidebar />
      <div className="flex flex-col flex-1 min-h-screen transition-all duration-300" style={{ marginLeft: w }}>
        <Topbar breadcrumb={breadcrumb} />
        <main className="flex-1 p-6 animate-fade-in">
          {children}
        </main>
      </div>
      <ConfirmDialog />
    </div>
  )
}
