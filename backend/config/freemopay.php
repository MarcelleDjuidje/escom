<?php

return [
    'base_url'     => env('FREEMOPAY_BASE_URL', 'https://api-v2.freemopay.com'),
    'app_key'      => env('FREEMOPAY_APP_KEY'),
    'secret_key'   => env('FREEMOPAY_SECRET_KEY'),
    'callback_url' => env('FREEMOPAY_CALLBACK_URL'),
];
