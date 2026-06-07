import Layout from '../components/Layout/Layout'
import { Wrench } from 'lucide-react'

export default function PlaceholderPage({ title, breadcrumb, desc, icon: Icon = Wrench }) {
  return (
    <Layout breadcrumb={breadcrumb || ['SITRAC', title]}>
      <div className="mb-5">
        <h1 className="page-title"><Icon size={22} className="text-orange" /> {title}</h1>
        {desc && <p className="page-sub">{desc}</p>}
      </div>
      <div className="card">
        <div className="flex flex-col items-center py-20 text-center">
          <div className="w-20 h-20 bg-orange-light dark:bg-orange/20 rounded-2xl flex items-center justify-center mb-5">
            <Icon size={36} className="text-orange" />
          </div>
          <h2 className="font-title font-black text-xl text-gray-800 dark:text-white mb-2">{title}</h2>
          <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-6">
            Ce module est entièrement fonctionnel dans la version HTML. 
            La migration React est en cours — les données sont déjà disponibles via le store Zustand.
          </p>
          <div className="flex gap-2 flex-wrap justify-center">
            <span className="text-xs bg-orange-light text-orange-dark font-bold px-3 py-1.5 rounded-full">
              🔄 Migration en cours
            </span>
            <span className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded-full">
              ✅ Données disponibles
            </span>
          </div>
        </div>
      </div>
    </Layout>
  )
}
