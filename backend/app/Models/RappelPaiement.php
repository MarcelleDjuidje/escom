<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RappelPaiement extends Model
{
    public $timestamps = false;
    protected $table = 'rappels_paiement';
    protected $primaryKey = 'id_rappel';

    protected $fillable = [
        'id_commande', 'id_client', 'semaine_numero',
        'date_rappel_prevu', 'date_rappel_envoye', 'statut', 'message',
    ];

    protected $casts = [
        'date_rappel_prevu' => 'datetime',
        'date_rappel_envoye' => 'datetime',
    ];

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'id_commande', 'id_commande');
    }
}
