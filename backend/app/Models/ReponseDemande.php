<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReponseDemande extends Model
{
    public $timestamps = false;
    protected $table = 'reponses_demande';
    protected $primaryKey = 'id_reponse';

    protected $fillable = [
        'id_demande', 'id_employe', 'contenu', 'prix_propose',
        'delai_realisation', 'fichiers_joints', 'est_devis_final', 'created_at',
    ];

    protected $casts = [
        'fichiers_joints' => 'array',
        'prix_propose' => 'decimal:2',
        'est_devis_final' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function demande(): BelongsTo
    {
        return $this->belongsTo(DemandeCampagne::class, 'id_demande', 'id_demande');
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe', 'id_employe');
    }
}
