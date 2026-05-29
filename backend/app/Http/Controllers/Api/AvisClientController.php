<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AvisClient;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AvisClientController extends Controller
{
    /**
     * Liste publique : avis validés uniquement
     */
    public function publicIndex(Request $request): JsonResponse
    {
        $avis = AvisClient::with('client:id_client,nom_complet,raison_sociale')
            ->where('statut', 'valide')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();
        return response()->json($avis);
    }

    /**
     * Liste admin : tous les avis, avec filtre éventuel
     */
    public function index(Request $request): JsonResponse
    {
        $query = AvisClient::with('client:id_client,nom_complet,raison_sociale');
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    /**
     * Création d'un avis par un client
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'note' => 'required|integer|min:1|max:5',
            'commentaire' => 'nullable|string|max:2000',
            'id_commande' => 'nullable|exists:commandes,id_commande',
        ]);

        if ($user instanceof Client) {
            $data['id_client'] = $user->id_client;
        }
        $data['statut'] = 'en_attente';

        return response()->json(AvisClient::create($data), 201);
    }

    /**
     * Validation de l'avis par un admin
     */
    public function valider(Request $request, int $id): JsonResponse
    {
        $avis = AvisClient::findOrFail($id);
        $employe = $request->user();

        $avis->update([
            'statut' => 'valide',
            'valide_le' => now(),
            'id_employe_valideur' => $employe->id_employe ?? null,
        ]);

        return response()->json([
            'message' => 'Avis validé',
            'avis' => $avis->fresh(),
        ]);
    }

    /**
     * Rejet de l'avis par un admin
     */
    public function rejeter(Request $request, int $id): JsonResponse
    {
        $avis = AvisClient::findOrFail($id);
        $employe = $request->user();

        $avis->update([
            'statut' => 'rejete',
            'valide_le' => now(),
            'id_employe_valideur' => $employe->id_employe ?? null,
        ]);

        return response()->json([
            'message' => 'Avis rejeté',
            'avis' => $avis->fresh(),
        ]);
    }

    /**
     * Suppression définitive
     */
    public function destroy(int $id): JsonResponse
    {
        AvisClient::findOrFail($id)->delete();
        return response()->json(['message' => 'Avis supprimé']);
    }

    /**
     * Alias PATCH : mise à jour du statut directement
     */
    public function updateStatut(Request $request, int $id): JsonResponse
    {
        $request->validate(['statut' => 'required|in:valide,rejete,en_attente']);
        $avis = AvisClient::findOrFail($id);
        $employe = $request->user();

        $avis->update([
            'statut' => $request->statut,
            'valide_le' => now(),
            'id_employe_valideur' => $employe->id_employe ?? null,
        ]);

        return response()->json($avis);
    }

    /**
     * L'admin répond publiquement à un avis client
     */
    public function repondre(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'reponse' => 'required|string|max:2000',
        ]);

        $avis = AvisClient::findOrFail($id);
        $avis->update(['reponse_admin' => $data['reponse']]);

        return response()->json([
            'message' => 'Réponse enregistrée',
            'avis' => $avis->fresh(),
        ]);
    }
}