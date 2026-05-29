<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Devis extends Model
{
    use HasFactory;

    protected $table = 'devis';
    protected $primaryKey = 'id_devis';

    protected $fillable = [
        'id_client', 'id_employe', 'numero_devis', 'date_creation',
        'date_validite', 'statut', 'sous_total_ht', 'remise_pct',
        'taux_tva', 'total_ttc', 'notes_internes',
    ];

    protected $casts = [
        'date_creation' => 'datetime',
        'date_validite' => 'date',
        'sous_total_ht' => 'decimal:2',
        'remise_pct' => 'decimal:2',
        'taux_tva' => 'decimal:2',
        'total_ttc' => 'decimal:2',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe', 'id_employe');
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(LigneDevis::class, 'id_devis', 'id_devis');
    }

    public function commande(): HasOne
    {
        return $this->hasOne(Commande::class, 'id_devis', 'id_devis');
    }

    public static function nextNumber(): string
    {
        $year = date('Y');
        $count = static::whereYear('date_creation', $year)->count() + 1;
        return sprintf('DEV-%s-%04d', $year, $count);
    }
}
