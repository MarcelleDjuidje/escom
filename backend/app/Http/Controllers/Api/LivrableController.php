<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Employe;
use App\Models\Livrable;
use App\Models\NotificationInterne;
use App\Models\Projet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class LivrableController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Livrable::with(['projet.commande.client', 'uploader']);

        if ($user instanceof Client) {
            $query->whereHas('projet.commande', function ($q) use ($user) {
                $q->where('id_client', $user->id_client);
            });
        } elseif ($user instanceof Employe && !$user->isAdmin()) {
            $query->whereHas('projet', function ($q) use ($user) {
                $q->where('id_chef_projet', $user->id_employe);
            });
        }

        if ($request->id_projet) {
            $query->where('id_projet', $request->id_projet);
        }

        return response()->json($query->orderByDesc('date_depot')->paginate(20));
    }

    public function show(int $id, Request $request): JsonResponse
    {
        $livrable = Livrable::with(['projet.commande.client', 'uploader'])->findOrFail($id);

        if (!$this->peutAccederLivrable($request->user(), $livrable)) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        return response()->json($livrable);
    }

    public function upload(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_projet' => 'required|exists:projets,id_projet',
            'libelle' => 'required|string|max:200',
            'description' => 'nullable|string|max:1000',
            'fichier' => 'required|file|max:51200',
            'est_version_finale' => 'nullable|boolean',
        ]);

        $user = $request->user();
        if (!($user instanceof Employe)) {
            return response()->json(['message' => 'Seul un employé peut téléverser un livrable'], 403);
        }

        $projet = Projet::with('commande')->findOrFail($validated['id_projet']);

        if (!$user->isAdmin() && $projet->id_chef_projet !== $user->id_employe) {
            return response()->json(['message' => 'Vous n\'êtes pas le chef de ce projet'], 403);
        }

        $file = $request->file('fichier');
        $originalName = $file->getClientOriginalName();
        $mime = $file->getMimeType();
        $size = $file->getSize();
        $extension = $file->getClientOriginalExtension() ?: 'bin';

        // Stocker le fichier HD
        $hdFilename = 'hd_' . uniqid() . '_' . time() . '.' . $extension;
        $file->storeAs('livrables', $hdFilename, 'public');
        $hdUrl = '/api/livrables/file/' . $hdFilename;

        // Créer la preview filigranée si image
        $previewUrl = null;
        if (str_starts_with($mime, 'image/')) {
            $previewUrl = $this->creerPreviewFiligranee($file->getRealPath(), $hdUrl);
        }

        // Déterminer le numéro de version
        $derniereVersion = Livrable::where('id_projet', $validated['id_projet'])
            ->max('version') ?? 0;

        $livrable = Livrable::create([
            'id_projet' => $validated['id_projet'],
            'id_employe' => $user->id_employe,
            'libelle' => $validated['libelle'],
            'description' => $validated['description'] ?? null,
            'nom_fichier' => $originalName,
            'type_fichier' => $mime,
            'chemin_stockage' => $hdUrl,
            'fichier_apercu_url' => $previewUrl,
            'taille_fichier' => $size,
            'version' => $derniereVersion + 1,
            'est_version_finale' => $validated['est_version_finale'] ?? false,
            'livraison_effectuee' => 0,
            'valide_client' => 0,
            'date_depot' => now(),
        ]);

        // Notifier le client
        NotificationInterne::create([
            'type_destinataire' => 'client',
            'id_client' => $projet->commande->id_client,
            'declencheur' => 'livrable_pret',
            'titre' => 'Nouveau livrable disponible',
            'contenu' => "L'aperçu de \"{$validated['libelle']}\" est disponible dans votre espace.",
            'url_action' => "/dashboard/client/commandes/{$projet->commande->id_commande}",
            'id_commande' => $projet->commande->id_commande,
            'created_at' => now(),
        ]);

        return response()->json($livrable->load('uploader'), 201);
    }

    /**
     * Crée une preview filigranée bien visible de l'image.
     * Filigrane : grand ESCOM diagonal + grille de petits ESCOM.
     */
    private function creerPreviewFiligranee(string $sourcePath, string $hdUrlFallback): string
    {
        $previewFilename = 'preview_' . uniqid() . '_' . time() . '.jpg';
        $previewFullPath = storage_path('app/public/livrables/' . $previewFilename);
        $previewUrl = '/api/livrables/preview/' . $previewFilename;

        try {
            $manager = new ImageManager(new Driver());
            $image = $manager->read($sourcePath);
            $image->scaleDown(width: 1200);

            $width = $image->width();
            $height = $image->height();

            // Recherche d'une police TTF disponible
            $fontCandidates = [
                storage_path('app/fonts/DejaVuSans-Bold.ttf'),
                'C:\\Windows\\Fonts\\arialbd.ttf',
                'C:\\Windows\\Fonts\\arial.ttf',
                'C:\\Windows\\Fonts\\tahomabd.ttf',
                'C:\\Windows\\Fonts\\tahoma.ttf',
                'C:\\Windows\\Fonts\\calibrib.ttf',
                'C:\\Windows\\Fonts\\verdanab.ttf',
            ];
            $fontPath = null;
            foreach ($fontCandidates as $candidate) {
                if (file_exists($candidate)) {
                    $fontPath = $candidate;
                    break;
                }
            }

            if ($fontPath) {
                $this->ajouterFiligraneTexte($image, $width, $height, $fontPath);
            } else {
                Log::warning('Aucune police TTF trouvée, fallback visuel');
                $this->ajouterFiligraneVisuel($image, $width, $height);
            }

            $image->toJpeg(80)->save($previewFullPath);
            return $previewUrl;

        } catch (\Throwable $e) {
            Log::warning('Erreur filigrane livrable: ' . $e->getMessage());

            // Fallback : sauvegarder l'image sans filigrane
            try {
                $manager = new ImageManager(new Driver());
                $image = $manager->read($sourcePath);
                $image->scaleDown(width: 1200);
                $image->toJpeg(70)->save($previewFullPath);
                return $previewUrl;
            } catch (\Throwable $e2) {
                Log::error('Erreur création preview: ' . $e2->getMessage());
                return $hdUrlFallback;
            }
        }
    }

    /**
     * Filigrane texte ESCOM grand format + grille secondaire.
     */
    private function ajouterFiligraneTexte($image, int $width, int $height, string $fontPath): void
    {
        // ========================================
        // FILIGRANE PRINCIPAL : Grand ESCOM diagonal
        // ========================================
        $bigSize = max(120, intval($width / 5));  // Très grand

        // Ombre noire pour ressortir sur fonds clairs
        $image->text('ESCOM', $width / 2 + 4, $height / 2 + 4, function ($font) use ($bigSize, $fontPath) {
            $font->filename($fontPath);
            $font->size($bigSize);
            $font->color('00000040');  // Noir 25%
            $font->align('center');
            $font->valign('middle');
            $font->angle(35);
        });

        // Texte blanc principal
        $image->text('ESCOM', $width / 2, $height / 2, function ($font) use ($bigSize, $fontPath) {
            $font->filename($fontPath);
            $font->size($bigSize);
            $font->color('ffffff90');  // Blanc 56%
            $font->align('center');
            $font->valign('middle');
            $font->angle(35);
        });

        // ========================================
        // FILIGRANES SECONDAIRES : Grille bien espacée
        // ========================================
        $smallSize = max(40, intval($width / 18));
        $stepX = intval($width / 3);
        $stepY = intval($height / 4);

        for ($x = intval($stepX / 2); $x < $width; $x += $stepX) {
            for ($y = intval($stepY / 2); $y < $height; $y += $stepY) {
                // Skip la zone centrale (pour ne pas masquer le gros logo)
                $distFromCenter = sqrt(pow($x - $width / 2, 2) + pow($y - $height / 2, 2));
                if ($distFromCenter < $width / 6) continue;

                $image->text('ESCOM', $x, $y, function ($font) use ($smallSize, $fontPath) {
                    $font->filename($fontPath);
                    $font->size($smallSize);
                    $font->color('ffffff60');  // Blanc 37%
                    $font->align('center');
                    $font->valign('middle');
                    $font->angle(35);
                });
            }
        }
    }

    /**
     * Filigrane visuel sans texte (fallback si aucune police TTF).
     */
    private function ajouterFiligraneVisuel($image, int $width, int $height): void
    {
        for ($i = -$height; $i < $width + $height; $i += 80) {
            $image->drawLine(function ($line) use ($i, $height) {
                $line->from($i, 0);
                $line->to($i + $height, $height);
                $line->color('ffffff40');
                $line->width(30);
            });
        }
    }

    public function download(int $id, Request $request)
    {
        $livrable = Livrable::with('projet.commande')->findOrFail($id);
        $user = $request->user();

        if (!$this->peutAccederLivrable($user, $livrable)) {
            abort(403, 'Accès refusé');
        }

        $commande = $livrable->projet?->commande;
        if (!$commande) abort(404, 'Commande introuvable');

        if ($user instanceof Client && $commande->livraison_bloquee) {
            return response()->json([
                'message' => 'Veuillez régler le solde de votre commande pour débloquer le téléchargement HD',
                'reste_a_payer' => $commande->total_ttc - $commande->montant_paye,
            ], 402);
        }

        $filename = basename(parse_url($livrable->chemin_stockage, PHP_URL_PATH));
        $path = storage_path('app/public/livrables/' . $filename);

        if (!file_exists($path)) abort(404, 'Fichier introuvable');

        return response()->download($path, $livrable->nom_fichier ?: $filename);
    }

    public function serveFile(string $filename, Request $request)
    {
        if (str_contains($filename, '..') || str_contains($filename, '/') || str_contains($filename, '\\')) {
            abort(403);
        }

        $livrable = Livrable::with('projet.commande')
            ->where('chemin_stockage', 'like', '%' . $filename)
            ->first();

        if (!$livrable) abort(404);

        $user = $request->user();
        if (!$this->peutAccederLivrable($user, $livrable)) abort(403);

        if ($user instanceof Client && $livrable->projet->commande->livraison_bloquee) {
            abort(402);
        }

        $path = storage_path('app/public/livrables/' . $filename);
        if (!file_exists($path)) abort(404);

        return response()->file($path);
    }

    public function servePreview(string $filename)
    {
        if (str_contains($filename, '..') || str_contains($filename, '/') || str_contains($filename, '\\')) {
            abort(403);
        }

        $path = storage_path('app/public/livrables/' . $filename);
        if (!file_exists($path)) abort(404);

        return response()->file($path);
    }

    private function peutAccederLivrable($user, Livrable $livrable): bool
    {
        if (!$user) return false;

        if ($user instanceof Employe && $user->isAdmin()) return true;

        if ($user instanceof Employe) {
            return $livrable->projet?->id_chef_projet === $user->id_employe
                || $livrable->id_employe === $user->id_employe;
        }

        if ($user instanceof Client) {
            return $livrable->projet?->commande?->id_client === $user->id_client;
        }

        return false;
    }
}