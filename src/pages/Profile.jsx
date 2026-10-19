import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { User, Key, Shield, History, Eye, EyeOff, Check, X, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useConfirm } from '../hooks/useConfirm'
import { timeAgo } from '../utils/storage'
import Layout from '../components/Layout/Layout'
import { Badge } from '../components/UI/index.jsx'
import { authAPI } from '../utils/api'
import { Monitor as IcoSession } from 'lucide-react'
import { CheckCircle2, XCircle, Laptop } from 'lucide-react'

const DEPT_PERMS = {
  Sales: [
    { ok:true,  label:'Gestion Destinations & Programmes' },
    { ok:true,  label:'Gestion Dossiers Clients (GI)'     },
    { ok:true,  label:'Cotation & Facture Pro'            },
    { ok:'ro',  label:'Lecture Booking & Finance'         },
    { ok:false, label:'Administration système'            },
  ],
  Booking: [
    { ok:true,  label:'Gestion Brieffings & Provisions' },
    { ok:'ro',  label:'Lecture: Dossiers Sales'         },
    { ok:false, label:'Modification données Sales'      },
    { ok:false, label:'Accès Finance'                   },
    { ok:false, label:'Administration système'          },
  ],
  Finance: [
    { ok:true,  label:'Factures Définitives & Paiements' },
    { ok:true,  label:'Clôtures & Reçus'                 },
    { ok:'ro',  label:'Lecture: Sales & Booking'         },
    { ok:false, label:'Modification Sales/Booking'       },
    { ok:false, label:'Administration système'           },
  ],
  Administration: [
    { ok:true, label:'Gestion complète utilisateurs'     },
    { ok:true, label:'Configuration système'             },
    { ok:true, label:'Accès tous départements (R/W)'     },
    { ok:true, label:'Statistiques & bilans globaux'     },
    { ok:true, label:'Supervision base de données'       },
  ],
  Superviseur: [
    { ok:true,  label:'Journal des actions (INSERT/UPDATE/DELETE)' },
    { ok:true,  label:'Statistiques d\'audit'                      },
    { ok:'ro',  label:'Lecture: données système'                   },
    { ok:false, label:'Modification des données'                   },
    { ok:false, label:'Gestion utilisateurs'                       },
  ],
}

function strengthScore(pass) {
  let s = 0
  if (pass.length >= 6)        s++
  if (/[A-Z]/.test(pass))      s++
  if (/[0-9]/.test(pass))      s++
  if (/[^A-Za-z0-9]/.test(pass)) s++
  return s
}

export default function Profile() {
  const { user, logout, refreshMe } = useAuthStore()
  const { confirm, confirmSave } = useConfirm()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'password' ? 'password' : 'info')
  const [editMode, setEditMode] = useState(false)
  const [showCur, setShowCur]   = useState(false)
  const [showNew, setShowNew]   = useState(false)
  const [showCon, setShowCon]   = useState(false)
  const [passStr, setPassStr]   = useState(0)
  const [passMatch, setPassMatch] = useState(null)

  const [profile, setProfile] = useState({ name: user.name || '', email: user.email || '', tel: '' })

  const { register: regInfo, handleSubmit: handleInfo, reset: resetInfo } = useForm({ defaultValues: { name:profile.name, email:profile.email||'', tel:profile.tel||'' } })
  const { register: regPass, handleSubmit: handlePassSubmit, watch: watchPass, reset: resetPass } = useForm()
  const newPassVal = watchPass('newPass', '')

  useEffect(() => { setPassStr(strengthScore(newPassVal)) }, [newPassVal])

  // Charge le téléphone et l'email réels depuis le serveur
  useEffect(() => {
    authAPI.me().then((me) => {
      const p = { name: me.nom_complet || user.name || '', email: me.email || '', tel: me.telephone || '' }
      setProfile(p); resetInfo(p)
    }).catch(() => {})
  }, [])

  const audit = [] // Les activités sont chargées via l'API Superviseur dans une future version

  const saveInfo = (data) => {
    confirmSave(async () => {
      try {
        // Enregistrement réel côté serveur (le nom est géré par l'Administration)
        const me = await authAPI.updateMe({ email: data.email.trim(), telephone: data.tel.trim() })
        setProfile({ name: profile.name, email: me.email || '', tel: me.telephone || '' })
        await refreshMe()
        setEditMode(false)
        toast.success('Profil mis à jour')
      } catch (e) {
        toast.error(e.message || 'Mise à jour impossible')
      }
    })
  }

  const savePassword = async (data) => {
    if (data.newPass !== data.confirmPass) { toast.error('Les mots de passe ne correspondent pas'); return }
    if (data.newPass.length < 6) { toast.error('Minimum 6 caractères'); return }
    confirm({
      icon:'cle', type:'warning', title:'Changer le mot de passe',
      msg:'Votre mot de passe sera changé. Vous devrez vous reconnecter.',
      confirmText:'Oui, changer',
      onConfirm: async () => {
        try {
          const { authAPI } = await import('../utils/api')
          await authAPI.changePassword({
            current_password: data.currentPass,
            new_password:     data.newPass,
            confirm_password: data.confirmPass,
          })
          toast.success('Mot de passe changé ! Reconnexion...')
          resetPass()
          setTimeout(() => { logout(); window.location.href = '/login' }, 2000)
        } catch(e) {
          toast.error(e.message || 'Mot de passe actuel incorrect')
        }
      }
    })
  }

  const strColors = ['','bg-brand-red','bg-orange','bg-orange','bg-brand-green']
  const strLabels = ['','Très faible','Faible','Moyen','Fort']
  const reqs = [
    { label:'Au moins 6 caractères',         ok: newPassVal.length >= 6     },
    { label:'Au moins 1 majuscule',           ok: /[A-Z]/.test(newPassVal)   },
    { label:'Au moins 1 chiffre',             ok: /[0-9]/.test(newPassVal)   },
    { label:'Au moins 1 caractère spécial',   ok: /[^A-Za-z0-9]/.test(newPassVal) },
  ]

  const perms = DEPT_PERMS[user.dept] || DEPT_PERMS.Administration

  const TABS = [
    { key:'info',     label:'Mon Compte',         icon:User    },
    { key:'password', label:'Mot de Passe',        icon:Key     },
    { key:'perms',    label:'Permissions',         icon:Shield  },
    { key:'activity', label:'Activité',            icon:History },
  ]

  return (
    <Layout breadcrumb={['SITRAC','Mon Profil']}>
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange to-orange-dark rounded-2xl p-7 mb-6 relative overflow-hidden shadow-lg">
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl text-white border-3 border-white/40 shadow-lg flex-shrink-0"
            style={{ background:'rgba(255,255,255,0.25)' }}>
            {user.login[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-title font-black text-xl text-white">{profile.name}</h2>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-white/80 text-sm">@{user.login}</span>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">{user.dept}</span>
              <span className="text-white/70 text-xs">Membre depuis Jan 2024</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={()=>setActiveTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap
                ${activeTab===t.key ? 'border-orange text-orange' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
            >
              <Icon size={14}/> {t.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tab content left */}
        <div>
          {activeTab === 'info' && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-title font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2"><User size={14}/> Informations</h3>
                <button className="btn btn-ghost btn-sm" onClick={()=>{ setEditMode(e=>!e); if(editMode) resetInfo({name:profile.name,email:profile.email||'',tel:profile.tel||''}) }}>
                  {editMode ? <><X size={13}/> Annuler</> : <><User size={13}/> Modifier</>}
                </button>
              </div>
              <div className="card-body">
                {editMode ? (
                  <form onSubmit={handleInfo(saveInfo)}>
                    <div className="form-group"><label className="form-label">Nom complet</label><input className="form-control opacity-60" readOnly {...regInfo('name')} /><p className="form-hint">Modifiable uniquement par l'Administration.</p></div>
                    <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-control" {...regInfo('email')} /></div>
                    <div className="form-group"><label className="form-label">Téléphone</label><input className="form-control" {...regInfo('tel')} /></div>
                    <div className="form-group"><label className="form-label">Login</label><input className="form-control opacity-60" readOnly value={user.login} /></div>
                    <div className="flex gap-2 mt-4">
                      <button type="button" className="btn btn-ghost flex-1" onClick={()=>setEditMode(false)}>Annuler</button>
                      <button type="submit" className="btn btn-success flex-1"><Check size={14}/> Enregistrer</button>
                    </div>
                  </form>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {[['Nom complet',profile.name],['Login',user.login],['Département',user.dept],['Email',profile.email||'—'],['Téléphone',profile.tel||'—']].map(([k,v])=>(
                      <div key={k} className="flex justify-between py-3 text-sm">
                        <span className="text-gray-500">{k}</span>
                        <strong className={`text-gray-900 dark:text-white ${k==='Login'?'font-mono':''}`}>{v}</strong>
                      </div>
                    ))}
                    <div className="flex justify-between py-3 text-sm"><span className="text-gray-500">Statut</span><Badge variant="active">Actif</Badge></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="card">
              <div className="card-header"><h3 className="font-title font-bold text-sm flex items-center gap-2"><Key size={14}/> Changer le Mot de Passe</h3></div>
              <div className="card-body">
                <form onSubmit={handlePassSubmit(savePassword)}>
                  {[
                    { id:'currentPass', label:'Mot de passe actuel', show:showCur, setShow:setShowCur, placeholder:'••••••••' },
                  ].map(f=>(
                    <div key={f.id} className="form-group">
                      <label className="form-label">{f.label} <span className="form-req">*</span></label>
                      <div className="relative">
                        <input type={f.show?'text':'password'} className="form-control pr-10" placeholder={f.placeholder} {...regPass(f.id,{required:true})} />
                        <button type="button" onClick={()=>f.setShow(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {f.show?<EyeOff size={14}/>:<Eye size={14}/>}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="form-group">
                    <label className="form-label">Nouveau mot de passe <span className="form-req">*</span></label>
                    <div className="relative">
                      <input type={showNew?'text':'password'} className="form-control pr-10" placeholder="Min. 6 caractères" {...regPass('newPass',{required:true,minLength:6})} />
                      <button type="button" onClick={()=>setShowNew(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showNew?<EyeOff size={14}/>:<Eye size={14}/>}</button>
                    </div>
                    {/* Strength */}
                    {newPassVal && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${strColors[passStr]}`} style={{ width:`${passStr*25}%` }} />
                        </div>
                        <p className="text-xs mt-1 text-gray-400">{strLabels[passStr]}</p>
                        <div className="mt-2 space-y-1">
                          {reqs.map(r=>(
                            <div key={r.label} className={`flex items-center gap-2 text-xs ${r.ok?'text-brand-green':'text-gray-400'}`}>
                              {r.ok?<Check size={10}/>:<X size={10}/>} {r.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirmer le nouveau MDP <span className="form-req">*</span></label>
                    <div className="relative">
                      <input type={showCon?'text':'password'} className="form-control pr-10" placeholder="Répéter..." {...regPass('confirmPass',{required:true})}
                        onChange={e=>setPassMatch(e.target.value===newPassVal)} />
                      <button type="button" onClick={()=>setShowCon(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showCon?<EyeOff size={14}/>:<Eye size={14}/>}</button>
                    </div>
                    {passMatch !== null && (
                      <p className={`text-xs mt-1 ${passMatch?'text-brand-green':'text-brand-red'}`}>
                        {passMatch ? <><Check size={12} className="inline -mt-px mr-1"/>Les mots de passe correspondent</> : <><X size={12} className="inline -mt-px mr-1"/>Les mots de passe ne correspondent pas</>}
                      </p>
                    )}
                  </div>
                  <button type="submit" className="btn btn-primary w-full justify-center"><Key size={14}/> Changer le mot de passe</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'perms' && (
            <div className="card">
              <div className="card-header"><h3 className="font-title font-bold text-sm flex items-center gap-2"><Shield size={14}/> Permissions d'accès</h3></div>
              <div className="card-body space-y-2">
                {perms.map((p,i)=>(
                  <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm
                    ${p.ok===true?'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                    :p.ok==='ro'?'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                    :'bg-gray-50 dark:bg-gray-800 text-gray-400 line-through'}`}
                  >
                    <span className="flex-shrink-0">{p.ok===true?<CheckCircle2 size={16}/>:p.ok==='ro'?<Eye size={16}/>:<XCircle size={16}/>}</span>
                    <span className="font-medium">{p.label}</span>
                    <span className="ml-auto text-xs font-bold opacity-60">{p.ok===true?'Autorisé':p.ok==='ro'?'Lecture':'Non autorisé'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="card">
              <div className="card-header"><h3 className="font-title font-bold text-sm flex items-center gap-2"><History size={14}/> Mes Activités Récentes</h3></div>
              <div className="card-body p-0">
                {audit.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">Aucune activité enregistrée</div>
                ) : audit.map((l,i)=>{
                  const clr = {INSERT:'text-brand-green bg-green-50',UPDATE:'text-orange bg-orange-light',DELETE:'text-brand-red bg-red-50'}[l.action]||''
                  return (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${clr}`}>{l.action}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{l.detail}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{l.table} · {timeAgo(l.ts)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: session card */}
        <div>
          <div className="card">
            <div className="card-header"><h3 className="font-title font-bold text-sm flex items-center gap-2"><IcoSession size={15} className="text-orange shrink-0"/>Session en cours</h3></div>
            <div className="card-body">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 mb-4">
                <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center text-white"><Laptop size={18}/></div>
                <div>
                  <div className="text-sm font-bold text-green-800 dark:text-green-400">Session active</div>
                  <div className="text-xs text-green-700 dark:text-green-500">Navigateur Web · {new Date().toLocaleString('fr-FR')}</div>
                </div>
                <Badge variant="active" className="ml-auto">En ligne</Badge>
              </div>
              <button
                className="btn btn-danger w-full justify-center"
                onClick={() => confirm({ icon:'deconnexion', type:'danger', title:'Déconnexion', msg:'Voulez-vous vous déconnecter ?', confirmText:'Oui, déconnecter', onConfirm: () => { logout(); window.location.href = '/login' } })}
              >
                <LogOut size={14}/> Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
