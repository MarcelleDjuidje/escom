<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CategorieService extends Model
{
    use HasFactory;

    protected $table = 'categories_services';
    protected $primaryKey = 'id_categorie';

    protected $fillable = ['code', 'libelle', 'description', 'icone', 'ordre', 'actif'];

    protected $casts = ['actif' => 'boolean'];

    public function services_conception(): HasMany
    {
        return $this->hasMany(ServiceConception::class, 'id_categorie', 'id_categorie');
    }

    public function services_impression(): HasMany
    {
        return $this->hasMany(ServiceImpression::class, 'id_categorie', 'id_categorie');
    }

    public function services_social(): HasMany
    {
        return $this->hasMany(ServiceSocialMedia::class, 'id_categorie', 'id_categorie');
    }

    public function campagnes(): HasMany
    {
        return $this->hasMany(Campagne::class, 'id_categorie', 'id_categorie');
    }
}
