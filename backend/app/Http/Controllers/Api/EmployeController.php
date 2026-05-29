<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employe;
use App\Models\LogActivite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class EmployeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Employe::query();
        if ($request->filled('role')) $query->where('role', $request->role);
        if ($request->filled('actif')) $query->where('actif', $request->boolean('actif'));
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('nom', 'like', "%$s%")
                ->orWhere('prenom', 'like', "%$s%")
                ->orWhere('email_pro', 'like', "%$s%"));
        }
        return response()->json($query->orderBy('nom')->paginate(20));
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(Employe::findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email_pro' => 'required|email|unique:employes,email_pro',
            'telephone' => 'nullable|string|max:25',
            'role' => 'required|in:commercial,designer,chef_projet,imprimeur,admin,directeur',
            'date_embauche' => 'nullable|date',
            'password' => 'required|string|min:8',
        ]);
        $data['password'] = Hash::make($data['password']);
        $data['actif'] = 1;
        $employe = Employe::create($data);
        LogActivite::log(
            'employe_creation',
            "Création {$employe->email_pro}",
            ['entite' => 'employe', 'id' => $employe->id_employe]
        );
        return response()->json($employe, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $employe = Employe::findOrFail($id);
        $data = $request->validate([
            'nom' => 'sometimes|string|max:100',
            'prenom' => 'sometimes|string|max:100',
            'email_pro' => 'sometimes|email|unique:employes,email_pro,' . $id . ',id_employe',
            'telephone' => 'nullable|string|max:25',
            'role' => 'sometimes|in:commercial,designer,chef_projet,imprimeur,admin,directeur',
            'actif' => 'sometimes|boolean',
            'password' => 'nullable|string|min:8',
        ]);
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }
        $employe->update($data);
        return response()->json($employe);
    }

    public function destroy(int $id): JsonResponse
    {
        $employe = Employe::findOrFail($id);
        $employe->update(['actif' => 0]);
        return response()->json(['message' => 'Employé désactivé']);
    }
}