<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceConception extends Model
{
    use HasFactory;

    protected $table = 'services_conception';
    protected $primaryKey = 'id_service_conception';

    protected $fillable = [
        'id_categorie', 'type_conception', 'libelle', 'description',
        'image', 'prix_unitaire_ht', 'duree_livraison_jours',
        'nb_revisions_incluses', 'prix_revision_sup_ht', 'actif',
        'id_employe_responsable',
    ];

    protected $casts = [
        'prix_unitaire_ht' => 'decimal:2',
        'prix_revision_sup_ht' => 'decimal:2',
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