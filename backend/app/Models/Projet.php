<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Projet extends Model
{
    protected $table = 'projets';
    protected $primaryKey = 'id_projet';

    protected $fillable = [
        'id_commande', 'id_chef_projet', 'titre', 'description',
        'date_debut', 'date_echeance', 'statut', 'livraison_autorisee',
        'priorite', 'notes',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_echeance' => 'date',
        'livraison_autorisee' => 'boolean',
    ];

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'id_commande', 'id_commande');
    }

    public function chef_projet(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_chef_projet', 'id_employe');
    }

    public function taches(): HasMany
    {
        return $this->hasMany(Tache::class, 'id_projet', 'id_projet');
    }

    public function livrables(): HasMany
    {
        return $this->hasMany(Livrable::class, 'id_projet', 'id_projet');
    }
}
