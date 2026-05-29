<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlanPaiement extends Model
{
    public $timestamps = false;
    protected $table = 'plans_paiement';
    protected $primaryKey = 'id_plan_paiement';

    protected $fillable = [
        'id_commande', 'nombre_tranches', 'montant_total_ttc',
        'montant_total_paye', 'statut_global', 'date_solde', 'id_employe_createur',
    ];

    protected $casts = [
        'montant_total_ttc' => 'decimal:2',
        'montant_total_paye' => 'decimal:2',
        'montant_restant_du' => 'decimal:2',
        'date_solde' => 'datetime',
    ];

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'id_commande', 'id_commande');
    }

    public function tranches(): HasMany
    {
        return $this->hasMany(TranchePaiement::class, 'id_plan_paiement', 'id_plan_paiement');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe_createur', 'id_employe');
    }
}
