<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromotionService extends Model
{
    public $timestamps = false;
    protected $table = 'promotions_service';
    protected $primaryKey = 'id_promotion';

    protected $fillable = [
        'type_service', 'id_service_ref', 'libelle_service',
        'taux_remise_pct', 'prix_original_ht', 'prix_promo_ht',
        'date_debut', 'date_fin', 'statut', 'declenchement_auto',
        'id_employe_validateur', 'notes', 'created_at',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'taux_remise_pct' => 'decimal:2',
        'prix_original_ht' => 'decimal:2',
        'prix_promo_ht' => 'decimal:2',
        'declenchement_auto' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function validateur(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe_validateur', 'id_employe');
    }
}
