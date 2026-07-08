<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services_impression', function (Blueprint $table) {
            $table->unsignedInteger('duree_livraison_jours')->nullable()->after('frais_calage_ht');
        });

        Schema::table('services_social_media', function (Blueprint $table) {
            $table->unsignedInteger('duree_livraison_jours')->nullable()->after('prix_ht');
        });
    }

    public function down(): void
    {
        Schema::table('services_impression', function (Blueprint $table) {
            $table->dropColumn('duree_livraison_jours');
        });

        Schema::table('services_social_media', function (Blueprint $table) {
            $table->dropColumn('duree_livraison_jours');
        });
    }
};
