<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Commande;
use App\Models\Conversation;
use App\Models\Employe;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Conversation::with(['client', 'employe', 'commande']);

        if ($user instanceof Client) {
            $query->where('id_client', $user->id_client);
        } elseif ($user instanceof Employe && !$user->isAdmin()) {
            $query->where('id_employe', $user->id_employe);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->orderByDesc('dernier_message_at')->get());
    }

    public function show(int $id): JsonResponse
    {
        $conversation = Conversation::with(['client', 'employe'])->findOrFail($id);
        $messages = Message::where('id_conversation', $id)
            ->orderBy('envoye_le')
            ->get();
        return response()->json([
            'conversation' => $conversation,
            'messages' => $messages,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'id_client' => 'required_without:id_employe|exists:clients,id_client',
            'id_employe' => 'required_without:id_client|exists:employes,id_employe',
            'sujet' => 'required|string|max:200',
            'id_commande' => 'nullable|exists:commandes,id_commande',
            'id_demande' => 'nullable|exists:demandes_campagnes,id_demande',
        ]);

        $user = $request->user();
        $initiePar = $user instanceof Client ? 'client' : 'employe';

        $conversation = Conversation::create([
            'id_client' => $user instanceof Client ? $user->id_client : $request->id_client,
            'id_employe' => $user instanceof Employe ? $user->id_employe : $request->id_employe,
            'id_commande' => $request->id_commande,
            'id_demande' => $request->id_demande,
            'sujet' => $request->sujet,
            'initiee_par' => $initiePar,
            'statut' => 'active',
        ]);

        return response()->json($conversation->load(['client', 'employe']), 201);
    }

    public function sendMessage(Request $request, int $idConversation): JsonResponse
    {
        $request->validate([
            'contenu' => 'nullable|string',
            'type_message' => 'nullable|in:texte,image,document,audio,video',
            'fichier' => 'nullable|file|max:10240', // 10 MB max
        ]);

        if (empty($request->contenu) && !$request->hasFile('fichier')) {
            return response()->json(['message' => 'Contenu ou fichier requis'], 422);
        }

        $user = $request->user();
        $conversation = Conversation::findOrFail($idConversation);
        $expediteurType = $user instanceof Client ? 'client' : 'employe';

        $fichierUrl = null;
        $fichierNom = null;
        $fichierTaille = null;
        $typeMessage = $request->input('type_message', 'texte');

        // Upload du fichier si présent
        if ($request->hasFile('fichier')) {
            $file = $request->file('fichier');
            $fichierNom = $file->getClientOriginalName();
            $fichierTaille = $file->getSize();
            $mime = $file->getMimeType();

            // Détecter le type
            if (str_starts_with($mime, 'image/')) {
                $typeMessage = 'image';
            } elseif (str_starts_with($mime, 'audio/')) {
                $typeMessage = 'audio';
            } elseif (str_starts_with($mime, 'video/')) {
                $typeMessage = 'video';
            } else {
                $typeMessage = 'document';
            }

            // Nom de fichier unique
            $ext = $file->getClientOriginalExtension();
            $filename = uniqid('chat_') . '_' . time() . ($ext ? '.' . $ext : '');
            $path = $file->storeAs('chat', $filename, 'public');
            $fichierUrl = '/storage/' . $path;
        }

        $message = DB::transaction(function () use ($request, $user, $conversation, $expediteurType, $fichierUrl, $fichierNom, $fichierTaille, $typeMessage) {
            return Message::create([
                'id_conversation' => $conversation->id_conversation,
                'expediteur_type' => $expediteurType,
                'id_expediteur_client' => $expediteurType === 'client' ? $user->id_client : null,
                'id_expediteur_employe' => $expediteurType === 'employe' ? $user->id_employe : null,
                'contenu' => $request->contenu,
                'type_message' => $typeMessage,
                'fichier_url' => $fichierUrl,
                'fichier_nom' => $fichierNom,
                'fichier_taille' => $fichierTaille,
            ]);
        });

        try {
            broadcast(new MessageSent($message))->toOthers();
        } catch (\Throwable $e) {
            // Broadcasting optionnel
        }

        return response()->json($message, 201);
    }

    public function markAsRead(Request $request, int $idConversation): JsonResponse
    {
        $user = $request->user();
        $champ = $user instanceof Client ? 'statut_client' : 'statut_employe';
        $champNonLus = $user instanceof Client ? 'nb_non_lus_client' : 'nb_non_lus_employe';

        Message::where('id_conversation', $idConversation)
            ->where($champ, '!=', 'lu')
            ->update([$champ => 'lu', 'lu_le' => now()]);

        Conversation::where('id_conversation', $idConversation)->update([$champNonLus => 0]);

        return response()->json(['message' => 'Marqué comme lu']);
    }

    public function reaction(Request $request, int $idMessage): JsonResponse
    {
        $request->validate(['emoji' => 'required|string']);
        $message = Message::findOrFail($idMessage);
        $reactions = $message->reactions ?? [];
        $user = $request->user();
        $key = ($user instanceof Client ? 'c' : 'e') . ($user->id_client ?? $user->id_employe);
        if (isset($reactions[$key]) && $reactions[$key] === $request->emoji) {
            unset($reactions[$key]);
        } else {
            $reactions[$key] = $request->emoji;
        }
        $message->update(['reactions' => $reactions]);
        return response()->json($message);
    }

    public function contactsDisponibles(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user instanceof Client) {
            $commandes = Commande::where('id_client', $user->id_client)
                ->whereNotNull('id_employe_responsable')
                ->select('id_commande', 'numero_commande', 'id_employe_responsable')
                ->get();

            if ($commandes->isEmpty()) {
                return response()->json([
                    'type' => 'employes',
                    'contacts' => [],
                    'has_commandes' => false,
                ]);
            }

            $employeIds = $commandes->pluck('id_employe_responsable')->unique()->values();
            $employes = Employe::whereIn('id_employe', $employeIds)
                ->where('actif', 1)
                ->select('id_employe', 'nom', 'prenom', 'role')
                ->get()
                ->keyBy('id_employe');

            $contactsMap = [];
            foreach ($commandes as $cmd) {
                $emp = $employes->get($cmd->id_employe_responsable);
                if (!$emp) continue;
                $id = $emp->id_employe;
                if (!isset($contactsMap[$id])) {
                    $contactsMap[$id] = [
                        'id_employe' => $id,
                        'nom' => $emp->nom,
                        'prenom' => $emp->prenom,
                        'role' => $emp->role,
                        'commandes' => [],
                    ];
                }
                $contactsMap[$id]['commandes'][] = [
                    'id_commande' => $cmd->id_commande,
                    'numero_commande' => $cmd->numero_commande,
                ];
            }

            return response()->json([
                'type' => 'employes',
                'contacts' => array_values($contactsMap),
                'has_commandes' => true,
            ]);
        }

        $contacts = Client::where('statut', '!=', 'archive')
            ->select('id_client', 'nom_complet', 'raison_sociale', 'type_client', 'email')
            ->orderBy('nom_complet')
            ->get();

        return response()->json([
            'type' => 'clients',
            'contacts' => $contacts,
            'has_commandes' => true,
        ]);
    }

    public function contacterAdmin(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!($user instanceof Client)) {
            return response()->json(['message' => 'Réservé aux clients'], 403);
        }

        $request->validate([
            'sujet' => 'required|string|max:200',
        ]);

        $admin = Employe::where('actif', 1)
            ->whereIn('role', ['admin', 'directeur'])
            ->first();

        if (!$admin) {
            return response()->json(['message' => 'Aucun administrateur disponible'], 503);
        }

        $conversation = Conversation::create([
            'id_client' => $user->id_client,
            'id_employe' => $admin->id_employe,
            'sujet' => $request->sujet,
            'initiee_par' => 'client',
            'statut' => 'active',
        ]);

        return response()->json($conversation->load(['client', 'employe']), 201);
    }
}