<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paniers', function (Blueprint $table) {
            $table->string('freemopay_reference', 100)->nullable()->after('id_devis_origine');
            $table->string('freemopay_statut', 20)->nullable()->after('freemopay_reference');
            // freemopay_statut : pending | success | failed
        });
    }

    public function down(): void
    {
        Schema::table('paniers', function (Blueprint $table) {
            $table->dropColumn(['freemopay_reference', 'freemopay_statut']);
        });
    }
};
