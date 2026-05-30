<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campagne;
use App\Models\Client;
use App\Models\Commande;
use App\Models\Employe;
use App\Models\FactureTranche;
use App\Models\NotificationInterne;
use App\Models\Panier;
use App\Models\PlanPaiement;
use App\Models\Projet;
use App\Models\ServiceConception;
use App\Models\ServiceImpression;
use App\Models\ServiceSocialMedia;
use App\Models\TranchePaiement;
use App\Services\FreemopayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PanierController extends Controller
{
    /**
     * Crée un panier "en attente de paiement" (étape 1 du flow client).
     * Le client doit ensuite appeler /paniers/{id}/payer pour finaliser.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lignes' => 'required|array|min:1',
            'lignes.*.designation' => 'required|string',
            'lignes.*.quantite' => 'required|numeric|min:0.01',
            'lignes.*.prix_unitaire_ht' => 'required|numeric|min:0',
            'lignes.*.type_service' => 'required|in:CONCEPTION,IMPRESSION,SOCIAL,CAMPAGNE',
            'lignes.*.id_service' => 'nullable|integer',
            'total_ttc' => 'required|numeric|min:0',
            'paiement_en_tranches' => 'required|boolean',
            'tranches_prevues' => 'nullable|array',
            'tranches_prevues.*.libelle' => 'required_with:tranches_prevues|string',
            'tranches_prevues.*.montant_du_ttc' => 'required_with:tranches_prevues|numeric|min:0',
            'tranches_prevues.*.date_echeance_prevue' => 'required_with:tranches_prevues|date',
            'mode_livraison' => 'required|in:remise_en_main,envoi_email,livraison_physique',
            'date_livraison_souhaitee' => 'nullable|date|after:today',
            'notes' => 'nullable|string|max:2000',
        ]);

        $user = $request->user();
        if (!($user instanceof Client)) {
            return response()->json(['message' => 'Seuls les clients peuvent créer un panier'], 403);
        }

        // Vérification anti-doublon : si un panier identique en attente existe < 5 min, on le réutilise
        $recent = Panier::where('id_client', $user->id_client)
            ->where('statut', 'en_attente_paiement')
            ->where('total_ttc', $validated['total_ttc'])
            ->where('created_at', '>=', now()->subMinutes(5))
            ->first();
        if ($recent) {
            return response()->json($recent->load('client'), 200);
        }

        $panier = Panier::create([
            'id_client' => $user->id_client,
            'numero_panier' => Panier::nextNumber(),
            'lignes' => $validated['lignes'],
            'total_ttc' => $validated['total_ttc'],
            'paiement_en_tranches' => $validated['paiement_en_tranches'],
            'tranches_prevues' => $validated['tranches_prevues'] ?? null,
            'mode_livraison' => $validated['mode_livraison'],
            'date_livraison_souhaitee' => $validated['date_livraison_souhaitee'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'statut' => 'en_attente_paiement',
            'expire_le' => now()->addHours(24),
        ]);

        return response()->json($panier->load('client'), 201);
    }

    /**
     * Affiche un panier précis (le client doit en être propriétaire).
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $panier = Panier::with('client', 'commandeCreee')->findOrFail($id);
        $user = $request->user();

        if ($user instanceof Client && $panier->id_client !== $user->id_client) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        return response()->json($panier);
    }

    /**
     * Tente de payer un panier (1ère tranche ou intégral).
     * Si succès → convertit le panier en commande complète + plan + tranches + factures.
     */
    public function payer(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'mode_paiement' => 'required|in:mobile_money,virement,especes',
            'operateur' => 'nullable|in:MTN,Orange',
            'numero_telephone' => 'nullable|string|max:20',
            'reference_transaction' => 'nullable|string|max:100',
            'montant' => 'required|numeric|min:0',
        ]);

        $panier = Panier::findOrFail($id);
        $user = $request->user();

        // Vérifications de sécurité
        if ($user instanceof Client && $panier->id_client !== $user->id_client) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        if ($panier->statut === 'converti') {
            return response()->json([
                'message' => 'Ce panier a déjà été payé',
                'commande_id' => $panier->id_commande_creee,
            ], 409);
        }

        if ($panier->statut === 'abandonne_24h' || $panier->expire_le->isPast()) {
            return response()->json([
                'message' => 'Ce panier a expiré. Veuillez relancer une commande.',
            ], 410);
        }

        // Validation Mobile Money : vérifier via Freemopay API ou statut DB
        if ($validated['mode_paiement'] === 'mobile_money') {
            $reference = $validated['reference_transaction'] ?? null;
            if ($reference) {
                try {
                    $freemopay = app(FreemopayService::class);
                    $statut = $freemopay->getStatut($reference);
                    if (($statut['status'] ?? '') !== 'SUCCESS') {
                        return response()->json([
                            'message' => 'Le paiement Mobile Money n\'a pas encore été confirmé par l\'opérateur',
                        ], 422);
                    }
                    // Mettre à jour le statut en DB si le webhook n'a pas encore tourné
                    if ($panier->freemopay_statut !== 'success') {
                        $panier->update(['freemopay_statut' => 'success']);
                    }
                } catch (\Throwable $e) {
                    Log::warning('PanierController: vérification Freemopay échouée', ['error' => $e->getMessage()]);
                    // Fallback : vérifier le statut mis à jour par le webhook
                    if ($panier->freemopay_statut !== 'success') {
                        return response()->json([
                            'message' => 'Impossible de vérifier le paiement Mobile Money. Réessayez dans quelques instants.',
                        ], 503);
                    }
                }
            }

            if (!$this->validerPrefixMobileMoney($validated['numero_telephone'] ?? '', $validated['operateur'] ?? '')) {
                $panier->increment('nb_tentatives_paiement');
                $panier->update([
                    'derniere_tentative_at'    => now(),
                    'derniere_erreur_paiement' => "Préfixe invalide pour {$validated['operateur']}",
                ]);
                return response()->json([
                    'message' => "Le numéro de téléphone ne correspond pas à un compte {$validated['operateur']} valide",
                ], 422);
            }
        }

        // Calcul du montant attendu pour la 1ère tranche (ou intégral)
        $montantAttendu = $panier->paiement_en_tranches && !empty($panier->tranches_prevues)
            ? floatval($panier->tranches_prevues[0]['montant_du_ttc'] ?? $panier->total_ttc)
            : floatval($panier->total_ttc);

        if (abs($validated['montant'] - $montantAttendu) > 1) {
            return response()->json([
                'message' => "Montant incorrect. Attendu : {$montantAttendu} XAF",
            ], 422);
        }

        // ============================================
        // TRANSACTION ATOMIQUE : conversion panier → commande
        // ============================================
        try {
            $commande = DB::transaction(function () use ($panier, $validated, $request) {
                // 1. Déterminer l'employé responsable
                $idEmploye = $this->determinerEmployeResponsable($panier->lignes);
                if (!$idEmploye) {
                    throw new \Exception('Aucun employé disponible pour gérer cette commande');
                }

                // 2. Créer la commande
                $commande = Commande::create([
                    'id_client' => $panier->id_client,
                    'id_employe_responsable' => $idEmploye,
                    'numero_commande' => Commande::nextNumber(),
                    'date_commande' => now(),
                    'statut' => 'confirmee',
                    'paiement_en_tranches' => $panier->paiement_en_tranches,
                    'livraison_bloquee' => 1,
                    'date_livraison_souhaitee' => $panier->date_livraison_souhaitee,
                    'mode_livraison' => $panier->mode_livraison,
                    'total_ttc' => $panier->total_ttc,
                    'montant_paye' => $validated['montant'],
                    'notes' => $panier->notes,
                ]);

                // 3. Créer le plan + tranches + factures
                $this->genererPlanPaiement($commande, $panier, $validated);

                // 4. Passer le client en "actif"
                Client::where('id_client', $panier->id_client)
                    ->update(['statut' => 'actif']);

                // 5. Créer le projet associé
                Projet::create([
                    'id_commande' => $commande->id_commande,
                    'id_chef_projet' => $idEmploye,
                    'titre' => "Projet — {$commande->numero_commande}",
                    'date_debut' => now(),
                    'date_echeance' => $commande->date_livraison_souhaitee,
                    'statut' => 'en_attente',
                    'priorite' => 'normale',
                    'livraison_autorisee' => 0,
                ]);

                // 6. Notification
                NotificationInterne::create([
                    'type_destinataire' => 'client',
                    'id_client' => $panier->id_client,
                    'declencheur' => 'nouvelle_commande',
                    'titre' => "Commande {$commande->numero_commande} confirmée",
                    'contenu' => "Votre paiement a été validé. Total: {$commande->total_ttc} XAF",
                    'url_action' => "/dashboard/client/commandes/{$commande->id_commande}",
                    'id_commande' => $commande->id_commande,
                    'created_at' => now(),
                ]);

                // 7. Marquer le panier comme converti
                $panier->update([
                    'statut' => 'converti',
                    'id_commande_creee' => $commande->id_commande,
                ]);

                return $commande;
            });

            return response()->json([
                'message' => 'Paiement validé, commande créée',
                'commande' => $commande->load(['plan_paiement.tranches.facture', 'projets']),
            ], 201);

        } catch (\Throwable $e) {
            // Loguer la tentative échouée
            $panier->increment('nb_tentatives_paiement');
            $panier->update([
                'derniere_tentative_at' => now(),
                'derniere_erreur_paiement' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Erreur lors du paiement : ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Liste les paniers du client connecté (pour reprendre un paiement).
     */
    public function mesPaniers(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!($user instanceof Client)) {
            return response()->json([], 200);
        }

        $paniers = Panier::where('id_client', $user->id_client)
            ->where('statut', 'en_attente_paiement')
            ->where('expire_le', '>', now())
            ->orderByDesc('created_at')
            ->get();

        return response()->json($paniers);
    }

    /**
     * ADMIN : Liste les paniers abandonnés pour relance commerciale.
     */
    public function adminAbandonnes(Request $request): JsonResponse
    {
        $query = Panier::with('client')
            ->whereIn('statut', ['en_attente_paiement', 'abandonne_24h']);

        if ($request->statut) {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    /**
     * ADMIN : Stats sur les paniers (taux conversion, montants perdus).
     */
    public function adminStats(): JsonResponse
    {
        $total = Panier::count();
        $convertis = Panier::convertis()->count();
        $abandonnes = Panier::abandonnes()->count();
        $enAttente = Panier::enAttente()->where('expire_le', '>', now())->count();

        $montantConverti = Panier::convertis()->sum('total_ttc');
        $montantAbandonne = Panier::abandonnes()->sum('total_ttc');

        $tauxConversion = $total > 0 ? round(($convertis / $total) * 100, 1) : 0;

        return response()->json([
            'total' => $total,
            'convertis' => $convertis,
            'abandonnes' => $abandonnes,
            'en_attente' => $enAttente,
            'taux_conversion' => $tauxConversion,
            'montant_converti' => $montantConverti,
            'montant_abandonne' => $montantAbandonne,
        ]);
    }

    // ============================================
    // MÉTHODES PRIVÉES (logique métier)
    // ============================================

    private function validerPrefixMobileMoney(string $numero, string $operateur): bool
    {
        // Normaliser : retirer +237, espaces, tirets
        $numero = preg_replace('/[^0-9]/', '', $numero);
        if (str_starts_with($numero, '237')) $numero = substr($numero, 3);
        if (strlen($numero) !== 9) return false;

        $prefix2 = substr($numero, 0, 2);
        $prefix3 = substr($numero, 0, 3);

        if ($operateur === 'MTN') {
            $prefixesMTN = ['67', '68'];
            $prefixes3MTN = ['650', '651', '652', '653', '654', '680', '681', '682', '683', '684'];
            return in_array($prefix2, $prefixesMTN) || in_array($prefix3, $prefixes3MTN);
        }

        if ($operateur === 'Orange') {
            $prefixesOrange = ['69'];
            $prefixes3Orange = ['640', '641', '642', '643', '655', '656', '657', '658', '659', '685', '686', '687', '688', '689'];
            return in_array($prefix2, $prefixesOrange) || in_array($prefix3, $prefixes3Orange);
        }

        return false;
    }

    private function determinerEmployeResponsable(array $lignes): ?int
    {
        // Niveau 1 : employé du service
        foreach ($lignes as $ligne) {
            $idService = $ligne['id_service'] ?? null;
            if (!$idService) continue;

            $employeId = match($ligne['type_service'] ?? null) {
                'CONCEPTION' => ServiceConception::find($idService)?->id_employe_responsable,
                'IMPRESSION' => ServiceImpression::find($idService)?->id_employe_responsable,
                'SOCIAL'     => ServiceSocialMedia::find($idService)?->id_employe_responsable,
                'CAMPAGNE'   => Campagne::find($idService)?->id_employe_responsable,
                default      => null,
            };

            if ($employeId) {
                $emp = Employe::where('id_employe', $employeId)->where('actif', 1)->first();
                if ($emp) return $emp->id_employe;
            }
        }

        // Niveau 2 : par rôle
        $roleParType = [
            'CONCEPTION' => 'designer',
            'IMPRESSION' => 'imprimeur',
            'SOCIAL'     => 'chef_projet',
            'CAMPAGNE'   => 'commercial',
        ];
        foreach ($lignes as $ligne) {
            $role = $roleParType[$ligne['type_service'] ?? null] ?? null;
            if (!$role) continue;
            $emp = Employe::where('role', $role)->where('actif', 1)->first();
            if ($emp) return $emp->id_employe;
        }

        // Niveau 3 : admin/directeur
        $admin = Employe::where('actif', 1)
            ->whereIn('role', ['admin', 'directeur'])
            ->first();
        return $admin?->id_employe;
    }

    private function genererPlanPaiement(Commande $commande, Panier $panier, array $paiementData): void
    {
        if ($panier->paiement_en_tranches && !empty($panier->tranches_prevues)) {
            // Plan multi-tranches
            $plan = PlanPaiement::create([
                'id_commande' => $commande->id_commande,
                'nombre_tranches' => count($panier->tranches_prevues),
                'montant_total_ttc' => $panier->total_ttc,
                'montant_total_paye' => $paiementData['montant'],
                'statut_global' => 'en_cours',
            ]);

            $nbTotal = count($panier->tranches_prevues);
            foreach ($panier->tranches_prevues as $i => $tr) {
                $estPremiere = ($i === 0);
                $tranche = TranchePaiement::create([
                    'id_plan_paiement' => $plan->id_plan_paiement,
                    'numero_tranche' => $i + 1,
                    'libelle' => $tr['libelle'],
                    'montant_du_ttc' => $tr['montant_du_ttc'],
                    'date_echeance_prevue' => $tr['date_echeance_prevue'],
                    'montant_paye' => $estPremiere ? $paiementData['montant'] : 0,
                    'date_paiement_effectif' => $estPremiere ? now() : null,
                    'statut' => $estPremiere ? 'payee' : 'en_attente',
                    'mode_paiement' => $estPremiere ? $paiementData['mode_paiement'] : null,
                    'reference_transaction' => $estPremiere ? ($paiementData['reference_transaction'] ?? null) : null,
                ]);

                $typeFacture = 'intermediaire';
                if ($i === 0) $typeFacture = 'acompte';
                if ($i === $nbTotal - 1) $typeFacture = 'solde';

                FactureTranche::create([
                    'id_tranche' => $tranche->id_tranche,
                    'id_commande' => $commande->id_commande,
                    'id_client' => $commande->id_client,
                    'numero_facture' => 'FAC-' . date('Y') . '-' . str_pad((string)$commande->id_commande, 4, '0', STR_PAD_LEFT) . '-T' . ($i + 1),
                    'type_facture' => $typeFacture,
                    'date_emission' => now()->toDateString(),
                    'date_echeance' => $tr['date_echeance_prevue'],
                    'date_paiement_effectif' => $estPremiere ? now() : null,
                    'designation_prestation' => "Commande {$commande->numero_commande} — " . $tr['libelle'],
                    'montant_ht' => $tr['montant_du_ttc'],
                    'taux_tva' => 0,
                    'montant_tva' => 0,
                    'montant_ttc' => $tr['montant_du_ttc'],
                    'statut_paiement' => $estPremiere ? 'payee' : 'non_payee',
                ]);
            }
        } else {
            // Paiement intégral
            $plan = PlanPaiement::create([
                'id_commande' => $commande->id_commande,
                'nombre_tranches' => 1,
                'montant_total_ttc' => $panier->total_ttc,
                'montant_total_paye' => $paiementData['montant'],
                'statut_global' => 'paye_integralement',
            ]);

            $tranche = TranchePaiement::create([
                'id_plan_paiement' => $plan->id_plan_paiement,
                'numero_tranche' => 1,
                'libelle' => 'Paiement intégral',
                'montant_du_ttc' => $panier->total_ttc,
                'date_echeance_prevue' => now()->toDateString(),
                'montant_paye' => $paiementData['montant'],
                'date_paiement_effectif' => now(),
                'statut' => 'payee',
                'mode_paiement' => $paiementData['mode_paiement'],
                'reference_transaction' => $paiementData['reference_transaction'] ?? null,
            ]);

            FactureTranche::create([
                'id_tranche' => $tranche->id_tranche,
                'id_commande' => $commande->id_commande,
                'id_client' => $commande->id_client,
                'numero_facture' => 'FAC-' . date('Y') . '-' . str_pad((string)$commande->id_commande, 4, '0', STR_PAD_LEFT) . '-T1',
                'type_facture' => 'solde',
                'date_emission' => now()->toDateString(),
                'date_echeance' => now()->toDateString(),
                'date_paiement_effectif' => now(),
                'designation_prestation' => "Commande {$commande->numero_commande} — Paiement intégral",
                'montant_ht' => $panier->total_ttc,
                'taux_tva' => 0,
                'montant_tva' => 0,
                'montant_ttc' => $panier->total_ttc,
                'statut_paiement' => 'payee',
            ]);

            // Débloquer la livraison (commande entièrement payée)
            $commande->update(['livraison_bloquee' => 0]);
        }
    }
}