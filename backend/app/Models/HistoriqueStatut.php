<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriqueStatut extends Model
{
    public $timestamps = false;
    protected $table = 'historique_statut';
    protected $primaryKey = 'id_historique';

    protected $fillable = [
        'entite_type', 'entite_id', 'ancien_statut', 'nouveau_statut',
        'id_employe', 'date_changement', 'commentaire',
    ];

    protected $casts = ['date_changement' => 'datetime'];

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe', 'id_employe');
    }
}
