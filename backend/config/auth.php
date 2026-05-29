<?php

return [
    'defaults' => [
        'guard' => env('AUTH_GUARD', 'employe'),
        'passwords' => 'employes',
    ],

    'guards' => [
        'employe' => [
            'driver' => 'sanctum',
            'provider' => 'employes',
        ],
        'client' => [
            'driver' => 'sanctum',
            'provider' => 'clients',
        ],
        'web' => [
            'driver' => 'session',
            'provider' => 'employes',
        ],
    ],

    'providers' => [
        'employes' => [
            'driver' => 'eloquent',
            'model' => App\Models\Employe::class,
        ],
        'clients' => [
            'driver' => 'eloquent',
            'model' => App\Models\Client::class,
        ],
    ],

    'passwords' => [
        'employes' => [
            'provider' => 'employes',
            'table' => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),
];
