<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Commande;
use App\Models\Devis;
use App\Models\Employe;
use App\Models\Projet;
use App\Models\Realisation;
use App\Models\ServiceConception;
use App\Models\ServiceImpression;
use App\Models\ServiceSocialMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function global(Request $request): JsonResponse
    {
        $q = $request->get('q', '');
        if (strlen($q) < 2) {
            return response()->json(['results' => []]);
        }
        $user = $request->user();
        $like = "%$q%";
        $results = [];

        // Services (visible à tous)
        $results['services_conception'] = ServiceConception::where('libelle', 'like', $like)
            ->orWhere('description', 'like', $like)->limit(5)->get();
        $results['services_impression'] = ServiceImpression::where('libelle', 'like', $like)->limit(5)->get();
        $results['services_social'] = ServiceSocialMedia::where('libelle', 'like', $like)->limit(5)->get();
        $results['realisations'] = Realisation::where('statut_publication', 'publie')
            ->where(fn($qq) => $qq->where('titre', 'like', $like)->orWhere('description', 'like', $like))
            ->limit(5)->get();

        // Réservé authentifiés
        if ($user instanceof Client) {
            $results['mes_commandes'] = Commande::where('id_client', $user->id_client)
                ->where(fn($qq) => $qq->where('numero_commande', 'like', $like))
                ->limit(5)->get();
            $results['mes_devis'] = Devis::where('id_client', $user->id_client)
                ->where('numero_devis', 'like', $like)->limit(5)->get();
        } elseif ($user instanceof Employe) {
            $results['commandes'] = Commande::where('numero_commande', 'like', $like)
                ->orWhereHas('client', fn($qq) => $qq->where('nom_complet', 'like', $like))
                ->limit(5)->get();
            $results['clients'] = Client::where('nom_complet', 'like', $like)
                ->orWhere('email', 'like', $like)->orWhere('raison_sociale', 'like', $like)
                ->limit(5)->get();
            $results['projets'] = Projet::where('titre', 'like', $like)->limit(5)->get();
        }

        return response()->json(['query' => $q, 'results' => $results]);
    }
}
