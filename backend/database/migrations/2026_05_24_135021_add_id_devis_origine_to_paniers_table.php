<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('paniers', function (Blueprint $table) {
            $table->integer('id_devis_origine')->nullable()->after('id_client');
            $table->index('id_devis_origine');
        });
    }

    public function down(): void
    {
        Schema::table('paniers', function (Blueprint $table) {
            $table->dropIndex(['id_devis_origine']);
            $table->dropColumn('id_devis_origine');
        });
    }
};