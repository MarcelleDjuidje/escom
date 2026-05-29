<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        // Si Client, role spécial 'client'
        if ($user instanceof \App\Models\Client) {
            return in_array('client', $roles) ? $next($request)
                : response()->json(['message' => 'Accès refusé'], 403);
        }

        // Employé
        if ($user instanceof \App\Models\Employe) {
            // admin et directeur ont toujours accès
            if (in_array($user->role, ['admin', 'directeur'])) {
                return $next($request);
            }
            return in_array($user->role, $roles) ? $next($request)
                : response()->json(['message' => 'Accès refusé'], 403);
        }

        return response()->json(['message' => 'Accès refusé'], 403);
    }
}
