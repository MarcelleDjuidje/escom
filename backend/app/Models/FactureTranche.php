<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FactureTranche extends Model
{
    public $timestamps = false;
    protected $table = 'factures_tranche';
    protected $primaryKey = 'id_facture_tranche';

    protected $fillable = [
        'id_tranche', 'id_commande', 'id_client', 'numero_facture', 'type_facture',
        'date_emission', 'date_echeance', 'date_paiement_effectif', 'designation_prestation',
        'montant_ht', 'taux_tva', 'montant_tva', 'montant_ttc', 'statut_paiement',
        'numero_tranche_sur_total', 'rappel_total_commande', 'chemin_pdf', 'created_at',
    ];

    protected $casts = [
        'date_emission' => 'date',
        'date_echeance' => 'date',
        'date_paiement_effectif' => 'date',
        'montant_ht' => 'decimal:2',
        'montant_tva' => 'decimal:2',
        'montant_ttc' => 'decimal:2',
        'taux_tva' => 'decimal:2',
        'rappel_total_commande' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function tranche(): BelongsTo
    {
        return $this->belongsTo(TranchePaiement::class, 'id_tranche', 'id_tranche');
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'id_commande', 'id_commande');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }

    public static function nextNumber(string $tranche = '1'): string
    {
        $year = date('Y');
        $count = static::whereYear('created_at', $year)->count() + 1;
        return sprintf('FAC-%s-%04d-T%s', $year, $count, $tranche);
    }
}
