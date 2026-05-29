<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistoriquePromotion extends Model
{
    public $timestamps = false;
    protected $table = 'historique_promotion';
    protected $primaryKey = 'id_historique_promo';

    protected $fillable = [
        'id_promotion', 'id_commande', 'id_client',
        'taux_applique', 'montant_remise_ht',
        'prix_avant', 'prix_apres', 'date_application',
    ];

    protected $casts = [
        'taux_applique' => 'decimal:2',
        'montant_remise_ht' => 'decimal:2',
        'prix_avant' => 'decimal:2',
        'prix_apres' => 'decimal:2',
        'date_application' => 'datetime',
    ];
}
