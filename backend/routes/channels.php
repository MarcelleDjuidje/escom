<?php

use App\Models\Conversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat.{conversationId}', function ($user, int $conversationId) {
    $conversation = Conversation::find($conversationId);
    if (!$conversation) return false;

    if ($user instanceof \App\Models\Client) {
        return $conversation->id_client === $user->id_client;
    }
    if ($user instanceof \App\Models\Employe) {
        // Employé propriétaire OU admin/directeur
        return $conversation->id_employe === $user->id_employe
            || in_array($user->role, ['admin', 'directeur']);
    }
    return false;
});

Broadcast::channel('notifications.client.{id}', function ($user, int $id) {
    return $user instanceof \App\Models\Client && $user->id_client === $id;
});

Broadcast::channel('notifications.employe.{id}', function ($user, int $id) {
    return $user instanceof \App\Models\Employe && $user->id_employe === $id;
});
