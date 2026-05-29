<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn() => response()->json([
    'app' => 'ESCOM API',
    'version' => '1.0.0',
    'frontend' => env('FRONTEND_URL', 'http://localhost:3000'),
]));
