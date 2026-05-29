<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BonAchat extends Model
{
    public $timestamps = false;
    protected $table = 'bons_achat';
    protected $primaryKey = 'id_bon_achat';

    protected $fillable = [
        'id_fournisseur', 'id_commande', 'numero_ba',
        'date_commande', 'date_livraison_prevue', 'montant_ht', 'statut',
    ];

    protected $casts = [
        'date_commande' => 'date',
        'date_livraison_prevue' => 'date',
        'montant_ht' => 'decimal:2',
    ];

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class, 'id_fournisseur', 'id_fournisseur');
    }
}
