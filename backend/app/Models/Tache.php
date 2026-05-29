<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tache extends Model
{
    protected $table = 'taches';
    protected $primaryKey = 'id_tache';

    protected $fillable = [
        'id_projet', 'id_employe', 'titre', 'description', 'statut',
        'date_echeance', 'heures_estimees', 'heures_reelles', 'ordre',
    ];

    protected $casts = [
        'date_echeance' => 'date',
        'heures_estimees' => 'decimal:2',
        'heures_reelles' => 'decimal:2',
    ];

    public function projet(): BelongsTo
    {
        return $this->belongsTo(Projet::class, 'id_projet', 'id_projet');
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe', 'id_employe');
    }
}
