// SITRA-BOT — assistant IA en bulle flottante (bas à droite), disponible sur toutes
// les pages du personnel. Remplace l'entrée « Assistant IA » du menu latéral et la
// page /chatbot : mêmes fonctions (suggestions et raccourcis par département,
// PDF GI / cotation / facture pro, badges des données consultées), autre placement.
import { useEffect, useRef, useState } from 'react'
import { Bot, Send, Loader2, X, MoreVertical, RotateCcw, MessageCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useChatbotStore } from '../../store/chatbotStore'
import { MessageBubble, SUGGESTIONS_BY_DEPT, RACCOURCIS_BY_DEPT, EXEMPLES_BY_DEPT } from './messages'
import GIPrintModal         from '../PDF/GIPrintModal'
import CotationPrintModal   from '../PDF/CotationPrintModal'
import FactureProPrintModal from '../PDF/FactureProPrintModal'

function Avatar({ taille = 36 }) {
  return (
    <div className="relative flex-shrink-0">
      <div className="rounded-full bg-orange text-white flex items-center justify-center"
        style={{ width: taille, height: taille }}>
        <Bot size={Math.round(taille * 0.5)}/>
      </div>
      <span className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full bg-green-500
        ring-2 ring-white dark:ring-gray-800" title="En ligne"/>
    </div>
  )
}

export default function ChatbotWidget() {
  const { user } = useAuthStore()
  const dept = user?.dept || 'Sales'
  const {
    ouvert, nonLus, messages, loading, printClient, printCotation, printFP,
    preparer, fermer, basculer, reinitialiser, envoyer,
    imprimerClient, setPrintClient, setPrintCotation, setPrintFP,
  } = useChatbotStore()

  const [input, setInput] = useState('')
  const [menu,  setMenu]  = useState(false)
  const bottomRef   = useRef(null)
  const listeRef    = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => { preparer(user) }, [user?.id])

  // Début de conversation : on montre l'accueil depuis le haut ; ensuite on suit le dernier message
  useEffect(() => {
    if (!ouvert) return
    if (messages.length <= 1 && !loading) { if (listeRef.current) listeRef.current.scrollTop = 0 }
    else bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading, ouvert])
  useEffect(() => {
    if (ouvert) setTimeout(() => textareaRef.current?.focus(), 150)
    else setMenu(false)
  }, [ouvert])

  // Échap ferme le menu, puis le panneau
  useEffect(() => {
    if (!ouvert) return
    const onKey = (e) => {
      if (e.key !== 'Escape' || printClient || printCotation || printFP) return
      if (menu) setMenu(false); else fermer()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ouvert, menu, printClient, printCotation, printFP, fermer])

  if (!user) return null

  const suggestions = SUGGESTIONS_BY_DEPT[dept] || SUGGESTIONS_BY_DEPT.Sales
  const raccourcis  = RACCOURCIS_BY_DEPT[dept]  || RACCOURCIS_BY_DEPT.Sales
  const debut       = messages.length <= 1

  const envoyerTexte = (texte = input) => {
    if (!texte.trim() || loading) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = '42px'
    envoyer(texte)
  }

  return (
    <>
      {/* ── Panneau de conversation ── */}
      {ouvert && (
        <section
          role="dialog" aria-label="SITRA-BOT, assistant IA"
          className="fixed z-[500] flex flex-col overflow-hidden bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700 shadow-2xl
            inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:rounded-2xl
            sm:h-[min(640px,calc(100vh-8rem))]
            motion-safe:animate-[sitrabot-ouverture_160ms_ease-out] origin-bottom-right">

          {/* En-tête */}
          <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <Avatar/>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">SITRA-BOT</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                Assistant IA, données du département {dept}
              </div>
            </div>
            <div className="relative">
              <button onClick={() => setMenu(m => !m)} aria-label="Options" aria-expanded={menu}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500
                  hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-orange">
                <MoreVertical size={17}/>
              </button>
              {menu && (
                <div className="absolute right-0 top-9 w-60 bg-white dark:bg-gray-800 border
                  border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-10">
                  <button
                    onClick={() => { reinitialiser(user); setMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700
                      dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <RotateCcw size={14}/> Réinitialiser la conversation
                  </button>
                  <div className="px-3 py-2 text-[11px] leading-relaxed text-gray-400 border-t
                    border-gray-100 dark:border-gray-700">
                    Gemini 2.5 Flash, connecté à la base SITRAC. Génère les PDF GI, cotation et facture pro.
                  </div>
                </div>
              )}
            </div>
            <button onClick={fermer} aria-label="Fermer l'assistant"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500
                hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-orange">
              <X size={18}/>
            </button>
          </header>

          {/* Messages */}
          <div ref={listeRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/60 dark:bg-gray-900/40">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg}
                onPrint={imprimerClient}
                onPrintCotation={setPrintCotation}
                onPrintFP={setPrintFP}/>
            ))}

            {/* Suggestions du département, au début de la conversation */}
            {debut && !loading && (
              <div className="pl-11 flex flex-col gap-1.5">
                {suggestions.map(s => (
                  <button key={s.label} onClick={() => envoyerTexte(s.q)} title={s.q}
                    className="text-left px-3 py-2 rounded-xl border border-orange/30 bg-white
                      dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200
                      hover:border-orange hover:bg-orange/5 hover:text-orange transition-colors">
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-orange flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={15} className="text-white"/>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                  px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    {[0, 150, 300].map(d => (
                      <div key={d} className="w-2 h-2 bg-orange rounded-full motion-safe:animate-bounce"
                        style={{ animationDelay: `${d}ms` }}/>
                    ))}
                    <span className="text-xs text-gray-400 ml-1">SITRA-BOT analyse…</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Raccourcis + saisie */}
          <div className="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 pt-2.5 pb-2">
            {!debut && (
              <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
                {raccourcis.map(([chip, question]) => (
                  <button key={chip} disabled={loading} onClick={() => envoyerTexte(question)}
                    className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] border border-gray-200
                      dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500
                      hover:border-orange hover:text-orange transition-colors disabled:opacity-40">
                    {chip}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef} rows={1} value={input} disabled={loading}
                aria-label="Votre message à SITRA-BOT"
                onChange={e => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px'
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyerTexte() }
                }}
                placeholder={`Ex. : « ${(EXEMPLES_BY_DEPT[dept] || EXEMPLES_BY_DEPT.Sales)[0]} »`}
                className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600
                  bg-gray-50 dark:bg-gray-700 px-3.5 py-2.5 text-sm text-gray-800 dark:text-gray-200
                  placeholder-gray-400 focus:outline-none focus:border-orange focus:ring-2
                  focus:ring-orange/20 disabled:opacity-50"
                style={{ minHeight: '42px', maxHeight: '110px' }}/>
              <button onClick={() => envoyerTexte()} disabled={!input.trim() || loading}
                aria-label="Envoyer"
                className="flex-shrink-0 w-[42px] h-[42px] rounded-full bg-orange text-white flex
                  items-center justify-center hover:bg-orange-dark transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2">
                {loading ? <Loader2 size={17} className="animate-spin"/> : <Send size={17}/>}
              </button>
            </div>
            <div className="text-[10px] text-gray-400 text-center mt-1.5">
              Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne
            </div>
          </div>
        </section>
      )}

      {/* ── Bulle flottante ── (masquée sur mobile quand le panneau occupe l'écran) */}
      <button
        onClick={basculer}
        aria-label={ouvert ? "Fermer l'assistant SITRA-BOT" : "Ouvrir l'assistant SITRA-BOT"}
        aria-expanded={ouvert}
        className={`fixed z-[500] bottom-6 right-6 w-14 h-14 rounded-full bg-orange text-white
          shadow-lg hover:bg-orange-dark hover:shadow-xl transition-colors flex items-center
          justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange/40
          ${ouvert ? 'hidden sm:flex' : ''}`}>
        {ouvert ? <X size={24}/> : <MessageCircle size={26}/>}
        {!ouvert && nonLus > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-600
            text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white
            dark:ring-gray-950">
            {nonLus}
          </span>
        )}
        {!ouvert && loading && (
          <span className="absolute inset-0 rounded-full border-2 border-white/70 border-t-transparent animate-spin"/>
        )}
      </button>

      {/* PDF (au-dessus du panneau : z-index des modales 1000) */}
      <GIPrintModal client={printClient} open={!!printClient} onClose={() => setPrintClient(null)}/>
      <CotationPrintModal data={printCotation} open={!!printCotation} onClose={() => setPrintCotation(null)}/>
      <FactureProPrintModal data={printFP} open={!!printFP} onClose={() => setPrintFP(null)}/>
    </>
  )
}
