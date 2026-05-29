<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class TranchePaiement extends Model
{
    protected $table = 'tranches_paiement';
    protected $primaryKey = 'id_tranche';
    public $timestamps = false;

    protected $fillable = [
        'id_plan_paiement', 'numero_tranche', 'libelle', 'montant_du_ttc',
        'date_echeance_prevue', 'date_paiement_effectif', 'montant_paye',
        'statut', 'mode_paiement', 'reference_transaction', 'id_employe_encaisseur',
        'created_at',
    ];

    protected $casts = [
        'date_echeance_prevue' => 'date',
        'date_paiement_effectif' => 'date',
        'montant_du_ttc' => 'decimal:2',
        'montant_paye' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(PlanPaiement::class, 'id_plan_paiement', 'id_plan_paiement');
    }

    public function facture(): HasOne
    {
        return $this->hasOne(FactureTranche::class, 'id_tranche', 'id_tranche');
    }

    public function encaisseur(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe_encaisseur', 'id_employe');
    }
}
