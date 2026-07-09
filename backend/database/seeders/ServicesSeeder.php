<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ServicesSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // ========== SERVICES CONCEPTION ==========
        $conceptions = [
            ['type_conception' => 'logo',           'libelle' => 'Création de logo professionnel',          'description' => 'Conception d\'un logo unique et mémorable avec charte graphique simplifiée. Inclut 3 propositions initiales.', 'prix_unitaire_ht' => 75000, 'duree_livraison_jours' => 4, 'nb_revisions_incluses' => 3, 'prix_revision_sup_ht' => 10000],
            ['type_conception' => 'logo',           'libelle' => 'Logo + Charte graphique complète',        'description' => 'Logo professionnel accompagné d\'une charte graphique complète (couleurs, typographies, usages, déclinaisons).', 'prix_unitaire_ht' => 150000, 'duree_livraison_jours' => 7, 'nb_revisions_incluses' => 5, 'prix_revision_sup_ht' => 15000],
            ['type_conception' => 'flyer',          'libelle' => 'Design flyer / tract publicitaire',       'description' => 'Conception graphique d\'un flyer A5 ou A4, recto ou recto-verso. Idéal pour vos événements et promotions.', 'prix_unitaire_ht' => 25000, 'duree_livraison_jours' => 2, 'nb_revisions_incluses' => 2, 'prix_revision_sup_ht' => 5000],
            ['type_conception' => 'affiche',        'libelle' => 'Design affiche grand format',             'description' => 'Conception d\'une affiche publicitaire A3, A2 ou format personnalisé pour événements, lancements de produits.', 'prix_unitaire_ht' => 35000, 'duree_livraison_jours' => 3, 'nb_revisions_incluses' => 2, 'prix_revision_sup_ht' => 7000],
            ['type_conception' => 'carte_visite',   'libelle' => 'Design carte de visite',                  'description' => 'Création d\'une carte de visite professionnelle recto-verso avec vos coordonnées et identité visuelle.', 'prix_unitaire_ht' => 15000, 'duree_livraison_jours' => 2, 'nb_revisions_incluses' => 2, 'prix_revision_sup_ht' => 3000],
            ['type_conception' => 'brochure',       'libelle' => 'Design brochure / catalogue',             'description' => 'Mise en page professionnelle d\'une brochure ou catalogue jusqu\'à 12 pages. Idéal pour présenter vos produits.', 'prix_unitaire_ht' => 80000, 'duree_livraison_jours' => 5, 'nb_revisions_incluses' => 3, 'prix_revision_sup_ht' => 12000],
            ['type_conception' => 'banniere_web',   'libelle' => 'Bannière web & réseaux sociaux',          'description' => 'Création de bannières optimisées pour Facebook, Instagram, LinkedIn, YouTube ou site web.', 'prix_unitaire_ht' => 15000, 'duree_livraison_jours' => 1, 'nb_revisions_incluses' => 2, 'prix_revision_sup_ht' => 3000],
            ['type_conception' => 'video',          'libelle' => 'Montage vidéo promotionnel',              'description' => 'Montage d\'une vidéo promotionnelle courte (30s à 2min) avec transitions, textes animés et musique.', 'prix_unitaire_ht' => 100000, 'duree_livraison_jours' => 5, 'nb_revisions_incluses' => 2, 'prix_revision_sup_ht' => 20000],
            ['type_conception' => 'motion',         'libelle' => 'Animation motion design',                 'description' => 'Création d\'une animation motion design pour présenter votre marque, produit ou service de manière dynamique.', 'prix_unitaire_ht' => 150000, 'duree_livraison_jours' => 7, 'nb_revisions_incluses' => 2, 'prix_revision_sup_ht' => 25000],
            ['type_conception' => 'habillage_reseau','libelle' => 'Habillage complet réseaux sociaux',      'description' => 'Pack complet : photo de profil, couverture, templates de posts pour Facebook, Instagram et LinkedIn.', 'prix_unitaire_ht' => 50000, 'duree_livraison_jours' => 3, 'nb_revisions_incluses' => 3, 'prix_revision_sup_ht' => 8000],
            ['type_conception' => 'kakemono',       'libelle' => 'Design kakémono / roll-up',               'description' => 'Conception graphique d\'un kakémono ou roll-up pour salons, conférences et points de vente.', 'prix_unitaire_ht' => 30000, 'duree_livraison_jours' => 2, 'nb_revisions_incluses' => 2, 'prix_revision_sup_ht' => 5000],
        ];

        foreach ($conceptions as $c) {
            DB::table('services_conception')->insert(array_merge($c, [
                'id_categorie' => 1,
                'actif' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }

        // ========== SERVICES IMPRESSION ==========
        $impressions = [
            ['type_support' => 'flyer',        'libelle' => 'Impression flyers A5',                    'description' => 'Impression flyers A5 sur papier couché 135g, quadri recto. Quantité minimum 100 exemplaires.', 'format' => 'A5', 'grammage_g_m2' => 135, 'finition' => 'brillant', 'recto_verso' => false, 'quantite_min' => 100,  'prix_unitaire_ht' => 50.00,    'frais_calage_ht' => 5000, 'duree_livraison_jours' => 3],
            ['type_support' => 'flyer',        'libelle' => 'Impression flyers A4 recto-verso',        'description' => 'Impression flyers A4 recto-verso sur papier couché 170g, finition brillante.', 'format' => 'A4', 'grammage_g_m2' => 170, 'finition' => 'brillant', 'recto_verso' => true,  'quantite_min' => 100,  'prix_unitaire_ht' => 100.00,   'frais_calage_ht' => 5000, 'duree_livraison_jours' => 3],
            ['type_support' => 'affiche',      'libelle' => 'Impression affiches A3',                  'description' => 'Impression affiches A3 sur papier couché 200g, haute résolution, couleurs vives.', 'format' => 'A3', 'grammage_g_m2' => 200, 'finition' => 'mat', 'recto_verso' => false, 'quantite_min' => 50,   'prix_unitaire_ht' => 200.00,   'frais_calage_ht' => 7500, 'duree_livraison_jours' => 4],
            ['type_support' => 'carte_visite', 'libelle' => 'Impression cartes de visite',             'description' => 'Cartes de visite 85x55mm, papier couché 350g, pelliculage mat ou brillant. Lot de 100.', 'format' => '85x55mm', 'grammage_g_m2' => 350, 'finition' => 'pellicule_mat', 'recto_verso' => true,  'quantite_min' => 100,  'prix_unitaire_ht' => 75.00,    'frais_calage_ht' => 3000, 'duree_livraison_jours' => 3],
            ['type_support' => 'banderole',    'libelle' => 'Impression banderole PVC',                'description' => 'Banderole PVC 500g/m² avec oeillets, impression grand format haute qualité. Prix au m².', 'format' => 'Sur mesure', 'grammage_g_m2' => 500, 'finition' => 'sans', 'recto_verso' => false, 'quantite_min' => 1,    'prix_unitaire_ht' => 5000.00,  'frais_calage_ht' => 0, 'duree_livraison_jours' => 4],
            ['type_support' => 'roll_up',      'libelle' => 'Impression roll-up 85x200cm',             'description' => 'Roll-up autoportant 85x200cm avec housse de transport. Structure aluminium incluse.', 'format' => '85x200cm', 'grammage_g_m2' => null, 'finition' => 'sans', 'recto_verso' => false, 'quantite_min' => 1,    'prix_unitaire_ht' => 35000.00, 'frais_calage_ht' => 0, 'duree_livraison_jours' => 5],
            ['type_support' => 'kakemono',     'libelle' => 'Impression kakémono 60x160cm',            'description' => 'Kakémono suspendu 60x160cm sur bâche 450g avec structure. Idéal pour stands et vitrines.', 'format' => '60x160cm', 'grammage_g_m2' => 450, 'finition' => 'sans', 'recto_verso' => false, 'quantite_min' => 1,    'prix_unitaire_ht' => 25000.00, 'frais_calage_ht' => 0, 'duree_livraison_jours' => 5],
            ['type_support' => 'bache',        'libelle' => 'Impression bâche grand format',           'description' => 'Bâche publicitaire grand format, PVC 500g avec oeillets tous les 50cm. Prix au m².', 'format' => 'Sur mesure', 'grammage_g_m2' => 500, 'finition' => 'sans', 'recto_verso' => false, 'quantite_min' => 1,    'prix_unitaire_ht' => 6000.00,  'frais_calage_ht' => 0, 'duree_livraison_jours' => 5],
            ['type_support' => 'tshirt',       'libelle' => 'Impression t-shirts personnalisés',       'description' => 'Impression sérigraphie ou transfert sur t-shirts coton. Logo recto, 1 à 4 couleurs.', 'format' => 'S à XXL', 'grammage_g_m2' => null, 'finition' => 'sans', 'recto_verso' => false, 'quantite_min' => 10,   'prix_unitaire_ht' => 3500.00,  'frais_calage_ht' => 10000, 'duree_livraison_jours' => 7],
            ['type_support' => 'macaron',      'libelle' => 'Impression macarons / stickers',          'description' => 'Autocollants ronds ou découpés, vinyle brillant résistant aux intempéries. Lot de 100.', 'format' => 'Rond 5cm', 'grammage_g_m2' => null, 'finition' => 'brillant', 'recto_verso' => false, 'quantite_min' => 100,  'prix_unitaire_ht' => 50.00,    'frais_calage_ht' => 2000, 'duree_livraison_jours' => 3],
        ];

        foreach ($impressions as $i) {
            DB::table('services_impression')->insert(array_merge($i, [
                'id_categorie' => 2,
                'actif' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }

        // ========== SERVICES SOCIAL MEDIA ==========
        $socials = [
            ['plateforme' => 'Facebook',  'type_prestation' => 'post_simple',            'libelle' => 'Post Facebook professionnel',              'description' => 'Création d\'un post Facebook avec visuel professionnel et texte engageant optimisé pour l\'algorithme.', 'frequence' => 'unitaire', 'nb_publications_incluses' => 1, 'budget_pub_inclus_ht' => null,  'prix_ht' => 10000, 'duree_livraison_jours' => 1],
            ['plateforme' => 'Instagram', 'type_prestation' => 'post_simple',            'libelle' => 'Post Instagram feed + story',              'description' => 'Création d\'un post Instagram avec visuel carré/portrait + story assortie. Hashtags et légende inclus.', 'frequence' => 'unitaire', 'nb_publications_incluses' => 2, 'budget_pub_inclus_ht' => null,  'prix_ht' => 12000, 'duree_livraison_jours' => 1],
            ['plateforme' => 'Instagram', 'type_prestation' => 'reel',                   'libelle' => 'Reel Instagram / TikTok',                  'description' => 'Montage d\'un reel court (15-60s) avec transitions tendance, musique et textes animés.', 'frequence' => 'unitaire', 'nb_publications_incluses' => 1, 'budget_pub_inclus_ht' => null,  'prix_ht' => 25000, 'duree_livraison_jours' => 2],
            ['plateforme' => 'Facebook',  'type_prestation' => 'gestion_compte',         'libelle' => 'Gestion Facebook mensuelle',               'description' => 'Gestion complète de votre page Facebook : 12 posts/mois, modération commentaires, rapport mensuel.', 'frequence' => 'mensuel', 'nb_publications_incluses' => 12, 'budget_pub_inclus_ht' => null,  'prix_ht' => 80000, 'duree_livraison_jours' => 30],
            ['plateforme' => 'Instagram', 'type_prestation' => 'gestion_compte',         'libelle' => 'Gestion Instagram mensuelle',              'description' => 'Gestion complète Instagram : 12 posts + 8 stories/mois, hashtags, engagement, rapport mensuel.', 'frequence' => 'mensuel', 'nb_publications_incluses' => 20, 'budget_pub_inclus_ht' => null,  'prix_ht' => 100000, 'duree_livraison_jours' => 30],
            ['plateforme' => 'Facebook',  'type_prestation' => 'publicite_sponsorisee',  'libelle' => 'Campagne publicitaire Facebook Ads',       'description' => 'Configuration et gestion d\'une campagne Facebook Ads ciblée. Budget publicitaire inclus.', 'frequence' => 'mensuel', 'nb_publications_incluses' => null, 'budget_pub_inclus_ht' => 50000, 'prix_ht' => 75000, 'duree_livraison_jours' => 30],
            ['plateforme' => 'LinkedIn',  'type_prestation' => 'post_simple',            'libelle' => 'Post LinkedIn professionnel',              'description' => 'Rédaction et design d\'un post LinkedIn B2B avec visuel professionnel et copywriting adapté.', 'frequence' => 'unitaire', 'nb_publications_incluses' => 1, 'budget_pub_inclus_ht' => null,  'prix_ht' => 15000, 'duree_livraison_jours' => 1],
            ['plateforme' => 'TikTok',    'type_prestation' => 'reel',                   'libelle' => 'Vidéo TikTok tendance',                   'description' => 'Création d\'une vidéo TikTok suivant les tendances actuelles avec montage dynamique et musique virale.', 'frequence' => 'unitaire', 'nb_publications_incluses' => 1, 'budget_pub_inclus_ht' => null,  'prix_ht' => 20000, 'duree_livraison_jours' => 2],
            ['plateforme' => 'Facebook',  'type_prestation' => 'audit',                  'libelle' => 'Audit réseaux sociaux',                   'description' => 'Analyse complète de votre présence sur les réseaux sociaux avec recommandations stratégiques détaillées.', 'frequence' => 'unitaire', 'nb_publications_incluses' => null, 'budget_pub_inclus_ht' => null,  'prix_ht' => 50000, 'duree_livraison_jours' => 5],
            ['plateforme' => 'Instagram', 'type_prestation' => 'strategie_editoriale',   'libelle' => 'Stratégie éditoriale Instagram',           'description' => 'Élaboration d\'une stratégie éditoriale complète : ligne éditoriale, calendrier, templates, guide de style.', 'frequence' => 'unitaire', 'nb_publications_incluses' => null, 'budget_pub_inclus_ht' => null,  'prix_ht' => 60000, 'duree_livraison_jours' => 5],
        ];

        foreach ($socials as $s) {
            DB::table('services_social_media')->insert(array_merge($s, [
                'id_categorie' => 3,
                'actif' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }

    }
}
