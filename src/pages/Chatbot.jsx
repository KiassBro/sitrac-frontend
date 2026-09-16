import { useState, useRef, useEffect } from 'react'
import {
  Bot, Send, Trash2, User, Loader2, Sparkles, Database
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { chatbotAPI, salesAPI } from '../utils/api'
import Layout from '../components/Layout/Layout'
import GIPrintModal from '../components/PDF/GIPrintModal'
import CotationPrintModal   from '../components/PDF/CotationPrintModal'
import FactureProPrintModal from '../components/PDF/FactureProPrintModal'

const SUGGESTIONS_BY_DEPT = {
  Sales: [
    { label:'Liste mes clients',  q:'Donne-moi la liste de tous les clients.' },
    { label:'Dossiers de vente',  q:'Montre-moi tous les dossiers de vente.' },
    { label:'Destinations dispo', q:'Quelles sont les destinations disponibles ?' },
    { label:'Programmes actifs',  q:'Liste tous les programmes touristiques.' },
    { label:'Calcul TOTAL 5',     q:'Comment se calcule le TOTAL 5 dans la cotation ?' },
    { label:'Fiche GI en PDF',    q:'Donne-moi la fiche GI du premier client en PDF.' },
    { label:'RG Facture Pro',     q:'Quelles sont les règles pour créer une Facture Pro ?' },
    { label:'Flux complet',       q:'Explique le flux complet Sales → Finance.' },
  ],
  Booking: [
    { label:'Dossiers reçus',     q:'Montre-moi les dossiers de vente disponibles.' },
    { label:'Brieffings',         q:'Liste les brieffings prestataires.' },
    { label:'Provisions',         q:'Comment fonctionnent les provisions ?' },
    { label:'RG Brieffing',       q:'Quelles sont les règles du brieffing ?' },
    { label:'Flux Booking',       q:'Explique le rôle du département Booking.' },
  ],
  Finance: [
    { label:'Paiements',          q:'Liste les paiements enregistrés.' },
    { label:'Clôtures',           q:'Liste les clôtures avec bénéfices.' },
    { label:'Dossiers Finance',   q:'Montre-moi les dossiers disponibles.' },
    { label:'KPIs Finance',       q:'Résumé des indicateurs financiers.' },
    { label:'RG Clôture',         q:'Explique la règle RG 24 — clôture.' },
  ],
  Administration: [
    { label:'Tous les clients',   q:'Liste complète des clients.' },
    { label:'Tous les dossiers',  q:'Liste tous les dossiers de vente.' },
    { label:'Utilisateurs',       q:'Liste tous les utilisateurs.' },
    { label:'Clôtures',           q:'Liste toutes les clôtures et bénéfices.' },
    { label:'Fiche GI PDF',       q:'Donne-moi la fiche GI du client DUPONT en PDF.' },
    { label:'Architecture',       q:'Architecture technique de SITRAC.' },
  ],
  Superviseur: [
    { label:'Audit INSERT',       q:'10 dernières actions INSERT.' },
    { label:'Audit DELETE',       q:'Dernières suppressions DELETE.' },
    { label:'Utilisateurs',       q:'Liste tous les utilisateurs.' },
    { label:'Clôtures',           q:'Liste toutes les clôtures.' },
    { label:'RG Audit',           q:'Explique RG 37 et RG 38 sur l\'audit.' },
  ],
}

const PDF_KEYWORDS = [
  'pdf','imprimer','impression','imprimé',
  'fiche gi','informations générales',
  'télécharger','générer','document'
]

function MarkdownText({ text, isUser }) {
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## '))
          return <h3 key={i} className="font-bold text-base mt-2 mb-1 first:mt-0">
            {line.replace('## ','')}
          </h3>
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-1.5 mb-0.5">
            {line.replace('### ','')}
          </h4>
        if (line.startsWith('- ')||line.startsWith('• '))
          return (
            <div key={i} className="flex gap-2 ml-1">
              <span className={`mt-0.5 flex-shrink-0 text-xs
                ${isUser?'text-white/70':'text-orange'}`}>•</span>
              <span dangerouslySetInnerHTML={{
                __html:line.slice(2)
                  .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
              }}/>
            </div>
          )
        if (line.match(/^\d+\./))
          return (
            <div key={i} className="flex gap-2 ml-1">
              <span className={`mt-0.5 flex-shrink-0 text-xs font-bold
                ${isUser?'text-white/70':'text-orange'}`}>
                {line.match(/^(\d+)\./)?.[1]}.
              </span>
              <span dangerouslySetInnerHTML={{
                __html:line.replace(/^\d+\.\s*/,'')
                  .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
              }}/>
            </div>
          )
        if (line===''||line==='---') return <div key={i} className="h-1"/>
        return (
          <p key={i} dangerouslySetInnerHTML={{
            __html:line
              .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
              .replace(/\*(.*?)\*/g,'<em>$1</em>')
          }}/>
        )
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
            🖨 Fiche GI — {msg.clientData.titre} {msg.clientData.nom}
          </button>
        )}

        {/* Bouton PDF Cotation */}
        {isBot && msg.cotationData && (
          <button onClick={() => onPrintCotation(msg.cotationData)}
            className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl
              text-sm font-semibold bg-gray-800 text-white shadow-sm
              hover:bg-gray-900 hover:shadow-md transition-all">
            🖨 Cotation — {msg.cotationData.client_nom}
          </button>
        )}

        {/* Bouton PDF Facture Pro */}
        {isBot && msg.fpData && (
          <button onClick={() => onPrintFP(msg.fpData)}
            className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl
              text-sm font-semibold bg-orange text-white shadow-sm
              hover:bg-orange-dark hover:shadow-md transition-all">
            🖨 Facture Pro — {msg.fpData.client_nom}
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
    content:`Bonjour **${user?.name||''}** ! 👋\n\nJe suis **SITRA-BOT**, votre assistant IA connecté à la base de données SITRAC.\n\nEn tant que **${dept}**, essayez :\n- *"Liste mes clients"*\n- *"Fiche GI de [nom] en PDF"*\n- *"Comment calculer le TOTAL 5 ?"*`,
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
        content:`❌ **Erreur** : ${errMsg}`,
        ts:Date.now(), toolsUsed:[], clientData:null,
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => setMessages([{
    role:'assistant',
    content:`Réinitialisé 🔄\n\nComment puis-je vous aider, **${user?.name}** ?`,
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
              {['Clients','Dossiers','Programmes','Paiements','Clôtures','PDF GI']
                .map(chip=>(
                  <button key={chip} disabled={loading}
                    onClick={()=>sendMessage(
                      chip==='PDF GI'
                        ? 'Donne-moi la fiche GI du premier client en PDF'
                        : `Montre-moi : ${chip.toLowerCase()}`
                    )}
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
                  placeholder='Ex: "Fiche GI de DUPONT en PDF" · "Liste mes clients"'
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