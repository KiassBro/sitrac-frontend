// SITRA-BOT — état de la conversation, partagé par toutes les pages.
// Le widget est rendu dans chaque Layout : garder la conversation ici (en mémoire,
// jamais dans le localStorage) évite de la perdre en changeant de page.
// La logique d'envoi est celle de l'ancienne page pages/Chatbot.jsx.
import { create } from 'zustand'
import { chatbotAPI, salesAPI } from '../utils/api'
import { EXEMPLES_BY_DEPT, PDF_KEYWORDS } from '../components/Chatbot/messages'

const accueil = (user) => {
  const dept = user?.dept || 'Sales'
  return {
    role: 'assistant',
    content: `Bonjour **${user?.name || ''}** !\n\nJe suis **SITRA-BOT**, l'assistant connecté aux données de SITRAC. Je réponds selon les droits du département **${dept}** : clients, dossiers, prestataires et tarifs, paiements, échéances, factures, clôtures…\n\nPar exemple :\n${(EXEMPLES_BY_DEPT[dept] || EXEMPLES_BY_DEPT.Sales).map(e => `- ${e}`).join('\n')}`,
    ts: Date.now(), toolsUsed: [], clientData: null,
  }
}

export const useChatbotStore = create((set, get) => ({
  userId:        null,   // conversation propre à l'utilisateur connecté
  ouvert:        false,
  nonLus:        0,      // réponses arrivées pendant que le panneau était fermé
  messages:      [],
  loading:       false,
  printClient:   null,
  printCotation: null,
  printFP:       null,

  // Nouvelle conversation si l'utilisateur change (déconnexion puis autre compte)
  preparer: (user) => {
    if (!user) return
    if (get().userId !== user.id) {
      set({ userId: user.id, messages: [accueil(user)], ouvert: false, nonLus: 0, loading: false,
            printClient: null, printCotation: null, printFP: null })
    }
  },

  ouvrir: () => set({ ouvert: true, nonLus: 0 }),
  fermer: () => set({ ouvert: false }),
  basculer: () => (get().ouvert ? get().fermer() : get().ouvrir()),

  reinitialiser: (user) => set({
    messages: [{
      role: 'assistant',
      content: `Conversation réinitialisée.\n\nComment puis-je vous aider, **${user?.name}** ?`,
      ts: Date.now(), toolsUsed: [], clientData: null,
    }],
  }),

  setPrintCotation: (d) => set({ printCotation: d }),
  setPrintFP:       (d) => set({ printFP: d }),
  setPrintClient:   (d) => set({ printClient: d }),

  // Ouvrir le PDF GI — charge les données complètes si besoin
  imprimerClient: async (clientData) => {
    if (clientData?.pax !== undefined) { set({ printClient: clientData }); return }
    try {
      set({ printClient: await salesAPI.getClient(clientData.id) })
    } catch {
      set({ printClient: clientData })
    }
  },

  envoyer: async (texte) => {
    const text = (texte || '').trim()
    if (!text || get().loading) return

    const wantsPDF = PDF_KEYWORDS.some(k => text.toLowerCase().includes(k))
    const newMsgs  = [...get().messages, { role: 'user', content: text, ts: Date.now() }]
    const userId   = get().userId
    set({ messages: newMsgs, loading: true })

    let reponse
    try {
      const res = await chatbotAPI.send(newMsgs.map(m => ({ role: m.role, content: m.content })))
      reponse = {
        role: 'assistant', content: res.reply || 'Désolé, pas de réponse.',
        ts: Date.now(),
        toolsUsed:    res.tools_used    || [],
        clientData:   res.client_data   || null,
        cotationData: res.cotation_data || null,
        fpData:       res.fp_data       || null,
      }
    } catch (e) {
      const errMsg = e.data?.error || e.message || 'Erreur'
      reponse = { role: 'assistant', content: `**Erreur** : ${errMsg}`, ts: Date.now(),
                  toolsUsed: [], clientData: null }
    }

    // L'utilisateur s'est déconnecté pendant la requête : la réponse ne lui est plus destinée
    if (get().userId !== userId) return
    set(s => ({ messages: [...s.messages, reponse], loading: false,
                nonLus: s.ouvert ? 0 : s.nonLus + 1 }))

    // Ouvrir le PDF automatiquement si demandé + données disponibles
    if (wantsPDF && reponse.clientData) setTimeout(() => get().imprimerClient(reponse.clientData), 400)
    if (reponse.cotationData)           setTimeout(() => set({ printCotation: reponse.cotationData }), 400)
    if (reponse.fpData)                 setTimeout(() => set({ printFP: reponse.fpData }), 400)
  },
}))
