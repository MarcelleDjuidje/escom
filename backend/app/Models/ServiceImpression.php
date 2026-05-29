<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceImpression extends Model
{
    use HasFactory;

    protected $table = 'services_impression';
    protected $primaryKey = 'id_service_impression';

    protected $fillable = [
        'id_categorie', 'type_support', 'libelle', 'description', 'image',
        'format', 'grammage_g_m2', 'finition', 'recto_verso',
        'quantite_min', 'prix_unitaire_ht', 'frais_calage_ht', 'actif',
        'id_employe_responsable',
    ];

    protected $casts = [
        'prix_unitaire_ht' => 'decimal:2',
        'frais_calage_ht' => 'decimal:2',
        'recto_verso' => 'boolean',
        'actif' => 'boolean',
    ];

    public function categorie(): BelongsTo
    {
        return $this->belongsTo(CategorieService::class, 'id_categorie', 'id_categorie');
    }

    public function tarifs_degressifs(): HasMany
    {
        return $this->hasMany(TarifDegressifImpression::class, 'id_service_impression', 'id_service_impression');
    }

    public function employeResponsable(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe_responsable', 'id_employe');
    }
}