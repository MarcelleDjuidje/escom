<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('paniers', function (Blueprint $table) {
            $table->integer('id_panier', true); // PK autoincrement signé (cohérence projet)

            $table->integer('id_client');
            $table->string('numero_panier', 30)->unique();

            // Contenu du panier (JSON)
            $table->json('lignes');
            $table->decimal('total_ttc', 12, 2)->default(0);

            // Paiement
            $table->boolean('paiement_en_tranches')->default(false);
            $table->json('tranches_prevues')->nullable();

            // Livraison
            $table->enum('mode_livraison', ['remise_en_main', 'envoi_email', 'livraison_physique'])->default('remise_en_main');
            $table->date('date_livraison_souhaitee')->nullable();
            $table->text('notes')->nullable();

            // Statut du panier
            $table->enum('statut', ['en_attente_paiement', 'converti', 'abandonne_24h'])->default('en_attente_paiement');
            $table->timestamp('expire_le')->nullable();

            // Lien vers la commande créée après paiement
            $table->integer('id_commande_creee')->nullable();

            // Suivi des tentatives de paiement
            $table->unsignedSmallInteger('nb_tentatives_paiement')->default(0);
            $table->timestamp('derniere_tentative_at')->nullable();
            $table->text('derniere_erreur_paiement')->nullable();

            $table->timestamps();

            $table->foreign('id_client')
                ->references('id_client')->on('clients')
                ->onDelete('cascade');

            $table->index('statut');
            $table->index('id_client');
            $table->index('expire_le');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paniers');
    }
};
