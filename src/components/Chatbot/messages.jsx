// SITRA-BOT — contenu des messages (suggestions par département, rendu Markdown,
// bulles avec boutons PDF et badges des outils interrogés).
// Extrait de l'ancienne page pages/Chatbot.jsx, sans changement de comportement.
import { Bot, User, Database, Printer } from 'lucide-react'

// Suggestions selon le département : uniquement des données auxquelles il a accès
export const SUGGESTIONS_BY_DEPT = {
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
export const RACCOURCIS_BY_DEPT = {
  Sales:          [['Clients','Liste mes clients.'], ['Dossiers','Liste mes dossiers de vente.'], ['Échéances','Échéances à payer de mes clients.'], ['Prestataires','Liste des prestataires et leurs tarifs.'], ['Prospects','Liste des prospects.']],
  Booking:        [['Dossiers','Liste des dossiers de vente.'], ['Brieffings','Liste des brieffings.'], ['Provisions','Liste des provisions.'], ['Prestataires','Liste des prestataires et leurs tarifs.']],
  Finance:        [['Paiements','Liste des paiements encaissés.'], ['Stripe','Paiements réglés via Stripe.'], ['Échéances','Échéances à payer.'], ['Clôtures','Liste des clôtures.'], ['Chiffres clés','Chiffres clés de cette année.']],
  Administration: [['Clients','Liste des clients.'], ['Paiements','Liste des paiements encaissés.'], ['Stripe','Paiements réglés via Stripe.'], ['Prestataires','Liste des prestataires et leurs tarifs.'], ['Clôtures','Liste des clôtures.'], ['Chiffres clés','Chiffres clés de cette année.']],
  Superviseur:    [['Journal','Dernières actions du journal d\'audit.'], ['Paiements','Liste des paiements encaissés.'], ['Clôtures','Liste des clôtures.'], ['Utilisateurs','Liste des utilisateurs.']],
}

export const EXEMPLES_BY_DEPT = {
  Sales:          ['Fiche GI de [nom du client] en PDF', 'Échéances en retard de mes clients', 'Tarifs des hôtels à Antsirabe'],
  Booking:        ['Départs des 30 prochains jours', 'Tarifs des transporteurs', 'Brieffing du dossier [n°]'],
  Finance:        ['Clients ayant payé via Stripe', 'Échéances en retard', 'Bénéfice net des clôtures'],
  Administration: ['Liste des prix de chaque prestataire', 'Clients ayant payé via Stripe', 'Chiffres clés de cette année'],
  Superviseur:    ['Dernières suppressions', 'Paiements en ligne du mois', 'Utilisateurs par département'],
}

export const PDF_KEYWORDS = [
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

export function MessageBubble({ msg, onPrint, onPrintCotation, onPrintFP }) {
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
      <div className={`max-w-[85%] min-w-0 ${!isBot?'items-end flex flex-col':''}`}>
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
