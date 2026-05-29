<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\NotificationInterne;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = NotificationInterne::query();

        if ($user instanceof Client) {
            $query->where('type_destinataire', 'client')->where('id_client', $user->id_client);
        } else {
            $query->where('type_destinataire', 'employe')->where('id_employe', $user->id_employe);
        }

        if ($request->boolean('non_lues')) {
            $query->where('lu', 0);
        }

        return response()->json($query->orderByDesc('created_at')->limit(50)->get());
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = NotificationInterne::where('lu', 0);
        if ($user instanceof Client) {
            $query->where('type_destinataire', 'client')->where('id_client', $user->id_client);
        } else {
            $query->where('type_destinataire', 'employe')->where('id_employe', $user->id_employe);
        }
        return response()->json(['count' => $query->count()]);
    }

    public function markAsRead(int $id): JsonResponse
    {
        $notif = NotificationInterne::findOrFail($id);
        $notif->update(['lu' => 1, 'lu_le' => now()]);
        return response()->json($notif);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = NotificationInterne::where('lu', 0);
        if ($user instanceof Client) {
            $query->where('type_destinataire', 'client')->where('id_client', $user->id_client);
        } else {
            $query->where('type_destinataire', 'employe')->where('id_employe', $user->id_employe);
        }
        $query->update(['lu' => 1, 'lu_le' => now()]);
        return response()->json(['message' => 'Toutes les notifications marquées comme lues']);
    }
}
