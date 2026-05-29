<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migration unique exécutant le schéma SQL complet ESCOM.
 */
return new class extends Migration
{
    public function up(): void
    {
        $schemaPath = base_path('../database/schema.sql');
        if (! file_exists($schemaPath)) {
            $schemaPath = database_path('schema.sql');
        }
        if (! file_exists($schemaPath)) {
            throw new \RuntimeException('schema.sql introuvable');
        }

        $sql = file_get_contents($schemaPath);

        // Nettoyer les commentaires SQL (lignes commençant par --)
        $sql = preg_replace('/^\s*--.*$/m', '', $sql);

        // Découper en respectant les blocs DELIMITER
        $statements = $this->splitSqlStatements($sql);

        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (empty($statement)) {
                continue;
            }

            // Skip CREATE DATABASE / USE (gérés par Laravel)
            if (preg_match('/^(CREATE\s+DATABASE|USE\s+)/i', $statement)) {
                continue;
            }

            try {
                DB::unprepared($statement);
            } catch (\Throwable $e) {
                throw new \RuntimeException("Erreur migration: {$e->getMessage()}\nStatement: " . substr($statement, 0, 300));
            }
        }
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // Drop des vues
        $views = ['v_commandes_dashboard','v_conversations_admin','v_demandes_en_attente','v_notifications_non_lues','v_portfolio_public','v_stats_admin'];
        foreach ($views as $v) {
            DB::statement("DROP VIEW IF EXISTS {$v}");
        }

        // Drop de toutes les tables connues
        $tables = [
            'logs_activites','rapports_activite','favoris','avis_clients',
            'bons_achat','fournisseurs','historique_promotion',
            'publications_planifiees','abonnements','promotions_services',
            'realisations','apercus_livrables','livrables','taches','projets',
            'rappels_paiement','alertes_deadline','notifications_internes',
            'reactions_messages','messages','conversations',
            'reponses_demandes','demandes_campagne',
            'historique_commandes','factures_tranche','tranches_paiement',
            'plans_paiement','pieces_jointes_commande','lignes_commandes',
            'lignes_devis','commandes','devis',
            'tarifs_degressifs_impression','campagnes',
            'services_social_media','services_impression','services_conception',
            'categories_services','parametres_agence','contacts_entreprise',
            'clients','employes','personal_access_tokens','password_reset_tokens',
        ];
        foreach ($tables as $t) {
            Schema::dropIfExists($t);
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
        Schema::enableForeignKeyConstraints();
    }

    /**
     * Sépare le SQL en respectant les blocs DELIMITER (triggers).
     */
    private function splitSqlStatements(string $sql): array
    {
        $statements = [];
        $current = '';
        $delimiter = ';';
        $lines = explode("\n", $sql);

        foreach ($lines as $line) {
            $trimmed = trim($line);

            if (preg_match('/^DELIMITER\s+(.+)$/i', $trimmed, $m)) {
                if (!empty(trim($current))) {
                    $statements[] = $current;
                    $current = '';
                }
                $delimiter = trim($m[1]);
                continue;
            }

            $current .= $line . "\n";

            if (str_ends_with(rtrim($current), $delimiter)) {
                $stmt = rtrim(trim($current));
                $stmt = substr($stmt, 0, -strlen($delimiter));
                if (!empty(trim($stmt))) {
                    $statements[] = $stmt;
                }
                $current = '';
            }
        }

        if (!empty(trim($current))) {
            $statements[] = $current;
        }

        return $statements;
    }
};