<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campagne;
use App\Models\Client;
use App\Models\Commande;
use App\Models\Employe;
use App\Models\FactureTranche;
use App\Models\LigneDevis;
use App\Models\NotificationInterne;
use App\Models\PlanPaiement;
use App\Models\Projet;
use App\Models\ServiceConception;
use App\Models\ServiceImpression;
use App\Models\ServiceSocialMedia;
use App\Models\TranchePaiement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommandeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Commande::with(['client', 'employe_responsable', 'plan_paiement']);

        if ($user instanceof Client) {
            $query->where('id_client', $user->id_client);
        } elseif ($user instanceof Employe && !$user->isAdmin()) {
            $query->where('id_employe_responsable', $user->id_employe);
        }

        if ($request->statut) $query->where('statut', $request->statut);
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('numero_commande', 'like', "%{$request->search}%")
                  ->orWhereHas('client', fn($c) => $c->where('nom_complet', 'like', "%{$request->search}%"));
            });
        }

        return response()->json($query->orderByDesc('date_commande')->paginate(20));
    }

    public function show(int $id, Request $request): JsonResponse
    {
        $commande = Commande::with([
            'client', 'employe_responsable', 'devis.lignes',
            'plan_paiement.tranches.facture', 'projets.taches', 'projets.livrables.apercu',
            'pieces_jointes', 'factures', 'rappels', 'conversations',
        ])->findOrFail($id);

        $user = $request->user();
        if ($user instanceof Client && $commande->id_client !== $user->id_client) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        return response()->json($commande);
    }

    /**
     * Détermine l'employé responsable d'une commande selon 3 niveaux de fallback :
     * 1. Service commandé (id_employe_responsable du service)
     * 2. Premier employé du bon rôle (selon type_service)
     * 3. Premier admin/directeur disponible
     */
    private function determinerEmployeResponsable(array $lignes): ?int
    {
        // ===== Niveau 1 : employé assigné au service =====
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
                // Vérifier que l'employé est toujours actif
                $emp = Employe::where('id_employe', $employeId)->where('actif', 1)->first();
                if ($emp) return $emp->id_employe;
            }
        }

        // ===== Niveau 2 : employé par rôle =====
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

        // ===== Niveau 3 : admin/directeur en dernier recours =====
        $admin = Employe::where('actif', 1)
            ->whereIn('role', ['admin', 'directeur'])
            ->first();

        return $admin?->id_employe;
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_client' => 'required|exists:clients,id_client',
            'id_devis' => 'nullable|exists:devis,id_devis',
            'id_employe_responsable' => 'nullable|exists:employes,id_employe',
            'date_livraison_souhaitee' => 'nullable|date|after:today',
            'mode_livraison' => 'required|in:remise_en_main,envoi_email,livraison_physique',
            'paiement_en_tranches' => 'required|boolean',
            'total_ttc' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'lignes' => 'required|array|min:1',
            'lignes.*.designation' => 'required|string',
            'lignes.*.quantite' => 'required|numeric|min:0.01',
            'lignes.*.prix_unitaire_ht' => 'required|numeric|min:0',
            'lignes.*.type_service' => 'required|in:CONCEPTION,IMPRESSION,SOCIAL,CAMPAGNE',
            'lignes.*.id_service' => 'nullable|integer',
            'tranches' => 'nullable|array',
            'tranches.*.libelle' => 'required_with:tranches|string',
            'tranches.*.montant_du_ttc' => 'required_with:tranches|numeric|min:0',
            'tranches.*.date_echeance_prevue' => 'required_with:tranches|date',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // ============================================
            // AUTO-ASSIGNATION DE L'EMPLOYÉ RESPONSABLE
            // ============================================
            $idEmployeResp = $validated['id_employe_responsable']
                ?? $this->determinerEmployeResponsable($validated['lignes']);

            if (!$idEmployeResp) {
                return response()->json([
                    'message' => 'Aucun employé disponible pour gérer cette commande. Veuillez contacter l\'administration.',
                ], 422);
            }

            $commande = Commande::create([
                'id_client' => $validated['id_client'],
                'id_devis' => $validated['id_devis'] ?? null,
                'id_employe_responsable' => $idEmployeResp,
                'numero_commande' => Commande::nextNumber(),
                'date_commande' => now(),
                'statut' => 'confirmee',
                'paiement_en_tranches' => $validated['paiement_en_tranches'],
                'livraison_bloquee' => 1,
                'date_livraison_souhaitee' => $validated['date_livraison_souhaitee'] ?? null,
                'mode_livraison' => $validated['mode_livraison'],
                'total_ttc' => $validated['total_ttc'],
                'montant_paye' => 0,
                'notes' => $validated['notes'] ?? null,
            ]);

            // ===== Plan de paiement + tranches + factures =====
            if ($validated['paiement_en_tranches'] && !empty($validated['tranches'])) {
                $plan = PlanPaiement::create([
                    'id_commande' => $commande->id_commande,
                    'nombre_tranches' => count($validated['tranches']),
                    'montant_total_ttc' => $validated['total_ttc'],
                    'montant_total_paye' => 0,
                    'statut_global' => 'en_cours',
                    'id_employe_createur' => $request->user()->id_employe ?? null,
                ]);

                $nbTotal = count($validated['tranches']);
                foreach ($validated['tranches'] as $i => $tr) {
                    $tranche = TranchePaiement::create([
                        'id_plan_paiement' => $plan->id_plan_paiement,
                        'numero_tranche' => $i + 1,
                        'libelle' => $tr['libelle'],
                        'montant_du_ttc' => $tr['montant_du_ttc'],
                        'date_echeance_prevue' => $tr['date_echeance_prevue'],
                        'statut' => 'en_attente',
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
                        'designation_prestation' => "Commande {$commande->numero_commande} — " . $tr['libelle'],
                        'montant_ht' => $tr['montant_du_ttc'],
                        'taux_tva' => 0,
                        'montant_tva' => 0,
                        'montant_ttc' => $tr['montant_du_ttc'],
                        'statut_paiement' => 'non_payee',
                    ]);
                }
            } else {
                // Paiement intégral : 1 plan, 1 tranche, 1 facture
                $plan = PlanPaiement::create([
                    'id_commande' => $commande->id_commande,
                    'nombre_tranches' => 1,
                    'montant_total_ttc' => $validated['total_ttc'],
                    'montant_total_paye' => 0,
                    'statut_global' => 'en_cours',
                    'id_employe_createur' => $request->user()->id_employe ?? null,
                ]);

                $echeance = now()->addDays(15);
                $tranche = TranchePaiement::create([
                    'id_plan_paiement' => $plan->id_plan_paiement,
                    'numero_tranche' => 1,
                    'libelle' => 'Paiement intégral',
                    'montant_du_ttc' => $validated['total_ttc'],
                    'date_echeance_prevue' => $echeance->toDateString(),
                    'statut' => 'en_attente',
                ]);

                FactureTranche::create([
                    'id_tranche' => $tranche->id_tranche,
                    'id_commande' => $commande->id_commande,
                    'id_client' => $commande->id_client,
                    'numero_facture' => 'FAC-' . date('Y') . '-' . str_pad((string)$commande->id_commande, 4, '0', STR_PAD_LEFT) . '-T1',
                    'type_facture' => 'solde',
                    'date_emission' => now()->toDateString(),
                    'date_echeance' => $echeance->toDateString(),
                    'designation_prestation' => "Commande {$commande->numero_commande} — Paiement intégral",
                    'montant_ht' => $validated['total_ttc'],
                    'taux_tva' => 0,
                    'montant_tva' => 0,
                    'montant_ttc' => $validated['total_ttc'],
                    'statut_paiement' => 'non_payee',
                ]);
            }

            // Notification
            NotificationInterne::create([
                'type_destinataire' => 'client',
                'id_client' => $commande->id_client,
                'declencheur' => 'nouvelle_commande',
                'titre' => "Nouvelle commande {$commande->numero_commande}",
                'contenu' => "Votre commande a été confirmée. Total: {$commande->total_ttc} XAF",
                'url_action' => "/dashboard/commandes/{$commande->id_commande}",
                'id_commande' => $commande->id_commande,
                'created_at' => now(),
            ]);

            // Projet associé
            Projet::create([
                'id_commande' => $commande->id_commande,
                'id_chef_projet' => $commande->id_employe_responsable,
                'titre' => "Projet — {$commande->numero_commande}",
                'date_debut' => now(),
                'date_echeance' => $commande->date_livraison_souhaitee,
                'statut' => 'en_attente',
                'priorite' => 'normale',
                'livraison_autorisee' => 0,
            ]);

            return response()->json($commande->load(['plan_paiement.tranches.facture', 'projets']), 201);
        });
    }

    public function updateStatut(int $id, Request $request): JsonResponse
    {
        $request->validate([
            'statut' => 'required|in:confirmee,en_production,prete,livree,annulee',
            'commentaire' => 'nullable|string',
        ]);

        $commande = Commande::findOrFail($id);
        $ancien = $commande->statut;
        $commande->update(['statut' => $request->statut]);

        NotificationInterne::create([
            'type_destinataire' => 'client',
            'id_client' => $commande->id_client,
            'declencheur' => 'statut_commande',
            'titre' => "Mise à jour commande {$commande->numero_commande}",
            'contenu' => "Statut: {$ancien} → {$request->statut}",
            'url_action' => "/dashboard/commandes/{$commande->id_commande}",
            'id_commande' => $commande->id_commande,
            'created_at' => now(),
        ]);

        return response()->json($commande);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $stats = DB::table('v_stats_admin')->first();

        $recentes = Commande::with('client')->orderByDesc('date_commande')->take(10)->get();

        return response()->json([
            'stats' => $stats,
            'commandes_recentes' => $recentes,
        ]);
    }
}