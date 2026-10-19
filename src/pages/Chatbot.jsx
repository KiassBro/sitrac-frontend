import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Trash2, User, Loader2, Sparkles, Database } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { chatbotAPI, salesAPI } from '../utils/api'
import Layout from '../components/Layout/Layout'
import GIPrintModal from '../components/PDF/GIPrintModal'
import CotationPrintModal   from '../components/PDF/CotationPrintModal'
import FactureProPrintModal from '../components/PDF/FactureProPrintModal'
import { Printer } from 'lucide-react'

// Suggestions selon le département : uniquement des données auxquelles il a accès
const SUGGESTIONS_BY_DEPT = {
  Sales: [
    { label:'Mes clients',              q:'Donne-moi la liste de mes clients avec leur nationalité et leurs dates de voyage.' },
    { label:'Dossiers à venir',         q:'Quels dossiers partent dans les 60 prochains jours ?' },
    { label:'Échéances à relancer',     q:'Quelles échéances de paiement de mes clients sont en retard ?' },
    { label:'Tarifs hôtels',            q:'Donne-moi les tarifs des hébergements, par prestataire.' },
    { label:'Prospects à traiter',      q:'Liste les prospects au statut nouveau ou contacté.' },
    { label:'Factures pro en brouillon',q:'Quelles factures pro sont encore en brouillon ?' },
    { label:'Calcul du TOTAL 5',        q:'Comment se calcule le TOTAL 5 dans la cotation ?' },
  ],
  Booking: [
    { label:'Départs à préparer',       q:'Quels dossiers partent dans les 30 prochains jours, et lesquels n\'ont pas encore de brieffing ?' },
    { label:'Brieffings',               q:'Liste les brieffings avec chauffeur, guide et véhicule.' },
    { label:'Provisions',               q:'Liste les provisions avec leur montant total.' },
    { label:'Tarifs prestataires',      q:'Donne-moi les tarifs de tous les prestataires, par catégorie.' },
    { label:'Avis des voyageurs',       q:'Quelles sont les dernières notes de satisfaction des guides et chauffeurs ?' },
  ],
  Finance: [
    { label:'Paiements Stripe',         q:'Liste les clients qui ont payé via Stripe, avec montant et date.' },
    { label:'Échéances en retard',      q:'Quelles échéances de paiement sont en retard ?' },
    { label:'Paiements du mois',        q:'Liste les paiements encaissés ce mois-ci, avec le total.' },
    { label:'Clôtures et bénéfices',    q:'Liste les clôtures avec recettes, dépenses et bénéfice net.' },
    { label:'Factures définitives',     q:'Liste les factures définitives avec leur total.' },
    { label:'Chiffres clés',            q:'Donne-moi les chiffres clés de cette année.' },
  ],
  Administration: [
    { label:'Tarifs des prestataires',  q:'Donne-moi la liste des prix de chaque prestataire.' },
    { label:'Paiements Stripe',         q:'Liste les clients qui ont payé via Stripe, avec montant et date.' },
    { label:'Échéances en retard',      q:'Quelles échéances de paiement sont en retard ?' },
    { label:'Dossiers en cours',        q:'Liste les dossiers de vente avec les étapes déjà réalisées.' },
    { label:'Chiffres clés',            q:'Donne-moi les chiffres clés de cette année.' },
    { label:'Satisfaction voyageurs',   q:'Quelle est la note moyenne de satisfaction et les derniers avis ?' },
    { label:'Utilisateurs',             q:'Liste les utilisateurs par département.' },
  ],
  Superviseur: [
    { label:'Suppressions récentes',    q:'Quelles sont les dernières suppressions (DELETE) ?' },
    { label:'Ajouts récents',           q:'Quelles sont les 10 dernières insertions (INSERT) ?' },
    { label:'Paiements en ligne',       q:'Liste les paiements en ligne et leur statut.' },
    { label:'Chiffres clés',            q:'Donne-moi les chiffres clés de cette année.' },
    { label:'Utilisateurs',             q:'Liste les utilisateurs par département.' },
  ],
}

// Raccourcis sous la zone de saisie (même logique de droits)
const RACCOURCIS_BY_DEPT = {
  Sales:          [['Clients','Liste mes clients.'], ['Dossiers','Liste mes dossiers de vente.'], ['Échéances','Échéances à payer de mes clients.'], ['Prestataires','Liste des prestataires et leurs tarifs.'], ['Prospects','Liste des prospects.']],
  Booking:        [['Dossiers','Liste des dossiers de vente.'], ['Brieffings','Liste des brieffings.'], ['Provisions','Liste des provisions.'], ['Prestataires','Liste des prestataires et leurs tarifs.']],
  Finance:        [['Paiements','Liste des paiements encaissés.'], ['Stripe','Paiements réglés via Stripe.'], ['Échéances','Échéances à payer.'], ['Clôtures','Liste des clôtures.'], ['Chiffres clés','Chiffres clés de cette année.']],
  Administration: [['Clients','Liste des clients.'], ['Paiements','Liste des paiements encaissés.'], ['Stripe','Paiements réglés via Stripe.'], ['Prestataires','Liste des prestataires et leurs tarifs.'], ['Clôtures','Liste des clôtures.'], ['Chiffres clés','Chiffres clés de cette année.']],
  Superviseur:    [['Journal','Dernières actions du journal d\'audit.'], ['Paiements','Liste des paiements encaissés.'], ['Clôtures','Liste des clôtures.'], ['Utilisateurs','Liste des utilisateurs.']],
}

const EXEMPLES_BY_DEPT = {
  Sales:          ['Fiche GI de [nom du client] en PDF', 'Échéances en retard de mes clients', 'Tarifs des hôtels à Antsirabe'],
  Booking:        ['Départs des 30 prochains jours', 'Tarifs des transporteurs', 'Brieffing du dossier [n°]'],
  Finance:        ['Clients ayant payé via Stripe', 'Échéances en retard', 'Bénéfice net des clôtures'],
  Administration: ['Liste des prix de chaque prestataire', 'Clients ayant payé via Stripe', 'Chiffres clés de cette année'],
  Superviseur:    ['Dernières suppressions', 'Paiements en ligne du mois', 'Utilisateurs par département'],
}

const PDF_KEYWORDS = [
  'pdf','imprimer','impression','imprimé',
  'fiche gi','informations générales',
  'télécharger','générer','document'
]

// Gras / italique rendus en éléments React : aucun HTML venant de la base ou de l'IA
// n'est injecté dans la page (les noms saisis sur le site public ne peuvent rien exécuter).
function Inline({ text }) {
  const morceaux = String(text).split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g)
  return morceaux.map((m, i) => {
    if (m.startsWith('**') && m.endsWith('**') && m.length > 4) return <strong key={i}>{m.slice(2, -2)}</strong>
    if (m.startsWith('*') && m.endsWith('*') && m.length > 2) return <em key={i}>{m.slice(1, -1)}</em>
    return <span key={i}>{m}</span>
  })
}

const cellules = (ligne) => ligne.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())

function Tableau({ lignes }) {
  const [entete, ...reste] = lignes
  const corps = reste.filter((l) => !/^\s*\|?\s*:?-{2,}/.test(l))
  return (
    <div className="my-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-xs border-collapse">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>{cellules(entete).map((c, i) => (
            <th key={i} className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap border-b border-gray-200 dark:border-gray-700"><Inline text={c}/></th>
          ))}</tr>
        </thead>
        <tbody>
          {corps.map((l, i) => (
            <tr key={i} className="border-b last:border-b-0 border-gray-100 dark:border-gray-800">
              {cellules(l).map((c, j) => <td key={j} className="px-3 py-1.5 align-top"><Inline text={c}/></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MarkdownText({ text, isUser }) {
  const blocs = []
  String(text || '').split('\n').forEach((line) => {
    const dernier = blocs[blocs.length - 1]
    if (line.trim().startsWith('|')) {
      if (dernier?.type === 'table') dernier.lignes.push(line)
      else blocs.push({ type: 'table', lignes: [line] })
    } else blocs.push({ type: 'ligne', line })
  })
  const puce = isUser ? 'text-white/70' : 'text-orange'
  return (
    <div className="space-y-1">
      {blocs.map((b, i) => {
        if (b.type === 'table') return <Tableau key={i} lignes={b.lignes}/>
        const line = b.line
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-1.5 mb-0.5"><Inline text={line.slice(4)}/></h4>
        if (line.startsWith('## ') || line.startsWith('# '))
          return <h3 key={i} className="font-bold text-base mt-2 mb-1 first:mt-0"><Inline text={line.replace(/^#+\s/, '')}/></h3>
        if (/^\s*[-•*]\s/.test(line))
          return (
            <div key={i} className="flex gap-2 ml-1">
              <span className={`mt-0.5 flex-shrink-0 text-xs ${puce}`}>•</span>
              <span><Inline text={line.replace(/^\s*[-•*]\s/, '')}/></span>
            </div>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <div key={i} className="flex gap-2 ml-1">
              <span className={`mt-0.5 flex-shrink-0 text-xs font-bold ${puce}`}>{line.match(/^(\d+)\./)[1]}.</span>
              <span><Inline text={line.replace(/^\d+\.\s*/, '')}/></span>
            </div>
          )
        if (line.trim() === '' || line.trim() === '---') return <div key={i} className="h-1"/>
        return <p key={i}><Inline text={line}/></p>
      })}
    </div>
  )
}

function MessageBubble({ msg, onPrint, onPrintCotation, onPrintFP }) {
  const isBot = msg.role === 'assistant'
  return (
    <div className={`flex gap-3 ${isBot?'':'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center
        flex-shrink-0 mt-1
        ${isBot
          ?'bg-orange text-white'
          :'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
        {isBot?<Bot size={15}/>:<User size={15}/>}
      </div>
      <div className={`max-w-[78%] ${!isBot?'items-end flex flex-col':''}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isBot
            ?'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-sm shadow-sm text-gray-800 dark:text-gray-200'
            :'bg-orange text-white rounded-tr-sm'}`}>
          <MarkdownText text={msg.content} isUser={!isBot}/>
        </div>

        {/* Bouton imprimer PDF — visible quand client_data reçu */}
        {/* Bouton PDF GI */}
        {isBot && msg.clientData && (
          <button onClick={() => onPrint(msg.clientData)}
            className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl
              text-sm font-semibold bg-orange text-white shadow-sm
              hover:bg-orange-dark hover:shadow-md transition-all">
            <Printer size={15}/> Fiche GI — {msg.clientData.titre} {msg.clientData.nom}
          </button>
        )}

        {/* Bouton PDF Cotation */}
        {isBot && msg.cotationData && (
          <button onClick={() => onPrintCotation(msg.cotationData)}
            className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl
              text-sm font-semibold bg-gray-800 text-white shadow-sm
              hover:bg-gray-900 hover:shadow-md transition-all">
            <Printer size={15}/> Cotation — {msg.cotationData.client_nom}
          </button>
        )}

        {/* Bouton PDF Facture Pro */}
        {isBot && msg.fpData && (
          <button onClick={() => onPrintFP(msg.fpData)}
            className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl
              text-sm font-semibold bg-orange text-white shadow-sm
              hover:bg-orange-dark hover:shadow-md transition-all">
            <Printer size={15}/> Facture Pro — {msg.fpData.client_nom}
          </button>
        )}

        {/* Badges outils DB */}
        {isBot && msg.toolsUsed?.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {msg.toolsUsed.map(t=>(
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full
                bg-blue-50 dark:bg-blue-900/20 text-blue-500
                border border-blue-200 dark:border-blue-800
                flex items-center gap-1">
                <Database size={8}/>{t.replace(/_/g,' ')}
              </span>
            ))}
          </div>
        )}

        <div className="text-[10px] text-gray-400 mt-1 px-1">
          {new Date(msg.ts).toLocaleTimeString('fr-FR',
            {hour:'2-digit',minute:'2-digit'})}
        </div>
      </div>
    </div>
  )
}

export default function Chatbot() {
  const { user } = useAuthStore()
  const dept     = user?.dept || 'Sales'

  const [messages,    setMessages]    = useState([{
    role:'assistant',
    content:`Bonjour **${user?.name||''}** !\n\nJe suis **SITRA-BOT**, l'assistant connecté aux données de SITRAC. Je réponds selon les droits du département **${dept}** : clients, dossiers, prestataires et tarifs, paiements, échéances, factures, clôtures…\n\nPar exemple :\n${(EXEMPLES_BY_DEPT[dept] || EXEMPLES_BY_DEPT.Sales).map(e => `- ${e}`).join('\n')}`,
    ts:Date.now(), toolsUsed:[], clientData:null,
  }])
  const [input,       setInput]           = useState('')
  const [loading,     setLoading]         = useState(false)
  const [printClient, setPrintClient]     = useState(null)
  const [printCotation, setPrintCotation] = useState(null) 
  const [printFP,       setPrintFP]       = useState(null)
  const bottomRef   = useRef(null)
  const textareaRef = useRef(null)

  const suggestions = SUGGESTIONS_BY_DEPT[dept] || SUGGESTIONS_BY_DEPT.Sales

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:'smooth'})
  }, [messages])

  // Ouvrir le modal PDF — charge les données complètes si besoin
  const handlePrint = async (clientData) => {
    if (clientData?.pax !== undefined) {
      setPrintClient(clientData)
      return
    }
    try {
      const full = await salesAPI.getClient(clientData.id)
      setPrintClient(full)
    } catch {
      setPrintClient(clientData)
    }
  }

    const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = '46px'

    const wantsPDF = PDF_KEYWORDS.some(k => text.toLowerCase().includes(k))
    const userMsg  = {role:'user', content:text, ts:Date.now()}
    const newMsgs  = [...messages, userMsg]
    setMessages(newMsgs)
    setLoading(true)

    try {
      const apiMessages = newMsgs.map(m=>({role:m.role,content:m.content}))
      const res         = await chatbotAPI.send(apiMessages)

      const reply        = res.reply         || 'Désolé, pas de réponse.'
      const toolsUsed    = res.tools_used    || []
      const clientData   = res.client_data   || null
      const cotationData = res.cotation_data || null  
      const fpData       = res.fp_data       || null

      setMessages(prev => [...prev, {
        role:'assistant', content:reply,
        ts:Date.now(), toolsUsed, clientData, cotationData, fpData,
      }])

      // Ouvrir le PDF automatiquement si demandé + données disponibles
      if (wantsPDF && clientData)   setTimeout(()=>handlePrint(clientData), 400)
      if (cotationData)              setTimeout(()=>setPrintCotation(cotationData), 400)
      if (fpData)                    setTimeout(()=>setPrintFP(fpData), 400)

    } catch(e) {
      // apiFetch (utils/api.js) lance un Error simple avec .message / .data,
      // pas un objet de type axios avec .response.data — cette lecture ne
      // fonctionnait que par un repli accidentel sur e.message.
      const errMsg = e.data?.error || e.message || 'Erreur'
      setMessages(prev => [...prev, {
        role:'assistant',
        content:`**Erreur** : ${errMsg}`,
        ts:Date.now(), toolsUsed:[], clientData:null,
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => setMessages([{
    role:'assistant',
    content:`Conversation réinitialisée.\n\nComment puis-je vous aider, **${user?.name}** ?`,
    ts:Date.now(), toolsUsed:[], clientData:null,
  }])

  return (
    <Layout breadcrumb={['SITRAC','Assistant IA']}>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange flex items-center
              justify-center shadow-sm">
              <Bot size={20} className="text-white"/>
            </div>
            SITRA-BOT
            <span className="px-2 py-0.5 text-[10px] font-bold bg-orange/10
              text-orange rounded-full border border-orange/20 uppercase
              tracking-wide">
              IA · Gemini 2.5
            </span>
          </h1>
          <p className="page-sub mt-0.5">
            Assistant intelligent — données réelles + PDF intégré
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={clearChat}>
          <Trash2 size={14}/> Réinitialiser
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4"
        style={{height:'calc(100vh - 200px)'}}>

        {/* Suggestions */}
        <div className="lg:col-span-1 flex flex-col gap-2 overflow-y-auto pr-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase
            tracking-wide mb-1 flex items-center gap-1">
            <Sparkles size={11}/> Suggestions
          </div>
          {suggestions.map((s,i)=>(
            <button key={i} onClick={()=>sendMessage(s.q)}
              disabled={loading}
              className="text-left p-3 rounded-xl border border-gray-200
                dark:border-gray-700 bg-white dark:bg-gray-800
                hover:border-orange hover:bg-orange/5 text-xs
                text-gray-600 dark:text-gray-400 transition-all
                disabled:opacity-40 group">
              <div className="font-semibold text-gray-800 dark:text-gray-200
                mb-0.5 group-hover:text-orange text-xs">
                {s.label}
              </div>
              <div className="line-clamp-2 text-[11px] leading-relaxed">
                {s.q}
              </div>
            </button>
          ))}
          <div className="mt-auto p-3 rounded-xl bg-gray-50 dark:bg-gray-900
            border border-gray-100 dark:border-gray-800 text-[10px]
            text-gray-400">
            <div className="font-semibold text-gray-500 mb-1">Modèle IA</div>
            <div>Gemini 2.5 Flash</div>
            <div className="mt-1">DB SITRAC connectée</div>
            <div className="mt-1">PDF : génération directe</div>
            <div className="mt-1 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
              En ligne
            </div>
          </div>
        </div>

        {/* Zone chat */}
        <div className="lg:col-span-3 flex flex-col bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700 rounded-2xl
          overflow-hidden shadow-sm">

          <div className="flex-1 overflow-y-auto p-4 space-y-4
            bg-gray-50/50 dark:bg-gray-900/50">
            {messages.map((msg,i)=>(
            <MessageBubble
              key={i}
              msg={msg}
              onPrint={handlePrint}
              onPrintCotation={(d)=>setPrintCotation(d)}
              onPrintFP={(d)=>setPrintFP(d)}
            />
          ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-orange flex items-center
                  justify-center flex-shrink-0 mt-1">
                  <Bot size={15} className="text-white"/>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200
                  dark:border-gray-700 px-4 py-3 rounded-2xl rounded-tl-sm
                  shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    {[0,150,300].map(d=>(
                      <div key={d}
                        className="w-2 h-2 bg-orange rounded-full animate-bounce"
                        style={{animationDelay:`${d}ms`}}/>
                    ))}
                    <span className="text-xs text-gray-400 ml-1">
                      SITRA-BOT analyse...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700"/>

          <div className="p-3 bg-white dark:bg-gray-800">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {(RACCOURCIS_BY_DEPT[dept] || RACCOURCIS_BY_DEPT.Sales)
                .map(([chip, question])=>(
                  <button key={chip} disabled={loading}
                    onClick={()=>sendMessage(question)}
                    className="flex-shrink-0 px-3 py-1 rounded-full text-xs
                      border border-gray-200 dark:border-gray-600
                      bg-gray-50 dark:bg-gray-700
                      hover:border-orange hover:text-orange hover:bg-orange/5
                      text-gray-500 transition-all disabled:opacity-40">
                    {chip}
                  </button>
                ))}
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={e=>{
                    setInput(e.target.value)
                    e.target.style.height='auto'
                    e.target.style.height=
                      Math.min(e.target.scrollHeight,120)+'px'
                  }}
                  onKeyDown={e=>{
                    if(e.key==='Enter'&&!e.shiftKey){
                      e.preventDefault(); sendMessage()
                    }
                  }}
                  placeholder={`Ex. : « ${(EXEMPLES_BY_DEPT[dept] || EXEMPLES_BY_DEPT.Sales)[0]} »`}
                  disabled={loading}
                  className="w-full resize-none rounded-xl border border-gray-200
                    dark:border-gray-600 bg-gray-50 dark:bg-gray-700
                    px-4 py-3 text-sm text-gray-800 dark:text-gray-200
                    placeholder-gray-400 focus:outline-none focus:border-orange
                    focus:ring-2 focus:ring-orange/20 transition-all
                    disabled:opacity-50"
                  style={{minHeight:'46px',maxHeight:'120px'}}
                />
              </div>
              <button onClick={()=>sendMessage()}
                disabled={!input.trim()||loading}
                className="flex-shrink-0 w-11 h-11 rounded-xl bg-orange
                  text-white flex items-center justify-center shadow-sm
                  hover:bg-orange-dark hover:shadow-md transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed">
                {loading
                  ?<Loader2 size={18} className="animate-spin"/>
                  :<Send size={18}/>}
              </button>
            </div>
            <div className="text-[10px] text-gray-400 text-center mt-2">
              Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
            </div>
          </div>
        </div>
      </div>

      {/* Modal PDF */}
      {/* PDF GI */}
      <GIPrintModal
        client={printClient}
        open={!!printClient}
        onClose={()=>setPrintClient(null)}
      />

      {/* PDF Cotation */}
      <CotationPrintModal
        data={printCotation}
        open={!!printCotation}
        onClose={()=>setPrintCotation(null)}
      />

      {/* PDF Facture Pro */}
      <FactureProPrintModal
        data={printFP}
        open={!!printFP}
        onClose={()=>setPrintFP(null)}
      />

    </Layout>
  )
}