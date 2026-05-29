<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message)
    {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.' . $this->message->id_conversation),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id_message' => $this->message->id_message,
            'id_conversation' => $this->message->id_conversation,
            'expediteur_type' => $this->message->expediteur_type,
            'id_expediteur_client' => $this->message->id_expediteur_client,
            'id_expediteur_employe' => $this->message->id_expediteur_employe,
            'contenu' => $this->message->contenu,
            'type_message' => $this->message->type_message,
            'fichier_url' => $this->message->fichier_url,
            'envoye_le' => $this->message->envoye_le,
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}
