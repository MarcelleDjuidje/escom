<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Employe;
use App\Models\LogActivite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Inscription client uniquement (les employés sont créés par l'admin).
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type_client' => 'required|in:particulier,entreprise',
            'nom_complet' => 'required|string|max:150',
            'raison_sociale' => 'nullable|string|max:200',
            'email' => 'required|email|unique:clients,email',
            'telephone' => 'required|string|max:25',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string|max:80',
            'secteur_activite' => 'nullable|string|max:100',
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $client = Client::create([
            ...$validator->validated(),
            'statut' => 'prospect',
        ]);

        $token = $client->createToken('client-token', ['client'])->plainTextToken;

        LogActivite::create([
            'user_type' => 'client',
            'user_id' => $client->id_client,
            'action' => 'register',
            'description' => 'Inscription nouveau client',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Inscription réussie',
            'user' => $client,
            'role' => 'client',
            'token' => $token,
        ], 201);
    }

    /**
     * Connexion unifiée (essaie client puis employé).
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // 1) Tenter en tant qu'employé
        $employe = Employe::where('email_pro', $request->email)->first();
        if ($employe && Hash::check($request->password, $employe->password)) {
            if (! $employe->actif) {
                return response()->json(['message' => 'Compte désactivé'], 403);
            }

            $token = $employe->createToken('employe-token', [$employe->role])->plainTextToken;

            LogActivite::create([
                'user_type' => 'employe',
                'user_id' => $employe->id_employe,
                'action' => 'login',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return response()->json([
                'message' => 'Connexion réussie',
                'user' => $employe,
                'role' => $employe->role,
                'is_staff' => true,
                'token' => $token,
            ]);
        }

        // 2) Tenter en tant que client
        $client = Client::where('email', $request->email)->first();
        if ($client && Hash::check($request->password, $client->password)) {
            $token = $client->createToken('client-token', ['client'])->plainTextToken;

            LogActivite::create([
                'user_type' => 'client',
                'user_id' => $client->id_client,
                'action' => 'login',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return response()->json([
                'message' => 'Connexion réussie',
                'user' => $client,
                'role' => 'client',
                'is_staff' => false,
                'token' => $token,
            ]);
        }

        return response()->json(['message' => 'Identifiants incorrects'], 401);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user instanceof Employe ? $user->role : 'client';
        return response()->json([
            'user' => $user,
            'role' => $role,
            'is_staff' => $user instanceof Employe,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnexion réussie']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);
        // Logique d'envoi du lien de reset (à implémenter avec mailer)
        return response()->json(['message' => 'Si ce compte existe, un email a été envoyé']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);
        // À implémenter
        return response()->json(['message' => 'Mot de passe réinitialisé']);
    }
}
