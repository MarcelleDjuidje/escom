<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublicationPlanifiee extends Model
{
    public $timestamps = false;
    protected $table = 'publications_planifiees';
    protected $primaryKey = 'id_publication';

    protected $fillable = [
        'id_abonnement', 'id_projet', 'plateforme',
        'date_planifiee', 'date_publiee', 'texte_post',
        'lien_visuel', 'statut', 'lien_post_publie',
    ];

    protected $casts = [
        'date_planifiee' => 'datetime',
        'date_publiee' => 'datetime',
    ];

    public function abonnement(): BelongsTo
    {
        return $this->belongsTo(Abonnement::class, 'id_abonnement', 'id_abonnement');
    }
}
