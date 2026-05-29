<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AvisClientController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CommandeController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DemandeCampagneController;
use App\Http\Controllers\Api\DevisController;
use App\Http\Controllers\Api\EmployeController;
use App\Http\Controllers\Api\FactureController;
use App\Http\Controllers\Api\FavoriController;
use App\Http\Controllers\Api\LivrableController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\PanierController;
use App\Http\Controllers\Api\ProjetController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\RealisationController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\TacheController;
use Illuminate\Support\Facades\Route;


// PUBLIC ENDPOINTS
Route::prefix('public')->group(function () {
    Route::get('services/categories', [ServiceController::class, 'categories']);
    Route::get('services/conception', [ServiceController::class, 'conception']);
    Route::get('services/impression', [ServiceController::class, 'impression']);
    Route::get('services/social', [ServiceController::class, 'social']);
    Route::get('services/campagnes', [ServiceController::class, 'campagnes']);
    Route::get('realisations', [RealisationController::class, 'publicIndex']);
    Route::get('realisations/{id}', [RealisationController::class, 'show']);
    Route::get('avis', [AvisClientController::class, 'publicIndex']);
    Route::get('promotions', [PromotionController::class, 'index'])->defaults('actives_only', true);
});

// AUTHENTICATION
Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/login', [AuthController::class, 'login']);

// AUTHENTICATED ROUTES
Route::middleware('auth:sanctum')->group(function () {
    // Profil
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    // Dashboard & Search
    Route::get('dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('search', [SearchController::class, 'global']);

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);

    // Chat
    Route::get('chat/contacts-disponibles', [ChatController::class, 'contactsDisponibles']);
    Route::post('chat/contacter-admin', [ChatController::class, 'contacterAdmin']);
    Route::get('chat/conversations', [ChatController::class, 'conversations']);
    Route::post('chat/conversations', [ChatController::class, 'store']);
    Route::get('chat/conversations/{id}', [ChatController::class, 'show']);
    Route::post('chat/conversations/{id}/messages', [ChatController::class, 'sendMessage']);
    Route::patch('chat/conversations/{id}/read', [ChatController::class, 'markAsRead']);
    Route::post('chat/messages/{id}/reaction', [ChatController::class, 'reaction']);

    // Devis
    Route::get('devis', [DevisController::class, 'index']);
    Route::get('devis/{id}', [DevisController::class, 'show']);
    Route::get('devis/{id}/pdf', [DevisController::class, 'generatePdf']);
    Route::post('devis', [DevisController::class, 'store']);
    Route::patch('devis/{id}/statut', [DevisController::class, 'updateStatut']);
    Route::delete('devis/{id}', [DevisController::class, 'destroy']);

    // ============ DEVIS PERSONNALISÉS ============
    // ⚠️ La route /stats DOIT être avant /{id} (sinon "stats" est pris pour un id)
    Route::get('devis/stats',            [DevisController::class, 'stats']);
    Route::get('devis',                  [DevisController::class, 'index']);
    Route::post('devis',                 [DevisController::class, 'store']);
    Route::get('devis/{id}',             [DevisController::class, 'show']);
    Route::post('devis/{id}/chiffrer',   [DevisController::class, 'chiffrer']);
    Route::post('devis/{id}/accepter',   [DevisController::class, 'accepter']);
    Route::post('devis/{id}/refuser',    [DevisController::class, 'refuser']);
    Route::post('devis/{id}/annuler',    [DevisController::class, 'annuler']);

    // Commandes
    Route::get('commandes', [CommandeController::class, 'index']);
    Route::get('commandes/dashboard', [CommandeController::class, 'dashboard']);
    Route::get('commandes/{id}', [CommandeController::class, 'show']);
    Route::post('commandes', [CommandeController::class, 'store']);
    Route::patch('commandes/{id}/statut', [CommandeController::class, 'updateStatut']);

    // Paniers (forçage paiement à la commande)
    Route::post('paniers', [PanierController::class, 'store']);
    Route::get('paniers/{id}', [PanierController::class, 'show']);
    Route::post('paniers/{id}/payer', [PanierController::class, 'payer']);
    Route::get('mes-paniers', [PanierController::class, 'mesPaniers']);

    // Factures
    Route::get('factures', [FactureController::class, 'index']);
    Route::get('factures/{id}', [FactureController::class, 'show']);
    Route::get('factures/{id}/pdf', [FactureController::class, 'generatePdf']);

    // Paiements
    Route::post('tranches/{id}/payer', [PaiementController::class, 'payerTranche']);
    Route::get('mes-tranches-en-attente', [PaiementController::class, 'tranchesEnAttenteClient']);
    Route::get('plans/{id}/tranches', [PaiementController::class, 'planTranches']);

    // Demandes Campagne
    Route::get('demandes-campagne', [DemandeCampagneController::class, 'index']);
    Route::post('demandes-campagne', [DemandeCampagneController::class, 'store']);
    Route::get('demandes-campagne/{id}', [DemandeCampagneController::class, 'show']);
    Route::post('demandes-campagne/{id}/repondre', [DemandeCampagneController::class, 'repondre']);
    Route::patch('demandes-campagne/{id}/statut', [DemandeCampagneController::class, 'changerStatut']);

    // Projets
    Route::get('projets', [ProjetController::class, 'index']);
    Route::get('projets/kanban', [ProjetController::class, 'kanban']);
    Route::get('projets/{id}', [ProjetController::class, 'show']);
    Route::post('projets', [ProjetController::class, 'store']);
    Route::patch('projets/{id}', [ProjetController::class, 'update']);
    Route::patch('projets/{id}/kanban', [ProjetController::class, 'deplacerKanban']);

    // Tâches
    Route::get('taches', [TacheController::class, 'index']);
    Route::post('taches', [TacheController::class, 'store']);
    Route::patch('taches/{id}', [TacheController::class, 'update']);
    Route::delete('taches/{id}', [TacheController::class, 'destroy']);

    // Livrables (les routes file et preview sont publiques, voir tout en bas)
    Route::get('livrables', [LivrableController::class, 'index']);
    Route::get('livrables/{id}', [LivrableController::class, 'show']);
    Route::post('livrables', [LivrableController::class, 'upload']);
    Route::get('livrables/{id}/download', [LivrableController::class, 'download']);
    Route::get('livrables/file/{filename}', [LivrableController::class, 'serveFile'])->where('filename', '[A-Za-z0-9._-]+');

    // Favoris
    Route::get('favoris', [FavoriController::class, 'index']);
    Route::post('favoris/toggle', [FavoriController::class, 'toggle']);

    // Avis client
    Route::post('avis', [AvisClientController::class, 'store']);

    // ADMIN ROUTES
    Route::prefix('admin')->group(function () {
        // Employés
        Route::get('employes', [EmployeController::class, 'index']);
        Route::post('employes', [EmployeController::class, 'store']);
        Route::get('employes/{id}', [EmployeController::class, 'show']);
        Route::patch('employes/{id}', [EmployeController::class, 'update']);
        Route::delete('employes/{id}', [EmployeController::class, 'destroy']);

        // Clients
        Route::get('clients', [ClientController::class, 'index']);
        Route::post('clients', [ClientController::class, 'store']);
        Route::get('clients/{id}', [ClientController::class, 'show']);
        Route::patch('clients/{id}', [ClientController::class, 'update']);
        Route::delete('clients/{id}', [ClientController::class, 'destroy']);

        // Services CRUD complet
        Route::post('services/conception', [ServiceController::class, 'storeConception']);
        Route::patch('services/conception/{id}', [ServiceController::class, 'updateConception']);
        Route::delete('services/conception/{id}', [ServiceController::class, 'destroyConception']);

        Route::post('services/impression', [ServiceController::class, 'storeImpression']);
        Route::patch('services/impression/{id}', [ServiceController::class, 'updateImpression']);
        Route::delete('services/impression/{id}', [ServiceController::class, 'destroyImpression']);

        Route::post('services/social', [ServiceController::class, 'storeSocialMedia']);
        Route::patch('services/social/{id}', [ServiceController::class, 'updateSocialMedia']);
        Route::delete('services/social/{id}', [ServiceController::class, 'destroySocialMedia']);

        Route::post('services/campagnes', [ServiceController::class, 'storeCampagne']);
        Route::patch('services/campagnes/{id}', [ServiceController::class, 'updateCampagne']);
        Route::delete('services/campagnes/{id}', [ServiceController::class, 'destroyCampagne']);

        // Réalisations
        Route::get('realisations', [RealisationController::class, 'adminIndex']);
        Route::post('realisations', [RealisationController::class, 'store']);
        Route::patch('realisations/{id}', [RealisationController::class, 'update']);
        Route::delete('realisations/{id}', [RealisationController::class, 'destroy']);
        Route::post('realisations/upload-image', [RealisationController::class, 'uploadImage']);

        // Promotions
        Route::get('promotions', [PromotionController::class, 'index']);
        Route::post('promotions', [PromotionController::class, 'store']);
        Route::patch('promotions/{id}', [PromotionController::class, 'update']);
        Route::post('promotions/{id}/activer', [PromotionController::class, 'activer']);
        Route::post('promotions/{id}/desactiver', [PromotionController::class, 'desactiver']);
        Route::delete('promotions/{id}', [PromotionController::class, 'destroy']);

        // Paniers (relance commerciale)
        Route::get('paniers', [PanierController::class, 'adminAbandonnes']);
        Route::get('paniers/stats', [PanierController::class, 'adminStats']);

        // Avis
        Route::get('avis', [AvisClientController::class, 'index']);
        Route::post('avis/{id}/valider', [AvisClientController::class, 'valider']);
        Route::post('avis/{id}/rejeter', [AvisClientController::class, 'rejeter']);
        Route::post('avis/{id}/repondre', [AvisClientController::class, 'repondre']);
        Route::delete('avis/{id}', [AvisClientController::class, 'destroy']);
    });
});

// ===== ALIAS ROUTES (compatibilité frontend) =====
Route::patch('commandes/{id}', [CommandeController::class, 'updateStatut']);
Route::post('factures/{id}/paiements', [PaiementController::class, 'payerFacture']);
Route::post('demandes-campagne/{id}/respond', [DemandeCampagneController::class, 'repondre']);
Route::get('admin/commandes', [CommandeController::class, 'index']);
Route::patch('admin/promotions/{id}/toggle', [PromotionController::class, 'toggle']);
Route::patch('admin/avis/{id}', [AvisClientController::class, 'updateStatut']);

// ===== ROUTES PUBLIQUES POUR FICHIERS (sécurité par nom aléatoire) =====

// Servir les fichiers du chat directement (bypass symlink)
Route::get('chat/file/{filename}', function ($filename) {
    if (str_contains($filename, '..') || str_contains($filename, '/') || str_contains($filename, '\\')) {
        abort(403);
    }
    $path = storage_path('app/public/chat/' . $filename);
    if (!file_exists($path)) {
        abort(404);
    }
    return response()->file($path);
})->where('filename', '[A-Za-z0-9._-]+');

// Preview livrables (public car nom aléatoire + image filigranée)
Route::get('livrables/preview/{filename}', [LivrableController::class, 'servePreview'])->where('filename', '[A-Za-z0-9._-]+');

// Health check
Route::get('health', fn() => response()->json(['status' => 'ok', 'time' => now()->toIso8601String()]));