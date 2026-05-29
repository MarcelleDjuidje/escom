<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Commande;
use App\Models\DemandeCampagne;
use App\Models\Employe;
use App\Models\FactureTranche;
use App\Models\Projet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user instanceof Client) {
            return $this->statsClient($user);
        }
        return $this->statsEmploye($user);
    }

    private function statsClient(Client $client): JsonResponse
    {
        $commandes = Commande::where('id_client', $client->id_client);
        $factures = FactureTranche::where('id_client', $client->id_client);

        return response()->json([
            'commandes_total' => (clone $commandes)->count(),
            'commandes_en_cours' => (clone $commandes)->whereIn('statut', ['confirmee', 'en_production'])->count(),
            'commandes_livrees' => (clone $commandes)->where('statut', 'livree')->count(),
            'montant_total_paye' => (clone $commandes)->sum('montant_paye'),
            'montant_restant' => (clone $commandes)->sum('montant_restant'),
            'factures_impayees' => (clone $factures)->where('statut_paiement', 'non_payee')->count(),
            'demandes_en_attente' => DemandeCampagne::where('id_client', $client->id_client)
                ->whereIn('statut', ['en_attente', 'en_etude'])->count(),
            'commandes_recentes' => (clone $commandes)->with('client')->latest('date_commande')->limit(5)->get(),
        ]);
    }

    private function statsEmploye(Employe $employe): JsonResponse
    {
        $isAdmin = $employe->isAdmin();

        $commandes = $isAdmin ? Commande::query() : Commande::where('id_employe_responsable', $employe->id_employe);
        $projets = $isAdmin ? Projet::query() : Projet::where('id_chef_projet', $employe->id_employe);

        $caEncaisse = (clone $commandes)->sum('montant_paye');
        $caPrevu = (clone $commandes)->sum('total_ttc');

        $commandesParStatut = (clone $commandes)
            ->select('statut', DB::raw('count(*) as total'))
            ->groupBy('statut')->pluck('total', 'statut');

        $stats = [
            'is_admin' => $isAdmin,
            'ca_encaisse' => $caEncaisse,
            'ca_previsionnel' => $caPrevu,
            'ca_restant' => $caPrevu - $caEncaisse,
            'commandes_total' => (clone $commandes)->count(),
            'commandes_par_statut' => $commandesParStatut,
            'projets_actifs' => (clone $projets)->whereIn('statut', ['en_attente', 'en_cours', 'revision'])->count(),
            'projets_en_retard' => (clone $projets)->where('date_echeance', '<', now())
                ->whereNotIn('statut', ['valide', 'livre'])->count(),
            'demandes_en_attente' => DemandeCampagne::whereIn('statut', ['en_attente', 'en_etude'])->count(),
        ];

        if ($isAdmin) {
            $stats['clients_total'] = Client::count();
            $stats['clients_actifs'] = Client::where('statut', 'actif')->count();
            $stats['employes_total'] = Employe::where('actif', 1)->count();
            $stats['ca_par_mois'] = Commande::select(
                DB::raw('DATE_FORMAT(date_commande, "%Y-%m") as mois'),
                DB::raw('SUM(montant_paye) as ca')
            )->groupBy('mois')->orderBy('mois')->limit(12)->get();
        }

        $stats['commandes_recentes'] = (clone $commandes)->with('client')->latest('date_commande')->limit(8)->get();
        $stats['projets_a_echeance'] = (clone $projets)->whereNotIn('statut', ['valide', 'livre'])
            ->whereNotNull('date_echeance')->orderBy('date_echeance')->limit(5)->get();

        return response()->json($stats);
    }
}
