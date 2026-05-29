<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PromotionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PromotionService::query();
        if ($request->filled('statut')) $query->where('statut', $request->statut);
        if ($request->boolean('actives_only')) {
            $query->where('statut', 'active')
                  ->where('date_debut', '<=', now())
                  ->where('date_fin', '>=', now())
                  ->where('taux_remise_pct', '>', 0);
        }
        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $employe = $request->user();
        $data = $request->validate([
            'type_service' => 'required|in:CONCEPTION,IMPRESSION,SOCIAL',
            'id_service_ref' => 'required|integer',
            'libelle_service' => 'required|string|max:200',
            'taux_remise_pct' => 'required|numeric|min:0|max:100',
            'prix_original_ht' => 'required|numeric|min:0',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'notes' => 'nullable|string',
        ]);
        $data['prix_promo_ht'] = $data['prix_original_ht'] * (1 - $data['taux_remise_pct'] / 100);
        $data['statut'] = 'planifiee';
        $data['declenchement_auto'] = 0;
        $data['id_employe_validateur'] = $employe->id_employe;
        return response()->json(PromotionService::create($data), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $promo = PromotionService::findOrFail($id);
        $data = $request->validate([
            'taux_remise_pct' => 'sometimes|numeric|min:0|max:100',
            'date_debut' => 'sometimes|date',
            'date_fin' => 'sometimes|date',
            'statut' => 'sometimes|in:planifiee,active,expiree,annulee',
            'notes' => 'nullable|string',
        ]);
        if (isset($data['taux_remise_pct'])) {
            $data['prix_promo_ht'] = $promo->prix_original_ht * (1 - $data['taux_remise_pct'] / 100);
        }
        $promo->update($data);
        return response()->json($promo);
    }

    public function activer(int $id): JsonResponse
    {
        $promo = PromotionService::findOrFail($id);
        $promo->update(['statut' => 'active']);
        return response()->json($promo);
    }

    public function desactiver(int $id): JsonResponse
    {
        $promo = PromotionService::findOrFail($id);
        $promo->update(['statut' => 'annulee']);
        return response()->json($promo);
    }

    public function destroy(int $id): JsonResponse
    {
        PromotionService::findOrFail($id)->delete();
        return response()->json(['message' => 'Promotion supprimée']);
    }

    public function toggle(int $id): JsonResponse
    {
        $promo = PromotionService::findOrFail($id);
        $newStatut = $promo->statut === 'active' ? 'annulee' : 'active';
        $promo->update(['statut' => $newStatut]);
        return response()->json(['ok' => true, 'est_active' => $newStatut === 'active']);
    }
}
