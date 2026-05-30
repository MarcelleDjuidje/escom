<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FactureTranche;
use App\Models\Panier;
use App\Models\PlanPaiement;
use App\Models\TranchePaiement;
use App\Services\FreemopayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FreemopayController extends Controller
{
    public function __construct(private FreemopayService $freemopay) {}

    /**
     * Initier un paiement Mobile Money pour un panier.
     * POST /api/freemopay/initier-panier
     */
    public function initierPanier(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_panier' => 'required|integer|exists:paniers,id_panier',
            'phone'     => 'required|string|min:9|max:15',
            'montant'   => 'required|numeric|min:1',
        ]);

        $panier = Panier::findOrFail($validated['id_panier']);
        $user   = $request->user();

        if ($panier->id_client !== $user->id_client) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        if ($panier->statut === 'converti') {
            return response()->json(['message' => 'Ce panier a déjà été payé'], 409);
        }

        if ($panier->statut === 'abandonne_24h' || ($panier->expire_le && $panier->expire_le->isPast())) {
            return response()->json(['message' => 'Ce panier a expiré'], 410);
        }

        $phone      = $this->normaliserPhone($validated['phone']);
        $externalId = 'panier_' . $panier->id_panier . '_' . time();

        $result = $this->freemopay->initierCollecte(
            $phone,
            (float) $validated['montant'],
            $externalId
        );

        $panier->update([
            'freemopay_reference' => $result['reference'],
            'freemopay_statut'    => 'pending',
        ]);

        return response()->json([
            'reference' => $result['reference'],
            'status'    => 'PENDING',
            'id_panier' => $panier->id_panier,
        ], 201);
    }

    /**
     * Initier un paiement Mobile Money pour une tranche existante.
     * POST /api/freemopay/initier-tranche
     */
    public function initierTranche(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_tranche' => 'required|integer|exists:tranches_paiement,id_tranche',
            'phone'      => 'required|string|min:9|max:15',
        ]);

        $tranche = TranchePaiement::findOrFail($validated['id_tranche']);

        if ($tranche->statut === 'payee') {
            return response()->json(['message' => 'Cette tranche est déjà payée'], 422);
        }

        $phone      = $this->normaliserPhone($validated['phone']);
        $externalId = 'tranche_' . $tranche->id_tranche . '_' . time();

        $result = $this->freemopay->initierCollecte(
            $phone,
            (float) $tranche->montant_du_ttc,
            $externalId
        );

        // Stocker la référence dans le champ existant
        $tranche->update(['reference_transaction' => $result['reference']]);

        return response()->json([
            'reference'  => $result['reference'],
            'status'     => 'PENDING',
            'id_tranche' => $tranche->id_tranche,
        ], 201);
    }

    /**
     * Vérifier le statut d'un paiement via Freemopay.
     * GET /api/freemopay/statut/{reference}
     */
    public function statut(string $reference): JsonResponse
    {
        $statut = $this->freemopay->getStatut($reference);
        return response()->json($statut);
    }

    /**
     * Webhook reçu depuis Freemopay après une transaction (SUCCESS ou FAILED).
     * POST /api/freemopay/webhook  — route publique
     */
    public function webhook(Request $request): JsonResponse
    {
        $data = $request->all();
        Log::info('Freemopay webhook', $data);

        $reference  = $data['reference']  ?? null;
        $status     = $data['status']     ?? null;
        $externalId = $data['externalId'] ?? null;
        $amount     = (float) ($data['amount'] ?? 0);

        if (!$reference || !$status || !$externalId) {
            return response()->json(['ok' => false, 'message' => 'Payload incomplet'], 400);
        }

        // Confirmer le statut côté Freemopay (anti-spoofing)
        try {
            $confirmed = $this->freemopay->getStatut($reference);
            $status    = $confirmed['status'] ?? $status;
        } catch (\Throwable $e) {
            Log::warning('Freemopay webhook: impossible de confirmer', ['error' => $e->getMessage()]);
        }

        if (str_starts_with($externalId, 'panier_')) {
            $this->traiterPanier($externalId, $status, $reference);
        } elseif (str_starts_with($externalId, 'tranche_')) {
            $this->traiterTranche($externalId, $status, $reference, $amount);
        }

        return response()->json(['ok' => true]);
    }

    // =========================================================
    // MÉTHODES PRIVÉES
    // =========================================================

    private function traiterPanier(string $externalId, string $status, string $reference): void
    {
        preg_match('/^panier_(\d+)/', $externalId, $m);
        $idPanier = $m[1] ?? null;
        if (!$idPanier) return;

        $panier = Panier::find($idPanier);
        if (!$panier) return;

        if ($status === 'SUCCESS') {
            $panier->update(['freemopay_statut' => 'success']);
            Log::info('Freemopay: panier marqué success', ['id_panier' => $idPanier]);
        } elseif ($status === 'FAILED') {
            $panier->update([
                'freemopay_statut'        => 'failed',
                'derniere_erreur_paiement' => 'Paiement Mobile Money échoué ou annulé',
            ]);
        }
    }

    private function traiterTranche(string $externalId, string $status, string $reference, float $montant): void
    {
        preg_match('/^tranche_(\d+)/', $externalId, $m);
        $idTranche = $m[1] ?? null;
        if (!$idTranche) return;

        $tranche = TranchePaiement::find($idTranche);
        if (!$tranche || $tranche->statut === 'payee') return;

        if ($status === 'SUCCESS') {
            DB::transaction(function () use ($tranche, $reference, $montant) {
                $tranche->update([
                    'montant_paye'           => $montant ?: $tranche->montant_du_ttc,
                    'date_paiement_effectif' => now()->toDateString(),
                    'mode_paiement'          => 'mobile_money',
                    'reference_transaction'  => $reference,
                    'statut'                 => 'payee',
                ]);

                $facture = FactureTranche::where('id_tranche', $tranche->id_tranche)->first();
                if ($facture) {
                    $facture->update([
                        'statut_paiement'        => 'payee',
                        'date_paiement_effectif' => now()->toDateString(),
                    ]);
                }
            });

            // Fallback PHP : débloquer la livraison si solde atteint
            $plan = PlanPaiement::with('commande')->find($tranche->id_plan_paiement);
            if ($plan && $plan->commande) {
                $totalPaye = TranchePaiement::where('id_plan_paiement', $plan->id_plan_paiement)
                    ->where('statut', 'payee')->sum('montant_paye');
                if ($totalPaye >= $plan->montant_total_ttc) {
                    $plan->commande->update(['livraison_bloquee' => 0]);
                    $plan->update(['statut_global' => 'solde', 'date_solde' => now()]);
                }
            }

            Log::info('Freemopay: tranche payée via webhook', ['id_tranche' => $tranche->id_tranche]);
        }
    }

    private function normaliserPhone(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (!str_starts_with($phone, '237')) {
            $phone = '237' . $phone;
        }
        return $phone;
    }
}
