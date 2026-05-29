<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AvisClient extends Model
{
    public $timestamps = false;
    protected $table = 'avis_clients';
    protected $primaryKey = 'id_avis';

    protected $fillable = [
        'id_client',
        'id_realisation',
        'id_commande',
        'note',
        'commentaire',
        'reponse_admin',
        'statut',
        'id_employe_valideur',
        'valide_le',
        'created_at',
    ];

    protected $casts = [
        'valide_le' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }

    public function realisation(): BelongsTo
    {
        return $this->belongsTo(Realisation::class, 'id_realisation', 'id_realisation');
    }

    public function commande(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'id_commande', 'id_commande');
    }

    public function employeValideur(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe_valideur', 'id_employe');
    }
}