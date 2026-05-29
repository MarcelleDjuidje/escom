<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contact extends Model
{
    protected $table = 'contacts';
    protected $primaryKey = 'id_contact';

    protected $fillable = [
        'id_client', 'nom', 'prenom', 'poste', 'email', 'telephone', 'est_principal',
    ];

    protected $casts = ['est_principal' => 'boolean'];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }
}
