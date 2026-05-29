<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogActivite extends Model
{
    public $timestamps = false;
    protected $table = 'logs_activite';
    protected $primaryKey = 'id_log';

    protected $fillable = [
        'user_type', 'user_id', 'action', 'description',
        'ip_address', 'user_agent', 'metadata', 'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public static function log(string $action, ?string $description = null, array $metadata = []): self
    {
        return static::create([
            'user_type' => auth('client')->check() ? 'client' : (auth('employe')->check() ? 'employe' : 'systeme'),
            'user_id' => auth('client')->id() ?? auth('employe')->id(),
            'action' => $action,
            'description' => $description,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }
}
