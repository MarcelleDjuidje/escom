<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fournisseur extends Model
{
    public $timestamps = false;
    protected $table = 'fournisseurs';
    protected $primaryKey = 'id_fournisseur';

    protected $fillable = [
        'nom', 'type', 'contact_nom', 'email', 'telephone',
        'delai_livraison_moyen_jours', 'note_qualite',
    ];

    protected $casts = ['note_qualite' => 'decimal:1'];
}
