<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DemandeCampagne extends Model
{
    public $timestamps = false;
    protected $table = 'demandes_campagne';
    protected $primaryKey = 'id_demande';

    protected $fillable = [
        'id_campagne', 'id_client', 'numero_demande', 'statut',
        'objectif_principal', 'budget_indicatif', 'duree_souhaitee',
        'cible', 'zone_geographique', 'plateformes_souhaitees',
        'description_projet', 'fichiers_joints', 'reponse_escom',
        'prix_propose', 'id_employe_reponse', 'date_demande',
        'date_reponse', 'id_commande',
    ];

    protected $casts = [
        'plateformes_souhaitees' => 'array',
        'fichiers_joints' => 'array',
        'budget_indicatif' => 'decimal:2',
        'prix_propose' => 'decimal:2',
        'date_demande' => 'datetime',
        'date_reponse' => 'datetime',
    ];

    public function campagne(): BelongsTo
    {
        return $this->belongsTo(Campagne::class, 'id_campagne', 'id_campagne');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }

    public function employe_reponse(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe_reponse', 'id_employe');
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'id_commande', 'id_commande');
    }

    public function reponses(): HasMany
    {
        return $this->hasMany(ReponseDemande::class, 'id_demande', 'id_demande');
    }

    public static function nextNumber(): string
    {
        $year = date('Y');
        $count = static::whereYear('date_demande', $year)->count() + 1;
        return sprintf('DEM-%s-%04d', $year, $count);
    }
}
