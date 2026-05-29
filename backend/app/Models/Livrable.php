<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Livrable extends Model
{
    protected $table = 'livrables';
    protected $primaryKey = 'id_livrable';
    public $timestamps = false; // Vous utilisez date_depot manuellement

    protected $fillable = [
        'id_projet',
        'id_employe',
        'libelle',
        'description',
        'nom_fichier',
        'type_fichier',
        'chemin_stockage',
        'fichier_apercu_url',
        'taille_fichier',
        'version',
        'est_version_finale',
        'livraison_effectuee',
        'valide_client',
        'date_depot',
    ];

    protected $casts = [
        'est_version_finale' => 'boolean',
        'livraison_effectuee' => 'boolean',
        'valide_client' => 'boolean',
        'date_depot' => 'datetime',
    ];

    public function projet(): BelongsTo
    {
        return $this->belongsTo(Projet::class, 'id_projet', 'id_projet');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe', 'id_employe');
    }

    /**
     * Compatibilité avec les "with('apercu')" du code existant.
     */
    public function apercu()
    {
        return $this->hasOne(self::class, 'id_livrable', 'id_livrable');
    }

    public function isImage(): bool
    {
        return $this->type_fichier && str_starts_with($this->type_fichier, 'image/');
    }
}