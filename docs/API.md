# 📡 Documentation API REST — ESCOM

Base URL : `http://localhost:8000/api`

Authentification : **Bearer Token** (Laravel Sanctum). Une fois connecté, toutes les requêtes doivent inclure :
```
Authorization: Bearer {token}
```

Format des réponses : **JSON**.

---

## 🔓 Routes publiques (sans authentification)

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Inscription d'un nouveau client |
| `POST` | `/auth/login` | Connexion (clients & employés) |
| `GET` | `/public/services/categories` | Liste des catégories de services |
| `GET` | `/public/services/conception` | Catalogue : conception graphique |
| `GET` | `/public/services/impression` | Catalogue : impression |
| `GET` | `/public/services/social` | Catalogue : social media |
| `GET` | `/public/services/campagnes` | Catalogue : campagnes |
| `GET` | `/public/realisations?page=1&categorie=...` | Portfolio paginé + filtres |
| `GET` | `/public/realisations/{id}` | Détail d'une réalisation |
| `GET` | `/public/avis` | Avis clients validés (publiables) |
| `GET` | `/public/promotions` | Promotions actives en cours |
| `GET` | `/health` | Health-check du serveur |

### Exemple : inscription
```json
POST /api/auth/register
{
  "type_client": "particulier",
  "nom_complet": "Jean Dupont",
  "email": "jean@example.com",
  "telephone": "+237699999999",
  "ville": "Douala",
  "password": "MotDePasse2026",
  "password_confirmation": "MotDePasse2026"
}
```

Réponse :
```json
{
  "user": {
    "id": 1, "nom_complet": "Jean Dupont", "email": "jean@example.com",
    "role": "client", "is_staff": false, "type_client": "particulier"
  },
  "token": "1|aBc123..."
}
```

---

## 🔒 Routes authentifiées

### Profil & utilitaires
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/me` | Profil de l'utilisateur courant |
| `POST` | `/auth/logout` | Révoquer le token |
| `GET` | `/dashboard/stats` | Stats adaptées au rôle (client / employé / admin) |
| `GET` | `/search?q=...` | Recherche globale (commandes, projets, devis, factures) |

### Notifications internes
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/notifications?page=1` | Liste paginée |
| `GET` | `/notifications/unread-count` | Nombre de non lues |
| `PATCH` | `/notifications/{id}/read` | Marquer comme lue |
| `POST` | `/notifications/mark-all-read` | Tout marquer comme lu |

### Chat / Messagerie
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/chat/conversations` | Mes conversations |
| `POST` | `/chat/conversations` | Créer une conversation |
| `GET` | `/chat/conversations/{id}` | Conversation + messages |
| `POST` | `/chat/conversations/{id}/messages` | Envoyer un message (broadcasté en temps réel) |
| `PATCH` | `/chat/conversations/{id}/read` | Marquer toute la conv comme lue |
| `POST` | `/chat/messages/{id}/reaction` | Ajouter / retirer une réaction (👍❤️ etc.) |

Body POST message :
```json
{ "contenu": "Bonjour !", "type_message": "texte" }
```

### Devis
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/devis?page=1&search=...&statut=...` | Liste paginée |
| `GET` | `/devis/{id}` | Détail avec lignes |
| `GET` | `/devis/{id}/pdf` | **Télécharger le PDF** (logo + cachet) |
| `POST` | `/devis` | Créer un devis (employé) |
| `PATCH` | `/devis/{id}/statut` | Changer statut (`accepte`, `refuse`...) |
| `DELETE` | `/devis/{id}` | Supprimer (admin) |

### Commandes
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/commandes?page=1&statut=...` | Liste (filtré par client si non-staff) |
| `GET` | `/commandes/dashboard` | Vue dashboard |
| `GET` | `/commandes/{id}` | Détail (lignes + plan paiement) |
| `POST` | `/commandes` | Créer (depuis devis ou direct) |
| `PATCH` | `/commandes/{id}/statut` | Changer statut |
| `PATCH` | `/commandes/{id}` | Alias de `statut` |
| `GET` | `/admin/commandes` | Alias admin (toutes les commandes) |

### Factures & Paiements
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/factures` | Liste des factures par tranche |
| `GET` | `/factures/{id}` | Détail facture |
| `GET` | `/factures/{id}/pdf` | **PDF** facture (cachet "PAYÉE" si soldée) |
| `POST` | `/factures/{id}/paiements` | Enregistrer un paiement (alias) |
| `POST` | `/tranches/{id}/payer` | Enregistrer un paiement de tranche |
| `GET` | `/plans/{id}/tranches` | Toutes les tranches d'un plan |

> ✨ **Cascade automatique** : un paiement déclenche le trigger SQL `trg_tranche_payee` qui met à jour le solde, débloque la livraison, autorise le téléchargement HD et notifie le client.

### Demandes de campagne
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/demandes-campagne` | Mes demandes |
| `POST` | `/demandes-campagne` | Soumettre une demande |
| `GET` | `/demandes-campagne/{id}` | Détail |
| `POST` | `/demandes-campagne/{id}/respond` | Répondre (employé) |
| `POST` | `/demandes-campagne/{id}/repondre` | Idem (alias FR) |
| `PATCH` | `/demandes-campagne/{id}/statut` | Changer statut |

### Projets & Tâches (employés)
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/projets` | Liste paginée |
| `GET` | `/projets/kanban` | Vue Kanban groupée par statut |
| `GET` | `/projets/{id}` | Détail (tâches + livrables) |
| `POST` | `/projets` | Créer (admin / chef projet) |
| `PATCH` | `/projets/{id}` | Mettre à jour (statut, avancement...) |
| `PATCH` | `/projets/{id}/kanban` | Déplacer en kanban |
| `GET` | `/taches` | Mes tâches |
| `POST` | `/taches` | Créer une tâche |
| `PATCH` | `/taches/{id}` | Modifier |
| `DELETE` | `/taches/{id}` | Supprimer |

### Livrables
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/livrables` | Liste (filtré par client si non-staff) |
| `GET` | `/livrables/{id}` | Détail |
| `POST` | `/livrables` | Uploader un livrable (avec génération auto d'aperçu filigrané) |
| `GET` | `/livrables/{id}/download` | **Télécharger HD** (refusé si solde non payé) |

### Favoris & Avis
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/favoris` | Mes favoris |
| `POST` | `/favoris/toggle` | Ajouter / retirer un favori |
| `POST` | `/avis` | Laisser un avis (en attente de validation) |

---

## 👑 Routes admin (préfixe `/admin/`)

> Réservées aux rôles `admin` et `directeur` (vérifié par middleware `role:admin,directeur`).

### Employés
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/employes` | Tous les employés |
| `POST` | `/admin/employes` | Créer un employé |
| `GET` | `/admin/employes/{id}` | Détail |
| `PATCH` | `/admin/employes/{id}` | Modifier |
| `DELETE` | `/admin/employes/{id}` | Désactiver |

### Clients (back-office)
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/clients` | Tous les clients |
| `POST` | `/admin/clients` | Créer un client (back-office) |
| `GET/PATCH/DELETE` | `/admin/clients/{id}` | CRUD |

### Catalogue services
| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/admin/services/conception` | Ajouter un service de conception |
| `POST` | `/admin/services/impression` | Ajouter un service d'impression |
| `POST` | `/admin/services/social` | Ajouter un pack social media |
| `POST` | `/admin/services/campagnes` | Ajouter une campagne |

### Réalisations / Portfolio
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/realisations` | Toutes les réalisations (pub + privées) |
| `POST` | `/admin/realisations` | Créer (multipart : `image_principale`, ...) |
| `PATCH` | `/admin/realisations/{id}` | Modifier |
| `DELETE` | `/admin/realisations/{id}` | Supprimer |
| `POST` | `/admin/realisations/upload-image` | Uploader une image annexe |

### Promotions
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/promotions` | Toutes les promotions |
| `POST` | `/admin/promotions` | Créer |
| `PATCH` | `/admin/promotions/{id}` | Modifier |
| `POST` | `/admin/promotions/{id}/activer` | Activer |
| `POST` | `/admin/promotions/{id}/desactiver` | Désactiver |
| `PATCH` | `/admin/promotions/{id}/toggle` | Bascule active/inactive |
| `DELETE` | `/admin/promotions/{id}` | Supprimer |

### Avis (modération)
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/avis` | Tous les avis (en attente / validés / rejetés) |
| `PATCH` | `/admin/avis/{id}` | `{ "statut_validation": "valide" \| "rejete" }` |
| `POST` | `/admin/avis/{id}/valider` | Valider |
| `POST` | `/admin/avis/{id}/rejeter` | Rejeter |
| `DELETE` | `/admin/avis/{id}` | Supprimer définitivement |

---

## 🛡️ Codes d'erreur

| Code | Signification |
|---|---|
| `200 OK` | Succès |
| `201 Created` | Ressource créée |
| `204 No Content` | Suppression réussie |
| `401 Unauthorized` | Token absent / invalide |
| `403 Forbidden` | Pas les droits (rôle insuffisant) |
| `404 Not Found` | Ressource introuvable |
| `422 Unprocessable Entity` | Validation échouée — voir `errors` dans la réponse |
| `500 Server Error` | Erreur côté serveur |

Format type d'une erreur de validation :
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["Le champ email est obligatoire."],
    "password": ["Le mot de passe doit contenir au moins 8 caractères."]
  }
}
```

---

## 🔌 Channels WebSocket (Reverb)

| Canal | Description |
|---|---|
| `private-chat.{conversation_id}` | Messages d'une conversation (broadcast `MessageSent`) |
| `private-notifications.client.{id}` | Notifications client |
| `private-notifications.employe.{id}` | Notifications employé |

Authentification des canaux : via `/broadcasting/auth` (géré automatiquement par Sanctum).

---

**Total : ~58 endpoints REST + 3 canaux WebSocket**
