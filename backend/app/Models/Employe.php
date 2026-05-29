<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Employe extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'employes';
    protected $primaryKey = 'id_employe';

    protected $fillable = [
        'nom', 'prenom', 'email_pro', 'telephone',
        'role', 'date_embauche', 'actif', 'avatar', 'password',
    ];

    protected $hidden = ['password', 'remember_token', 'two_factor_secret'];

    protected $casts = [
        'date_embauche' => 'date',
        'actif' => 'boolean',
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Laravel needs this to map auth identifier
    public function getAuthIdentifierName(): string
    {
        return 'id_employe';
    }

    public function getEmailForPasswordReset(): string
    {
        return $this->email_pro;
    }

    // Relations
    public function clients(): HasMany
    {
        return $this->hasMany(Client::class, 'id_commercial', 'id_employe');
    }

    public function commandes(): HasMany
    {
        return $this->hasMany(Commande::class, 'id_employe_responsable', 'id_employe');
    }

    public function devis(): HasMany
    {
        return $this->hasMany(Devis::class, 'id_employe', 'id_employe');
    }

    public function projets(): HasMany
    {
        return $this->hasMany(Projet::class, 'id_chef_projet', 'id_employe');
    }

    public function taches(): HasMany
    {
        return $this->hasMany(Tache::class, 'id_employe', 'id_employe');
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'id_employe', 'id_employe');
    }

    public function notifications_internes(): HasMany
    {
        return $this->hasMany(NotificationInterne::class, 'id_employe', 'id_employe');
    }

    // Helpers
    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'directeur']);
    }

    public function fullName(): string
    {
        return "{$this->prenom} {$this->nom}";
    }
}
