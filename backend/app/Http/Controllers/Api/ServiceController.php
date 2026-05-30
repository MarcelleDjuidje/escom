<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campagne;
use App\Models\CategorieService;
use App\Models\ServiceConception;
use App\Models\ServiceImpression;
use App\Models\ServiceSocialMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function categories(): JsonResponse
    {
        return response()->json(
            CategorieService::where('actif', 1)->orderBy('ordre')->get()
        );
    }

    public function conception(Request $request): JsonResponse
    {
        $query = ServiceConception::with('categorie')->where('actif', 1);
        if ($request->type) $query->where('type_conception', $request->type);
        return response()->json($query->orderBy('libelle')->get());
    }

    public function impression(Request $request): JsonResponse
    {
        $query = ServiceImpression::with(['categorie', 'tarifs_degressifs'])->where('actif', 1);
        if ($request->type_support) $query->where('type_support', $request->type_support);
        return response()->json($query->orderBy('libelle')->get());
    }

    public function social(Request $request): JsonResponse
    {
        $query = ServiceSocialMedia::with('categorie')->where('actif', 1);
        if ($request->plateforme) $query->where('plateforme', $request->plateforme);
        return response()->json($query->orderBy('libelle')->get());
    }

    public function campagnes(): JsonResponse
    {
        return response()->json(
            Campagne::with('categorie')->where('actif', 1)->orderBy('titre')->get()
        );
    }

    public function showCampagne(int $id): JsonResponse
    {
        return response()->json(Campagne::with('categorie')->findOrFail($id));
    }

    // ============================================
    // ADMIN — Création
    // ============================================

    public function storeConception(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_categorie' => 'required|exists:categories_services,id_categorie',
            'type_conception' => 'required|string',
            'libelle' => 'required|string|max:150',
            'description' => 'nullable|string',
            'prix_unitaire_ht' => 'required|numeric|min:0',
            'duree_livraison_jours' => 'nullable|integer',
            'nb_revisions_incluses' => 'nullable|integer',
            'image' => 'nullable|string',
            'id_employe_responsable' => 'nullable|exists:employes,id_employe',
        ]);

        $service = ServiceConception::create($validated);
        return response()->json($service, 201);
    }

    public function storeImpression(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_categorie' => 'required|exists:categories_services,id_categorie',
            'type_support' => 'required|string',
            'libelle' => 'required|string|max:150',
            'format' => 'nullable|string',
            'grammage_g_m2' => 'nullable|integer',
            'finition' => 'nullable|string',
            'recto_verso' => 'nullable|boolean',
            'quantite_min' => 'nullable|integer',
            'prix_unitaire_ht' => 'required|numeric|min:0',
            'frais_calage_ht' => 'nullable|numeric|min:0',
            'image' => 'nullable|string',
            'id_employe_responsable' => 'nullable|exists:employes,id_employe',
        ]);

        $service = ServiceImpression::create($validated);
        return response()->json($service, 201);
    }

    public function storeSocialMedia(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_categorie' => 'required|exists:categories_services,id_categorie',
            'plateforme' => 'nullable|string',
            'type_prestation' => 'nullable|string',
            'libelle' => 'required|string|max:150',
            'description' => 'nullable|string',
            'frequence' => 'nullable|string',
            'nb_publications_incluses' => 'nullable|integer',
            'budget_pub_inclus_ht' => 'nullable|numeric|min:0',
            'prix_ht' => 'required|numeric|min:0',
            'image' => 'nullable|string',
            'id_employe_responsable' => 'nullable|exists:employes,id_employe',
        ]);

        $service = ServiceSocialMedia::create($validated);
        return response()->json($service, 201);
    }

    public function storeCampagne(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_categorie' => 'required|exists:categories_services,id_categorie',
            'titre' => 'required|string|max:200',
            'description' => 'required|string',
            'type_campagne' => 'required|string',
            'objectifs_proposes' => 'nullable|array',
            'champs_formulaire' => 'nullable|array',
            'image_illustration' => 'nullable|string',
            'prix_indicatif_min' => 'nullable|numeric|min:0',
            'id_employe_responsable' => 'nullable|exists:employes,id_employe',
        ]);

        $campagne = Campagne::create($validated);
        return response()->json($campagne, 201);
    }

    // ============================================
    // ADMIN — Modification
    // ============================================

    public function updateConception(Request $request, int $id): JsonResponse
    {
        $service = ServiceConception::findOrFail($id);
        $service->update($request->all());
        return response()->json($service);
    }

    public function destroyConception(int $id): JsonResponse
    {
        ServiceConception::findOrFail($id)->delete();
        return response()->json(['message' => 'Service supprimé']);
    }

    public function updateImpression(Request $request, int $id): JsonResponse
    {
        $service = ServiceImpression::findOrFail($id);
        $service->update($request->all());
        return response()->json($service);
    }

    public function destroyImpression(int $id): JsonResponse
    {
        ServiceImpression::findOrFail($id)->delete();
        return response()->json(['message' => 'Service supprimé']);
    }

    public function updateSocialMedia(Request $request, int $id): JsonResponse
    {
        $service = ServiceSocialMedia::findOrFail($id);
        $service->update($request->all());
        return response()->json($service);
    }

    public function destroySocialMedia(int $id): JsonResponse
    {
        ServiceSocialMedia::findOrFail($id)->delete();
        return response()->json(['message' => 'Service supprimé']);
    }

    public function updateCampagne(Request $request, int $id): JsonResponse
    {
        $service = Campagne::findOrFail($id);
        $service->update($request->all());
        return response()->json($service);
    }

    public function destroyCampagne(int $id): JsonResponse
    {
        Campagne::findOrFail($id)->delete();
        return response()->json(['message' => 'Service supprimé']);
    }
}