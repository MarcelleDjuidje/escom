<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    public $timestamps = false;
    protected $table = 'messages';
    protected $primaryKey = 'id_message';

    protected $fillable = [
        'id_conversation', 'expediteur_type', 'id_expediteur_client',
        'id_expediteur_employe', 'contenu', 'type_message',
        'fichier_url', 'fichier_nom', 'fichier_taille',
        'statut_client', 'statut_employe', 'lu_par_admin',
        'reactions', 'envoye_le', 'lu_le',
    ];

    protected $casts = [
        'reactions' => 'array',
        'lu_par_admin' => 'boolean',
        'envoye_le' => 'datetime',
        'lu_le' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'id_conversation', 'id_conversation');
    }

    public function expediteur_client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_expediteur_client', 'id_client');
    }

    public function expediteur_employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_expediteur_employe', 'id_employe');
    }
}
