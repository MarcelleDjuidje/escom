<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FactureTranche;
use App\Models\Panier;
use App\Models\PlanPaiement;
use App\Models\TranchePaiement;
use App\Services\KPayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class KPayController extends Controller
{
    public function __construct(private KPayService $kpay) {}

    /**
     * Initier un paiement Mobile Money pour un panier.
     * POST /api/kpay/initier-panier
     */
    public function initierPanier(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_panier' => 'required|integer|exists:paniers,id_panier',
            'phone'     => 'required|string|min:9|max:15',
            'montant'   => 'required|numeric|min:1',
            'operateur' => 'nullable|in:MTN,Orange',
        ]);

        $panier = Panier::findOrFail($validated['id_panier']);
        $user   = $request->user();

        if ($panier->id_client !== $user->id_client) {
            return response()->json(['message' => 'Acces refuse'], 403);
        }

        if ($panier->statut === 'converti') {
            return response()->json(['message' => 'Ce panier a deja ete paye'], 409);
        }

        if ($panier->statut === 'abandonne_24h' || ($panier->expire_le && $panier->expire_le->isPast())) {
            return response()->json(['message' => 'Ce panier a expire'], 410);
        }

        $externalId = 'panier_' . $panier->id_panier . '_' . time();

        $result = $this->kpay->initPaymentUssd(
            $validated['phone'],
            (float) $validated['montant'],
            $externalId,
            $validated['operateur'] ?? null,
            "Panier {$panier->numero_panier}"
        );

        $panier->update([
            'kpay_id'     => $result['id'] ?? null,
            'kpay_statut' => 'pending',
        ]);

        return response()->json([
            'kpay_id'    => $result['id'] ?? null,
            'reference'  => $result['reference'] ?? null,
            'status'     => 'PENDING',
            'id_panier'  => $panier->id_panier,
        ], 201);
    }

    /**
     * Initier un paiement Mobile Money pour une tranche existante.
     * POST /api/kpay/initier-tranche
     */
    public function initierTranche(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_tranche' => 'required|integer|exists:tranches_paiement,id_tranche',
            'phone'      => 'required|string|min:9|max:15',
            'operateur'  => 'nullable|in:MTN,Orange',
        ]);

        $tranche = TranchePaiement::findOrFail($validated['id_tranche']);

        if ($tranche->statut === 'payee') {
            return response()->json(['message' => 'Cette tranche est deja payee'], 422);
        }

        $externalId = 'tranche_' . $tranche->id_tranche . '_' . time();

        $result = $this->kpay->initPaymentUssd(
            $validated['phone'],
            (float) $tranche->montant_du_ttc,
            $externalId,
            $validated['operateur'] ?? null,
            "Tranche {$tranche->numero_tranche} — {$tranche->libelle}"
        );

        $tranche->update([
            'reference_transaction' => $result['id'] ?? null,
        ]);

        return response()->json([
            'kpay_id'    => $result['id'] ?? null,
            'reference'  => $result['reference'] ?? null,
            'status'     => 'PENDING',
            'id_tranche' => $tranche->id_tranche,
        ], 201);
    }

    /**
     * Verifier le statut d'un paiement via KPay.
     * GET /api/kpay/statut/{paymentId}
     */
    public function statut(string $paymentId): JsonResponse
    {
        $statut = $this->kpay->getPaymentStatus($paymentId);

        // Normaliser le statut pour le frontend
        $status = strtoupper($statut['status'] ?? 'PENDING');
        $mapped = match ($status) {
            'COMPLETED' => 'SUCCESS',
            'FAILED', 'CANCELLED', 'EXPIRED' => 'FAILED',
            default => $status,
        };

        return response()->json([
            'status'        => $mapped,
            'kpay_id'       => $statut['id'] ?? $paymentId,
            'reference'     => $statut['reference'] ?? null,
            'amount'        => $statut['amount'] ?? null,
            'failureReason' => $statut['failureReason'] ?? null,
            'reason'        => $statut['failureReason'] ?? null,
        ]);
    }

    /**
     * Webhook recu depuis KPay apres une transaction.
     * POST /api/kpay/webhook — route publique
     */
    public function webhook(Request $request): JsonResponse
    {
        $rawBody   = $request->getContent();
        $signature = $request->header('x-kpay-signature', '');

        // Verifier la signature HMAC
        if ($signature && !$this->kpay->verifyWebhookSignature($rawBody, $signature)) {
            Log::warning('KPay webhook: signature invalide');
            return response()->json(['ok' => false, 'message' => 'Signature invalide'], 401);
        }

        $data = $request->all();
        Log::info('KPay webhook', $data);

        $kpayId     = $data['id'] ?? null;
        $status     = strtoupper($data['status'] ?? '');
        $externalId = $data['externalId'] ?? null;
        $amount     = (float) ($data['amount'] ?? 0);

        if (!$kpayId || !$status || !$externalId) {
            return response()->json(['ok' => false, 'message' => 'Payload incomplet'], 400);
        }

        // Normaliser
        $normalizedStatus = match ($status) {
            'COMPLETED' => 'SUCCESS',
            'FAILED', 'CANCELLED', 'EXPIRED' => 'FAILED',
            default => $status,
        };

        if (str_starts_with($externalId, 'panier_')) {
            $this->traiterPanier($externalId, $normalizedStatus, $kpayId);
        } elseif (str_starts_with($externalId, 'tranche_')) {
            $this->traiterTranche($externalId, $normalizedStatus, $kpayId, $amount);
        }

        return response()->json(['ok' => true]);
    }

    // =========================================================
    // METHODES PRIVEES
    // =========================================================

    private function traiterPanier(string $externalId, string $status, string $kpayId): void
    {
        preg_match('/^panier_(\d+)/', $externalId, $m);
        $idPanier = $m[1] ?? null;
        if (!$idPanier) return;

        $panier = Panier::find($idPanier);
        if (!$panier) return;

        if ($status === 'SUCCESS') {
            $panier->update(['kpay_statut' => 'success']);
            Log::info('KPay: panier marque success', ['id_panier' => $idPanier]);
        } elseif ($status === 'FAILED') {
            $panier->update([
                'kpay_statut'              => 'failed',
                'derniere_erreur_paiement' => 'Paiement Mobile Money echoue ou annule',
            ]);
        }
    }

    private function traiterTranche(string $externalId, string $status, string $kpayId, float $montant): void
    {
        preg_match('/^tranche_(\d+)/', $externalId, $m);
        $idTranche = $m[1] ?? null;
        if (!$idTranche) return;

        $tranche = TranchePaiement::find($idTranche);
        if (!$tranche || $tranche->statut === 'payee') return;

        if ($status === 'SUCCESS') {
            DB::transaction(function () use ($tranche, $kpayId, $montant) {
                $tranche->update([
                    'montant_paye'           => $montant ?: $tranche->montant_du_ttc,
                    'date_paiement_effectif' => now()->toDateString(),
                    'mode_paiement'          => 'mobile_money',
                    'reference_transaction'  => $kpayId,
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

            // Fallback PHP : debloquer la livraison si solde atteint
            $plan = PlanPaiement::with('commande')->find($tranche->id_plan_paiement);
            if ($plan && $plan->commande) {
                $totalPaye = TranchePaiement::where('id_plan_paiement', $plan->id_plan_paiement)
                    ->where('statut', 'payee')->sum('montant_paye');
                if ($totalPaye >= $plan->montant_total_ttc) {
                    $plan->commande->update(['livraison_bloquee' => 0]);
                    $plan->update(['statut_global' => 'solde', 'date_solde' => now()]);
                }
            }

            Log::info('KPay: tranche payee via webhook', ['id_tranche' => $tranche->id_tranche]);
        }
    }
}
