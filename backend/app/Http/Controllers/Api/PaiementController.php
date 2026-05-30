<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FactureTranche;
use App\Models\LogActivite;
use App\Models\PlanPaiement;
use App\Models\TranchePaiement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaiementController extends Controller
{
    /**
     * Enregistrer un paiement de tranche.
     */
    public function payerTranche(Request $request, int $idTranche): JsonResponse
    {
        $request->validate([
            'montant' => 'required|numeric|min:0.01',
            'mode_paiement' => 'required|in:especes,virement,cheque,mobile_money,carte',
            'reference_transaction' => 'nullable|string|max:100',
        ]);

        $employe = $request->user();
        $tranche = TranchePaiement::findOrFail($idTranche);

        if ($tranche->statut === 'payee') {
            return response()->json(['message' => 'Tranche déjà payée'], 422);
        }

        DB::transaction(function () use ($tranche, $request, $employe) {
            $tranche->update([
                'montant_paye' => $request->montant,
                'date_paiement_effectif' => now()->toDateString(),
                'mode_paiement' => $request->mode_paiement,
                'reference_transaction' => $request->reference_transaction,
                'id_employe_encaisseur' => $employe->id_employe ?? null,
                'statut' => 'payee',
            ]);

            $facture = FactureTranche::where('id_tranche', $tranche->id_tranche)->first();
            if ($facture) {
                $facture->update([
                    'statut_paiement' => 'payee',
                    'date_paiement_effectif' => now()->toDateString(),
                ]);
            }
        });

        // Fallback PHP : débloquer la livraison si toutes les tranches sont payées
        // (au cas où le trigger MySQL n'aurait pas mis à jour livraison_bloquee)
        $this->debloquerSiSolde($tranche->id_plan_paiement);

        return response()->json([
            'message' => 'Paiement enregistré avec succès',
            'tranche' => $tranche->fresh()->load('plan.commande'),
        ]);
    }

    private function debloquerSiSolde(int $idPlan): void
    {
        $plan = PlanPaiement::with('commande')->find($idPlan);
        if (!$plan || !$plan->commande) return;

        // Recalculer le total payé depuis les tranches (source de vérité)
        $totalPaye = TranchePaiement::where('id_plan_paiement', $idPlan)
            ->where('statut', 'payee')
            ->sum('montant_paye');

        if ($totalPaye >= $plan->montant_total_ttc) {
            $plan->commande->update(['livraison_bloquee' => 0]);
            if ($plan->statut_global !== 'solde') {
                $plan->update(['statut_global' => 'solde', 'date_solde' => now()]);
            }
        }
    }

    public function planTranches(int $idPlan): JsonResponse
    {
        $tranches = TranchePaiement::where('id_plan_paiement', $idPlan)
            ->orderBy('numero_tranche')
            ->get();
        return response()->json($tranches);
    }

    /**
     * Enregistrer un paiement directement depuis une facture (alias).
     */
    public function payerFacture(Request $request, int $idFacture): JsonResponse
    {
        $request->validate([
            'montant' => 'required|numeric|min:0.01',
            'mode_paiement' => 'required|in:especes,virement,cheque,mobile_money,carte',
            'reference_paiement' => 'nullable|string|max:100',
        ]);

        $facture = FactureTranche::findOrFail($idFacture);
        $idTranche = $facture->id_tranche;

        $request->merge(['reference_transaction' => $request->reference_paiement]);
        return $this->payerTranche($request, $idTranche);
    }

    /**
     * Liste les tranches en attente de paiement pour le client connecté
     */
    public function tranchesEnAttenteClient(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!($user instanceof \App\Models\Client)) {
            return response()->json(['message' => 'Réservé aux clients'], 403);
        }

        $tranches = TranchePaiement::whereHas('plan.commande', function ($q) use ($user) {
            $q->where('id_client', $user->id_client);
        })
        ->where('statut', '!=', 'payee')
        ->where('statut', '!=', 'annulee')
        ->with(['plan.commande', 'facture'])
        ->orderBy('date_echeance_prevue', 'asc')
        ->get();

        return response()->json($tranches);
    }
}