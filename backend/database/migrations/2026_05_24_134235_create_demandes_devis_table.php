<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ============================================
        // TABLE PRINCIPALE : demandes_devis
        // ============================================
        Schema::create('demandes_devis', function (Blueprint $table) {
            // PK : INT signed autoincrement (pour cohérence avec le reste du projet)
            $table->integer('id_demande_devis', true);
            $table->string('numero_devis', 30)->unique();

            // Acteurs (INT signed pour matcher les PK existantes)
            $table->integer('id_client');
            $table->integer('id_employe_responsable')->nullable();

            // Service d'origine (optionnel)
            $table->string('type_service', 30);
            $table->integer('id_service_origine')->nullable();
            $table->string('table_service_origine', 50)->nullable();

            // Le brief client
            $table->string('titre', 200);
            $table->text('description_besoin');
            $table->decimal('budget_indicatif', 12, 2)->nullable();
            $table->date('delai_souhaite')->nullable();
            $table->json('fichiers_joints')->nullable();

            // Statut
            $table->enum('statut', [
                'en_attente_reponse',
                'chiffre',
                'accepte',
                'refuse',
                'expire',
                'annule'
            ])->default('en_attente_reponse');

            // Chiffrage par l'admin
            $table->decimal('prix_propose_ht', 12, 2)->nullable();
            $table->decimal('taux_tva', 5, 2)->default(19.25);
            $table->decimal('prix_propose_ttc', 12, 2)->nullable();
            $table->integer('delai_propose_jours')->nullable();
            $table->text('commentaire_admin')->nullable();
            $table->text('conditions_particulieres')->nullable();

            // Conversion en commande
            $table->integer('id_commande_creee')->nullable();
            $table->integer('id_panier_creé')->nullable();

            // Validité
            $table->date('valide_jusqu_au')->nullable();
            $table->timestamp('date_chiffrage')->nullable();
            $table->timestamp('date_acceptation')->nullable();
            $table->timestamp('date_refus')->nullable();
            $table->text('raison_refus')->nullable();

            $table->timestamps();

            // Foreign keys (avec types alignés sur les PK des tables cibles)
            $table->foreign('id_client')
                ->references('id_client')->on('clients')
                ->onDelete('cascade');

            $table->foreign('id_employe_responsable')
                ->references('id_employe')->on('employes')
                ->onDelete('set null');

            // Index pour performance
            $table->index('statut');
            $table->index('id_client');
            $table->index('id_employe_responsable');
            $table->index('valide_jusqu_au');
        });

        // ============================================
        // TABLE AUDIT : historique_devis
        // ============================================
        Schema::create('historique_devis', function (Blueprint $table) {
            $table->integer('id_historique', true);
            $table->integer('id_demande_devis');

            $table->enum('action', [
                'cree',
                'chiffre',
                'revise',
                'accepte',
                'refuse',
                'expire',
                'annule',
                'reassigne'
            ]);

            $table->decimal('prix_avant', 12, 2)->nullable();
            $table->decimal('prix_apres', 12, 2)->nullable();
            $table->text('commentaire')->nullable();

            // Qui a fait l'action
            $table->enum('type_acteur', ['client', 'employe', 'systeme']);
            $table->integer('id_acteur')->nullable();
            $table->string('nom_acteur', 200)->nullable();

            $table->timestamp('created_at')->useCurrent();

            $table->foreign('id_demande_devis')
                ->references('id_demande_devis')
                ->on('demandes_devis')
                ->onDelete('cascade');

            $table->index('id_demande_devis');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historique_devis');
        Schema::dropIfExists('demandes_devis');
    }
};