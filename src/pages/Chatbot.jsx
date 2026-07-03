import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bot, Send, Trash2, User, Loader2,
  Sparkles, Database, FileText, ExternalLink
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { chatbotAPI } from '../utils/api'
import Layout from '../components/Layout/Layout'

// ─── Suggestions par département ─────────────────────────────
const SUGGESTIONS_BY_DEPT = {
  Sales: [
    { label: 'Liste mes clients',    q: 'Donne-moi la liste de tous les clients enregistrés.' },
    { label: 'Liste les dossiers',   q: 'Montre-moi tous les dossiers de vente.' },
    { label: 'Destinations dispo',   q: 'Quelles sont les destinations disponibles ?' },
    { label: 'Programmes actifs',    q: 'Liste tous les programmes touristiques actifs.' },
    { label: 'Flux cotation',        q: 'Explique-moi comment fonctionne la cotation dans SITRAC.' },
    { label: 'Calculer TOTAL 5',     q: 'Comment se calcule le TOTAL 5 dans la cotation ?' },
    { label: 'Fiche GI PDF',         q: 'Comment imprimer la fiche GI d\'un client en PDF ?' },
    { label: 'RG Facture Pro',       q: 'Quelles sont les règles pour créer une Facture Pro ?' },
  ],
  Booking: [
    { label: 'Dossiers reçus',       q: 'Montre-moi les dossiers de vente disponibles.' },
    { label: 'Mes brieffings',       q: 'Liste les brieffings prestataires.' },
    { label: 'RG Brieffing',         q: 'Quelles sont les règles de gestion du brieffing ?' },
    { label: 'Flux Booking',         q: 'Explique le rôle du département Booking dans SITRAC.' },
    { label: 'Provisions',           q: 'Comment fonctionnent les provisions prévisionnelles ?' },
    { label: 'Prestataires',         q: 'Comment gérer les prestataires dans le brieffing ?' },
  ],
  Finance: [
    { label: 'Dossiers Finance',     q: 'Montre-moi les dossiers disponibles pour la Finance.' },
    { label: 'Paiements clients',    q: 'Liste les paiements enregistrés.' },
    { label: 'Clôtures',             q: 'Liste les clôtures financières.' },
    { label: 'KPIs Finance',         q: 'Donne-moi un résumé des indicateurs financiers clés.' },
    { label: 'RG Clôture',           q: 'Explique-moi la règle de gestion de la clôture (RG 24).' },
    { label: 'Bénéfice net',         q: 'Comment est calculé le bénéfice net d\'un dossier ?' },
  ],
  Administration: [
    { label: 'Tous les clients',     q: 'Donne-moi la liste complète des clients.' },
    { label: 'Tous les dossiers',    q: 'Liste tous les dossiers de vente.' },
    { label: 'Utilisateurs',         q: 'Liste tous les utilisateurs du système.' },
    { label: 'Clôtures globales',    q: 'Liste toutes les clôtures et leurs bénéfices.' },
    { label: 'Paiements globaux',    q: 'Liste tous les paiements enregistrés.' },
    { label: 'RG globales',          q: 'Explique les 38 règles de gestion de SITRAC.' },
    { label: 'Architecture',         q: 'Décris l\'architecture technique de SITRAC (React + Django).' },
  ],
  Superviseur: [
    { label: 'Audit INSERT',         q: 'Montre les 10 dernières actions INSERT.' },
    { label: 'Audit DELETE',         q: 'Montre les dernières suppressions (DELETE).' },
    { label: 'Liste utilisateurs',   q: 'Liste tous les utilisateurs et leurs départements.' },
    { label: 'Dossiers clôturés',    q: 'Liste toutes les clôtures financières.' },
    { label: 'RG Audit',             q: 'Explique les règles RG 37 et RG 38 sur l\'audit.' },
    { label: 'Traçabilité',          q: 'Comment fonctionne la traçabilité dans SITRAC ?' },
  ],
}

// ─── PDF links par contexte ────────────────────────────────────
const PDF_LINKS = {
  'detail_client':    { path: '/sales/gi',            label: 'Ouvrir Informations Générales → PDF' },
  'liste_clients':    { path: '/sales/gi',            label: 'Aller vers la liste des clients'     },
  'liste_dossiers':   { path: '/sales/pc',            label: 'Aller vers les dossiers de vente'   },
  'liste_cotations':  { path: '/sales/cotation',      label: 'Aller vers les cotations'            },
  'liste_paiements':  { path: '/finance/paiement',    label: 'Aller vers les paiements'            },
  'resume_paiements': { path: '/finance/paiement',    label: 'Voir les paiements → résumé'         },
  'liste_clotures':   { path: '/finance/cloture',     label: 'Aller vers les clôtures'             },
  'liste_programmes': { path: '/sales/programmes',    label: 'Aller vers les programmes'           },
  'liste_factures_def':{ path: '/finance/facture-def',label: 'Aller vers les factures définitives' },
}

// ─── Rendu Markdown simple ─────────────────────────────────────
function MarkdownText({ text }) {
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## '))
          return <h3 key={i} className="font-bold text-base mt-2 mb-1 first:mt-0">
            {line.replace('## ', '')}
          </h3>
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-1.5 mb-0.5">
            {line.replace('### ', '')}
          </h4>
        if (line.startsWith('- ') || line.startsWith('• '))
          return (
            <div key={i} className="flex gap-2 ml-1">
              <span className="mt-0.5 flex-shrink-0 text-orange">•</span>
              <span dangerouslySetInnerHTML={{
                __html: line.slice(2)
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">$1</code>')
              }}/>
            </div>
          )
        if (line.match(/^\d+\./))
          return (
            <div key={i} className="flex gap-2 ml-1">
              <span className="mt-0.5 flex-shrink-0 text-orange font-bold text-xs">
                {line.match(/^(\d+)\./)?.[1]}.
              </span>
              <span dangerouslySetInnerHTML={{
                __html: line.replace(/^\d+\.\s*/, '')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }}/>
            </div>
          )
        if (line === '' || line === '---')
          return <div key={i} className="h-1"/>
        return (
          <p key={i} dangerouslySetInnerHTML={{
            __html: line
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">$1</code>')
          }}/>
        )
      })}
    </div>
  )
}

// ─── Bulle de message ──────────────────────────────────────────
function MessageBubble({ msg, navigate }) {
  const isBot = msg.role === 'assistant'

  // Détecter si la demande concerne un PDF
  const pdfKeywords = ['pdf', 'imprimer', 'impression', 'télécharger',
                       'fiche gi', 'informations générales', 'facture',
                       'cotation', 'clôture', 'rapport']
  const wantsPDF = msg.userQuery
    ? pdfKeywords.some(k => msg.userQuery.toLowerCase().includes(k))
    : false

  // Trouver le lien PDF pertinent basé sur les outils utilisés
  const pdfLink = msg.toolsUsed?.length > 0
    ? PDF_LINKS[msg.toolsUsed[0]]
    : null

  return (
    <div className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>

      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center
        flex-shrink-0 mt-1
        ${isBot
          ? 'bg-orange text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
        {isBot ? <Bot size={15}/> : <User size={15}/>}
      </div>

      {/* Contenu */}
      <div className={`max-w-[78%] ${!isBot ? 'items-end flex flex-col' : ''}`}>

        {/* Bulle */}
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isBot
            ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-sm shadow-sm text-gray-800 dark:text-gray-200'
            : 'bg-orange text-white rounded-tr-sm'}`}>
          <MarkdownText text={msg.content}/>
        </div>

        {/* Outils DB utilisés */}
        {isBot && msg.toolsUsed?.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {msg.toolsUsed.map(t => (
              <span key={t}
                className="text-[10px] px-2 py-0.5 rounded-full
                  bg-blue-50 dark:bg-blue-900/20
                  text-blue-500 border border-blue-200 dark:border-blue-800
                  flex items-center gap-1">
                <Database size={8}/>
                {t.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Bouton PDF/Navigation */}
        {isBot && pdfLink && (
          <button
            onClick={() => navigate(pdfLink.path)}
            className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl
              text-xs font-semibold border transition-all
              bg-orange/10 text-orange border-orange/30
              hover:bg-orange hover:text-white hover:border-orange">
            <FileText size={12}/>
            {wantsPDF ? `Ouvrir pour imprimer le PDF` : pdfLink.label}
            <ExternalLink size={10}/>
          </button>
        )}

        {/* Timestamp */}
        <div className="text-[10px] text-gray-400 mt-1 px-1">
          {new Date(msg.ts).toLocaleTimeString('fr-FR',
            { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

// ─── Page Chatbot ──────────────────────────────────────────────
export default function Chatbot() {
  const { user }   = useAuthStore()
  const navigate   = useNavigate()
  const dept       = user?.dept || 'Sales'

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Bonjour **${user?.name || ''}** ! 👋\n\nJe suis **SITRA-BOT**, votre assistant IA connecté à la base de données SITRAC.\n\nEn tant que **${dept}**, je peux vous aider sur :\n- Consulter les données de votre département\n- Expliquer les règles de gestion (RG 01 à 38)\n- Répondre aux questions sur le tourisme à Madagascar\n- Guider vers les bons modules pour imprimer des PDF\n\nQue souhaitez-vous faire ?`,
      ts: Date.now(),
      toolsUsed: [],
    }
  ])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const textareaRef = useRef(null)

  const suggestions = SUGGESTIONS_BY_DEPT[dept] || SUGGESTIONS_BY_DEPT.Sales

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Envoyer un message ────────────────────────────────────────
  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return

    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const userMsg = { role: 'user', content: text, ts: Date.now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      // Construire l'historique (sans les metadata frontend)
      const apiMessages = newMessages.map(m => ({
        role:    m.role,
        content: m.content,
      }))

      const res = await chatbotAPI.send(apiMessages)

      const reply     = res.reply     || 'Désolé, je n\'ai pas pu générer une réponse.'
      const toolsUsed = res.tools_used || []

      setMessages(prev => [...prev, {
        role:      'assistant',
        content:   reply,
        ts:        Date.now(),
        toolsUsed,
        userQuery: text,  // pour détecter les demandes PDF
      }])

    } catch (e) {
      const errMsg = e.response?.data?.error || e.message || 'Erreur de connexion'
      setMessages(prev => [...prev, {
        role:     'assistant',
        content:  `❌ **Erreur** : ${errMsg}`,
        ts:       Date.now(),
        toolsUsed: [],
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // ── Réinitialiser ─────────────────────────────────────────────
  const clearChat = () => {
    setMessages([{
      role:    'assistant',
      content: `Conversation réinitialisée. 🔄\n\nComment puis-je vous aider, **${user?.name}** ?`,
      ts:      Date.now(),
      toolsUsed: [],
    }])
  }

  // ── Chips rapides (mots clés) ─────────────────────────────────
  const chips = ['Clients', 'Dossiers', 'Programmes', 'Paiements',
                 'Clôtures', 'Audit', 'Cotation', 'PDF']

  return (
    <Layout breadcrumb={['SITRAC', 'Assistant IA']}>

      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange flex items-center justify-center
              shadow-sm">
              <Bot size={20} className="text-white"/>
            </div>
            SITRA-BOT
            <span className="px-2 py-0.5 text-[10px] font-bold bg-orange/10 text-orange
              rounded-full border border-orange/20 uppercase tracking-wide">
              IA · Gemini
            </span>
          </h1>
          <p className="page-sub mt-0.5">
            Assistant intelligent connecté à la base de données SITRAC
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={clearChat}>
          <Trash2 size={14}/> Réinitialiser
        </button>
      </div>

      {/* Corps */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4"
        style={{ height: 'calc(100vh - 200px)' }}>

        {/* ── Suggestions (colonne gauche) ── */}
        <div className="lg:col-span-1 flex flex-col gap-2 overflow-y-auto pr-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase
            tracking-wide mb-1 flex items-center gap-1">
            <Sparkles size={11}/> Suggestions
          </div>

          {suggestions.map((s, i) => (
            <button key={i}
              onClick={() => sendMessage(s.q)}
              disabled={loading}
              className="text-left p-3 rounded-xl border border-gray-200
                dark:border-gray-700 bg-white dark:bg-gray-800
                hover:border-orange hover:bg-orange/5
                text-xs text-gray-600 dark:text-gray-400
                transition-all disabled:opacity-40 disabled:cursor-not-allowed
                group">
              <div className="font-semibold text-gray-800 dark:text-gray-200
                mb-0.5 group-hover:text-orange transition-colors">
                {s.label}
              </div>
              <div className="line-clamp-2 text-[11px] leading-relaxed">
                {s.q}
              </div>
            </button>
          ))}

          {/* Infos modèle */}
          <div className="mt-auto p-3 rounded-xl bg-gray-50 dark:bg-gray-900
            border border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
            <div className="font-semibold text-gray-500 mb-1">Modèle IA</div>
            <div>Gemini 2.5 Flash</div>
            <div className="mt-1">Google AI · Function Calling</div>
            <div className="mt-1">DB connectée : SITRAC</div>
            <div className="mt-1 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
              En ligne
            </div>
          </div>
        </div>

        {/* ── Zone de chat (colonne droite) ── */}
        <div className="lg:col-span-3 flex flex-col bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700 rounded-2xl
          overflow-hidden shadow-sm">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4
            bg-gray-50/50 dark:bg-gray-900/50">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} navigate={navigate}/>
            ))}

            {/* Indicateur de frappe */}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-orange flex items-center
                  justify-center flex-shrink-0 mt-1">
                  <Bot size={15} className="text-white"/>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200
                  dark:border-gray-700 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 bg-orange rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}/>
                    <div className="w-2 h-2 bg-orange rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}/>
                    <div className="w-2 h-2 bg-orange rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}/>
                    <span className="text-xs text-gray-400 ml-2">
                      SITRA-BOT analyse votre demande...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Séparateur */}
          <div className="border-t border-gray-100 dark:border-gray-700"/>

          {/* Zone de saisie */}
          <div className="p-3 bg-white dark:bg-gray-800">

            {/* Chips rapides */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {chips.map(chip => (
                <button key={chip}
                  onClick={() => sendMessage(
                    `Montre-moi les informations sur : ${chip.toLowerCase()}`
                  )}
                  disabled={loading}
                  className="flex-shrink-0 px-3 py-1 rounded-full text-xs
                    border border-gray-200 dark:border-gray-600
                    bg-gray-50 dark:bg-gray-700
                    hover:border-orange hover:text-orange hover:bg-orange/5
                    text-gray-500 dark:text-gray-400
                    transition-all disabled:opacity-40">
                  {chip}
                </button>
              ))}
            </div>

            {/* Textarea + bouton envoi */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <textarea
                  ref={el => { inputRef.current = el; textareaRef.current = el }}
                  rows={1}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 120) + 'px'
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder={`Posez une question ou demandez des données (ex: "Liste mes clients", "Fiche GI en PDF")...`}
                  disabled={loading}
                  className="w-full resize-none rounded-xl border border-gray-200
                    dark:border-gray-600 bg-gray-50 dark:bg-gray-700
                    px-4 py-3 text-sm text-gray-800 dark:text-gray-200
                    placeholder-gray-400 focus:outline-none focus:border-orange
                    focus:ring-2 focus:ring-orange/20 transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ minHeight: '46px', maxHeight: '120px' }}
                />
              </div>

              <button
                ref={inputRef}
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-11 h-11 rounded-xl bg-orange
                  hover:bg-orange-dark text-white flex items-center justify-center
                  transition-all disabled:opacity-40 disabled:cursor-not-allowed
                  shadow-sm hover:shadow-md">
                {loading
                  ? <Loader2 size={18} className="animate-spin"/>
                  : <Send size={18}/>}
              </button>
            </div>

            <div className="text-[10px] text-gray-400 text-center mt-2">
              Entrée pour envoyer · Maj+Entrée pour nouvelle ligne ·
              Données en temps réel depuis la base SITRAC
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}