<?php

namespace App\Console\Commands;

use App\Models\DemandeDevis;
use App\Models\HistoriqueDevis;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpirerDevis extends Command
{
    protected $signature = 'devis:expirer';
    protected $description = 'Passe en statut "expire" les devis chiffrés dont la validité (30j) est dépassée';

    public function handle(): int
    {
        $devisExpirables = DemandeDevis::expirable()->get();

        if ($devisExpirables->isEmpty()) {
            $this->info('Aucun devis à expirer.');
            return self::SUCCESS;
        }

        $compteur = 0;

        foreach ($devisExpirables as $devis) {
            DB::transaction(function () use ($devis, &$compteur) {
                $ancienStatut = $devis->statut;

                $devis->update(['statut' => DemandeDevis::STATUT_EXPIRE]);

                HistoriqueDevis::create([
                    'id_demande_devis' => $devis->id_demande_devis,
                    'action'           => HistoriqueDevis::ACTION_EXPIRATION,
                    'ancien_statut'    => $ancienStatut,
                    'nouveau_statut'   => DemandeDevis::STATUT_EXPIRE,
                    'acteur_type'      => 'systeme',
                    'acteur_id'        => null,
                    'acteur_nom'       => 'Système (tâche planifiée)',
                    'details'          => ['valide_jusqu_au' => $devis->valide_jusqu_au?->toDateString()],
                    'created_at'       => now(),
                ]);

                $compteur++;
            });

            $this->line("  → {$devis->numero_devis} expiré");
        }

        $this->info("{$compteur} devis expiré(s) avec succès.");
        return self::SUCCESS;
    }
}