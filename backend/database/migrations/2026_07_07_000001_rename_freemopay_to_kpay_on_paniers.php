<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paniers', function (Blueprint $table) {
            $table->renameColumn('freemopay_reference', 'kpay_id');
            $table->renameColumn('freemopay_statut', 'kpay_statut');
        });
    }

    public function down(): void
    {
        Schema::table('paniers', function (Blueprint $table) {
            $table->renameColumn('kpay_id', 'freemopay_reference');
            $table->renameColumn('kpay_statut', 'freemopay_statut');
        });
    }
};
