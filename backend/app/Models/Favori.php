<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Favori extends Model
{
    public $timestamps = false;
    protected $table = 'favoris';
    protected $primaryKey = 'id_favori';

    protected $fillable = ['id_client', 'id_realisation', 'created_at'];
    protected $casts = ['created_at' => 'datetime'];
}
