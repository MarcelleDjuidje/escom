<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Realisation extends Model
{
    public $timestamps = false;
    protected $table = 'realisations';
    protected $primaryKey = 'id_realisation';

    protected $fillable = [
        'id_client', 'id_employe', 'id_commande', 'titre', 'description',
        'image_principale', 'images_galerie', 'categorie',
        'statut_publication', 'visible_visiteurs', 'ordre_affichage',
        'publie_le', 'created_at',
    ];

    protected $casts = [
        'images_galerie' => 'array',
        'visible_visiteurs' => 'boolean',
        'publie_le' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function avis(): HasMany
    {
        return $this->hasMany(AvisClient::class, 'id_realisation', 'id_realisation');
    }
}
