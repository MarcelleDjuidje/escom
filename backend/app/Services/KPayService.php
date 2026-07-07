<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service d'integration KPay (https://admin.kpay.site)
 * Gere MTN MoMo et Orange Money au Cameroun via USSD.
 *
 * Providers Cameroun: MTN_MOMO_CMR, ORANGE_CMR
 */
class KPayService
{
    private string $baseUrl;
    private string $apiKey;
    private string $secretKey;
    private string $webhookSecret;

    private const METHOD_TO_PROVIDER = [
        'MTN'    => 'MTN_MOMO_CMR',
        'Orange' => 'ORANGE_CMR',
    ];

    public function __construct()
    {
        $this->baseUrl       = rtrim(config('kpay.base_url'), '/');
        $this->apiKey        = config('kpay.api_key') ?? '';
        $this->secretKey     = config('kpay.secret_key') ?? '';
        $this->webhookSecret = config('kpay.webhook_secret') ?? '';
    }

    /**
     * Resout le provider KPay depuis l'operateur interne (MTN / Orange).
     */
    public function resolveProvider(string $operateur): ?string
    {
        return self::METHOD_TO_PROVIDER[$operateur] ?? null;
    }

    /**
     * Initier un paiement USSD (le client recoit une demande sur son telephone).
     *
     * @return array{id: string, reference: string, status: string, amount: int, ...}
     */
    public function initPaymentUssd(string $phone, float $amount, string $externalId, ?string $operateur = null, ?string $description = null): array
    {
        $body = [
            'amount'      => (int) round($amount),
            'phoneNumber' => $this->formatPhone($phone),
            'externalId'  => $externalId,
            'description' => $description,
        ];

        if ($operateur) {
            $provider = $this->resolveProvider($operateur);
            if ($provider) {
                $body['provider'] = $provider;
            }
        }

        Log::info('KPay initPaymentUssd', [
            'externalId' => $externalId,
            'phone'      => $body['phoneNumber'],
            'amount'     => $body['amount'],
            'provider'   => $body['provider'] ?? null,
        ]);

        return $this->request('POST', '/api/v1/payments/init', $body);
    }

    /**
     * Recuperer le statut d'un paiement par son ID KPay.
     *
     * @return array{id: string, reference: string, status: string, amount: int, ...}
     */
    public function getPaymentStatus(string $paymentId): array
    {
        return $this->request('GET', "/api/v1/payments/{$paymentId}");
    }

    /**
     * Detecter l'operateur a partir du numero de telephone.
     */
    public function predictProvider(string $phone): array
    {
        return $this->request('POST', '/api/v1/payments/predict-provider', [
            'phoneNumber' => $this->formatPhone($phone),
        ]);
    }

    /**
     * Verifier la disponibilite des operateurs.
     */
    public function getAvailability(): array
    {
        return $this->request('GET', '/api/v1/payments/availability');
    }

    /**
     * Verifie la signature HMAC-SHA256 du webhook KPay.
     */
    public function verifyWebhookSignature(string $rawBody, string $signature): bool
    {
        if (!$this->webhookSecret || !$signature) {
            return false;
        }

        $expected = hash_hmac('sha256', $rawBody, $this->webhookSecret);

        return hash_equals($expected, $signature);
    }

    /**
     * Formate le telephone : 237XXXXXXXXX (sans +).
     */
    private function formatPhone(string $phone): string
    {
        $cleaned = preg_replace('/[\s\-\.+]/', '', $phone);
        if (!str_starts_with($cleaned, '237')) {
            $cleaned = '237' . $cleaned;
        }
        return $cleaned;
    }

    /**
     * Effectue une requete HTTP vers l'API KPay.
     */
    private function request(string $method, string $path, ?array $body = null): array
    {
        $url = "{$this->baseUrl}{$path}";

        $http = Http::withHeaders([
            'X-API-Key'    => $this->apiKey,
            'X-Secret-Key' => $this->secretKey,
            'Content-Type' => 'application/json',
        ])->timeout(30);

        $response = match (strtoupper($method)) {
            'POST' => $http->post($url, $body ?? []),
            'GET'  => $http->get($url),
            default => throw new \RuntimeException("Methode HTTP non supportee: {$method}"),
        };

        Log::info('KPay request', [
            'method'      => $method,
            'path'        => $path,
            'http_status' => $response->status(),
        ]);

        if (!$response->successful()) {
            $msg = $response->json('message') ?? $response->body();
            if (is_array($msg)) {
                $msg = implode(', ', $msg);
            }

            if ($response->status() === 429) {
                throw new \RuntimeException('KPay: trop de requetes, reessayez dans quelques secondes');
            }

            throw new \RuntimeException('KPay: erreur ' . $response->status() . ' — ' . $msg);
        }

        return $response->json();
    }
}
