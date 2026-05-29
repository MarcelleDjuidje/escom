<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class DemandeDevis extends Model
{
    protected $table = 'demandes_devis';
    protected $primaryKey = 'id_demande_devis';
    public $timestamps = true; // created_at + updated_at présents

    protected $fillable = [
        'numero_devis',
        'id_client',
        'id_employe_responsable',
        'type_service',
        'id_service_origine',
        'table_service_origine',
        'titre',
        'description_besoin',
        'budget_indicatif',
        'delai_souhaite',
        'fichiers_joints',
        'statut',
        'prix_propose_ht',
        'taux_tva',
        'prix_propose_ttc',
        'delai_propose_jours',
        'commentaire_admin',
        'conditions_particulieres',
        'id_commande_creee',
        'id_panier_cree',
        'valide_jusqu_au',
        'date_chiffrage',
        'date_acceptation',
        'date_refus',
        'raison_refus',
    ];

    protected $casts = [
        'budget_indicatif'    => 'decimal:2',
        'prix_propose_ht'     => 'decimal:2',
        'taux_tva'            => 'decimal:2',
        'prix_propose_ttc'    => 'decimal:2',
        'delai_propose_jours' => 'integer',
        'fichiers_joints'     => 'array',  // JSON <-> array auto
        'delai_souhaite'      => 'date',
        'valide_jusqu_au'     => 'date',
        'date_chiffrage'      => 'datetime',
        'date_acceptation'    => 'datetime',
        'date_refus'          => 'datetime',
        'created_at'          => 'datetime',
        'updated_at'          => 'datetime',
    ];

    // ---------------------------------------------------------------
    // CONSTANTES DE STATUT (évite les fautes de frappe)
    // ---------------------------------------------------------------
    const STATUT_EN_ATTENTE = 'en_attente_reponse';
    const STATUT_CHIFFRE    = 'chiffre';
    const STATUT_ACCEPTE    = 'accepte';
    const STATUT_REFUSE     = 'refuse';
    const STATUT_ANNULE     = 'annule';
    const STATUT_EXPIRE     = 'expire';

    const TVA_DEFAUT        = 19.25;
    const VALIDITE_JOURS    = 30;

    // ---------------------------------------------------------------
    // GÉNÉRATION DU NUMÉRO : DEV-2025-0001
    // ---------------------------------------------------------------
    public static function genererNumero(): string
    {
        $annee  = date('Y');
        $prefix = "DEV-{$annee}-";

        $dernier = self::where('numero_devis', 'like', $prefix . '%')
            ->orderByDesc('numero_devis')
            ->first();

        $sequence = 1;
        if ($dernier) {
            $dernierNum = (int) substr($dernier->numero_devis, strlen($prefix));
            $sequence   = $dernierNum + 1;
        }

        return $prefix . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    // ---------------------------------------------------------------
    // RELATIONS
    // ---------------------------------------------------------------
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }

    public function employeResponsable(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_employe_responsable', 'id_employe');
    }

    public function historique(): HasMany
    {
        return $this->hasMany(HistoriqueDevis::class, 'id_demande_devis', 'id_demande_devis')
            ->orderByDesc('created_at');
    }

    // ---------------------------------------------------------------
    // SCOPES (filtres réutilisables)
    // ---------------------------------------------------------------
    public function scopeEnAttente(Builder $q): Builder
    {
        return $q->where('statut', self::STATUT_EN_ATTENTE);
    }

    public function scopeChiffre(Builder $q): Builder
    {
        return $q->where('statut', self::STATUT_CHIFFRE);
    }

    public function scopeAccepte(Builder $q): Builder
    {
        return $q->where('statut', self::STATUT_ACCEPTE);
    }

    // Devis chiffrés dont la date de validité est dépassée
    public function scopeExpirable(Builder $q): Builder
    {
        return $q->where('statut', self::STATUT_CHIFFRE)
                 ->whereNotNull('valide_jusqu_au')
                 ->whereDate('valide_jusqu_au', '<', now()->toDateString());
    }

    // ---------------------------------------------------------------
    // MÉTHODES MÉTIER
    // ---------------------------------------------------------------

    // Calcule le TTC à partir du HT et de la TVA
    public function calculerTTC(): ?float
    {
        if ($this->prix_propose_ht === null) {
            return null;
        }
        $taux = (float) ($this->taux_tva ?? self::TVA_DEFAUT);
        return round((float) $this->prix_propose_ht * (1 + $taux / 100), 2);
    }

    // Le devis est-il expiré ?
    public function estExpire(): bool
    {
        if (!$this->valide_jusqu_au) {
            return false;
        }
        return $this->valide_jusqu_au->isPast()
            && $this->statut === self::STATUT_CHIFFRE;
    }

    // Le client peut-il accepter ce devis ?
    public function peutEtreAccepte(): bool
    {
        return $this->statut === self::STATUT_CHIFFRE && !$this->estExpire();
    }

    // L'admin peut-il chiffrer ce devis ?
    public function peutEtreChiffre(): bool
    {
        return in_array($this->statut, [
            self::STATUT_EN_ATTENTE,
            self::STATUT_CHIFFRE, // re-chiffrage / négociation
        ], true);
    }

    // Le client peut-il refuser/annuler ?
    public function peutEtreRefuse(): bool
    {
        return in_array($this->statut, [
            self::STATUT_EN_ATTENTE,
            self::STATUT_CHIFFRE,
        ], true);
    }
}