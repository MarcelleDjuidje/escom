<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Panier extends Model
{
    protected $table = 'paniers';
    protected $primaryKey = 'id_panier';

    protected $fillable = [
        'id_client',
        'numero_panier',
        'lignes',
        'total_ttc',
        'paiement_en_tranches',
        'tranches_prevues',
        'mode_livraison',
        'date_livraison_souhaitee',
        'notes',
        'statut',
        'expire_le',
        'id_commande_creee',
        'nb_tentatives_paiement',
        'derniere_tentative_at',
        'derniere_erreur_paiement',
        'id_devis_origine',
    ];

    protected $casts = [
        'lignes' => 'array',
        'tranches_prevues' => 'array',
        'paiement_en_tranches' => 'boolean',
        'total_ttc' => 'decimal:2',
        'expire_le' => 'datetime',
        'derniere_tentative_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Génère le prochain numéro de panier au format PAN-2026-001
     */
    public static function nextNumber(): string
    {
        $year = date('Y');
        $count = self::whereYear('created_at', $year)->count() + 1;
        return 'PAN-' . $year . '-' . str_pad((string)$count, 4, '0', STR_PAD_LEFT);
    }

    // Relations
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }

    public function commandeCreee(): BelongsTo
    {
        return $this->belongsTo(Commande::class, 'id_commande_creee', 'id_commande');
    }

    // Scopes utiles
    public function scopeEnAttente($query)
    {
        return $query->where('statut', 'en_attente_paiement');
    }

    public function scopeAbandonnes($query)
    {
        return $query->where('statut', 'abandonne_24h');
    }

    public function scopeConvertis($query)
    {
        return $query->where('statut', 'converti');
    }

    public function scopeExpires($query)
    {
        return $query->where('statut', 'en_attente_paiement')
                     ->where('expire_le', '<', now());
    }
}