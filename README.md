# 🎯 ESCOM — Plateforme SaaS de Communication 360°

> *"La Communication à l'ère du digital"*

Plateforme SaaS complète et fiable pour l'agence de communication **ESCOM** (Cameroun), couvrant la conception graphique, l'impression, le social media, et les campagnes marketing.

---

## 🛠️ Stack technologique

### Backend
- **Laravel 12** (PHP 8.2+) — REST API + MVC + Sanctum
- **MySQL 8.0+** ou MariaDB 10.6+
- **Laravel Reverb** — WebSocket temps réel (chat, notifications)
- **DOMPDF** — génération de devis et factures
- **Spatie Permission + Activity Log** — gestion des rôles et audit
- **Intervention Image** — filigrane et compression des aperçus livrables

### Frontend
- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + composants personnalisés
- **Framer Motion** — animations fluides
- **Recharts** — graphiques dashboard admin
- **Sonner** — toasts modernes
- **React Hook Form + Zod** — validation de formulaires
- **Axios + Laravel Echo** — communication API & realtime

---

## 📋 Fonctionnalités

### 🌐 Site public (`/`)
- Page d'accueil avec hero animé, stats, services, CTA
- Catalogue services (4 onglets : Conception, Impression, Social, Campagnes)
- Galerie de réalisations avec filtres par catégorie + modal détaillé + infinite scroll
- Pages À propos, Processus, FAQ
- SEO optimisé (Open Graph, mots-clés FR)

### 👥 Espace client
- Tableau de bord avec stats personnelles
- Suivi des commandes (par n° et statut)
- Téléchargement de devis & factures (PDF avec logo + cachet "PAYÉE")
- Espace livrables avec **téléchargement HD débloqué uniquement après paiement du solde** (filigrane sinon)
- Demande de campagne marketing 360° (formulaire structuré)
- Messagerie temps réel avec l'équipe ESCOM
- Favoris services, profil

### 🛠️ Espace employé (commercial / designer / chef projet)
- Tableau de bord adapté au rôle
- Vue **Kanban projets** (Planifié → En cours → En pause → Terminé)
- Liste des tâches assignées
- Gestion des clients
- Réponse aux demandes de campagne
- Messagerie clients

### 🎯 Espace admin / directeur
- Dashboard global avec :
  - CA encaissé / prévisionnel
  - Graphique linéaire CA mensuel (Recharts)
  - Camembert répartition par statut
  - Projets à échéance
- CRUD complet : Commandes, Devis, Factures, Projets, Clients, Employés, Réalisations, Promotions
- Modération des avis clients (valider / rejeter)
- Enregistrement de paiements (cascade automatique : tranche payée → solde mis à jour → livraison débloquée)
- Activation/désactivation manuelle des promotions

---

## 🎨 Charte graphique

- **Couleurs primaires** : Bleu ESCOM (`#1d4ed8`) + Or (`#d4af37`)
- **Aucun noir pur** — fonds neutres `#1c1c24` maximum
- **Typographies** : Inter (corps) + Plus Jakarta Sans (titres)
- **UX moderne** : transitions fluides, scroll behavior, microinteractions

---

## 🚀 Installation rapide

### Prérequis
- PHP 8.2 ou supérieur
- Composer 2.x
- Node.js 18+ et npm
- MySQL 8.0+ (ou MariaDB 10.6+)

### 1️⃣ Backend Laravel

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

**Configurer la base de données** dans `.env` :

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=escom_db
DB_USERNAME=root
DB_PASSWORD=
```

**Créer la base** :

```bash
mysql -u root -p -e "CREATE DATABASE escom_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

**Lancer la migration** (exécute le script SQL complet : 38 tables, 7 triggers, 6 vues, seed) :

```bash
php artisan migrate
php artisan storage:link
php artisan serve
```

➡️ Backend disponible sur **http://localhost:8000**

### 2️⃣ Frontend Next.js

```bash
cd ../frontend
npm install
npm run dev
```

➡️ Frontend disponible sur **http://localhost:3000**

### 3️⃣ (Optionnel) WebSocket Reverb pour chat temps réel

```bash
cd backend
php artisan reverb:start
```

> 💡 Sans Reverb, la messagerie fonctionne par polling toutes les 6 secondes.

---

## 🔑 Compte de démonstration

Un compte administrateur est créé automatiquement par le seed :

| Champ | Valeur |
|---|---|
| Email | `admin@escom.cm` |
| Mot de passe | `Admin@2026` |
| Rôle | `admin` |

> ⚠️ **Changez ce mot de passe en production !**

---

## 📂 Structure du projet

```
escom-platform/
├── backend/                  # Laravel 12 API
│   ├── app/
│   │   ├── Models/           # 30+ modèles Eloquent
│   │   ├── Http/Controllers/Api/  # ~20 contrôleurs REST
│   │   ├── Events/           # Broadcasting (chat)
│   │   └── ...
│   ├── routes/
│   │   ├── api.php           # ~55 endpoints REST
│   │   ├── channels.php      # Canaux WebSocket privés
│   │   └── ...
│   ├── database/migrations/  # Migration unique exécutant le SQL
│   ├── resources/views/pdf/  # Templates Blade pour PDF
│   └── public/assets/images/ # Logo, placeholder
│
├── frontend/                 # Next.js 14
│   ├── app/
│   │   ├── (public)/         # Pages publiques (accueil, services...)
│   │   ├── (auth)/           # Login & Register
│   │   └── (dashboard)/      # Espaces client/employé/admin
│   ├── components/
│   │   ├── layout/           # Navbar, Footer
│   │   └── dashboard/        # DashboardLayout, ChatPanel, DataTable
│   ├── lib/                  # api, auth-context, utils
│   └── public/assets/images/
│
├── database/
│   └── schema.sql            # Source unique de vérité (~970 lignes)
│
├── docs/
│   └── API.md                # Documentation des endpoints
│
└── README.md
```

---

## 🔌 Endpoints API principaux

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Connexion (clients & employés) |
| POST | `/api/auth/register` | Inscription client |
| GET  | `/api/auth/me` | Profil courant |
| POST | `/api/auth/logout` | Déconnexion |
| GET  | `/api/dashboard/stats` | Stats par rôle |
| GET  | `/api/public/services/conception` | Catalogue conception |
| GET  | `/api/public/realisations` | Portfolio public |
| GET  | `/api/commandes` | Commandes (filtré par client si non-staff) |
| GET  | `/api/devis/{id}/pdf` | PDF devis |
| GET  | `/api/factures/{id}/pdf` | PDF facture |
| POST | `/api/factures/{id}/paiements` | Enregistrer un paiement |
| GET  | `/api/livrables/{id}/download` | Télécharger livrable HD (si payé) |
| GET  | `/api/chat/conversations` | Liste conversations |
| POST | `/api/chat/conversations/{id}/messages` | Envoyer message |
| GET  | `/api/admin/employes` | Gestion employés (admin) |
| ... | | _(voir docs/API.md pour la liste complète)_ |

---

## 🗄️ Schéma de la base de données

**38 tables** structurées selon le MCD v4.0 :

- **Authentification** : `clients`, `employes`, `contacts_entreprise`
- **Catalogue** : `categories_services`, `services_conception`, `services_impression`, `services_social_media`, `campagnes`, `promotions_services`
- **Vente** : `devis`, `lignes_devis`, `commandes`, `lignes_commandes`, `plans_paiement`, `tranches_paiement`, `factures_tranche`
- **Production** : `projets`, `taches`, `livrables`, `apercus_livrables`
- **Communication** : `conversations`, `messages`, `reactions_messages`, `notifications_internes`, `demandes_campagne`, `reponses_demandes`
- **Portfolio** : `realisations`, `avis_clients`, `favoris`
- **Système** : `logs_activites`, `parametres_agence`, `historique_commandes`

**7 triggers MySQL** pour automatiser la logique métier :
- `trg_tranche_payee` → cascade automatique (paiement → solde → déblocage livraison)
- `trg_new_message` → notification interne automatique
- `trg_alerte_deadline` → notification 48h avant échéance
- `trg_bloc_livraison` → blocage SQL si tentative de livraison sans paiement

**6 vues** pour requêtes optimisées (`v_commandes_dashboard`, `v_stats_admin`, etc.)

---

## 🧪 Tester le projet

1. Visitez http://localhost:3000
2. Cliquez sur **Inscription** ou utilisez le compte admin
3. Naviguez les pages publiques (Accueil → Services → Réalisations → Processus → FAQ)
4. Connectez-vous en admin avec `admin@escom.cm / Admin@2026`
5. Explorez les 3 dashboards et toutes les fonctions CRUD
6. Testez la messagerie en créant un client, puis en lui envoyant un message via l'admin

---

## 📜 Licence

Projet propriétaire ESCOM © 2026 — Tous droits réservés.

---

**Développé avec ❤️ pour ESCOM Communication**
