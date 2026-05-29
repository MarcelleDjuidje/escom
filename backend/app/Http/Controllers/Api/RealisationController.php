<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Realisation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RealisationController extends Controller
{
    /** Public — listing avec filtres et infinite scroll */
    public function publicIndex(Request $request): JsonResponse
    {
        $query = Realisation::where('statut_publication', 'publie')
            ->where('visible_visiteurs', 1);

        if ($request->filled('categorie')) {
            $query->where('categorie', $request->categorie);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('titre', 'like', "%$s%")->orWhere('description', 'like', "%$s%"));
        }

        return response()->json($query->orderBy('ordre_affichage')->orderByDesc('publie_le')->paginate(12));
    }

    public function show(int $id): JsonResponse
    {
        $r = Realisation::where('id_realisation', $id)
            ->where('statut_publication', 'publie')
            ->firstOrFail();
        return response()->json($r);
    }

    /** Admin */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Realisation::query();
        if ($request->filled('statut')) $query->where('statut_publication', $request->statut);
        return response()->json($query->orderByDesc('publie_le')->paginate(20));
    }

    public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'titre' => 'required|string|max:200',
        'description' => 'nullable|string',
        'categorie' => 'required|string|max:50',
        'secteur_activite' => 'nullable|string|max:100',
        'est_publique' => 'nullable',
        'image_principale' => 'nullable|file|image|max:5120',
    ]);

    // Conversion booléenne tolérante (FormData envoie des strings)
    $validated['est_publique'] = filter_var(
        $request->input('est_publique', true),
        FILTER_VALIDATE_BOOLEAN
    );

    // Gestion de l'upload d'image
    if ($request->hasFile('image_principale')) {
        $path = $request->file('image_principale')->store('realisations', 'public');
        $validated['image_principale'] = $path;
    } else {
        $validated['image_principale'] = null;
    }

    // Champs auto-remplis
    $validated['ordre_affichage'] = \App\Models\Realisation::max('ordre_affichage') + 1;
    $validated['date_realisation'] = now()->toDateString();

    $realisation = \App\Models\Realisation::create($validated);

    return response()->json($realisation, 201);
}

    public function update(Request $request, int $id): JsonResponse
{
    $realisation = \App\Models\Realisation::findOrFail($id);

    $validated = $request->validate([
        'titre' => 'sometimes|required|string|max:200',
        'description' => 'nullable|string',
        'categorie' => 'sometimes|required|string|max:50',
        'secteur_activite' => 'nullable|string|max:100',
        'est_publique' => 'nullable',
        'image_principale' => 'nullable|file|image|max:5120',
    ]);

    if ($request->has('est_publique')) {
        $validated['est_publique'] = filter_var(
            $request->input('est_publique'),
            FILTER_VALIDATE_BOOLEAN
        );
    }

    if ($request->hasFile('image_principale')) {
        $path = $request->file('image_principale')->store('realisations', 'public');
        $validated['image_principale'] = $path;
    } else {
        unset($validated['image_principale']); // Ne pas écraser si pas de nouvelle image
    }

    $realisation->update($validated);
    return response()->json($realisation);
}

    public function destroy(int $id): JsonResponse
    {
        Realisation::findOrFail($id)->delete();
        return response()->json(['message' => 'Réalisation supprimée']);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate(['image' => 'required|image|max:10240']);
        $path = $request->file('image')->store('realisations', 'public');
        return response()->json(['url' => Storage::url($path), 'path' => $path]);
    }
}
