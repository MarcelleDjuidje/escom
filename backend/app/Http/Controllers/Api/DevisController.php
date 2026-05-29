<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Employe;
use App\Models\DemandeDevis;
use App\Models\HistoriqueDevis;
use App\Models\Panier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DevisController extends Controller
{
    // =============================================================
    // HELPERS PRIVÉS
    // =============================================================

    /** Détermine si l'utilisateur connecté est un administrateur */
    private function estAdmin($user): bool
    {
        return $user instanceof Employe && ($user->role ?? null) === 'admin';
    }

    /** Détermine si l'utilisateur est un employé (admin ou non) */
    private function estEmploye($user): bool
    {
        return $user instanceof Employe;
    }

    /** Enregistre une entrée dans l'historique (audit) */
    private function logHistorique(
        DemandeDevis $devis,
        string $action,
        $user,
        ?string $ancienStatut = null,
        ?string $nouveauStatut = null,
        array $details = [],
        ?Request $request = null
    ): void {
        $acteurType = 'systeme';
        $acteurId   = null;
        $acteurNom  = 'Système';

        if ($user instanceof Client) {
            $acteurType = 'client';
            $acteurId   = $user->id_client;
            $acteurNom  = $user->nom_complet ?? $user->raison_sociale ?? 'Client';
        } elseif ($user instanceof Employe) {
            $acteurType = 'employe';
            $acteurId   = $user->id_employe;
            $acteurNom  = $user->nom_complet ?? ($user->nom ?? 'Employé');
        }

        HistoriqueDevis::create([
            'id_demande_devis' => $devis->id_demande_devis,
            'action'           => $action,
            'ancien_statut'    => $ancienStatut,
            'nouveau_statut'   => $nouveauStatut,
            'acteur_type'      => $acteurType,
            'acteur_id'        => $acteurId,
            'acteur_nom'       => $acteurNom,
            'details'          => !empty($details) ? $details : null,
            'ip_address'       => $request?->ip(),
            'user_agent'       => $request ? substr((string) $request->userAgent(), 0, 500) : null,
            'created_at'       => now(),
        ]);
    }

    // =============================================================
    // LISTE DES DEVIS  (GET /api/devis)
    // =============================================================
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = DemandeDevis::with([
            'client:id_client,nom_complet,raison_sociale,email,telephone',
            'employeResponsable:id_employe,nom_complet',
        ]);

        // Client : ne voit QUE ses propres devis
        if ($user instanceof Client) {
            $query->where('id_client', $user->id_client);
        }
        // Employé non-admin : voit les devis dont il est responsable
        elseif ($this->estEmploye($user) && !$this->estAdmin($user)) {
            $query->where('id_employe_responsable', $user->id_employe);
        }
        // Admin : voit tout (pas de filtre)

        // Filtre optionnel par statut
        if ($request->filled('statut')) {
            $query->where('statut', $request->string('statut'));
        }

        // Recherche optionnelle (numéro ou titre)
        if ($request->filled('recherche')) {
            $r = $request->string('recherche');
            $query->where(function ($q) use ($r) {
                $q->where('numero_devis', 'like', "%{$r}%")
                  ->orWhere('titre', 'like', "%{$r}%");
            });
        }

        $devis = $query->orderByDesc('created_at')->paginate(15);

        return response()->json($devis);
    }

    // =============================================================
    // DÉTAIL D'UN DEVIS  (GET /api/devis/{id})
    // =============================================================
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $devis = DemandeDevis::with([
            'client:id_client,nom_complet,raison_sociale,email,telephone',
            'employeResponsable:id_employe,nom_complet',
            'historique',
        ])->findOrFail($id);

        // Vérification d'accès
        if ($user instanceof Client && $devis->id_client !== $user->id_client) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        return response()->json($devis);
    }

    // =============================================================
    // CRÉER UNE DEMANDE  (POST /api/devis)  — CLIENT
    // =============================================================
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!($user instanceof Client)) {
            return response()->json(['message' => 'Seuls les clients peuvent demander un devis'], 403);
        }

        $data = $request->validate([
            'type_service'          => 'required|string|max:30',
            'id_service_origine'    => 'nullable|integer',
            'table_service_origine' => 'nullable|string|max:50',
            'titre'                 => 'required|string|max:200',
            'description_besoin'    => 'required|string|max:5000',
            'budget_indicatif'      => 'nullable|numeric|min:0|max:999999999',
            'delai_souhaite'        => 'nullable|date|after:today',
            'fichiers_joints'       => 'nullable|array',
            'fichiers_joints.*'     => 'string|max:500',
        ]);

        $devis = DB::transaction(function () use ($data, $user, $request) {
            $devis = DemandeDevis::create([
                'numero_devis'          => DemandeDevis::genererNumero(),
                'id_client'             => $user->id_client,
                'type_service'          => $data['type_service'],
                'id_service_origine'    => $data['id_service_origine'] ?? null,
                'table_service_origine' => $data['table_service_origine'] ?? null,
                'titre'                 => $data['titre'],
                'description_besoin'    => $data['description_besoin'],
                'budget_indicatif'      => $data['budget_indicatif'] ?? null,
                'delai_souhaite'        => $data['delai_souhaite'] ?? null,
                'fichiers_joints'       => $data['fichiers_joints'] ?? null,
                'statut'                => DemandeDevis::STATUT_EN_ATTENTE,
                'taux_tva'              => DemandeDevis::TVA_DEFAUT,
            ]);

            $this->logHistorique(
                $devis,
                HistoriqueDevis::ACTION_CREATION,
                $user,
                null,
                DemandeDevis::STATUT_EN_ATTENTE,
                ['titre' => $devis->titre],
                $request
            );

            return $devis;
        });

        return response()->json([
            'message' => 'Votre demande de devis a été envoyée avec succès',
            'devis'   => $devis->load('client:id_client,nom_complet,raison_sociale'),
        ], 201);
    }

    // =============================================================
    // CHIFFRER UN DEVIS  (POST /api/devis/{id}/chiffrer)  — ADMIN
    // =============================================================
    public function chiffrer(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$this->estAdmin($user)) {
            return response()->json(['message' => 'Seul un administrateur peut chiffrer un devis'], 403);
        }

        $devis = DemandeDevis::findOrFail($id);

        if (!$devis->peutEtreChiffre()) {
            return response()->json([
                'message' => "Ce devis ne peut pas être chiffré (statut actuel : {$devis->statut})"
            ], 422);
        }

        $data = $request->validate([
            'prix_propose_ht'          => 'required|numeric|min:0|max:999999999',
            'taux_tva'                 => 'nullable|numeric|min:0|max:100',
            'delai_propose_jours'      => 'required|integer|min:1|max:365',
            'commentaire_admin'        => 'nullable|string|max:2000',
            'conditions_particulieres' => 'nullable|string|max:2000',
            'id_employe_responsable'   => 'nullable|integer|exists:employes,id_employe',
        ]);

        $ancienStatut = $devis->statut;

        $devis = DB::transaction(function () use ($devis, $data, $user, $request, $ancienStatut) {
            $taux = $data['taux_tva'] ?? DemandeDevis::TVA_DEFAUT;
            $ht   = (float) $data['prix_propose_ht'];
            $ttc  = round($ht * (1 + $taux / 100), 2);

            $devis->update([
                'prix_propose_ht'          => $ht,
                'taux_tva'                 => $taux,
                'prix_propose_ttc'         => $ttc,
                'delai_propose_jours'      => $data['delai_propose_jours'],
                'commentaire_admin'        => $data['commentaire_admin'] ?? null,
                'conditions_particulieres' => $data['conditions_particulieres'] ?? null,
                'id_employe_responsable'   => $data['id_employe_responsable'] ?? $devis->id_employe_responsable,
                'statut'                   => DemandeDevis::STATUT_CHIFFRE,
                'date_chiffrage'           => now(),
                'valide_jusqu_au'          => now()->addDays(DemandeDevis::VALIDITE_JOURS)->toDateString(),
            ]);

            $this->logHistorique(
                $devis,
                HistoriqueDevis::ACTION_CHIFFRAGE,
                $user,
                $ancienStatut,
                DemandeDevis::STATUT_CHIFFRE,
                ['prix_ht' => $ht, 'prix_ttc' => $ttc, 'delai_jours' => $data['delai_propose_jours']],
                $request
            );

            return $devis;
        });

        return response()->json([
            'message' => 'Devis chiffré avec succès. Le client va être notifié.',
            'devis'   => $devis->fresh(['client', 'employeResponsable']),
        ]);
    }

    // =============================================================
    // ACCEPTER UN DEVIS  (POST /api/devis/{id}/accepter)  — CLIENT
    // =============================================================
    public function accepter(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!($user instanceof Client)) {
            return response()->json(['message' => 'Seul le client peut accepter son devis'], 403);
        }

        $devis = DemandeDevis::findOrFail($id);

        if ($devis->id_client !== $user->id_client) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        if (!$devis->peutEtreAccepte()) {
            $raison = $devis->estExpire()
                ? "Ce devis a expiré (validité dépassée)"
                : "Ce devis ne peut pas être accepté (statut : {$devis->statut})";
            return response()->json(['message' => $raison], 422);
        }

        $resultat = DB::transaction(function () use ($devis, $user, $request) {
            // Créer un panier à partir du devis accepté
            $panier = Panier::create([
                'id_client'        => $user->id_client,
                'total_ht'         => $devis->prix_propose_ht,
                'total_ttc'        => $devis->prix_propose_ttc,
                'statut'           => 'en_attente',
                'mode_livraison'   => 'standard',
                'id_devis_origine' => $devis->id_demande_devis,
            ]);

            $devis->update([
                'statut'           => DemandeDevis::STATUT_ACCEPTE,
                'date_acceptation' => now(),
                'id_panier_cree'   => $panier->id_panier,
            ]);

            $this->logHistorique(
                $devis,
                HistoriqueDevis::ACTION_ACCEPTATION,
                $user,
                DemandeDevis::STATUT_CHIFFRE,
                DemandeDevis::STATUT_ACCEPTE,
                ['id_panier' => $panier->id_panier, 'montant_ttc' => $devis->prix_propose_ttc],
                $request
            );

            return ['devis' => $devis, 'panier' => $panier];
        });

        return response()->json([
            'message'   => 'Devis accepté ! Un panier a été créé, vous pouvez procéder au paiement.',
            'devis'     => $resultat['devis']->fresh(),
            'id_panier' => $resultat['panier']->id_panier,
        ]);
    }

    // =============================================================
    // REFUSER UN DEVIS  (POST /api/devis/{id}/refuser)  — CLIENT
    // =============================================================
    public function refuser(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!($user instanceof Client)) {
            return response()->json(['message' => 'Seul le client peut refuser son devis'], 403);
        }

        $devis = DemandeDevis::findOrFail($id);

        if ($devis->id_client !== $user->id_client) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        if (!$devis->peutEtreRefuse()) {
            return response()->json([
                'message' => "Ce devis ne peut plus être refusé (statut : {$devis->statut})"
            ], 422);
        }

        $data = $request->validate([
            'raison_refus' => 'nullable|string|max:1000',
        ]);

        $ancienStatut = $devis->statut;

        $devis = DB::transaction(function () use ($devis, $data, $user, $request, $ancienStatut) {
            $devis->update([
                'statut'       => DemandeDevis::STATUT_REFUSE,
                'date_refus'   => now(),
                'raison_refus' => $data['raison_refus'] ?? null,
            ]);

            $this->logHistorique(
                $devis,
                HistoriqueDevis::ACTION_REFUS,
                $user,
                $ancienStatut,
                DemandeDevis::STATUT_REFUSE,
                ['raison' => $data['raison_refus'] ?? 'Non précisée'],
                $request
            );

            return $devis;
        });

        return response()->json([
            'message' => 'Devis refusé.',
            'devis'   => $devis->fresh(),
        ]);
    }

    // =============================================================
    // ANNULER UNE DEMANDE  (POST /api/devis/{id}/annuler)  — CLIENT
    // =============================================================
    public function annuler(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!($user instanceof Client)) {
            return response()->json(['message' => 'Action non autorisée'], 403);
        }

        $devis = DemandeDevis::findOrFail($id);

        if ($devis->id_client !== $user->id_client) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        if (!in_array($devis->statut, [DemandeDevis::STATUT_EN_ATTENTE, DemandeDevis::STATUT_CHIFFRE], true)) {
            return response()->json([
                'message' => "Ce devis ne peut plus être annulé (statut : {$devis->statut})"
            ], 422);
        }

        $ancienStatut = $devis->statut;

        $devis = DB::transaction(function () use ($devis, $user, $request, $ancienStatut) {
            $devis->update(['statut' => DemandeDevis::STATUT_ANNULE]);

            $this->logHistorique(
                $devis,
                HistoriqueDevis::ACTION_ANNULATION,
                $user,
                $ancienStatut,
                DemandeDevis::STATUT_ANNULE,
                [],
                $request
            );

            return $devis;
        });

        return response()->json([
            'message' => 'Demande de devis annulée.',
            'devis'   => $devis->fresh(),
        ]);
    }

    // =============================================================
    // STATISTIQUES  (GET /api/devis/stats)  — ADMIN
    // =============================================================
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$this->estAdmin($user)) {
            return response()->json(['message' => 'Accès réservé aux administrateurs'], 403);
        }

        $total       = DemandeDevis::count();
        $enAttente   = DemandeDevis::enAttente()->count();
        $chiffres    = DemandeDevis::chiffre()->count();
        $acceptes    = DemandeDevis::accepte()->count();
        $refuses     = DemandeDevis::where('statut', DemandeDevis::STATUT_REFUSE)->count();
        $expires     = DemandeDevis::where('statut', DemandeDevis::STATUT_EXPIRE)->count();

        // Taux de conversion : acceptés / (chiffrés + acceptés + refusés)
        $baseConversion = $chiffres + $acceptes + $refuses;
        $tauxConversion = $baseConversion > 0
            ? round(($acceptes / $baseConversion) * 100, 1)
            : 0;

        // Panier moyen des devis acceptés
        $panierMoyen = (float) DemandeDevis::accepte()->avg('prix_propose_ttc');

        // Chiffre d'affaires potentiel (devis chiffrés en attente de réponse)
        $caPotentiel = (float) DemandeDevis::chiffre()->sum('prix_propose_ttc');

        // Chiffre d'affaires confirmé (devis acceptés)
        $caConfirme = (float) DemandeDevis::accepte()->sum('prix_propose_ttc');

        return response()->json([
            'total'             => $total,
            'en_attente'        => $enAttente,
            'chiffres'          => $chiffres,
            'acceptes'          => $acceptes,
            'refuses'           => $refuses,
            'expires'           => $expires,
            'taux_conversion'   => $tauxConversion,
            'panier_moyen'      => round($panierMoyen, 2),
            'ca_potentiel'      => round($caPotentiel, 2),
            'ca_confirme'       => round($caConfirme, 2),
        ]);
    }
}