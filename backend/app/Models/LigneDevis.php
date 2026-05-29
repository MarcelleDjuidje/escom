<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LigneDevis extends Model
{
    public $timestamps = false;
    protected $table = 'lignes_devis';
    protected $primaryKey = 'id_ligne_devis';

    protected $fillable = [
        'id_devis', 'type_service', 'id_service_ref', 'designation',
        'quantite', 'prix_unitaire_ht', 'remise_ligne_pct',
        'total_ligne_ht', 'ordre',
    ];

    protected $casts = [
        'quantite' => 'decimal:2',
        'prix_unitaire_ht' => 'decimal:2',
        'remise_ligne_pct' => 'decimal:2',
        'total_ligne_ht' => 'decimal:2',
    ];

    public function devis(): BelongsTo
    {
        return $this->belongsTo(Devis::class, 'id_devis', 'id_devis');
    }
}
