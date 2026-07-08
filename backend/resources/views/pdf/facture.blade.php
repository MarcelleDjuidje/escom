<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture {{ $facture->numero_facture }}</title>
    <style>
        @page { margin: 25px 30px 40px 30px; }
        body { font-family: 'DejaVu Sans', sans-serif; color: #1a1a2e; font-size: 10px; line-height: 1.5; margin: 0; }

        /* Header band */
        .header-band {
            background: #0f1b4c;
            color: white;
            padding: 20px 25px;
            margin: -25px -30px 0 -30px;
        }
        .header-table { width: 100%; }
        .header-table td { vertical-align: top; }
        .logo-cell { width: 55%; }
        .facture-cell { width: 45%; text-align: right; }
        .logo { max-height: 40px; margin-bottom: 6px; }
        .company-name { font-size: 20px; font-weight: bold; letter-spacing: 1px; margin: 0; }
        .company-tagline { font-size: 9px; color: #d4af37; font-style: italic; margin: 2px 0 0 0; }
        .facture-label { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #d4af37; margin: 0; }
        .facture-num { font-size: 16px; font-weight: bold; margin: 4px 0 0 0; }
        .facture-date { font-size: 9px; color: #a0a8c4; margin-top: 4px; }

        /* Type badge */
        .badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }
        .badge-acompte { background: #2563eb; color: white; }
        .badge-intermediaire { background: #d97706; color: white; }
        .badge-solde { background: #059669; color: white; }
        .badge-avoir { background: #dc2626; color: white; }

        /* Info blocks */
        .info-row { display: table; width: 100%; margin: 20px 0; }
        .info-col { display: table-cell; width: 50%; vertical-align: top; }
        .info-block { padding: 14px 16px; border-radius: 8px; }
        .info-block-left { background: #f8f9fb; border-left: 3px solid #0f1b4c; margin-right: 10px; }
        .info-block-right { background: #fffbeb; border-left: 3px solid #d4af37; margin-left: 10px; }
        .info-title { font-size: 8px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; color: #6b7280; margin: 0 0 6px 0; }
        .info-name { font-size: 13px; font-weight: bold; color: #0f1b4c; margin: 0; }
        .info-detail { font-size: 9px; color: #6b7280; margin: 2px 0 0 0; }

        /* Detail table */
        .detail-table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        .detail-table thead th {
            background: #0f1b4c;
            color: white;
            padding: 10px 12px;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: left;
        }
        .detail-table thead th:first-child { border-radius: 6px 0 0 0; }
        .detail-table thead th:last-child { border-radius: 0 6px 0 0; text-align: right; }
        .detail-table tbody td {
            padding: 12px;
            border-bottom: 1px solid #f0f1f3;
            font-size: 10px;
        }
        .detail-table tbody tr:last-child td { border-bottom: none; }
        .detail-table .designation { font-weight: 600; color: #0f1b4c; }
        .detail-table .subdesc { font-size: 8px; color: #9ca3af; margin-top: 2px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Totals */
        .totals-wrapper { margin-top: 20px; display: table; width: 100%; }
        .totals-spacer { display: table-cell; width: 55%; }
        .totals-box { display: table-cell; width: 45%; }
        .totals-table { width: 100%; border-collapse: collapse; }
        .totals-table td { padding: 6px 12px; font-size: 10px; }
        .totals-table .subtotal td { color: #6b7280; }
        .totals-table .tva td { color: #6b7280; border-bottom: 1px solid #e5e7eb; }
        .totals-table .grand-total td {
            background: #0f1b4c;
            color: white;
            font-size: 13px;
            font-weight: bold;
            padding: 10px 12px;
        }
        .totals-table .grand-total td:first-child { border-radius: 0 0 0 6px; }
        .totals-table .grand-total td:last-child { border-radius: 0 0 6px 0; }

        /* Stamps */
        .stamp {
            position: absolute;
            top: 320px;
            right: 80px;
            transform: rotate(-20deg);
            border: 3px solid;
            padding: 6px 30px;
            font-size: 20px;
            font-weight: bold;
            opacity: 0.6;
            letter-spacing: 3px;
            border-radius: 8px;
        }
        .stamp-payee { border-color: #059669; color: #059669; }
        .stamp-retard { border-color: #dc2626; color: #dc2626; }

        /* Payment info */
        .payment-box {
            margin-top: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 9px;
        }
        .payment-success { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
        .payment-pending { background: #fefce8; border: 1px solid #fde68a; color: #92400e; }

        /* Tranche info */
        .tranche-box {
            margin-top: 12px;
            padding: 10px 14px;
            background: #f8f9fb;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .tranche-title { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; color: #6b7280; margin: 0 0 4px 0; }

        /* Footer */
        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 2px solid #0f1b4c;
            text-align: center;
            color: #9ca3af;
            font-size: 8px;
        }
        .footer-company { font-weight: bold; color: #0f1b4c; font-size: 9px; }
        .footer-gold { color: #d4af37; }
    </style>
</head>
<body>

    {{-- HEADER BAND --}}
    <div class="header-band">
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    @if($logoData)
                        <img src="data:image/png;base64,{{ $logoData }}" class="logo" alt="Logo">
                    @endif
                    <p class="company-name">{{ $agence['nom'] }}</p>
                    <p class="company-tagline">{{ $agence['tagline'] }}</p>
                </td>
                <td class="facture-cell">
                    <p class="facture-label">Facture</p>
                    <p class="facture-num">{{ $facture->numero_facture }}</p>
                    <p class="facture-date">
                        Emise le {{ \Carbon\Carbon::parse($facture->date_emission)->format('d/m/Y') }}
                    </p>
                    @php
                        $typeBadge = match($facture->type_facture ?? 'solde') {
                            'acompte' => 'badge-acompte',
                            'intermediaire' => 'badge-intermediaire',
                            'avoir' => 'badge-avoir',
                            default => 'badge-solde',
                        };
                    @endphp
                    <span class="badge {{ $typeBadge }}">
                        {{ strtoupper($facture->type_facture ?? 'solde') }}
                    </span>
                </td>
            </tr>
        </table>
    </div>

    {{-- STAMPS --}}
    @if($facture->statut_paiement === 'payee')
        <div class="stamp stamp-payee">PAYEE</div>
    @elseif($facture->statut_paiement === 'en_retard')
        <div class="stamp stamp-retard">EN RETARD</div>
    @endif

    {{-- CLIENT & COMMANDE INFO --}}
    <div class="info-row">
        <div class="info-col">
            <div class="info-block info-block-left">
                <p class="info-title">Facture a</p>
                <p class="info-name">{{ $facture->client->nom_complet ?? $facture->client->raison_sociale ?? 'Client' }}</p>
                @if($facture->client && $facture->client->email)
                    <p class="info-detail">{{ $facture->client->email }}</p>
                @endif
                @if($facture->client && $facture->client->telephone)
                    <p class="info-detail">{{ $facture->client->telephone }}</p>
                @endif
                @if($facture->client && $facture->client->adresse)
                    <p class="info-detail">{{ $facture->client->adresse }}</p>
                @endif
            </div>
        </div>
        <div class="info-col">
            <div class="info-block info-block-right">
                <p class="info-title">Commande</p>
                <p class="info-name">{{ $facture->commande->numero_commande ?? '---' }}</p>
                <p class="info-detail">
                    Echeance : {{ \Carbon\Carbon::parse($facture->date_echeance)->format('d/m/Y') }}
                </p>
                @if($facture->tranche)
                    <p class="info-detail">
                        Tranche {{ $facture->tranche->numero_tranche }}
                        @if($facture->tranche->plan)
                            sur {{ $facture->tranche->plan->nombre_tranches }}
                        @endif
                    </p>
                @endif
            </div>
        </div>
    </div>

    {{-- DETAIL TABLE --}}
    <table class="detail-table">
        <thead>
            <tr>
                <th style="width: 55%;">Designation</th>
                <th class="text-center" style="width: 15%;">Qte</th>
                <th class="text-right" style="width: 30%;">Montant HT</th>
            </tr>
        </thead>
        <tbody>
            @if($facture->commande && $facture->commande->devis && $facture->commande->devis->lignes && count($facture->commande->devis->lignes) > 0)
                @foreach($facture->commande->devis->lignes as $ligne)
                    <tr>
                        <td>
                            <div class="designation">{{ $ligne->designation ?? $ligne->libelle ?? 'Prestation' }}</div>
                            @if(!empty($ligne->description))
                                <div class="subdesc">{{ $ligne->description }}</div>
                            @endif
                        </td>
                        <td class="text-center">{{ $ligne->quantite ?? 1 }}</td>
                        <td class="text-right" style="font-weight: 600;">
                            {{ number_format($ligne->montant_ht ?? ($ligne->quantite ?? 1) * ($ligne->prix_unitaire_ht ?? 0), 0, ',', ' ') }} XAF
                        </td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td>
                        <div class="designation">{{ $facture->designation_prestation }}</div>
                    </td>
                    <td class="text-center">1</td>
                    <td class="text-right" style="font-weight: 600;">
                        {{ number_format($facture->montant_ht, 0, ',', ' ') }} XAF
                    </td>
                </tr>
            @endif
        </tbody>
    </table>

    {{-- TOTALS --}}
    <div class="totals-wrapper">
        <div class="totals-spacer"></div>
        <div class="totals-box">
            <table class="totals-table">
                <tr class="subtotal">
                    <td>Sous-total HT</td>
                    <td class="text-right"><strong>{{ number_format($facture->montant_ht, 0, ',', ' ') }} XAF</strong></td>
                </tr>
                @if($facture->taux_tva && $facture->taux_tva > 0)
                    <tr class="tva">
                        <td>TVA ({{ $facture->taux_tva }}%)</td>
                        <td class="text-right">{{ number_format($facture->montant_tva, 0, ',', ' ') }} XAF</td>
                    </tr>
                @endif
                <tr class="grand-total">
                    <td>TOTAL TTC</td>
                    <td class="text-right">{{ number_format($facture->montant_ttc, 0, ',', ' ') }} XAF</td>
                </tr>
            </table>
        </div>
    </div>

    {{-- PAYMENT STATUS --}}
    @if($facture->statut_paiement === 'payee' && $facture->date_paiement_effectif)
        <div class="payment-box payment-success">
            <strong>Paiement recu</strong> le {{ \Carbon\Carbon::parse($facture->date_paiement_effectif)->format('d/m/Y') }}
        </div>
    @elseif($facture->statut_paiement === 'non_payee')
        <div class="payment-box payment-pending">
            <strong>En attente de paiement</strong> — Echeance le {{ \Carbon\Carbon::parse($facture->date_echeance)->format('d/m/Y') }}
        </div>
    @endif

    {{-- RAPPEL TOTAL COMMANDE --}}
    @if($facture->rappel_total_commande)
        <div class="tranche-box">
            <p class="tranche-title">Rappel total commande</p>
            <p style="font-size: 10px;">
                Montant total : <strong>{{ number_format($facture->rappel_total_commande, 0, ',', ' ') }} XAF</strong>
            </p>
        </div>
    @endif

    {{-- FOOTER --}}
    <div class="footer">
        <p class="footer-company">{{ $agence['nom'] }} <span class="footer-gold">|</span> {{ $agence['tagline'] }}</p>
        <p>{{ $agence['adresse'] }}</p>
        <p>{{ $agence['email'] }} | {{ $agence['telephone'] }}</p>
        <p style="margin-top: 6px; color: #c4c8d4;">
            Document genere le {{ now()->format('d/m/Y a H:i') }}
        </p>
    </div>

</body>
</html>
