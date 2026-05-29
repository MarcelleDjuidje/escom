<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PieceJointeCommande extends Model
{
    public $timestamps = false;
    protected $table = 'pieces_jointes_commande';
    protected $primaryKey = 'id_piece';

    protected $fillable = [
        'id_commande', 'id_client', 'nom_fichier', 'type_fichier',
        'chemin_stockage', 'taille_octets', 'description_client', 'uploaded_at',
    ];

    protected $casts = ['uploaded_at' => 'datetime'];

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'id_commande', 'id_commande');
    }
}
