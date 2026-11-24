/**
 * Écran de chargement avec le logo de Ramartour Madagascar.
 *
 *  - <PageLoader />               : plein écran (changement de page)
 *  - <PageLoader plein={false} /> : dans la zone de contenu (chargement des données)
 *
 * Le logo est servi depuis /public/logo-transparent.png (fond transparent).
 */
const STYLE = `
@keyframes sitrac-flotte {
  0%, 100% { transform: translateY(0)    scale(1);    }
  50%      { transform: translateY(-8px) scale(1.04); }
}
@keyframes sitrac-ombre {
  0%, 100% { transform: scaleX(1);   opacity: .18; }
  50%      { transform: scaleX(.75); opacity: .08; }
}
@keyframes sitrac-point {
  0%, 20%   { opacity: 0; }
  40%, 100% { opacity: 1; }
}
.sitrac-logo   { animation: sitrac-flotte 1.6s ease-in-out infinite; }
.sitrac-ombre  { animation: sitrac-ombre  1.6s ease-in-out infinite; }
.sitrac-point  { animation: sitrac-point  1.2s infinite; }
.sitrac-point:nth-child(2) { animation-delay: .2s; }
.sitrac-point:nth-child(3) { animation-delay: .4s; }
/* Mode sombre : léger halo pour que le texte noir « Ramartour » reste lisible */
.dark .sitrac-logo-img { filter: drop-shadow(0 0 1px rgba(255,255,255,.9)) drop-shadow(0 0 8px rgba(255,255,255,.25)); }
@media (prefers-reduced-motion: reduce) {
  .sitrac-logo, .sitrac-ombre, .sitrac-point { animation: none; opacity: 1; }
}
`

export default function PageLoader({ text = 'Chargement', plein = true }) {
  const taille = plein ? 'w-40 h-32' : 'w-24 h-20'
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        plein
          ? 'fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#F5F7FA] dark:bg-gray-950'
          : 'flex flex-col items-center justify-center py-20'
      }
    >
      <style>{STYLE}</style>

      <div className="sitrac-logo">
        {/* Logo PNG transparent : il prend la couleur de fond de l'application */}
        <img
          src="/logo-transparent.png"
          alt="Ramartour Madagascar"
          draggable="false"
          className={`${taille} object-contain sitrac-logo-img`}
        />
      </div>
      <div className={`sitrac-ombre ${plein ? 'w-20' : 'w-12'} h-2 mt-3 rounded-full bg-black`} />

      <p className={`${plein ? 'mt-8 text-2xl' : 'mt-5 text-sm'} font-title font-bold text-gray-400 dark:text-gray-500`}>
        {text}
        <span className="sitrac-point">.</span>
        <span className="sitrac-point">.</span>
        <span className="sitrac-point">.</span>
      </p>
    </div>
  )
}
