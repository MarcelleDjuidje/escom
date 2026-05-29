<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FactureTranche;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FactureController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = FactureTranche::with(['client', 'commande', 'tranche']);

        if ($user instanceof \App\Models\Client) {
            $query->where('id_client', $user->id_client);
        }

        if ($request->filled('statut')) {
            $query->where('statut_paiement', $request->statut);
        }

        return response()->json($query->orderByDesc('date_emission')->paginate(15));
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(FactureTranche::with(['client', 'commande', 'tranche'])->findOrFail($id));
    }

    public function generatePdf(int $id)
    {
        // Charger la facture avec ses relations (sans 'lignes' qui n'existe pas)
        $facture = FactureTranche::with([
            'client',
            'commande.client',
            'commande.devis.lignes',
            'tranche.plan',
        ])->findOrFail($id);

        $logoPath = public_path('assets/images/logo.png');
        $logoData = file_exists($logoPath) ? base64_encode(file_get_contents($logoPath)) : null;

        $pdf = Pdf::loadView('pdf.facture', [
            'facture' => $facture,
            'logoData' => $logoData,
            'agence' => [
                'nom' => 'ESCOM',
                'tagline' => 'La Communication à l\'ère du digital',
                'adresse' => 'Douala & Bafoussam, Cameroun',
                'email' => 'contact@escom.cm',
                'telephone' => '+237 6XX XXX XXX',
            ],
        ]);

        return $pdf->download("Facture-{$facture->numero_facture}.pdf");
    }
}