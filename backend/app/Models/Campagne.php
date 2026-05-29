<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campagne extends Model
{
    use HasFactory;

    protected $table = 'campagnes';
    protected $primaryKey = 'id_campagne';

    protected $fillable = [
        'id_categorie', 'titre', 'description', 'type_campagne',
        'objectifs_proposes', 'champs_formulaire', 'image_illustration',
        'prix_indicatif_min', 'actif',
        'id_employe_responsable',
    ];

    protected $casts = [
        'objectifs_proposes' => 'array',
        'champs_formulaire' => 'array',
        'prix_indicatif_min' => 'decimal:2',
        'actif' => 'boolean',
    ];

    public function categorie(): BelongsTo
    {
        return $this->belongsTo(CategorieService::class, 'id_categorie', 'id_categorie');
    }

    public function demandes(): HasMany
    {
        return $this->hasMany(DemandeCampagne::class, 'id_campagne', 'id_campagne');
    }

    public function employeResponsable(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe_responsable', 'id_employe');
    }
}