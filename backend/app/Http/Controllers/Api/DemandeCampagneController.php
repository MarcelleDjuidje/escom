<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\DemandeCampagne;
use App\Models\Employe;
use App\Models\LogActivite;
use App\Models\ReponseDemande;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DemandeCampagneController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = DemandeCampagne::with(['campagne', 'client', 'employeReponse', 'reponses']);

        if ($user instanceof Client) {
            $query->where('id_client', $user->id_client);
        } elseif ($user instanceof Employe && !$user->isAdmin()) {
            $query->where(function ($q) use ($user) {
                $q->where('id_employe_reponse', $user->id_employe)
                  ->orWhereNull('id_employe_reponse');
            });
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->orderByDesc('date_demande')->paginate(15));
    }

    public function show(int $id): JsonResponse
    {
        $demande = DemandeCampagne::with(['campagne', 'client', 'employeReponse', 'reponses.employe'])
            ->findOrFail($id);
        return response()->json($demande);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'id_campagne' => 'required|exists:campagnes,id_campagne',
            'objectif_principal' => 'required|string|max:200',
            'budget_indicatif' => 'nullable|numeric|min:0',
            'duree_souhaitee' => 'nullable|string|max:100',
            'cible' => 'nullable|string',
            'zone_geographique' => 'nullable|string|max:200',
            'plateformes_souhaitees' => 'nullable|array',
            'description_projet' => 'required|string',
            'fichiers_joints' => 'nullable|array',
        ]);

        $data['numero_demande'] = DemandeCampagne::nextNumber();
        $data['id_client'] = $user->id_client;
        $data['statut'] = 'en_attente';

        $demande = DemandeCampagne::create($data);
        LogActivite::log('demande_campagne_creation', 'demande_campagne', $demande->id_demande,
            "Demande {$demande->numero_demande} créée");

        return response()->json($demande->load('campagne'), 201);
    }

    public function repondre(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'contenu' => 'required|string',
            'prix_propose' => 'nullable|numeric|min:0',
            'delai_realisation' => 'nullable|string|max:100',
            'fichiers_joints' => 'nullable|array',
            'est_devis_final' => 'nullable|boolean',
        ]);

        $employe = $request->user();
        $demande = DemandeCampagne::findOrFail($id);

        $reponse = ReponseDemande::create([
            'id_demande' => $demande->id_demande,
            'id_employe' => $employe->id_employe,
            'contenu' => $request->contenu,
            'prix_propose' => $request->prix_propose,
            'delai_realisation' => $request->delai_realisation,
            'fichiers_joints' => $request->fichiers_joints,
            'est_devis_final' => $request->boolean('est_devis_final'),
        ]);

        $demande->update([
            'statut' => 'devis_envoye',
            'reponse_escom' => $request->contenu,
            'prix_propose' => $request->prix_propose,
            'id_employe_reponse' => $employe->id_employe,
            'date_reponse' => now(),
        ]);

        LogActivite::log('demande_reponse', 'demande_campagne', $demande->id_demande, 'Réponse envoyée');

        return response()->json($reponse, 201);
    }

    public function changerStatut(Request $request, int $id): JsonResponse
    {
        $request->validate(['statut' => 'required|in:en_attente,en_etude,devis_envoye,acceptee,refusee,annulee']);
        $demande = DemandeCampagne::findOrFail($id);
        $demande->update(['statut' => $request->statut]);
        return response()->json($demande);
    }
}
