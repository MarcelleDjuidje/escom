<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApercuLivrable extends Model
{
    public $timestamps = false;
    protected $table = 'apercus_livrable';
    protected $primaryKey = 'id_apercu';

    protected $fillable = [
        'id_livrable', 'id_commande', 'chemin_watermark',
        'chemin_basse_resolution', 'telechargement_autorise',
        'capture_bloquee', 'token_acces', 'expire_le', 'created_at',
    ];

    protected $casts = [
        'telechargement_autorise' => 'boolean',
        'capture_bloquee' => 'boolean',
        'expire_le' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function livrable(): BelongsTo
    {
        return $this->belongsTo(Livrable::class, 'id_livrable', 'id_livrable');
    }
}
