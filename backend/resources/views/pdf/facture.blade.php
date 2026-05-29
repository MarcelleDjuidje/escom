<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture {{ $facture->numero_facture }}</title>
    <style>
        @page { margin: 30px 35px; }
        body { font-family: 'DejaVu Sans', sans-serif; color: #1f2937; font-size: 11px; line-height: 1.5; }
        .header { display: table; width: 100%; border-bottom: 3px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 20px; }
        .header-left, .header-right { display: table-cell; vertical-align: top; }
        .header-right { text-align: right; }
        .logo { max-height: 50px; }
        .agency-name { font-size: 22px; font-weight: bold; color: #1d4ed8; margin: 0; }
        .agency-tagline { color: #d4af37; font-style: italic; font-size: 10px; }
        .agency-info { color: #6b7280; font-size: 9px; margin-top: 5px; }
        .facture-title { font-size: 26px; font-weight: bold; color: #1d4ed8; margin: 0; letter-spacing: 1px; }
        .facture-numero { font-size: 13px; color: #6b7280; margin-top: 4px; }
        .facture-date { font-size: 9px; color: #9ca3af; margin-top: 3px; }
        .info-grid { display: table; width: 100%; margin: 20px 0; }
        .info-cell { display: table-cell; width: 50%; vertical-align: top; }
        .info-box { background: #f3f4f6; padding: 12px; border-radius: 6px; }
        .info-box-right { background: #fef3c7; padding: 12px; border-radius: 6px; border-left: 3px solid #d4af37; }
        .info-label { font-size: 9px; color: #6b7280; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; }
        .info-value { font-weight: bold; font-size: 12px; }
        .type-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
        .type-acompte { background: #dbeafe; color: #1e40af; }
        .type-intermediaire { background: #fef3c7; color: #92400e; }
        .type-solde { background: #dcfce7; color: #166534; }
        table.detail { width: 100%; border-collapse: collapse; margin-top: 20px; }
        table.detail th { background: #1d4ed8; color: white; padding: 10px; text-align: left; font-size: 10px; text-transform: uppercase; }
        table.detail td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; }
        .text-right { text-align: right; }
        .totals { margin-top: 20px; width: 50%; margin-left: auto; }
        .totals table { width: 100%; }
        .totals td { padding: 6px 10px; }
        .totals .total-final td { background: #1d4ed8; color: white; font-size: 14px; font-weight: bold; padding: 12px 10px; }
        .stamp { position: absolute; top: 280px; right: 100px; transform: rotate(-25deg); border: 4px solid #16a34a; color: #16a34a; padding: 8px 25px; font-size: 22px; font-weight: bold; opacity: 0.7; letter-spacing: 2px; }
        .stamp-due { border-color: #dc2626; color: #dc2626; }
        .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 9px; }
        .progress-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; margin: 15px 0; }
        .progress-title { font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; }
    </style>
</head>
<body>

    <!-- HEADER -->
    <div class="header">
        <div class="header-left">
            @if($logoData)
                <img src="data:image/png;base64,{{ $logoData }}" class="logo" alt="Logo">
            @endif
            <p class="agency-name">{{ $agence['nom'] }}</p>
            <p class="agency-tagline">{{ $agence['tagline'] }}</p>
            <p class="agency-info">
                {{ $agence['adresse'] }}<br>
                {{ $agence['email'] }} — {{ $agence['telephone'] }}
            </p>
        </div>
        <div class="header-right">
            <p class="facture-title">FACTURE</p>
            <p class="facture-numero">{{ $facture->numero_facture }}</p>
            <p class="facture-date">Émise le {{ \Carbon\Carbon::parse($facture->date_emission)->format('d/m/Y') }}</p>
            <div style="margin-top: 8px;">
                <span class="type-badge type-{{ $facture->type_facture ?? 'solde' }}">
                    {{ strtoupper($facture->type_facture ?? 'solde') }}
                </span>
            </div>
        </div>
    </div>

    <!-- INFO CLIENT + COMMANDE -->
    <div class="info-grid">
        <div class="info-cell" style="padding-right: 8px;">
            <div class="info-box">
                <p class="info-label">FACTURÉ À</p>
                <p class="info-value">{{ $facture->client->nom_complet ?? 'Client' }}</p>
                @if($facture->client && $facture->client->email)
                    <p style="font-size: 10px; color: #6b7280;">{{ $facture->client->email }}</p>
                @endif
                @if($facture->client && $facture->client->telephone)
                    <p style="font-size: 10px; color: #6b7280;">{{ $facture->client->telephone }}</p>
                @endif
                @if($facture->client && $facture->client->adresse)
                    <p style="font-size: 10px; color: #6b7280;">{{ $facture->client->adresse }}</p>
                @endif
            </div>
        </div>
        <div class="info-cell" style="padding-left: 8px;">
            <div class="info-box-right">
                <p class="info-label">COMMANDE</p>
                <p class="info-value">{{ $facture->commande->numero_commande ?? '—' }}</p>
                <p style="font-size: 10px; color: #6b7280;">
                    Échéance : {{ \Carbon\Carbon::parse($facture->date_echeance)->format('d/m/Y') }}
                </p>
                @if($facture->tranche)
                    <p style="font-size: 10px; color: #6b7280;">
                        Tranche {{ $facture->tranche->numero_tranche }}
                        @if($facture->tranche->plan)
                            / {{ $facture->tranche->plan->nombre_tranches }}
                        @endif
                    </p>
                @endif
            </div>
        </div>
    </div>

    <!-- CACHET PAYÉE -->
    @if($facture->statut_paiement === 'payee')
        <div class="stamp">PAYÉE</div>
    @elseif($facture->statut_paiement === 'en_retard')
        <div class="stamp stamp-due">EN RETARD</div>
    @endif

    <!-- DÉTAIL DE LA PRESTATION -->
    <table class="detail">
        <thead>
            <tr>
                <th style="width: 60%;">Désignation</th>
                <th class="text-right" style="width: 15%;">Quantité</th>
                <th class="text-right" style="width: 25%;">Montant HT</th>
            </tr>
        </thead>
        <tbody>
            @if($facture->commande && $facture->commande->devis && $facture->commande->devis->lignes && count($facture->commande->devis->lignes) > 0)
                {{-- Si la commande a un devis avec des lignes, on les affiche --}}
                @foreach($facture->commande->devis->lignes as $ligne)
                    <tr>
                        <td>
                            <strong>{{ $ligne->designation ?? $ligne->libelle ?? 'Prestation' }}</strong>
                            @if(!empty($ligne->description))
                                <br><span style="color: #6b7280; font-size: 9px;">{{ $ligne->description }}</span>
                            @endif
                        </td>
                        <td class="text-right">{{ $ligne->quantite ?? 1 }}</td>
                        <td class="text-right">{{ number_format($ligne->montant_ht ?? ($ligne->quantite ?? 1) * ($ligne->prix_unitaire_ht ?? 0), 0, ',', ' ') }} XAF</td>
                    </tr>
                @endforeach
            @else
                {{-- Sinon, on affiche la désignation de la facture --}}
                <tr>
                    <td>
                        <strong>{{ $facture->designation_prestation }}</strong>
                    </td>
                    <td class="text-right">1</td>
                    <td class="text-right">{{ number_format($facture->montant_ht, 0, ',', ' ') }} XAF</td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- TOTAUX -->
    <div class="totals">
        <table>
            <tr>
                <td>Sous-total HT :</td>
                <td class="text-right"><strong>{{ number_format($facture->montant_ht, 0, ',', ' ') }} XAF</strong></td>
            </tr>
            @if($facture->taux_tva && $facture->taux_tva > 0)
                <tr>
                    <td>TVA ({{ $facture->taux_tva }}%) :</td>
                    <td class="text-right">{{ number_format($facture->montant_tva, 0, ',', ' ') }} XAF</td>
                </tr>
            @endif
            <tr class="total-final">
                <td>TOTAL TTC :</td>
                <td class="text-right">{{ number_format($facture->montant_ttc, 0, ',', ' ') }} XAF</td>
            </tr>
        </table>
    </div>

    <!-- INFOS PAIEMENT SI PAYÉE -->
    @if($facture->statut_paiement === 'payee' && $facture->date_paiement_effectif)
        <div class="progress-box" style="background: #f0fdf4; border-color: #86efac;">
            <p class="progress-title" style="color: #166534;">✓ PAIEMENT REÇU</p>
            <p style="font-size: 10px;">
                Payée le <strong>{{ \Carbon\Carbon::parse($facture->date_paiement_effectif)->format('d/m/Y') }}</strong>
            </p>
        </div>
    @endif

    <!-- INFOS RAPPEL COMMANDE -->
    @if($facture->rappel_total_commande)
        <div class="progress-box">
            <p class="progress-title">Rappel total commande</p>
            <p style="font-size: 11px;">
                Montant total de la commande : <strong>{{ number_format($facture->rappel_total_commande, 0, ',', ' ') }} XAF</strong>
            </p>
        </div>
    @endif

    <!-- FOOTER -->
    <div class="footer">
        <p>
            <strong>{{ $agence['nom'] }}</strong> — {{ $agence['adresse'] }}<br>
            {{ $agence['email'] }} | {{ $agence['telephone'] }}<br>
            <span style="margin-top: 6px; display: inline-block;">Facture générée automatiquement le {{ now()->format('d/m/Y à H:i') }}</span>
        </p>
    </div>

</body>
</html>