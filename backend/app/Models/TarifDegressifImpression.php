<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TarifDegressifImpression extends Model
{
    protected $table = 'tarifs_degressifs_impression';
    protected $primaryKey = 'id_tarif_degressif';
    public $timestamps = false;

    protected $fillable = ['id_service_impression', 'quantite_min', 'quantite_max', 'prix_unitaire_ht'];

    protected $casts = ['prix_unitaire_ht' => 'decimal:4'];

    public function service(): BelongsTo
    {
        return $this->belongsTo(ServiceImpression::class, 'id_service_impression', 'id_service_impression');
    }
}
