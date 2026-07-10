<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture {{ $facture->numero_facture }}</title>
    <style>
        @page { margin: 0; }
        body { font-family: 'DejaVu Sans', sans-serif; color: #222; font-size: 10px; line-height: 1.5; margin: 0; padding: 0; }

        /* === TOP BAND === */
        .top-band {
            background: linear-gradient(135deg, #0f1b4c 0%, #1a2d6d 100%);
            height: 8px;
        }

        /* === HEADER === */
        .header {
            padding: 30px 40px 20px 40px;
        }
        .header-table { width: 100%; border-collapse: collapse; }
        .header-table td { vertical-align: top; }
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #0f1b4c;
            letter-spacing: 3px;
            margin: 0;
        }
        .company-tagline {
            font-size: 9px;
            color: #b8860b;
            letter-spacing: 1px;
            margin: 4px 0 0 0;
        }
        .company-info {
            font-size: 8px;
            color: #888;
            margin-top: 8px;
            line-height: 1.6;
        }

        /* === FACTURE TITLE === */
        .facture-title-box {
            text-align: right;
        }
        .facture-title {
            font-size: 26px;
            font-weight: bold;
            color: #0f1b4c;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .facture-num {
            font-size: 12px;
            color: #555;
            margin: 4px 0;
            font-family: monospace;
        }
        .facture-date {
            font-size: 9px;
            color: #999;
        }
        .badge {
            display: inline-block;
            padding: 3px 14px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 8px;
        }
        .badge-acompte { background: #e0edff; color: #1d4ed8; }
        .badge-intermediaire { background: #fef3c7; color: #b45309; }
        .badge-solde { background: #d1fae5; color: #047857; }
        .badge-avoir { background: #fee2e2; color: #b91c1c; }

        /* === SEPARATOR === */
        .separator {
            border: none;
            height: 1px;
            background: #e5e7eb;
            margin: 0 40px;
        }
        .gold-line {
            border: none;
            height: 2px;
            background: #d4af37;
            margin: 0 40px;
        }

        /* === CLIENT / COMMANDE === */
        .info-section {
            padding: 20px 40px;
        }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { vertical-align: top; width: 50%; }
        .info-label {
            font-size: 7px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #b8860b;
            font-weight: bold;
            margin: 0 0 8px 0;
        }
        .info-value {
            font-size: 12px;
            font-weight: bold;
            color: #0f1b4c;
            margin: 0 0 3px 0;
        }
        .info-sub {
            font-size: 9px;
            color: #666;
            margin: 2px 0;
        }

        /* === DETAIL TABLE === */
        .detail-section { padding: 10px 40px 0 40px; }
        .detail-table { width: 100%; border-collapse: collapse; }
        .detail-table thead th {
            background: #0f1b4c;
            color: white;
            padding: 10px 14px;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            text-align: left;
        }
        .detail-table thead th:last-child { text-align: right; }
        .detail-table thead th.text-center { text-align: center; }
        .detail-table tbody td {
            padding: 12px 14px;
            font-size: 10px;
            border-bottom: 1px solid #f3f4f6;
        }
        .detail-table tbody tr:nth-child(even) td { background: #fafbfc; }
        .detail-table tbody tr:last-child td { border-bottom: 2px solid #e5e7eb; }
        .designation { font-weight: 600; color: #111; }
        .subdesc { font-size: 8px; color: #999; margin-top: 2px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* === TOTALS === */
        .totals-section { padding: 0 40px; }
        .totals-outer { width: 100%; border-collapse: collapse; }
        .totals-outer td { vertical-align: top; }
        .totals-spacer { width: 50%; }
        .totals-box-cell { width: 50%; }
        .totals-table { width: 100%; border-collapse: collapse; }
        .totals-table td { padding: 7px 14px; font-size: 10px; }
        .totals-table .row-ht td { color: #666; }
        .totals-table .row-tva td { color: #666; border-bottom: 1px solid #e5e7eb; }
        .totals-table .row-total td {
            background: #0f1b4c;
            color: white;
            font-size: 14px;
            font-weight: bold;
            padding: 12px 14px;
        }

        /* === PAYMENT STATUS === */
        .payment-section { padding: 15px 40px; }
        .payment-box {
            padding: 12px 16px;
            border-radius: 4px;
            font-size: 10px;
        }
        .payment-paid { background: #ecfdf5; border-left: 4px solid #059669; color: #065f46; }
        .payment-pending { background: #fffbeb; border-left: 4px solid #d97706; color: #92400e; }

        /* === TRANCHE === */
        .tranche-section { padding: 0 40px 15px 40px; }
        .tranche-box {
            padding: 10px 14px;
            background: #f8f9fb;
            border-left: 3px solid #0f1b4c;
            font-size: 9px;
            color: #555;
        }

        /* === CONDITIONS === */
        .conditions-section { padding: 10px 40px; }
        .conditions {
            font-size: 8px;
            color: #999;
            line-height: 1.7;
        }
        .conditions strong { color: #666; }

        /* === FOOTER === */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #0f1b4c;
            color: white;
            padding: 12px 40px;
            font-size: 8px;
            text-align: center;
        }
        .footer-gold { color: #d4af37; }

        /* === STAMPS === */
        .stamp {
            position: absolute;
            top: 380px;
            right: 80px;
            transform: rotate(-18deg);
            border: 4px double;
            padding: 8px 35px;
            font-size: 22px;
            font-weight: bold;
            opacity: 0.15;
            letter-spacing: 5px;
            border-radius: 6px;
            text-transform: uppercase;
        }
        .stamp-payee { border-color: #059669; color: #059669; }
        .stamp-retard { border-color: #dc2626; color: #dc2626; }
    </style>
</head>
<body>

    {{-- TOP DECORATIVE BAND --}}
    <div class="top-band"></div>

    {{-- STAMPS --}}
    @if($facture->statut_paiement === 'payee')
        <div class="stamp stamp-payee">Payee</div>
    @elseif($facture->statut_paiement === 'en_retard')
        <div class="stamp stamp-retard">En retard</div>
    @endif

    {{-- HEADER --}}
    <div class="header">
        <table class="header-table">
            <tr>
                <td style="width: 50%;">
                    @if($logoData)
                        <img src="data:image/png;base64,{{ $logoData }}" style="max-height: 36px; margin-bottom: 6px;" alt="Logo">
                    @endif
                    <p class="company-name">{{ $agence['nom'] }}</p>
                    <p class="company-tagline">{{ $agence['tagline'] }}</p>
                    <div class="company-info">
                        {{ $agence['adresse'] }}<br>
                        {{ $agence['telephone'] }} | {{ $agence['email'] }}
                    </div>
                </td>
                <td style="width: 50%;">
                    <div class="facture-title-box">
                        <p class="facture-title">Facture</p>
                        <p class="facture-num">N° {{ $facture->numero_facture }}</p>
                        <p class="facture-date">
                            Date d'emission : {{ \Carbon\Carbon::parse($facture->date_emission)->format('d/m/Y') }}<br>
                            Echeance : {{ \Carbon\Carbon::parse($facture->date_echeance)->format('d/m/Y') }}
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
                            {{ ucfirst($facture->type_facture ?? 'solde') }}
                        </span>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <hr class="gold-line">

    {{-- CLIENT & COMMANDE --}}
    <div class="info-section">
        <table class="info-table">
            <tr>
                <td style="padding-right: 20px;">
                    <p class="info-label">Facturer a</p>
                    <p class="info-value">{{ $facture->client->nom_complet ?? $facture->client->raison_sociale ?? 'Client' }}</p>
                    @if($facture->client && $facture->client->email)
                        <p class="info-sub">{{ $facture->client->email }}</p>
                    @endif
                    @if($facture->client && $facture->client->telephone)
                        <p class="info-sub">{{ $facture->client->telephone }}</p>
                    @endif
                    @if($facture->client && $facture->client->adresse)
                        <p class="info-sub">{{ $facture->client->adresse }}</p>
                    @endif
                </td>
                <td style="padding-left: 20px;">
                    <p class="info-label">Reference commande</p>
                    <p class="info-value">{{ $facture->commande->numero_commande ?? '---' }}</p>
                    @if($facture->tranche)
                        <p class="info-sub">
                            Tranche {{ $facture->tranche->numero_tranche }}
                            @if($facture->tranche->plan)
                                / {{ $facture->tranche->plan->nombre_tranches }}
                            @endif
                        </p>
                    @endif
                    <p class="info-sub">
                        Commande du {{ $facture->commande ? \Carbon\Carbon::parse($facture->commande->date_commande)->format('d/m/Y') : '---' }}
                    </p>
                </td>
            </tr>
        </table>
    </div>

    <hr class="separator">

    {{-- DETAIL TABLE --}}
    <div class="detail-section">
        <table class="detail-table">
            <thead>
                <tr>
                    <th style="width: 50%;">Designation</th>
                    <th class="text-center" style="width: 15%;">Quantite</th>
                    <th class="text-right" style="width: 17%;">P.U. HT</th>
                    <th class="text-right" style="width: 18%;">Total HT</th>
                </tr>
            </thead>
            <tbody>
                @php $hasLignes = false; @endphp
                @if($facture->commande && $facture->commande->devis && $facture->commande->devis->lignes && count($facture->commande->devis->lignes) > 0)
                    @php $hasLignes = true; @endphp
                    @foreach($facture->commande->devis->lignes as $ligne)
                        <tr>
                            <td>
                                <div class="designation">{{ $ligne->designation ?? $ligne->libelle ?? 'Prestation' }}</div>
                                @if(!empty($ligne->description))
                                    <div class="subdesc">{{ $ligne->description }}</div>
                                @endif
                            </td>
                            <td class="text-center">{{ $ligne->quantite ?? 1 }}</td>
                            <td class="text-right">
                                {{ number_format($ligne->prix_unitaire_ht ?? 0, 0, ',', ' ') }} XAF
                            </td>
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
                        <td class="text-right">
                            {{ number_format($facture->montant_ht, 0, ',', ' ') }} XAF
                        </td>
                        <td class="text-right" style="font-weight: 600;">
                            {{ number_format($facture->montant_ht, 0, ',', ' ') }} XAF
                        </td>
                    </tr>
                @endif
            </tbody>
        </table>
    </div>

    {{-- TOTALS --}}
    <div class="totals-section">
        <table class="totals-outer">
            <tr>
                <td class="totals-spacer">
                    @if($facture->rappel_total_commande)
                        <div class="tranche-box" style="margin-top: 10px;">
                            <strong style="color: #0f1b4c;">Rappel total commande :</strong>
                            {{ number_format($facture->rappel_total_commande, 0, ',', ' ') }} XAF TTC
                        </div>
                    @endif
                </td>
                <td class="totals-box-cell">
                    <table class="totals-table">
                        <tr class="row-ht">
                            <td>Sous-total HT</td>
                            <td class="text-right"><strong>{{ number_format($facture->montant_ht, 0, ',', ' ') }} XAF</strong></td>
                        </tr>
                        @if($facture->taux_tva && $facture->taux_tva > 0)
                            <tr class="row-tva">
                                <td>TVA ({{ $facture->taux_tva }}%)</td>
                                <td class="text-right">{{ number_format($facture->montant_tva, 0, ',', ' ') }} XAF</td>
                            </tr>
                        @else
                            <tr class="row-tva">
                                <td>TVA</td>
                                <td class="text-right">0 XAF</td>
                            </tr>
                        @endif
                        <tr class="row-total">
                            <td>Total TTC</td>
                            <td class="text-right">{{ number_format($facture->montant_ttc, 0, ',', ' ') }} XAF</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    {{-- PAYMENT STATUS --}}
    <div class="payment-section">
        @if($facture->statut_paiement === 'payee' && $facture->date_paiement_effectif)
            <div class="payment-box payment-paid">
                <strong>Reglement recu</strong> le {{ \Carbon\Carbon::parse($facture->date_paiement_effectif)->format('d/m/Y') }}
                @if($facture->mode_paiement)
                    — Mode : {{ ucfirst(str_replace('_', ' ', $facture->mode_paiement)) }}
                @endif
            </div>
        @elseif($facture->statut_paiement === 'non_payee')
            <div class="payment-box payment-pending">
                <strong>En attente de reglement</strong> — Echeance le {{ \Carbon\Carbon::parse($facture->date_echeance)->format('d/m/Y') }}
            </div>
        @endif
    </div>

    {{-- CONDITIONS --}}
    <div class="conditions-section">
        <div class="conditions">
            <strong>Conditions de paiement :</strong> Paiement a reception de facture par Mobile Money (Orange Money, MTN MoMo) ou virement bancaire.<br>
            <strong>Penalites de retard :</strong> En cas de retard de paiement, une penalite de 1,5% par mois sera appliquee.<br>
            Conformement a la loi, aucun escompte n'est accorde en cas de paiement anticipe.
        </div>
    </div>

    {{-- FOOTER --}}
    <div class="footer">
        <span class="footer-gold">{{ $agence['nom'] }}</span> &nbsp;|&nbsp;
        {{ $agence['adresse'] }} &nbsp;|&nbsp;
        {{ $agence['telephone'] }} &nbsp;|&nbsp;
        {{ $agence['email'] }}
        <br>
        <span style="color: #8892b0; font-size: 7px;">
            Document genere le {{ now()->format('d/m/Y a H:i') }}
        </span>
    </div>

</body>
</html>
