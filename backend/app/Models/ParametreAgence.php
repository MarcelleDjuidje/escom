<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParametreAgence extends Model
{
    protected $table = 'parametres_agence';
    protected $primaryKey = 'id_parametre';

    protected $fillable = ['cle', 'valeur', 'description'];

    public static function get(string $key, ?string $default = null): ?string
    {
        return static::where('cle', $key)->value('valeur') ?? $default;
    }

    public static function set(string $key, string $value): void
    {
        static::updateOrCreate(['cle' => $key], ['valeur' => $value]);
    }
}
