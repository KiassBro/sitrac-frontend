/**
 * Textes de l'espace client (anglais par défaut, français).
 * La clientèle de Ramartour est majoritairement internationale.
 */
import { create } from 'zustand'

const CLE = 'sitrac_portail_langue'
const initiale = () => {
  const s = localStorage.getItem(CLE)
  if (s === 'en' || s === 'fr') return s
  return (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export const useLangue = create((set) => ({
  langue: initiale(),
  setLangue: (langue) => { localStorage.setItem(CLE, langue); document.documentElement.lang = langue; set({ langue }) },
}))

const T = {
  en: {
    espace: "Travellers' space", mes_voyages: 'My trips', profil: 'My details', deconnexion: 'Sign out',
    contact: 'Questions? Write to us or message us on WhatsApp.',
    // plateforme (menu, en-tête, pied de page)
    menu: 'Menu', demander_devis: 'Request a quote', mon_espace: 'My space', bonjour: 'Welcome back',
    besoin_aide: 'A question about your trip? Our team in Antananarivo answers you.',
    signature_marque: 'Madagascar · Tailor-made journeys',
    pied_texte: 'Tailor-made trips across Madagascar, prepared by a local team — from your first idea to your return home.',
    contact_titre: 'Contact us',
    mes_voyages_intro: 'Your quotes, payments, travellers and travel book, trip by trip.',
    nouveau_projet: 'New trip project',
    connexion_cote_titre: 'Everything about your trip, in one place',
    atout_signer: 'Review and sign your quote', atout_payer: 'Pay your instalments by card',
    atout_voyageurs: 'Complete traveller details', atout_carnet: 'Your travel book and vouchers',
    pas_encore_client: 'Not travelling with us yet?',
    // connexion
    connexion_titre: 'Sign in to your travel space',
    connexion_intro: 'Enter the email address you gave us. We will send you a 6-digit code — no password needed.',
    email: 'Email address', recevoir_code: 'Send me a code', code: '6-digit code',
    code_envoye: 'If this address has a travel space, a code is on its way. It is valid for {n} minutes.',
    se_connecter: 'Sign in', autre_email: 'Use another email', renvoyer: 'Send a new code',
    // voyages
    aucun_voyage: 'No trip yet. Your trips appear here once our team has prepared them.',
    du_au: '{a} – {b}', voyageurs: '{n} traveller(s)', reste: '{m} left to pay', voir: 'Open',
    statut_a_confirmer: 'Quote to confirm', statut_confirme: 'Confirmed', statut_regle: 'Fully paid',
    statut_termine: 'Completed', statut_en_preparation: 'Being prepared',
    // dossier
    retour: 'All my trips', itineraire: 'Itinerary', votre_devis: 'Your quote',
    devis_a_confirmer: 'Your quote is waiting for your confirmation.', confirmer_devis: 'Review and confirm',
    devis_signe: 'Signed by {nom} on {date}.', devis_refuse: 'You declined this quote. We will send you a new version.',
    devis_expire: 'This quote has expired. Contact us for a new one.', devis_remplace: 'This quote was replaced by a newer version.',
    voir_pdf: 'View PDF', facture: 'Invoice',
    paiements: 'Payments', total_du: 'Total', deja_paye: 'Paid', reste_a_payer: 'Left to pay',
    avant_le: 'due {d}', payer: 'Pay {m}', paye: 'Paid', en_retard: 'Overdue', partiel: 'Partly paid', a_payer: 'To pay',
    aucune_echeance: 'The payment schedule appears once you confirm your quote.',
    virement: 'Prefer a bank transfer? Use these details and mention your name (bank fees at your charge):',
    carte_info: 'Card payments are processed on the secure page of our payment provider.',
    documents: 'Documents', aucun_document: 'Your vouchers and final programme will appear here before departure.',
    telecharger: 'Download', voyageurs_titre: 'Travellers',
    voyageurs_intro: 'Please complete passport, insurance and emergency contact details for everyone travelling.',
    completer: 'Complete traveller details', voyageurs_verrouille: 'Your trip is being prepared — contact us for any change.',
    historique: 'History',
    h_devis_envoye: 'Quote sent', h_devis_consulte: 'Quote opened', h_devis_signe: 'Quote signed',
    h_devis_refuse: 'Quote declined', h_devis_remplace: 'Quote replaced', h_devis_expire: 'Quote expired',
    h_message: 'Message sent: {s}', h_paiement: 'Payment received: {m}', h_document: 'Document added: {t}',
    // voyageurs
    leader: 'Main traveller', autres: 'Other travellers', ajouter_voyageur: 'Add a traveller', retirer: 'Remove',
    enregistrer: 'Save', enregistre: 'Saved', titre: 'Title', nom: 'Full name', nationalite: 'Nationality',
    naissance: 'Date of birth', passeport: 'Passport number', adresse: 'Address', cp: 'Postcode', ville: 'City',
    pays: 'Country', ass_voyage: 'Travel insurance no.', ass_sante: 'Health insurance no.',
    urgence_nom: 'Emergency contact', urgence_tel: 'Emergency phone', medical: 'Medical information we should know',
    vols: 'Flights', vol_arr: 'Arrival flight', vol_dep: 'Departure flight', depart: 'From', destination: 'To',
    date: 'Date', compagnie: 'Airline', telephone: 'Phone', prevu: '{n} traveller(s) booked',
    mr: 'Mr', mme: 'Mrs', mlle: 'Ms',
    // profil
    profil_intro: 'How should we reach you about your trip?', langue: 'Language', mobile: 'Mobile number',
    mobile_aide: 'With country code, e.g. +44 7700 900123', mobile_sejour: 'Local number during your stay (optional)',
    mobile_sejour_aide: 'Many travellers buy a Malagasy SIM card on arrival.',
    sms_ok: 'Send me reminders by SMS', wa_ok: 'Send me reminders on WhatsApp',
    consent_aide: 'Only about your booking: confirmations, payment reminders, travel updates. Reply STOP to opt out.',
    // confirmation
    conf_titre: 'Your trip to Madagascar', conf_etape1: 'Review', conf_etape2: 'Sign',
    conf_intro: 'Please check the details below. Nothing is booked until you accept.',
    lignes: 'Details', sous_total: 'Subtotal', remise: 'Discount', total: 'Total',
    echeancier: 'Payment schedule', conditions: 'Booking and cancellation conditions', lire: 'Read', masquer: 'Hide',
    valable: 'This link is valid until {d}.', accepter_titre: 'Accept and sign',
    nom_signataire: 'Your full name', signature: 'Your signature (optional)', effacer: 'Clear',
    signature_aide: 'Draw with your finger or mouse.',
    j_accepte: 'I have read and accept the booking and cancellation conditions.',
    envoyer_code: 'Send me a signature code', code_par_email: 'by email', code_par_sms: 'by SMS',
    code_envoye_a: 'Code sent to {d}. It is valid for {n} minutes.',
    signer: 'Accept and sign', refuser: 'Decline this quote', refuser_titre: 'What should we change?',
    refuser_aide: 'Dates, itinerary, budget… Your sales agent will get back to you.', confirmer_refus: 'Send my answer',
    annuler: 'Cancel', merci_signe: 'Thank you — your booking is confirmed.',
    merci_signe_suite: 'We have emailed you the signed quote. Your next step is the payment below.',
    merci_refus: 'Thank you for your answer.', merci_refus_suite: 'Your sales agent will contact you with a new proposal.',
    acceder_espace: 'Go to my travel space', lien_invalide: 'This link is not valid',
    lien_invalide_suite: 'It may have expired or been replaced by a newer quote. Check your latest email or contact us.',
    deja_signe: 'This quote was already accepted.', telecharger_signe: 'Download the signed quote',
    chargement: 'Loading…', erreur: 'Something went wrong. Please try again.',
    // paiement
    pay_retour_ok: 'Payment received — thank you!', pay_retour_attente: 'We are confirming your payment…',
    pay_retour_echec: 'The payment did not go through.', pay_retour_echec_suite: 'No money was taken. You can try again from your travel space.',
    pay_simulation: 'Test payment page', pay_simulation_aide: 'This page replaces the card provider while the online payment is not yet connected. No real payment happens.',
    simuler_ok: 'Simulate a successful payment', simuler_echec: 'Simulate a failed payment',
  },
  fr: {
    espace: 'Espace voyageurs', mes_voyages: 'Mes voyages', profil: 'Mes coordonnées', deconnexion: 'Se déconnecter',
    contact: 'Une question ? Écrivez-nous ou contactez-nous sur WhatsApp.',
    menu: 'Menu', demander_devis: 'Demander un devis', mon_espace: 'Mon espace', bonjour: 'Bonjour',
    besoin_aide: 'Une question sur votre voyage ? Notre équipe à Antananarivo vous répond.',
    signature_marque: 'Madagascar · Voyages sur mesure',
    pied_texte: "Des voyages sur mesure partout à Madagascar, préparés par une équipe locale — de la première idée jusqu'au retour.",
    contact_titre: 'Nous contacter',
    mes_voyages_intro: 'Vos devis, paiements, voyageurs et carnet de route, voyage par voyage.',
    nouveau_projet: 'Nouveau projet de voyage',
    connexion_cote_titre: 'Tout votre voyage, au même endroit',
    atout_signer: 'Consulter et signer votre devis', atout_payer: 'Régler vos échéances par carte',
    atout_voyageurs: 'Compléter les informations des voyageurs', atout_carnet: 'Votre carnet de route et vos vouchers',
    pas_encore_client: 'Vous ne voyagez pas encore avec nous ?',
    connexion_titre: 'Connexion à votre espace voyage',
    connexion_intro: "Saisissez l'adresse email que vous nous avez communiquée. Nous vous enverrons un code à 6 chiffres, sans mot de passe.",
    email: 'Adresse email', recevoir_code: 'Recevoir un code', code: 'Code à 6 chiffres',
    code_envoye: 'Si cette adresse dispose d’un espace voyage, un code vient d’y être envoyé. Il est valable {n} minutes.',
    se_connecter: 'Se connecter', autre_email: 'Utiliser une autre adresse', renvoyer: 'Renvoyer un code',
    aucun_voyage: 'Aucun voyage pour le moment. Vos voyages apparaissent ici dès que notre équipe les a préparés.',
    du_au: 'du {a} au {b}', voyageurs: '{n} voyageur(s)', reste: 'reste {m} à payer', voir: 'Ouvrir',
    statut_a_confirmer: 'Devis à confirmer', statut_confirme: 'Confirmé', statut_regle: 'Entièrement réglé',
    statut_termine: 'Terminé', statut_en_preparation: 'En préparation',
    retour: 'Tous mes voyages', itineraire: 'Itinéraire', votre_devis: 'Votre devis',
    devis_a_confirmer: 'Votre devis attend votre confirmation.', confirmer_devis: 'Consulter et confirmer',
    devis_signe: 'Signé par {nom} le {date}.', devis_refuse: 'Vous avez refusé ce devis. Nous vous enverrons une nouvelle version.',
    devis_expire: 'Ce devis a expiré. Contactez-nous pour en recevoir un nouveau.', devis_remplace: 'Ce devis a été remplacé par une version plus récente.',
    voir_pdf: 'Voir le PDF', facture: 'Facture',
    paiements: 'Paiements', total_du: 'Total', deja_paye: 'Payé', reste_a_payer: 'Reste à payer',
    avant_le: 'avant le {d}', payer: 'Payer {m}', paye: 'Payé', en_retard: 'En retard', partiel: 'Payé en partie', a_payer: 'À payer',
    aucune_echeance: "L'échéancier apparaît dès que vous avez confirmé votre devis.",
    virement: 'Vous préférez un virement ? Utilisez ces coordonnées en indiquant votre nom (frais bancaires à votre charge) :',
    carte_info: 'Le paiement par carte se fait sur la page sécurisée de notre prestataire de paiement.',
    documents: 'Documents', aucun_document: 'Vos vouchers et votre programme final apparaîtront ici avant le départ.',
    telecharger: 'Télécharger', voyageurs_titre: 'Voyageurs',
    voyageurs_intro: "Merci de compléter passeport, assurance et contact d'urgence pour chaque voyageur.",
    completer: 'Compléter les informations', voyageurs_verrouille: 'Votre voyage est en préparation : contactez-nous pour toute modification.',
    historique: 'Historique',
    h_devis_envoye: 'Devis envoyé', h_devis_consulte: 'Devis consulté', h_devis_signe: 'Devis signé',
    h_devis_refuse: 'Devis refusé', h_devis_remplace: 'Devis remplacé', h_devis_expire: 'Devis expiré',
    h_message: 'Message envoyé : {s}', h_paiement: 'Paiement reçu : {m}', h_document: 'Document ajouté : {t}',
    leader: 'Voyageur principal', autres: 'Autres voyageurs', ajouter_voyageur: 'Ajouter un voyageur', retirer: 'Retirer',
    enregistrer: 'Enregistrer', enregistre: 'Enregistré', titre: 'Civilité', nom: 'Nom complet', nationalite: 'Nationalité',
    naissance: 'Date de naissance', passeport: 'N° de passeport', adresse: 'Adresse', cp: 'Code postal', ville: 'Ville',
    pays: 'Pays', ass_voyage: 'N° assurance voyage', ass_sante: 'N° assurance santé',
    urgence_nom: "Contact d'urgence", urgence_tel: "Téléphone d'urgence", medical: 'Informations médicales utiles',
    vols: 'Vols', vol_arr: "Vol d'arrivée", vol_dep: 'Vol de départ', depart: 'De', destination: 'Vers',
    date: 'Date', compagnie: 'Compagnie', telephone: 'Téléphone', prevu: '{n} voyageur(s) réservé(s)',
    mr: 'Monsieur', mme: 'Madame', mlle: 'Mademoiselle',
    profil_intro: 'Comment vous joindre au sujet de votre voyage ?', langue: 'Langue', mobile: 'Numéro de mobile',
    mobile_aide: 'Avec l’indicatif du pays, ex. +33 6 12 34 56 78', mobile_sejour: 'Numéro local pendant le séjour (facultatif)',
    mobile_sejour_aide: 'Beaucoup de voyageurs achètent une carte SIM malgache à l’arrivée.',
    sms_ok: 'Recevoir les rappels par SMS', wa_ok: 'Recevoir les rappels sur WhatsApp',
    consent_aide: 'Uniquement pour votre réservation : confirmations, rappels de paiement, informations de voyage. Répondez STOP pour arrêter.',
    conf_titre: 'Votre voyage à Madagascar', conf_etape1: 'Vérifier', conf_etape2: 'Signer',
    conf_intro: "Vérifiez les informations ci-dessous. Rien n'est réservé tant que vous n'avez pas accepté.",
    lignes: 'Détail', sous_total: 'Sous-total', remise: 'Remise', total: 'Total',
    echeancier: 'Échéancier de paiement', conditions: "Conditions de réservation et d'annulation", lire: 'Lire', masquer: 'Masquer',
    valable: "Ce lien est valable jusqu'au {d}.", accepter_titre: 'Accepter et signer',
    nom_signataire: 'Votre nom complet', signature: 'Votre signature (facultatif)', effacer: 'Effacer',
    signature_aide: 'Dessinez avec le doigt ou la souris.',
    j_accepte: "J'ai lu et j'accepte les conditions de réservation et d'annulation.",
    envoyer_code: 'Recevoir un code de signature', code_par_email: 'par email', code_par_sms: 'par SMS',
    code_envoye_a: 'Code envoyé à {d}. Il est valable {n} minutes.',
    signer: 'Accepter et signer', refuser: 'Refuser ce devis', refuser_titre: 'Que faut-il modifier ?',
    refuser_aide: 'Dates, itinéraire, budget… Votre conseiller reviendra vers vous.', confirmer_refus: 'Envoyer ma réponse',
    annuler: 'Annuler', merci_signe: 'Merci, votre réservation est confirmée.',
    merci_signe_suite: 'Nous vous avons envoyé le devis signé par email. Prochaine étape : le paiement ci-dessous.',
    merci_refus: 'Merci pour votre réponse.', merci_refus_suite: 'Votre conseiller vous recontactera avec une nouvelle proposition.',
    acceder_espace: 'Accéder à mon espace voyage', lien_invalide: "Ce lien n'est pas valable",
    lien_invalide_suite: 'Il a peut-être expiré ou été remplacé par un devis plus récent. Consultez votre dernier email ou contactez-nous.',
    deja_signe: 'Ce devis a déjà été accepté.', telecharger_signe: 'Télécharger le devis signé',
    chargement: 'Chargement…', erreur: 'Une erreur est survenue. Réessayez.',
    pay_retour_ok: 'Paiement reçu, merci !', pay_retour_attente: 'Nous confirmons votre paiement…',
    pay_retour_echec: "Le paiement n'a pas abouti.", pay_retour_echec_suite: "Aucun montant n'a été débité. Vous pouvez réessayer depuis votre espace voyage.",
    pay_simulation: 'Page de paiement de test', pay_simulation_aide: "Cette page remplace le prestataire de paiement tant que le paiement en ligne n'est pas branché. Aucun paiement réel n'a lieu.",
    simuler_ok: 'Simuler un paiement réussi', simuler_echec: 'Simuler un paiement refusé',
  },
}

export function useT() {
  const langue = useLangue((s) => s.langue)
  const t = (cle, vars = {}) => {
    let txt = T[langue]?.[cle] ?? T.en[cle] ?? cle
    Object.entries(vars).forEach(([k, v]) => { txt = txt.replaceAll(`{${k}}`, v) })
    return txt
  }
  return { t, langue }
}

export function formatMontant(v, langue, devise = 'EUR') {
  const n = Number(v || 0)
  return new Intl.NumberFormat(langue === 'fr' ? 'fr-FR' : 'en-GB', { style: 'currency', currency: devise }).format(n)
}

export function formatDate(v, langue, avecHeure = false) {
  if (!v) return ''
  const d = typeof v === 'string' && v.length === 10 ? new Date(`${v}T12:00:00`) : new Date(v)
  return new Intl.DateTimeFormat(langue === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', ...(avecHeure ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(d)
}
