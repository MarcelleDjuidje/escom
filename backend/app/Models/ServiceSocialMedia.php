<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceSocialMedia extends Model
{
    use HasFactory;

    protected $table = 'services_social_media';
    protected $primaryKey = 'id_service_social';

    protected $fillable = [
        'id_categorie', 'plateforme', 'type_prestation', 'libelle', 'description', 'image',
        'frequence', 'nb_publications_incluses', 'budget_pub_inclus_ht', 'prix_ht', 'actif',
        'id_employe_responsable',
    ];

    protected $casts = [
        'prix_ht' => 'decimal:2',
        'budget_pub_inclus_ht' => 'decimal:2',
        'actif' => 'boolean',
    ];

    public function categorie(): BelongsTo
    {
        return $this->belongsTo(CategorieService::class, 'id_categorie', 'id_categorie');
    }

    public function employeResponsable(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe_responsable', 'id_employe');
    }
}