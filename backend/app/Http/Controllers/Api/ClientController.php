<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Client::with('commercial');
        if ($request->filled('statut')) $query->where('statut', $request->statut);
        if ($request->filled('type')) $query->where('type_client', $request->type);
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('nom_complet', 'like', "%$s%")
                ->orWhere('email', 'like', "%$s%")
                ->orWhere('raison_sociale', 'like', "%$s%"));
        }
        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(Client::with('commercial', 'contacts')->findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type_client' => 'required|in:particulier,entreprise',
            'nom_complet' => 'required|string|max:150',
            'raison_sociale' => 'nullable|string|max:200',
            'email' => 'required|email|unique:clients,email',
            'telephone' => 'required|string|max:25',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string|max:80',
            'secteur_activite' => 'nullable|string|max:100',
            'id_commercial' => 'nullable|exists:employes,id_employe',
            'password' => 'required|string|min:8',
        ]);
        $data['password'] = Hash::make($data['password']);
        $data['statut'] = 'actif';
        return response()->json(Client::create($data), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $client = Client::findOrFail($id);
        $data = $request->validate([
            'nom_complet' => 'sometimes|string|max:150',
            'raison_sociale' => 'nullable|string|max:200',
            'email' => 'sometimes|email|unique:clients,email,' . $id . ',id_client',
            'telephone' => 'sometimes|string|max:25',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string|max:80',
            'secteur_activite' => 'nullable|string|max:100',
            'statut' => 'sometimes|in:prospect,actif,archive',
            'id_commercial' => 'nullable|exists:employes,id_employe',
        ]);
        $client->update($data);
        return response()->json($client);
    }

    public function destroy(int $id): JsonResponse
    {
        $client = Client::findOrFail($id);
        $client->update(['statut' => 'archive']);
        return response()->json(['message' => 'Client archivé']);
    }
}
