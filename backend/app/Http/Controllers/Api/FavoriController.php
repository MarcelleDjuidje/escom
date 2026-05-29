<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favori;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $favoris = Favori::where('id_client', $user->id_client)->get();
        return response()->json($favoris);
    }

    public function toggle(Request $request): JsonResponse
    {
        $request->validate([
            'type_service' => 'required|in:CONCEPTION,IMPRESSION,SOCIAL,CAMPAGNE,REALISATION',
            'id_service_ref' => 'required|integer',
        ]);
        $user = $request->user();
        $existing = Favori::where('id_client', $user->id_client)
            ->where('type_service', $request->type_service)
            ->where('id_service_ref', $request->id_service_ref)
            ->first();
        if ($existing) {
            $existing->delete();
            return response()->json(['favori' => false]);
        }
        Favori::create([
            'id_client' => $user->id_client,
            'type_service' => $request->type_service,
            'id_service_ref' => $request->id_service_ref,
        ]);
        return response()->json(['favori' => true]);
    }
}
