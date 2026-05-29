-- =====================================================================
-- ESCOM - Agence de Communication
-- Schéma de base de données complet (MySQL 8.0+ / MariaDB 10.6+)
-- Version 4.0 - 38 entités
-- =====================================================================

CREATE DATABASE IF NOT EXISTS escom_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE escom_db;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- 1. UTILISATEURS & ACCÈS
-- =====================================================================

CREATE TABLE employes (
    id_employe          INT AUTO_INCREMENT PRIMARY KEY,
    nom                 VARCHAR(100) NOT NULL,
    prenom              VARCHAR(100) NOT NULL,
    email_pro           VARCHAR(150) NOT NULL UNIQUE,
    telephone           VARCHAR(25),
    role                ENUM('commercial','designer','chef_projet','imprimeur','admin','directeur') NOT NULL,
    date_embauche       DATE,
    actif               TINYINT(1) DEFAULT 1,
    avatar              VARCHAR(500),
    password            VARCHAR(255) NOT NULL,
    remember_token      VARCHAR(100),
    email_verified_at   TIMESTAMP NULL,
    two_factor_secret   TEXT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE clients (
    id_client           INT AUTO_INCREMENT PRIMARY KEY,
    type_client         ENUM('particulier','entreprise') NOT NULL DEFAULT 'particulier',
    nom_complet         VARCHAR(150) NOT NULL,
    raison_sociale      VARCHAR(200),
    email               VARCHAR(150) UNIQUE,
    telephone           VARCHAR(25) NOT NULL,
    adresse             TEXT,
    ville               VARCHAR(80),
    secteur_activite    VARCHAR(100),
    statut              ENUM('prospect','actif','archive') DEFAULT 'prospect',
    avatar              VARCHAR(500),
    password            VARCHAR(255) NOT NULL,
    remember_token      VARCHAR(100),
    email_verified_at   TIMESTAMP NULL,
    id_commercial       INT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_commercial) REFERENCES employes(id_employe) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE contacts (
    id_contact          INT AUTO_INCREMENT PRIMARY KEY,
    id_client           INT NOT NULL,
    nom                 VARCHAR(100) NOT NULL,
    prenom              VARCHAR(100),
    poste               VARCHAR(80),
    email               VARCHAR(150),
    telephone           VARCHAR(25),
    est_principal       TINYINT(1) DEFAULT 0,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_client) REFERENCES clients(id_client) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE parametres_agence (
    id_parametre        INT AUTO_INCREMENT PRIMARY KEY,
    cle                 VARCHAR(80) NOT NULL UNIQUE,
    valeur              TEXT NOT NULL,
    description         VARCHAR(200),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- 2. CATALOGUE DE SERVICES
-- =====================================================================

CREATE TABLE categories_services (
    id_categorie        INT AUTO_INCREMENT PRIMARY KEY,
    code                VARCHAR(20) NOT NULL UNIQUE,
    libelle             VARCHAR(100) NOT NULL,
    description         TEXT,
    icone               VARCHAR(50),
    ordre               INT DEFAULT 0,
    actif               TINYINT(1) DEFAULT 1,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE services_conception (
    id_service_conception INT AUTO_INCREMENT PRIMARY KEY,
    id_categorie        INT NOT NULL,
    type_conception     ENUM('flyer','logo','video','brochure','affiche','carte_visite','banniere_web','motion','habillage_reseau','kakemono','autre') NOT NULL,
    libelle             VARCHAR(150) NOT NULL,
    description         TEXT,
    image               VARCHAR(500),
    prix_unitaire_ht    DECIMAL(10,2) NOT NULL,
    duree_livraison_jours INT,
    nb_revisions_incluses INT DEFAULT 2,
    prix_revision_sup_ht DECIMAL(10,2),
    actif               TINYINT(1) DEFAULT 1,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categorie) REFERENCES categories_services(id_categorie)
) ENGINE=InnoDB;

CREATE TABLE services_impression (
    id_service_impression INT AUTO_INCREMENT PRIMARY KEY,
    id_categorie        INT NOT NULL,
    type_support        ENUM('flyer','affiche','banderole','macaron','roll_up','kakemono','carte_visite','bache','enveloppe','tshirt','autre') NOT NULL,
    libelle             VARCHAR(150) NOT NULL,
    description         TEXT,
    image               VARCHAR(500),
    format              VARCHAR(30),
    grammage_g_m2       INT,
    finition            ENUM('sans','brillant','mat','pellicule_brillant','pellicule_mat','vernis_UV','dorure','decoupe') DEFAULT 'sans',
    recto_verso         TINYINT(1) DEFAULT 0,
    quantite_min        INT DEFAULT 1,
    prix_unitaire_ht    DECIMAL(10,4) NOT NULL,
    frais_calage_ht     DECIMAL(10,2) DEFAULT 0,
    actif               TINYINT(1) DEFAULT 1,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categorie) REFERENCES categories_services(id_categorie)
) ENGINE=InnoDB;

CREATE TABLE services_social_media (
    id_service_social   INT AUTO_INCREMENT PRIMARY KEY,
    id_categorie        INT NOT NULL,
    plateforme          ENUM('Facebook','Instagram','TikTok','LinkedIn','YouTube','Twitter_X','Snapchat') NOT NULL,
    type_prestation     ENUM('post_simple','story','reel','gestion_compte','publicite_sponsorisee','audit','strategie_editoriale') NOT NULL,
    libelle             VARCHAR(150) NOT NULL,
    description         TEXT,
    image               VARCHAR(500),
    frequence           ENUM('unitaire','hebdomadaire','mensuel','annuel') DEFAULT 'unitaire',
    nb_publications_incluses INT DEFAULT 0,
    budget_pub_inclus_ht DECIMAL(10,2) DEFAULT 0,
    prix_ht             DECIMAL(10,2) NOT NULL,
    actif               TINYINT(1) DEFAULT 1,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categorie) REFERENCES categories_services(id_categorie)
) ENGINE=InnoDB;

CREATE TABLE campagnes (
    id_campagne         INT AUTO_INCREMENT PRIMARY KEY,
    id_categorie        INT NOT NULL,
    titre               VARCHAR(200) NOT NULL,
    description         TEXT NOT NULL,
    type_campagne       ENUM('social_ads','affichage','radio_tv','evenementiel','influence','email_marketing','seo_sea','autre') NOT NULL,
    objectifs_proposes  JSON,
    champs_formulaire   JSON,
    image_illustration  VARCHAR(500),
    prix_indicatif_min  DECIMAL(12,2),
    actif               TINYINT(1) DEFAULT 1,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categorie) REFERENCES categories_services(id_categorie)
) ENGINE=InnoDB;

CREATE TABLE tarifs_degressifs_impression (
    id_tarif_degressif  INT AUTO_INCREMENT PRIMARY KEY,
    id_service_impression INT NOT NULL,
    quantite_min        INT NOT NULL,
    quantite_max        INT NULL,
    prix_unitaire_ht    DECIMAL(10,4) NOT NULL,
    FOREIGN KEY (id_service_impression) REFERENCES services_impression(id_service_impression) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 3. DEVIS, COMMANDES & PAIEMENT
-- =====================================================================

CREATE TABLE devis (
    id_devis            INT AUTO_INCREMENT PRIMARY KEY,
    id_client           INT NOT NULL,
    id_employe          INT NOT NULL,
    numero_devis        VARCHAR(20) NOT NULL UNIQUE,
    date_creation       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_validite       DATE,
    statut              ENUM('brouillon','envoye','accepte','refuse','expire') DEFAULT 'brouillon',
    sous_total_ht       DECIMAL(12,2) DEFAULT 0,
    remise_pct          DECIMAL(5,2) DEFAULT 0.00,
    taux_tva            DECIMAL(5,2) DEFAULT 19.25,
    total_ttc           DECIMAL(12,2) DEFAULT 0,
    notes_internes      TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_client) REFERENCES clients(id_client),
    FOREIGN KEY (id_employe) REFERENCES employes(id_employe)
) ENGINE=InnoDB;

CREATE TABLE commandes (
    id_commande         INT AUTO_INCREMENT PRIMARY KEY,
    id_devis            INT NULL,
    id_client           INT NOT NULL,
    id_employe_responsable INT NOT NULL,
    numero_commande     VARCHAR(20) NOT NULL UNIQUE,
    date_commande       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut              ENUM('confirmee','en_production','prete','livree','annulee') DEFAULT 'confirmee',
    paiement_en_tranches TINYINT(1) DEFAULT 0,
    livraison_bloquee   TINYINT(1) DEFAULT 1,
    date_livraison_souhaitee DATE,
    mode_livraison      ENUM('remise_en_main','envoi_email','livraison_physique') DEFAULT 'envoi_email',
    total_ttc           DECIMAL(12,2) NOT NULL,
    montant_paye        DECIMAL(12,2) DEFAULT 0,
    montant_restant     DECIMAL(12,2) GENERATED ALWAYS AS (total_ttc - montant_paye) STORED,
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_devis) REFERENCES devis(id_devis) ON DELETE SET NULL,
    FOREIGN KEY (id_client) REFERENCES clients(id_client),
    FOREIGN KEY (id_employe_responsable) REFERENCES employes(id_employe)
) ENGINE=InnoDB;

CREATE TABLE lignes_devis (
    id_ligne_devis      INT AUTO_INCREMENT PRIMARY KEY,
    id_devis            INT NOT NULL,
    type_service        ENUM('CONCEPTION','IMPRESSION','SOCIAL','CAMPAGNE') NOT NULL,
    id_service_ref      INT,
    designation         VARCHAR(250) NOT NULL,
    quantite            DECIMAL(10,2) DEFAULT 1,
    prix_unitaire_ht    DECIMAL(10,2) NOT NULL,
    remise_ligne_pct    DECIMAL(5,2) DEFAULT 0,
    total_ligne_ht      DECIMAL(12,2) NOT NULL,
    ordre               INT DEFAULT 1,
    FOREIGN KEY (id_devis) REFERENCES devis(id_devis) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE pieces_jointes_commande (
    id_piece            INT AUTO_INCREMENT PRIMARY KEY,
    id_commande         INT NOT NULL,
    id_client           INT NOT NULL,
    nom_fichier         VARCHAR(250) NOT NULL,
    type_fichier        VARCHAR(20),
    chemin_stockage     TEXT NOT NULL,
    taille_octets       BIGINT,
    description_client  TEXT,
    uploaded_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande) ON DELETE CASCADE,
    FOREIGN KEY (id_client) REFERENCES clients(id_client)
) ENGINE=InnoDB;

CREATE TABLE plans_paiement (
    id_plan_paiement    INT AUTO_INCREMENT PRIMARY KEY,
    id_commande         INT NOT NULL UNIQUE,
    nombre_tranches     INT NOT NULL,
    montant_total_ttc   DECIMAL(12,2) NOT NULL,
    montant_total_paye  DECIMAL(12,2) DEFAULT 0,
    montant_restant_du  DECIMAL(12,2) GENERATED ALWAYS AS (montant_total_ttc - montant_total_paye) STORED,
    statut_global       ENUM('en_cours','solde','en_retard') DEFAULT 'en_cours',
    date_solde          TIMESTAMP NULL,
    id_employe_createur INT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande),
    FOREIGN KEY (id_employe_createur) REFERENCES employes(id_employe) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE tranches_paiement (
    id_tranche          INT AUTO_INCREMENT PRIMARY KEY,
    id_plan_paiement    INT NOT NULL,
    numero_tranche      INT NOT NULL,
    libelle             VARCHAR(150),
    montant_du_ttc      DECIMAL(12,2) NOT NULL,
    date_echeance_prevue DATE NOT NULL,
    date_paiement_effectif DATE,
    montant_paye        DECIMAL(12,2) DEFAULT 0,
    statut              ENUM('en_attente','payee','en_retard','annulee') DEFAULT 'en_attente',
    mode_paiement       ENUM('especes','virement','cheque','mobile_money','carte') NULL,
    reference_transaction VARCHAR(100),
    id_employe_encaisseur INT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_plan_paiement) REFERENCES plans_paiement(id_plan_paiement),
    FOREIGN KEY (id_employe_encaisseur) REFERENCES employes(id_employe) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE factures_tranche (
    id_facture_tranche  INT AUTO_INCREMENT PRIMARY KEY,
    id_tranche          INT NOT NULL UNIQUE,
    id_commande         INT NOT NULL,
    id_client           INT NOT NULL,
    numero_facture      VARCHAR(25) NOT NULL UNIQUE,
    type_facture        ENUM('acompte','intermediaire','solde','avoir') DEFAULT 'acompte',
    date_emission       DATE NOT NULL,
    date_echeance       DATE NOT NULL,
    date_paiement_effectif DATE,
    designation_prestation TEXT NOT NULL,
    montant_ht          DECIMAL(12,2) NOT NULL,
    taux_tva            DECIMAL(5,2) DEFAULT 19.25,
    montant_tva         DECIMAL(12,2) NOT NULL,
    montant_ttc         DECIMAL(12,2) NOT NULL,
    statut_paiement     ENUM('non_payee','payee','en_retard','annulee') DEFAULT 'non_payee',
    numero_tranche_sur_total VARCHAR(20),
    rappel_total_commande DECIMAL(12,2),
    chemin_pdf          VARCHAR(500),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_tranche) REFERENCES tranches_paiement(id_tranche),
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande),
    FOREIGN KEY (id_client) REFERENCES clients(id_client)
) ENGINE=InnoDB;

CREATE TABLE historique_statut (
    id_historique       INT AUTO_INCREMENT PRIMARY KEY,
    entite_type         VARCHAR(50) NOT NULL,
    entite_id           INT NOT NULL,
    ancien_statut       VARCHAR(60),
    nouveau_statut      VARCHAR(60) NOT NULL,
    id_employe          INT NULL,
    date_changement     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    commentaire         TEXT,
    FOREIGN KEY (id_employe) REFERENCES employes(id_employe) ON DELETE SET NULL,
    INDEX idx_entite (entite_type, entite_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 4. DEMANDES DE CAMPAGNES
-- =====================================================================

CREATE TABLE demandes_campagne (
    id_demande          INT AUTO_INCREMENT PRIMARY KEY,
    id_campagne         INT NOT NULL,
    id_client           INT NOT NULL,
    numero_demande      VARCHAR(20) NOT NULL UNIQUE,
    statut              ENUM('en_attente','en_etude','devis_envoye','acceptee','refusee','annulee') DEFAULT 'en_attente',
    objectif_principal  VARCHAR(200) NOT NULL,
    budget_indicatif    DECIMAL(12,2),
    duree_souhaitee     VARCHAR(100),
    cible               TEXT,
    zone_geographique   VARCHAR(200),
    plateformes_souhaitees JSON,
    description_projet  TEXT NOT NULL,
    fichiers_joints     JSON,
    reponse_escom       TEXT,
    prix_propose        DECIMAL(12,2),
    id_employe_reponse  INT NULL,
    date_demande        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_reponse        TIMESTAMP NULL,
    id_commande         INT NULL,
    FOREIGN KEY (id_campagne) REFERENCES campagnes(id_campagne),
    FOREIGN KEY (id_client) REFERENCES clients(id_client),
    FOREIGN KEY (id_employe_reponse) REFERENCES employes(id_employe) ON DELETE SET NULL,
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE reponses_demande (
    id_reponse          INT AUTO_INCREMENT PRIMARY KEY,
    id_demande          INT NOT NULL,
    id_employe          INT NOT NULL,
    contenu             TEXT NOT NULL,
    prix_propose        DECIMAL(12,2),
    delai_realisation   VARCHAR(100),
    fichiers_joints     JSON,
    est_devis_final     TINYINT(1) DEFAULT 0,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_demande) REFERENCES demandes_campagne(id_demande) ON DELETE CASCADE,
    FOREIGN KEY (id_employe) REFERENCES employes(id_employe)
) ENGINE=InnoDB;

-- =====================================================================
-- 5. CHAT INTERNE
-- =====================================================================

CREATE TABLE conversations (
    id_conversation     INT AUTO_INCREMENT PRIMARY KEY,
    id_client           INT NOT NULL,
    id_employe          INT NOT NULL,
    id_commande         INT NULL,
    id_demande          INT NULL,
    sujet               VARCHAR(200),
    statut              ENUM('active','archivee','fermee') DEFAULT 'active',
    initiee_par         ENUM('client','employe') NOT NULL,
    visible_admin       TINYINT(1) DEFAULT 1,
    nb_messages         INT DEFAULT 0,
    nb_non_lus_client   INT DEFAULT 0,
    nb_non_lus_employe  INT DEFAULT 0,
    dernier_message_at  TIMESTAMP NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_client) REFERENCES clients(id_client),
    FOREIGN KEY (id_employe) REFERENCES employes(id_employe),
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande) ON DELETE SET NULL,
    FOREIGN KEY (id_demande) REFERENCES demandes_campagne(id_demande) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE messages (
    id_message          INT AUTO_INCREMENT PRIMARY KEY,
    id_conversation     INT NOT NULL,
    expediteur_type     ENUM('client','employe','systeme') NOT NULL,
    id_expediteur_client INT NULL,
    id_expediteur_employe INT NULL,
    contenu             TEXT,
    type_message        ENUM('texte','image','document','audio','video') DEFAULT 'texte',
    fichier_url         TEXT,
    fichier_nom         VARCHAR(250),
    fichier_taille      BIGINT,
    statut_client       ENUM('envoye','recu','lu') DEFAULT 'envoye',
    statut_employe      ENUM('envoye','recu','lu') DEFAULT 'envoye',
    lu_par_admin        TINYINT(1) DEFAULT 0,
    reactions           JSON,
    envoye_le           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lu_le               TIMESTAMP NULL,
    FOREIGN KEY (id_conversation) REFERENCES conversations(id_conversation) ON DELETE CASCADE,
    FOREIGN KEY (id_expediteur_client) REFERENCES clients(id_client) ON DELETE SET NULL,
    FOREIGN KEY (id_expediteur_employe) REFERENCES employes(id_employe) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 6. NOTIFICATIONS INTERNES
-- =====================================================================

CREATE TABLE notifications_internes (
    id_notification     INT AUTO_INCREMENT PRIMARY KEY,
    type_destinataire   ENUM('client','employe') NOT NULL,
    id_client           INT NULL,
    id_employe          INT NULL,
    declencheur         ENUM('nouveau_message','reponse_campagne','statut_commande','paiement_confirme','solde_complet','livraison_debloquee','nouvelle_commande','deadline_proche','nouveau_devis','campagne_en_attente','promotion','avis_valide') NOT NULL,
    titre               VARCHAR(200) NOT NULL,
    contenu             TEXT NOT NULL,
    url_action          VARCHAR(500),
    lu                  TINYINT(1) DEFAULT 0,
    lu_le               TIMESTAMP NULL,
    id_commande         INT NULL,
    id_conversation     INT NULL,
    id_demande          INT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_client) REFERENCES clients(id_client) ON DELETE CASCADE,
    FOREIGN KEY (id_employe) REFERENCES employes(id_employe) ON DELETE CASCADE,
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande) ON DELETE CASCADE,
    FOREIGN KEY (id_conversation) REFERENCES conversations(id_conversation) ON DELETE CASCADE,
    FOREIGN KEY (id_demande) REFERENCES demandes_campagne(id_demande) ON DELETE CASCADE,
    INDEX idx_dest (type_destinataire, id_client, id_employe, lu)
) ENGINE=InnoDB;

CREATE TABLE alertes_deadline (
    id_alerte           INT AUTO_INCREMENT PRIMARY KEY,
    id_commande         INT NOT NULL,
    id_employe          INT NOT NULL,
    id_admin            INT NULL,
    date_livraison_souhaitee DATE NOT NULL,
    statut_alerte       ENUM('active','livree','annulee') DEFAULT 'active',
    dernier_envoi_at    TIMESTAMP NULL,
    prochain_envoi_at   TIMESTAMP NULL,
    nb_alertes_envoyees INT DEFAULT 0,
    actif               TINYINT(1) DEFAULT 1,
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande) ON DELETE CASCADE,
    FOREIGN KEY (id_employe) REFERENCES employes(id_employe),
    FOREIGN KEY (id_admin) REFERENCES employes(id_employe) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE rappels_paiement (
    id_rappel           INT AUTO_INCREMENT PRIMARY KEY,
    id_commande         INT NOT NULL,
    id_client           INT NOT NULL,
    semaine_numero      INT,
    date_rappel_prevu   DATETIME NOT NULL,
    date_rappel_envoye  DATETIME NULL,
    statut              ENUM('planifie','envoye','annule_paiement_recu') DEFAULT 'planifie',
    message             TEXT,
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande) ON DELETE CASCADE,
    FOREIGN KEY (id_client) REFERENCES clients(id_client)
) ENGINE=InnoDB;

-- =====================================================================
-- 7. PROJETS & PRODUCTION
-- =====================================================================

CREATE TABLE projets (
    id_projet           INT AUTO_INCREMENT PRIMARY KEY,
    id_commande         INT NOT NULL,
    id_chef_projet      INT NOT NULL,
    titre               VARCHAR(200) NOT NULL,
    description         TEXT,
    date_debut          DATE,
    date_echeance       DATE,
    statut              ENUM('en_attente','en_cours','revision','valide','livre') DEFAULT 'en_attente',
    livraison_autorisee TINYINT(1) DEFAULT 0,
    priorite            ENUM('basse','normale','haute','urgente') DEFAULT 'normale',
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande),
    FOREIGN KEY (id_chef_projet) REFERENCES employes(id_employe)
) ENGINE=InnoDB;

CREATE TABLE taches (
    id_tache            INT AUTO_INCREMENT PRIMARY KEY,
    id_projet           INT NOT NULL,
    id_employe          INT NOT NULL,
    titre               VARCHAR(200) NOT NULL,
    description         TEXT,
    statut              ENUM('a_faire','en_cours','terminee') DEFAULT 'a_faire',
    date_echeance       DATE,
    heures_estimees     DECIMAL(6,2),
    heures_reelles      DECIMAL(6,2),
    ordre               INT DEFAULT 0,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_projet) REFERENCES projets(id_projet) ON DELETE CASCADE,
    FOREIGN KEY (id_employe) REFERENCES employes(id_employe)
) ENGINE=InnoDB;

CREATE TABLE livrables (
    id_livrable         INT AUTO_INCREMENT PRIMARY KEY,
    id_projet           INT NOT NULL,
    id_employe          INT NOT NULL,
    nom_fichier         VARCHAR(250) NOT NULL,
    type_fichier        VARCHAR(20),
    chemin_stockage     TEXT NOT NULL,
    version             INT DEFAULT 1,
    est_version_finale  TINYINT(1) DEFAULT 0,
    livraison_effectuee TINYINT(1) DEFAULT 0,
    valide_client       TINYINT(1) DEFAULT 0,
    date_depot          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_projet) REFERENCES projets(id_projet) ON DELETE CASCADE,
    FOREIGN KEY (id_employe) REFERENCES employes(id_employe)
) ENGINE=InnoDB;

CREATE TABLE apercus_livrable (
    id_apercu           INT AUTO_INCREMENT PRIMARY KEY,
    id_livrable         INT NOT NULL UNIQUE,
    id_commande         INT NOT NULL,
    chemin_watermark    TEXT NOT NULL,
    chemin_basse_resolution TEXT,
    telechargement_autorise TINYINT(1) DEFAULT 0,
    capture_bloquee     TINYINT(1) DEFAULT 1,
    token_acces         VARCHAR(100),
    expire_le           TIMESTAMP NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_livrable) REFERENCES livrables(id_livrable) ON DELETE CASCADE,
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande)
) ENGINE=InnoDB;

-- =====================================================================
-- 8. PORTFOLIO, PROMOTIONS & ABONNEMENTS
-- =====================================================================

CREATE TABLE realisations (
    id_realisation      INT AUTO_INCREMENT PRIMARY KEY,
    id_client           INT NULL,
    id_employe          INT NULL,
    id_commande         INT NULL,
    titre               VARCHAR(200) NOT NULL,
    description         TEXT,
    image_principale    VARCHAR(500) NOT NULL,
    images_galerie      JSON,
    categorie           ENUM('conception','impression','social','marketing','audio','autre') NOT NULL,
    statut_publication  ENUM('brouillon','publie','archive') DEFAULT 'brouillon',
    visible_visiteurs   TINYINT(1) DEFAULT 1,
    ordre_affichage     INT DEFAULT 0,
    publie_le           TIMESTAMP NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_client) REFERENCES clients(id_client) ON DELETE SET NULL,
    FOREIGN KEY (id_employe) REFERENCES employes(id_employe) ON DELETE SET NULL,
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE promotions_service (
    id_promotion        INT AUTO_INCREMENT PRIMARY KEY,
    type_service        ENUM('CONCEPTION','IMPRESSION','SOCIAL') NOT NULL,
    id_service_ref      INT NOT NULL,
    libelle_service     VARCHAR(200),
    taux_remise_pct     DECIMAL(5,2) DEFAULT 0.00,
    prix_original_ht    DECIMAL(12,2) NOT NULL,
    prix_promo_ht       DECIMAL(12,2) NOT NULL,
    date_debut          DATE NOT NULL,
    date_fin            DATE NOT NULL,
    statut              ENUM('planifiee','active','expiree','annulee') DEFAULT 'planifiee',
    declenchement_auto  TINYINT(1) DEFAULT 0,
    id_employe_validateur INT NULL,
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_employe_validateur) REFERENCES employes(id_employe) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE abonnements (
    id_abonnement       INT AUTO_INCREMENT PRIMARY KEY,
    id_client           INT NOT NULL,
    id_service_social   INT NOT NULL,
    date_debut          DATE NOT NULL,
    date_fin            DATE NULL,
    frequence_facturation ENUM('mensuel','trimestriel','annuel') DEFAULT 'mensuel',
    montant_ht          DECIMAL(12,2) NOT NULL,
    statut              ENUM('actif','suspendu','resilie') DEFAULT 'actif',
    prochaine_facturation DATE,
    renouvellement_auto TINYINT(1) DEFAULT 1,
    FOREIGN KEY (id_client) REFERENCES clients(id_client),
    FOREIGN KEY (id_service_social) REFERENCES services_social_media(id_service_social)
) ENGINE=InnoDB;

CREATE TABLE publications_planifiees (
    id_publication      INT AUTO_INCREMENT PRIMARY KEY,
    id_abonnement       INT NOT NULL,
    id_projet           INT NULL,
    plateforme          ENUM('Facebook','Instagram','TikTok','LinkedIn','YouTube','Twitter_X') NOT NULL,
    date_planifiee      DATETIME NOT NULL,
    date_publiee        DATETIME NULL,
    texte_post          TEXT,
    lien_visuel         TEXT,
    statut              ENUM('brouillon','valide','publie','annule') DEFAULT 'brouillon',
    lien_post_publie    TEXT,
    FOREIGN KEY (id_abonnement) REFERENCES abonnements(id_abonnement) ON DELETE CASCADE,
    FOREIGN KEY (id_projet) REFERENCES projets(id_projet) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE historique_promotion (
    id_historique_promo INT AUTO_INCREMENT PRIMARY KEY,
    id_promotion        INT NOT NULL,
    id_commande         INT NULL,
    id_client           INT NULL,
    taux_applique       DECIMAL(5,2),
    montant_remise_ht   DECIMAL(12,2),
    prix_avant          DECIMAL(12,2),
    prix_apres          DECIMAL(12,2),
    date_application    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_promotion) REFERENCES promotions_service(id_promotion),
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande) ON DELETE SET NULL,
    FOREIGN KEY (id_client) REFERENCES clients(id_client) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 9. FOURNISSEURS & DIVERS
-- =====================================================================

CREATE TABLE fournisseurs (
    id_fournisseur      INT AUTO_INCREMENT PRIMARY KEY,
    nom                 VARCHAR(150) NOT NULL,
    type                ENUM('imprimerie','freelance','regie_pub','autre') DEFAULT 'autre',
    contact_nom         VARCHAR(100),
    email               VARCHAR(150),
    telephone           VARCHAR(25),
    delai_livraison_moyen_jours INT,
    note_qualite        DECIMAL(3,1),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE bons_achat (
    id_bon_achat        INT AUTO_INCREMENT PRIMARY KEY,
    id_fournisseur      INT NOT NULL,
    id_commande         INT NOT NULL,
    numero_ba           VARCHAR(20) NOT NULL UNIQUE,
    date_commande       DATE NOT NULL,
    date_livraison_prevue DATE,
    montant_ht          DECIMAL(12,2),
    statut              ENUM('envoye','confirme','recu','litige') DEFAULT 'envoye',
    FOREIGN KEY (id_fournisseur) REFERENCES fournisseurs(id_fournisseur),
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande)
) ENGINE=InnoDB;

-- =====================================================================
-- 10. AVIS, FAVORIS, LOGS, SESSIONS
-- =====================================================================

CREATE TABLE avis_clients (
    id_avis             INT AUTO_INCREMENT PRIMARY KEY,
    id_client           INT NOT NULL,
    id_realisation      INT NULL,
    id_commande         INT NULL,
    note                INT NOT NULL CHECK (note BETWEEN 1 AND 5),
    commentaire         TEXT,
    statut              ENUM('en_attente','valide','rejete') DEFAULT 'en_attente',
    id_employe_valideur INT NULL,
    valide_le           TIMESTAMP NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_client) REFERENCES clients(id_client) ON DELETE CASCADE,
    FOREIGN KEY (id_realisation) REFERENCES realisations(id_realisation) ON DELETE SET NULL,
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande) ON DELETE SET NULL,
    FOREIGN KEY (id_employe_valideur) REFERENCES employes(id_employe) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE favoris (
    id_favori           INT AUTO_INCREMENT PRIMARY KEY,
    id_client           INT NOT NULL,
    id_realisation      INT NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_favori (id_client, id_realisation),
    FOREIGN KEY (id_client) REFERENCES clients(id_client) ON DELETE CASCADE,
    FOREIGN KEY (id_realisation) REFERENCES realisations(id_realisation) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE logs_activite (
    id_log              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_type           ENUM('client','employe','systeme') NOT NULL,
    user_id             INT NULL,
    action              VARCHAR(100) NOT NULL,
    description         TEXT,
    ip_address          VARCHAR(45),
    user_agent          TEXT,
    metadata            JSON,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_type, user_id),
    INDEX idx_action (action)
) ENGINE=InnoDB;

CREATE TABLE rapports_activite (
    id_rapport          INT AUTO_INCREMENT PRIMARY KEY,
    id_employe          INT NOT NULL,
    periode             ENUM('jour','semaine','mois','trimestre','annee') NOT NULL,
    date_debut          DATE NOT NULL,
    date_fin            DATE NOT NULL,
    nb_projets          INT DEFAULT 0,
    nb_taches           INT DEFAULT 0,
    heures_travaillees  DECIMAL(8,2),
    ca_genere           DECIMAL(12,2),
    note_performance    DECIMAL(3,1),
    commentaires        TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_employe) REFERENCES employes(id_employe)
) ENGINE=InnoDB;

CREATE TABLE personal_access_tokens (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tokenable_type      VARCHAR(255) NOT NULL,
    tokenable_id        BIGINT UNSIGNED NOT NULL,
    name                VARCHAR(255) NOT NULL,
    token               VARCHAR(64) NOT NULL UNIQUE,
    abilities           TEXT,
    last_used_at        TIMESTAMP NULL,
    expires_at          TIMESTAMP NULL,
    created_at          TIMESTAMP NULL,
    updated_at          TIMESTAMP NULL,
    INDEX idx_tokenable (tokenable_type, tokenable_id)
) ENGINE=InnoDB;

CREATE TABLE password_reset_tokens (
    email               VARCHAR(150) PRIMARY KEY,
    token               VARCHAR(255) NOT NULL,
    created_at          TIMESTAMP NULL
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- TRIGGERS — RÈGLES MÉTIER
-- =====================================================================

DELIMITER //

-- Trigger : MAJ commande quand une tranche est payée
CREATE TRIGGER trg_tranche_payee
AFTER UPDATE ON tranches_paiement
FOR EACH ROW
BEGIN
    IF NEW.statut = 'payee' AND OLD.statut <> 'payee' THEN
        UPDATE plans_paiement
        SET montant_total_paye = montant_total_paye + NEW.montant_paye
        WHERE id_plan_paiement = NEW.id_plan_paiement;

        UPDATE commandes c
        INNER JOIN plans_paiement p ON p.id_commande = c.id_commande
        SET c.montant_paye = p.montant_total_paye
        WHERE p.id_plan_paiement = NEW.id_plan_paiement;

        UPDATE commandes c
        INNER JOIN plans_paiement p ON p.id_commande = c.id_commande
        SET c.livraison_bloquee = 0
        WHERE p.id_plan_paiement = NEW.id_plan_paiement
          AND p.montant_restant_du <= 0;

        UPDATE plans_paiement
        SET statut_global = 'solde', date_solde = NOW()
        WHERE id_plan_paiement = NEW.id_plan_paiement
          AND montant_restant_du <= 0;

        UPDATE apercus_livrable a
        INNER JOIN livrables l ON l.id_livrable = a.id_livrable
        INNER JOIN projets pr ON pr.id_projet = l.id_projet
        INNER JOIN commandes c ON c.id_commande = pr.id_commande
        INNER JOIN plans_paiement p ON p.id_commande = c.id_commande
        SET a.telechargement_autorise = 1
        WHERE p.id_plan_paiement = NEW.id_plan_paiement
          AND c.livraison_bloquee = 0;
    END IF;
END//

-- Trigger : Historique de statut des commandes
CREATE TRIGGER trg_histo_commande
AFTER UPDATE ON commandes
FOR EACH ROW
BEGIN
    IF OLD.statut <> NEW.statut THEN
        INSERT INTO historique_statut(entite_type, entite_id, ancien_statut, nouveau_statut, date_changement)
        VALUES ('COMMANDE', NEW.id_commande, OLD.statut, NEW.statut, NOW());
    END IF;
END//

-- Trigger : MAJ conversation à chaque nouveau message
CREATE TRIGGER trg_new_message
AFTER INSERT ON messages
FOR EACH ROW
BEGIN
    UPDATE conversations
    SET nb_messages = nb_messages + 1,
        nb_non_lus_client = IF(NEW.expediteur_type = 'employe', nb_non_lus_client + 1, nb_non_lus_client),
        nb_non_lus_employe = IF(NEW.expediteur_type = 'client', nb_non_lus_employe + 1, nb_non_lus_employe),
        dernier_message_at = NEW.envoye_le
    WHERE id_conversation = NEW.id_conversation;
END//

-- Trigger : Réponse à demande campagne -> change statut
CREATE TRIGGER trg_reponse_demande
AFTER INSERT ON reponses_demande
FOR EACH ROW
BEGIN
    UPDATE demandes_campagne
    SET statut = 'devis_envoye',
        id_employe_reponse = NEW.id_employe,
        date_reponse = NOW(),
        prix_propose = COALESCE(NEW.prix_propose, prix_propose),
        reponse_escom = NEW.contenu
    WHERE id_demande = NEW.id_demande;
END//

-- Trigger : Crée alerte deadline à la création d'une commande
CREATE TRIGGER trg_alerte_deadline
AFTER INSERT ON commandes
FOR EACH ROW
BEGIN
    IF NEW.date_livraison_souhaitee IS NOT NULL THEN
        INSERT INTO alertes_deadline(id_commande, id_employe, date_livraison_souhaitee, statut_alerte)
        VALUES (NEW.id_commande, NEW.id_employe_responsable, NEW.date_livraison_souhaitee, 'active');
    END IF;
END//

-- Trigger : Bloque la livraison si solde non payé
CREATE TRIGGER trg_bloc_livraison
BEFORE UPDATE ON livrables
FOR EACH ROW
BEGIN
    DECLARE v_autorise TINYINT(1);
    IF NEW.livraison_effectuee = 1 AND OLD.livraison_effectuee = 0 THEN
        SELECT livraison_autorisee INTO v_autorise FROM projets WHERE id_projet = NEW.id_projet;
        IF v_autorise = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Livraison bloquée : paiement incomplet';
        END IF;
    END IF;
END//

-- Trigger : Historique projet
CREATE TRIGGER trg_histo_projet
AFTER UPDATE ON projets
FOR EACH ROW
BEGIN
    IF OLD.statut <> NEW.statut THEN
        INSERT INTO historique_statut(entite_type, entite_id, ancien_statut, nouveau_statut, date_changement)
        VALUES ('PROJET', NEW.id_projet, OLD.statut, NEW.statut, NOW());
    END IF;
END//

DELIMITER ;

-- =====================================================================
-- VUES SQL
-- =====================================================================

CREATE OR REPLACE VIEW v_commandes_dashboard AS
SELECT
    c.id_commande,
    c.numero_commande,
    c.statut,
    c.total_ttc,
    c.montant_paye,
    c.montant_restant,
    c.date_livraison_souhaitee,
    DATEDIFF(c.date_livraison_souhaitee, CURDATE()) AS jours_restants,
    cl.nom_complet AS client_nom,
    cl.email AS client_email,
    e.nom AS employe_nom,
    e.prenom AS employe_prenom,
    p.nombre_tranches,
    p.statut_global AS statut_paiement
FROM commandes c
LEFT JOIN clients cl ON cl.id_client = c.id_client
LEFT JOIN employes e ON e.id_employe = c.id_employe_responsable
LEFT JOIN plans_paiement p ON p.id_commande = c.id_commande;

CREATE OR REPLACE VIEW v_conversations_admin AS
SELECT
    co.id_conversation,
    co.sujet,
    co.statut,
    co.nb_messages,
    co.nb_non_lus_client,
    co.nb_non_lus_employe,
    co.dernier_message_at,
    cl.nom_complet AS client_nom,
    e.nom AS employe_nom,
    e.prenom AS employe_prenom
FROM conversations co
LEFT JOIN clients cl ON cl.id_client = co.id_client
LEFT JOIN employes e ON e.id_employe = co.id_employe;

CREATE OR REPLACE VIEW v_demandes_en_attente AS
SELECT
    d.id_demande,
    d.numero_demande,
    d.statut,
    d.objectif_principal,
    d.budget_indicatif,
    d.date_demande,
    cl.nom_complet AS client_nom,
    cl.email AS client_email,
    ca.titre AS campagne_titre,
    ca.type_campagne
FROM demandes_campagne d
LEFT JOIN clients cl ON cl.id_client = d.id_client
LEFT JOIN campagnes ca ON ca.id_campagne = d.id_campagne
WHERE d.statut IN ('en_attente','en_etude');

CREATE OR REPLACE VIEW v_notifications_non_lues AS
SELECT
    type_destinataire,
    COALESCE(id_client, id_employe) AS id_user,
    COUNT(*) AS nb_non_lues
FROM notifications_internes
WHERE lu = 0
GROUP BY type_destinataire, COALESCE(id_client, id_employe);

CREATE OR REPLACE VIEW v_portfolio_public AS
SELECT
    id_realisation, titre, description, image_principale, images_galerie,
    categorie, ordre_affichage, publie_le
FROM realisations
WHERE statut_publication = 'publie' AND visible_visiteurs = 1
ORDER BY ordre_affichage ASC, publie_le DESC;

CREATE OR REPLACE VIEW v_stats_admin AS
SELECT
    (SELECT COUNT(*) FROM clients WHERE statut = 'actif') AS nb_clients_actifs,
    (SELECT COUNT(*) FROM commandes WHERE statut = 'en_production') AS nb_commandes_production,
    (SELECT COUNT(*) FROM commandes WHERE statut = 'livree') AS nb_commandes_livrees,
    (SELECT COALESCE(SUM(total_ttc),0) FROM commandes WHERE YEAR(date_commande)=YEAR(CURDATE())) AS ca_annee,
    (SELECT COALESCE(SUM(montant_paye),0) FROM commandes WHERE YEAR(date_commande)=YEAR(CURDATE())) AS ca_encaisse_annee,
    (SELECT COUNT(*) FROM demandes_campagne WHERE statut='en_attente') AS demandes_en_attente,
    (SELECT COUNT(*) FROM employes WHERE actif=1) AS nb_employes_actifs;

-- =====================================================================
-- DONNÉES INITIALES (SEEDS)
-- =====================================================================

INSERT INTO parametres_agence (cle, valeur, description) VALUES
('agence_nom', 'ESCOM', 'Nom de l''agence'),
('agence_slogan', 'La Communication à l''ère du digital', 'Slogan'),
('agence_email', 'contact@escom.cm', 'Email de contact'),
('agence_telephone', '+237 6XX XXX XXX', 'Téléphone'),
('agence_adresse_douala', 'Douala, Cameroun', 'Adresse Douala'),
('agence_adresse_bafoussam', 'Bafoussam, Cameroun', 'Adresse Bafoussam'),
('taux_tva', '19.25', 'Taux TVA Cameroun'),
('devise', 'XAF', 'Devise FCFA'),
('promo_globale_pct', '0', 'Promotion globale (manuelle admin)');

INSERT INTO categories_services (code, libelle, description, icone, ordre) VALUES
('CONCEPTION', 'Conception graphique', 'Création de logos, flyers, brochures, vidéos, motion design', 'palette', 1),
('IMPRESSION', 'Impression', 'Impression flyers, affiches, banderoles, cartes de visite, kakémonos', 'printer', 2),
('SOCIAL', 'Réseaux sociaux', 'Gestion de comptes, posts, stories, reels, publicités sponsorisées', 'share-2', 3),
('CAMPAGNE', 'Campagnes marketing', 'Campagnes publicitaires sur devis (social ads, affichage, radio/TV, événementiel)', 'megaphone', 4);

-- Compte admin par défaut (mot de passe : Admin@2026 - bcrypt)
INSERT INTO employes (nom, prenom, email_pro, telephone, role, date_embauche, password) VALUES
('Admin', 'Système', 'admin@escom.cm', '+237600000000', 'admin', CURDATE(),
 '$2y$12$8K4cPyBnT3.ZqL.1JYjMhuS3oXKfDqNvJqYzKr7E5mLfp9F8wJgUC');

-- =====================================================================
-- FIN DU SCHÉMA
-- =====================================================================
