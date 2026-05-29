<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    protected $table = 'conversations';
    protected $primaryKey = 'id_conversation';

    protected $fillable = [
        'id_client', 'id_employe', 'id_commande', 'id_demande',
        'sujet', 'statut', 'initiee_par', 'visible_admin',
        'nb_messages', 'nb_non_lus_client', 'nb_non_lus_employe',
        'dernier_message_at',
    ];

    protected $casts = [
        'visible_admin' => 'boolean',
        'dernier_message_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe', 'id_employe');
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'id_commande', 'id_commande');
    }

    public function demande(): BelongsTo
    {
        return $this->belongsTo(DemandeCampagne::class, 'id_demande', 'id_demande');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'id_conversation', 'id_conversation')
                    ->orderBy('envoye_le', 'asc');
    }
}
