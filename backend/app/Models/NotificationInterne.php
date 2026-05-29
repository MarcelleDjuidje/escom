<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationInterne extends Model
{
    public $timestamps = false;
    protected $table = 'notifications_internes';
    protected $primaryKey = 'id_notification';

    protected $fillable = [
        'type_destinataire', 'id_client', 'id_employe', 'declencheur',
        'titre', 'contenu', 'url_action', 'lu', 'lu_le',
        'id_commande', 'id_conversation', 'id_demande', 'created_at',
    ];

    protected $casts = [
        'lu' => 'boolean',
        'lu_le' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe', 'id_employe');
    }
}
