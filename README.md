# SITRAC React — Ramartour Madagascar

Système Informatisé pour le Traitement des Relations Clients  
**Stack : React 18 + Vite + Zustand + Tailwind CSS + Recharts + Framer Motion**

---

## 📁 Structure du projet

```
sitrac-react/
├── public/
│   └── logo.jpg                    ← Logo Ramartour
├── src/
│   ├── App.jsx                     ← Router principal (toutes les routes)
│   ├── main.jsx                    ← Point d'entrée React
│   ├── index.css                   ← Styles globaux Tailwind
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Layout.jsx          ← Mise en page principale
│   │   │   ├── Sidebar.jsx         ← Barre latérale avec navigation
│   │   │   └── Topbar.jsx          ← Barre supérieure
│   │   └── UI/
│   │       ├── Modal.jsx           ← Composant modal réutilisable
│   │       ├── ConfirmDialog.jsx   ← Dialog de confirmation
│   │       └── index.jsx           ← Toggle, Badge, StatCard, Pagination, Alert...
│   ├── pages/
│   │   ├── Login.jsx               ← Page de connexion
│   │   ├── Dashboard.jsx           ← Tableau de bord avec graphiques
│   │   ├── Notifications.jsx       ← Page de notifications complète
│   │   ├── Profile.jsx             ← Profil utilisateur + changement MDP
│   │   ├── PlaceholderPage.jsx     ← Template pour modules en cours
│   │   ├── Sales/
│   │   │   ├── Destinations.jsx    ← CRUD destinations (complet)
│   │   │   ├── Programmes.jsx      ← CRUD programmes (complet)
│   │   │   └── ProgrammeClient.jsx ← Programme Client (complet)
│   │   ├── Admin/
│   │   │   └── Utilisateurs.jsx    ← CRUD utilisateurs (complet)
│   │   └── Superviseur/
│   │       └── Journal.jsx         ← Superviseur BD audit log (complet)
│   ├── store/
│   │   ├── authStore.js            ← Authentification (Zustand)
│   │   ├── dataStore.js            ← Toutes les données CRUD (Zustand)
│   │   └── uiStore.js              ← État UI, confirmations
│   ├── hooks/
│   │   └── useConfirm.js           ← Hook pour les dialogs de confirmation
│   └── utils/
│       └── storage.js              ← LocalStorage + audit log + seed data
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## 🚀 Installation et démarrage

### Prérequis
- **Node.js** 18+ : https://nodejs.org
- **npm** 9+

### Étapes

```bash
# 1. Extraire l'archive et aller dans le dossier
cd sitrac-react

# 2. Installer toutes les dépendances
npm install

# 3. Démarrer en mode développement
npm run dev
# → Ouvre automatiquement http://localhost:3000
```

### Build de production
```bash
npm run build
npm run preview  # tester le build
```

---

## 🔑 Comptes de démonstration

| Login | Mot de passe | Département | Accès |
|-------|-------------|-------------|-------|
| `sales` | `sales123` | Sales | Destinations, Programmes, GI, PC, Cotation, Facture Pro |
| `booking` | `booking123` | Booking | Brieffings, Provisions |
| `finance` | `finance123` | Finance | Factures Déf., Paiements, Clôture, Reçu |
| `admin` | `admin123` | Administration | Tout en R/W |
| `superviseur` | `super123` | Superviseur | Journal BD (INSERT/UPDATE/DELETE) |

---

## 📦 Dépendances principales

| Package | Version | Usage |
|---------|---------|-------|
| `react` + `react-dom` | 18.3 | Framework UI |
| `react-router-dom` | 6.28 | Routing SPA |
| `zustand` | 5.0 | State management |
| `recharts` | 2.13 | Graphiques (barres, camembert, lignes) |
| `lucide-react` | 0.469 | Icônes SVG |
| `react-hot-toast` | 2.4 | Notifications toast |
| `framer-motion` | 11 | Animations (modales, transitions) |
| `react-hook-form` | 7.54 | Formulaires avec validation |
| `date-fns` | 4.1 | Manipulation des dates |
| `tailwindcss` | 3.4 | CSS utilitaire |
| `vite` | 6.0 | Build tool ultra-rapide |

---

## 🏗️ Architecture technique

### State Management (Zustand)
- **`authStore`** : Authentification, thème (dark/light), état sidebar
- **`dataStore`** : CRUD complet de toutes les entités (destinations, programmes, clients, PC, cotations, factures, paiements, utilisateurs, constantes)
- **`uiStore`** : Dialog de confirmation global

### Données persistantes
Toutes les données sont stockées en **localStorage** avec le préfixe `sitrac_`.  
Un **journal d'audit** automatique trace chaque INSERT/UPDATE/DELETE avec utilisateur, timestamp, et données avant/après.

### Couleurs Ramartour
```js
orange:  '#F5A623'  // Couleur principale
green:   '#27AE60'  // Succès, Booking
blue:    '#2980B9'  // Finance, Info
purple:  '#8E44AD'  // Administration
dark:    '#2C3E50'  // Superviseur
```

### Règles de gestion implémentées
- **RG 01** : Un utilisateur → un département
- **RG 06** : Programme désactivé → pas de vente possible
- **RG 29** : Accès données selon département
- **RG 36** : Utilisateur désactivé → plus de connexion
- **RG 37** : Éléments supprimés archivés (audit log)
- **RG 39** : Notifications automatiques sur création/modification
- **RG 40** : Vérification incohérences avant validation

---

## 🛠️ Personnalisation

### Ajouter un nouveau département
Dans `src/store/authStore.js`, ajouter dans `USERS` et `DEPT_COLORS`.

### Ajouter un module complet
1. Créer `src/pages/[Dept]/[Module].jsx`
2. Ajouter la route dans `src/App.jsx`
3. Ajouter le lien dans `src/components/Layout/Sidebar.jsx`
4. Ajouter les méthodes CRUD dans `src/store/dataStore.js`

### Connexion à un backend
Remplacer les appels `getData`/`setData` dans `dataStore.js` par des appels `fetch()` vers votre API REST.

---

## 📋 Pages complètes vs Placeholder

### Complètes ✅
- Login, Dashboard, Notifications, Profile
- Sales: Destinations, Programmes, Programme Client
- Admin: Utilisateurs
- Superviseur: Journal des Actions (complet avec filtres, export CSV, détail avant/après)

### En cours de migration 🔄
Les autres modules (Cotation, Facture Pro, Brieffing, etc.) affichent un `PlaceholderPage` stylisé.  
Les données sont prêtes dans le store — il suffit de créer le composant de page.

---

## 📞 Support

Ramartour Madagascar — SITRAC v1.0.0
# sitrac-frontend
