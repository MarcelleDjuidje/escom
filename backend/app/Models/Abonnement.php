<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Abonnement extends Model
{
    public $timestamps = false;
    protected $table = 'abonnements';
    protected $primaryKey = 'id_abonnement';

    protected $fillable = [
        'id_client', 'id_service_social', 'date_debut', 'date_fin',
        'frequence_facturation', 'montant_ht', 'statut',
        'prochaine_facturation', 'renouvellement_auto',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'prochaine_facturation' => 'date',
        'montant_ht' => 'decimal:2',
        'renouvellement_auto' => 'boolean',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(ServiceSocialMedia::class, 'id_service_social', 'id_service_social');
    }

    public function publications(): HasMany
    {
        return $this->hasMany(PublicationPlanifiee::class, 'id_abonnement', 'id_abonnement');
    }
}
