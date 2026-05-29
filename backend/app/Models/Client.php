<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Client extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'clients';
    protected $primaryKey = 'id_client';

    protected $fillable = [
        'type_client', 'nom_complet', 'raison_sociale', 'email',
        'telephone', 'adresse', 'ville', 'secteur_activite',
        'statut', 'avatar', 'password', 'id_commercial',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function getAuthIdentifierName(): string
    {
        return 'id_client';
    }

    // Relations
    public function commercial(): BelongsTo
    {
        return $this->belongsTo(Employe::class, 'id_commercial', 'id_employe');
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class, 'id_client', 'id_client');
    }

    public function devis(): HasMany
    {
        return $this->hasMany(Devis::class, 'id_client', 'id_client');
    }

    public function commandes(): HasMany
    {
        return $this->hasMany(Commande::class, 'id_client', 'id_client');
    }

    public function demandes_campagne(): HasMany
    {
        return $this->hasMany(DemandeCampagne::class, 'id_client', 'id_client');
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'id_client', 'id_client');
    }

    public function abonnements(): HasMany
    {
        return $this->hasMany(Abonnement::class, 'id_client', 'id_client');
    }

    public function avis(): HasMany
    {
        return $this->hasMany(AvisClient::class, 'id_client', 'id_client');
    }

    public function favoris(): HasMany
    {
        return $this->hasMany(Favori::class, 'id_client', 'id_client');
    }

    public function notifications_internes(): HasMany
    {
        return $this->hasMany(NotificationInterne::class, 'id_client', 'id_client');
    }
}
