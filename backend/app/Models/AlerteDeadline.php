<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlerteDeadline extends Model
{
    public $timestamps = false;
    protected $table = 'alertes_deadline';
    protected $primaryKey = 'id_alerte';

    protected $fillable = [
        'id_commande', 'id_employe', 'id_admin',
        'date_livraison_souhaitee', 'statut_alerte',
        'dernier_envoi_at', 'prochain_envoi_at',
        'nb_alertes_envoyees', 'actif',
    ];

    protected $casts = [
        'date_livraison_souhaitee' => 'date',
        'dernier_envoi_at' => 'datetime',
        'prochain_envoi_at' => 'datetime',
        'actif' => 'boolean',
    ];

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'id_commande', 'id_commande');
    }
}
