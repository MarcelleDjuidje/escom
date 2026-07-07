# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ESCOM is a SaaS platform for a Cameroonian communication agency. It's a monorepo with a **Laravel 12 REST API backend** and a **Next.js 14 frontend** (App Router, TypeScript).

## Development Commands

### Backend (Laravel)
```bash
cd backend
composer install
php artisan key:generate
php artisan migrate          # Runs full SQL schema (38 tables, 7 triggers, 6 views)
php artisan storage:link
php artisan serve            # http://localhost:8000
php artisan reverb:start     # Optional: WebSocket for real-time chat
php artisan test             # PHPUnit tests
vendor/bin/pint              # Code formatting (Laravel Pint)
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev                  # http://localhost:3000
npm run build
npm run lint                 # ESLint
```

## Architecture

### Backend (`backend/`)
- **Framework**: Laravel 12, PHP 8.2+, Sanctum token auth
- **API controllers**: `app/Http/Controllers/Api/` — ~20 REST controllers
- **Models**: `app/Models/` — ~40 Eloquent models. Tables use French names (e.g., `commandes`, `devis`, `factures`, `livrables`)
- **Routes**: `routes/api.php` — all API endpoints. Public routes under `/api/public/`, authenticated routes under `auth:sanctum` middleware, admin routes under `/api/admin/`
- **Services**: `app/Services/KPayService.php` — Mobile Money payment integration
- **Events**: `app/Events/MessageSent.php` — WebSocket broadcasting for chat
- **PDF generation**: DOMPDF via `resources/views/pdf/` Blade templates (devis, factures)
- **Database**: Single migration (`2026_01_01_000000_create_escom_full_schema.php`) executes `database/schema.sql` (source of truth, ~970 lines). Additional incremental migrations for paniers/devis features.
- **Key packages**: spatie/laravel-permission (roles), spatie/laravel-activitylog (audit), intervention/image (watermarks), laravel/reverb (WebSocket)

### Frontend (`frontend/`)
- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Route groups**:
  - `app/(public)/` — public pages (accueil, services, réalisations, FAQ, processus)
  - `app/(auth)/` — login & register
  - `app/(dashboard)/dashboard/{admin,client,employe}/` — role-based dashboards
- **API client**: `lib/api.ts` — Axios instance with Sanctum token injection from localStorage (`escom_token`)
- **Auth**: `lib/auth-context.tsx` — React context providing user/role info
- **Components**: `components/layout/` (Navbar, Footer), `components/dashboard/` (DashboardLayout, ChatPanel, DataTable)
- **UI stack**: Tailwind CSS, Radix UI primitives, Framer Motion, Recharts, Sonner toasts, React Hook Form + Zod
- **State**: Zustand for client-side state

### Authentication & Roles
- Two user tables: `clients` and `employes` (unified behind Sanctum)
- Roles: `client`, `commercial`, `designer`, `chef_projet`, `imprimeur`, `admin`, `directeur`
- `is_staff` boolean distinguishes employees from clients
- Token stored in localStorage as `escom_token`, user data as `escom_user`

### Business Logic
- **Payment flow**: Devis → Commande → PlanPaiement → TranchePaiement → FactureTranche. MySQL triggers automate cascade (payment → balance update → delivery unlock)
- **Livrables**: HD download gated behind full payment; watermarked previews shown otherwise
- **KPay**: Mobile Money integration with webhook at `/api/kpay/webhook` (public, no auth)
- **Chat**: Real-time via Laravel Reverb WebSocket, falls back to 6s polling

## Conventions
- All domain terms are in **French** (table names, API routes, model names, UI labels)
- Database primary keys use `id_<entity>` pattern (e.g., `id_employe`, `id_commande`)
- The canonical database schema lives in `database/schema.sql`, not in individual Laravel migrations
- Brand colors: Blue `#1d4ed8`, Gold `#d4af37`. No pure black — max `#1c1c24`
