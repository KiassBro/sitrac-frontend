// Code pays ISO (FR, MG…) affiché en pastille : remplace les emojis drapeaux,
// qui s'affichent en simples lettres sous Windows (Edge, Chrome).
export default function CodePays({ code }) {
  if (!code) return <span className="inline-flex w-7 justify-center text-gray-400" aria-hidden>—</span>
  return (
    <span aria-hidden className="inline-flex items-center justify-center w-7 h-5 rounded text-[10px] font-bold tracking-wide
      bg-gray-100 text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 flex-shrink-0">
      {String(code).toUpperCase()}
    </span>
  )
}
