<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TacheController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Tache::with('employe', 'projet');
        if ($request->filled('id_projet')) $query->where('id_projet', $request->id_projet);
        if ($request->filled('statut')) $query->where('statut', $request->statut);
        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_projet' => 'required|exists:projets,id_projet',
            'id_employe' => 'required|exists:employes,id_employe',
            'titre' => 'required|string|max:200',
            'description' => 'nullable|string',
            'date_echeance' => 'nullable|date',
            'heures_estimees' => 'nullable|numeric',
        ]);
        $data['statut'] = 'a_faire';
        return response()->json(Tache::create($data), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tache = Tache::findOrFail($id);
        $data = $request->validate([
            'titre' => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'statut' => 'sometimes|in:a_faire,en_cours,terminee',
            'date_echeance' => 'nullable|date',
            'heures_estimees' => 'nullable|numeric',
            'heures_reelles' => 'nullable|numeric',
            'id_employe' => 'sometimes|exists:employes,id_employe',
        ]);
        $tache->update($data);
        return response()->json($tache);
    }

    public function destroy(int $id): JsonResponse
    {
        Tache::findOrFail($id)->delete();
        return response()->json(['message' => 'Tâche supprimée']);
    }
}
