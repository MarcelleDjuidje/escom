<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriqueDevis extends Model
{
    protected $table = 'historique_devis';
    protected $primaryKey = 'id_historique';

    // Pas de updated_at : on garde uniquement created_at
    public $timestamps = false;

    protected $fillable = [
        'id_demande_devis',
        'action',
        'ancien_statut',
        'nouveau_statut',
        'acteur_type',
        'acteur_id',
        'acteur_nom',
        'details',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'details'    => 'array',   // JSON <-> array auto
        'created_at' => 'datetime',
    ];

    // Actions possibles (constantes)
    const ACTION_CREATION     = 'creation';
    const ACTION_CHIFFRAGE    = 'chiffrage';
    const ACTION_ACCEPTATION  = 'acceptation';
    const ACTION_REFUS        = 'refus';
    const ACTION_ANNULATION   = 'annulation';
    const ACTION_EXPIRATION   = 'expiration';
    const ACTION_MODIFICATION = 'modification';

    public function demandeDevis(): BelongsTo
    {
        return $this->belongsTo(DemandeDevis::class, 'id_demande_devis', 'id_demande_devis');
    }
}