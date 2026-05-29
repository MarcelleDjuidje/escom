<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Commande extends Model
{
    use HasFactory;

    protected $table = 'commandes';
    protected $primaryKey = 'id_commande';

    protected $fillable = [
        'id_devis', 'id_client', 'id_employe_responsable', 'numero_commande',
        'date_commande', 'statut', 'paiement_en_tranches', 'livraison_bloquee',
        'date_livraison_souhaitee', 'mode_livraison', 'total_ttc',
        'montant_paye', 'notes',
    ];

    protected $casts = [
        'date_commande' => 'datetime',
        'date_livraison_souhaitee' => 'date',
        'paiement_en_tranches' => 'boolean',
        'livraison_bloquee' => 'boolean',
        'total_ttc' => 'decimal:2',
        'montant_paye' => 'decimal:2',
        'montant_restant' => 'decimal:2',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }

    public function employe_responsable(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe_responsable', 'id_employe');
    }

    public function devis(): BelongsTo
    {
        return $this->belongsTo(Devis::class, 'id_devis', 'id_devis');
    }

    public function plan_paiement(): HasOne
    {
        return $this->hasOne(PlanPaiement::class, 'id_commande', 'id_commande');
    }

    public function projets(): HasMany
    {
        return $this->hasMany(Projet::class, 'id_commande', 'id_commande');
    }

    public function pieces_jointes(): HasMany
    {
        return $this->hasMany(PieceJointeCommande::class, 'id_commande', 'id_commande');
    }

    public function factures(): HasMany
    {
        return $this->hasMany(FactureTranche::class, 'id_commande', 'id_commande');
    }

    public function rappels(): HasMany
    {
        return $this->hasMany(RappelPaiement::class, 'id_commande', 'id_commande');
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'id_commande', 'id_commande');
    }

    public function alerte_deadline(): HasOne
    {
        return $this->hasOne(AlerteDeadline::class, 'id_commande', 'id_commande');
    }

    public static function nextNumber(): string
    {
        $year = date('Y');
        $count = static::whereYear('date_commande', $year)->count() + 1;
        return sprintf('CMD-%s-%04d', $year, $count);
    }
}
