<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Employe;
use App\Models\LogActivite;
use App\Models\Projet;
use App\Models\Tache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Projet::with(['commande.client', 'chefProjet', 'taches']);

        if ($user instanceof Client) {
            $query->whereHas('commande', fn($q) => $q->where('id_client', $user->id_client));
        } elseif ($user instanceof Employe && !$user->isAdmin()) {
            $query->where('id_chef_projet', $user->id_employe);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('priorite')) {
            $query->where('priorite', $request->priorite);
        }

        return response()->json($query->orderByDesc('date_echeance')->get());
    }

    public function kanban(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Projet::with(['commande.client', 'chefProjet']);

        if ($user instanceof Employe && !$user->isAdmin()) {
            $query->where('id_chef_projet', $user->id_employe);
        }

        $projets = $query->get();
        $kanban = [
            'en_attente' => [],
            'en_cours' => [],
            'revision' => [],
            'valide' => [],
            'livre' => [],
        ];
        foreach ($projets as $p) {
            $kanban[$p->statut][] = $p;
        }

        return response()->json($kanban);
    }

    public function show(int $id): JsonResponse
    {
        $projet = Projet::with(['commande.client', 'chefProjet', 'taches.employe', 'livrables'])
            ->findOrFail($id);
        return response()->json($projet);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id_commande' => 'required|exists:commandes,id_commande',
            'id_chef_projet' => 'required|exists:employes,id_employe',
            'titre' => 'required|string|max:200',
            'description' => 'nullable|string',
            'date_debut' => 'nullable|date',
            'date_echeance' => 'nullable|date',
            'priorite' => 'nullable|in:basse,normale,haute,urgente',
            'notes' => 'nullable|string',
        ]);
        $data['statut'] = 'en_attente';
        $projet = Projet::create($data);
        return response()->json($projet, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $projet = Projet::findOrFail($id);
        $data = $request->validate([
            'titre' => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'date_debut' => 'nullable|date',
            'date_echeance' => 'nullable|date',
            'statut' => 'sometimes|in:en_attente,en_cours,revision,valide,livre',
            'priorite' => 'sometimes|in:basse,normale,haute,urgente',
            'notes' => 'nullable|string',
            'id_chef_projet' => 'sometimes|exists:employes,id_employe',
        ]);
        $projet->update($data);
        if (isset($data['statut'])) {
            LogActivite::log('projet_statut', 'projet', $projet->id_projet, "Statut → {$data['statut']}");
        }
        return response()->json($projet);
    }

    public function deplacerKanban(Request $request, int $id): JsonResponse
    {
        $request->validate(['statut' => 'required|in:en_attente,en_cours,revision,valide,livre']);
        $projet = Projet::findOrFail($id);
        $projet->update(['statut' => $request->statut]);
        return response()->json($projet);
    }
}
