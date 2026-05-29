# 📖 Guide d'installation détaillé — ESCOM

## 🎯 Vue d'ensemble

Cette plateforme se compose de deux applications :
1. **Backend Laravel 12** (API REST) — port `8000`
2. **Frontend Next.js 14** (UI) — port `3000`

Et d'une base de données MySQL.

---

## ✅ Prérequis détaillés

### Côté serveur / poste
| Outil | Version minimale | Vérification |
|---|---|---|
| PHP | 8.2 | `php -v` |
| Composer | 2.x | `composer -V` |
| Node.js | 18.x | `node -v` |
| npm | 9.x | `npm -v` |
| MySQL | 8.0 (ou MariaDB 10.6) | `mysql --version` |

### Extensions PHP requises
```bash
php -m | grep -E 'mbstring|openssl|pdo_mysql|tokenizer|xml|ctype|json|bcmath|fileinfo|gd'
```

Si une extension manque, sur Ubuntu/Debian :
```bash
sudo apt install php8.2-mbstring php8.2-xml php8.2-mysql php8.2-bcmath php8.2-gd php8.2-curl
```

---

## 🔧 Installation pas-à-pas

### Étape 1 — Préparer la base de données

Connectez-vous à MySQL :

```bash
mysql -u root -p
```

Créez la base et un utilisateur (recommandé) :

```sql
CREATE DATABASE escom_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'escom_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe_fort';
GRANT ALL PRIVILEGES ON escom_db.* TO 'escom_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> ⚠️ **Important :** L'utilisateur DOIT avoir le privilège `SUPER` ou `TRIGGER` pour la création des triggers SQL. Sinon, exécutez :
> ```sql
> SET GLOBAL log_bin_trust_function_creators = 1;
> ```

### Étape 2 — Backend Laravel

```bash
cd backend

# Installer les dépendances
composer install --no-dev --optimize-autoloader
# Pour le dev :
composer install

# Configuration
cp .env.example .env
php artisan key:generate
```

Ouvrez `backend/.env` et configurez :

```env
APP_NAME=ESCOM
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=escom_db
DB_USERNAME=escom_user
DB_PASSWORD=votre_mot_de_passe_fort

SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost

# Optionnel : Reverb (WebSocket)
BROADCAST_DRIVER=reverb
REVERB_APP_ID=escom
REVERB_APP_KEY=escomkey
REVERB_APP_SECRET=escomsecret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

Exécutez la migration (qui charge le `database/schema.sql`) :

```bash
php artisan migrate
```

✅ Vous devriez voir : *38 tables créées, 7 triggers, 6 vues, données initiales seedées*

Créez le lien symbolique pour le stockage public :

```bash
php artisan storage:link
```

Lancez le serveur :

```bash
php artisan serve
```

➡️ Backend accessible sur **http://localhost:8000**

Vérifiez avec : `curl http://localhost:8000/api/health`

### Étape 3 — Frontend Next.js

Dans un autre terminal :

```bash
cd frontend

# Installer les dépendances (peut prendre quelques minutes)
npm install
```

Le fichier `.env.local` est déjà préconfiguré (`NEXT_PUBLIC_API_URL=http://localhost:8000/api`).

Lancez le serveur de dev :

```bash
npm run dev
```

➡️ Frontend accessible sur **http://localhost:3000**

### Étape 4 — (Optionnel) WebSocket Reverb

Pour activer le chat **temps réel** (sinon le frontend utilise le polling 6s) :

```bash
cd backend
php artisan reverb:start
```

➡️ Serveur WebSocket sur le port `8080`.

---

## 🔍 Premiers tests

1. Ouvrez http://localhost:3000
2. Vous voyez la page d'accueil avec le hero animé
3. Cliquez sur **Connexion** dans la barre du haut
4. Saisissez les identifiants admin :
   - Email : `admin@escom.cm`
   - Mot de passe : `Admin@2026`
5. Vous arrivez sur le **dashboard admin** avec stats, graphiques, listes
6. Inscrivez un client de test avec **Inscription**
7. Testez la création d'une demande de campagne, puis répondez en tant qu'admin

---

## 🐛 Dépannage

### ❌ "SQLSTATE[HY000] [2002] Connection refused"
- MySQL n'est pas lancé : `sudo service mysql start`
- Vérifiez `DB_HOST=127.0.0.1` (pas `localhost` sous certaines configs)

### ❌ "Trigger creator can't be set"
Activez la création de triggers :
```sql
SET GLOBAL log_bin_trust_function_creators = 1;
```
Puis relancez : `php artisan migrate:fresh`

### ❌ "Class 'PDO' not found"
Installez `php-mysql` : `sudo apt install php8.2-mysql`

### ❌ Frontend "Network Error" lors du login
- Vérifiez que le backend tourne sur le port 8000
- Inspectez la console du navigateur : si erreur CORS, vérifiez `config/cors.php` (déjà configuré)
- Le `frontend/.env.local` doit contenir `NEXT_PUBLIC_API_URL=http://localhost:8000/api`

### ❌ "419 PAGE EXPIRED" lors du login
Régénérez la clé : `php artisan key:generate` puis `php artisan config:clear`

### ❌ "ENOSPC: System limit for number of file watchers reached"
Sous Linux :
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### ❌ Les fichiers PDF de devis ne contiennent pas le logo
Vérifiez que le logo existe :
```bash
ls -lh backend/public/assets/images/logo.png
```

### ❌ "Class 'Intervention\Image\ImageManager' not found"
```bash
cd backend
composer require intervention/image
```

### ❌ Le téléchargement HD du livrable est refusé
Comportement normal : le solde de la commande doit être payé. Connectez-vous en admin et enregistrez le paiement complet de la facture.

### ❌ "npm install" échoue avec ERESOLVE
Forcez la résolution :
```bash
npm install --legacy-peer-deps
```

---

## 🚀 Mise en production

### Backend
```bash
cd backend
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

Configurez votre serveur web (Apache/Nginx) pour pointer vers `backend/public/`.

### Frontend
```bash
cd frontend
npm run build
npm run start  # ou utilisez PM2
```

### Variables d'environnement à modifier en prod
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://api.escom.cm`
- `FRONTEND_URL=https://app.escom.cm`
- Nouveau mot de passe admin (changez `admin@escom.cm`)
- Sécurisez vos clés Reverb

---

## 📊 Limites & considérations

- **Téléchargements concurrents** : Laravel sert les fichiers en streaming. Pour un trafic >100 simultanés, utilisez S3/MinIO.
- **WebSocket** : Reverb tient ~1000 connexions simultanées par instance. Au-delà, scaler avec Soketi/Pusher.
- **PDF** : DOMPDF est limité côté CSS. Pour des templates très complexes, considérez Puppeteer.
- **Multi-langue** : la base est FR, structure prête pour EN (clé `parametres_agence.langue`).

---

## 📚 Liens utiles

- Documentation Laravel : https://laravel.com/docs/12.x
- Documentation Next.js : https://nextjs.org/docs
- Documentation Reverb : https://reverb.laravel.com
- Documentation Sanctum : https://laravel.com/docs/sanctum

---

**Bonne installation ! 🚀**
