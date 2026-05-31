<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FreemopayService
{
    private string $baseUrl;
    private string $appKey;
    private string $secretKey;

    public function __construct()
    {
        $this->baseUrl  = rtrim(config('freemopay.base_url'), '/');
        $this->appKey   = config('freemopay.app_key');
        $this->secretKey = config('freemopay.secret_key');
    }

    /**
     * Initier une collecte Mobile Money (le client paie le marchand).
     *
     * @param  string $phone      Numéro avec indicatif pays (ex: 237670000000)
     * @param  float  $amount     Montant en XAF (entier)
     * @param  string $externalId Identifiant unique côté marchand
     * @return array{reference: string, status: string}
     */
    public function initierCollecte(string $phone, float $amount, string $externalId): array
    {
        $response = Http::withBasicAuth($this->appKey, $this->secretKey)
            ->timeout(30)
            ->post("{$this->baseUrl}/api/v2/payment", [
                'payer'      => $phone,
                'amount'     => (int) $amount,
                'externalId' => $externalId,
                'callback'   => config('freemopay.callback_url'),
            ]);

        Log::info('Freemopay initierCollecte', [
            'externalId' => $externalId,
            'phone'      => $phone,
            'amount'     => $amount,
            'http_status' => $response->status(),
            'response'   => $response->json(),
        ]);

        if (!$response->successful()) {
            $msg = $response->json('message') ?? $response->body();
            if (is_array($msg)) $msg = implode(', ', $msg);
            throw new \RuntimeException('Freemopay: erreur ' . $response->status() . ' — ' . $msg);
        }

        return $response->json();
    }

    /**
     * Récupérer le statut d'une transaction par sa référence.
     *
     * @return array{reference: string, merchandRef: string, amount: int, status: string, reason?: string}
     */
    public function getStatut(string $reference): array
    {
        $response = Http::withBasicAuth($this->appKey, $this->secretKey)
            ->timeout(15)
            ->get("{$this->baseUrl}/api/v2/payment/{$reference}");

        if (!$response->successful()) {
            $msg = $response->json('message') ?? $response->body();
            if (is_array($msg)) $msg = implode(', ', $msg);
            throw new \RuntimeException('Freemopay statut: erreur ' . $response->status() . ' — ' . $msg);
        }

        return $response->json();
    }
}
