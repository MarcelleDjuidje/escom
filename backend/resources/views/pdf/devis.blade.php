<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Devis {{ $devis->numero_devis }}</title>
<style>
    @page { margin: 30px 40px; }
    body { font-family: 'Helvetica', sans-serif; color: #1f2937; font-size: 11px; }
    .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 3px solid #1d4ed8; padding-bottom: 14px; margin-bottom: 20px; }
    .logo-block { display: inline-block; vertical-align: top; }
    .logo { width: 90px; height: 90px; }
    .agence-name { font-size: 28px; color: #1d4ed8; font-weight: bold; margin: 0; }
    .agence-tagline { font-size: 10px; color: #d4af37; font-style: italic; margin: 0; }
    .agence-info { font-size: 10px; color: #6b7280; margin-top: 8px; }
    .doc-title { text-align: right; }
    .doc-title h1 { color: #d4af37; margin: 0; font-size: 32px; }
    .doc-numero { background: #1d4ed8; color: white; padding: 4px 10px; display: inline-block; margin-top: 4px; font-weight: bold; }
    .meta { display: flex; justify-content: space-between; margin: 18px 0; }
    .meta-block { width: 48%; }
    .meta-block h3 { background: #f3f4f6; padding: 6px 10px; margin: 0 0 6px; color: #1d4ed8; font-size: 12px; }
    .meta-block p { margin: 2px 0; padding-left: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #1d4ed8; color: white; padding: 8px; text-align: left; font-size: 10px; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #f9fafb; }
    .totaux { margin-top: 16px; width: 50%; float: right; }
    .totaux div { display: flex; justify-content: space-between; padding: 5px 10px; }
    .totaux .total { background: #d4af37; color: white; font-weight: bold; font-size: 14px; }
    .footer { margin-top: 100px; padding-top: 12px; border-top: 2px solid #1d4ed8; font-size: 9px; color: #6b7280; text-align: center; }
    .clear { clear: both; }
    .notes { margin-top: 20px; padding: 10px; background: #fef3c7; border-left: 4px solid #d4af37; }
</style>
</head>
<body>
<div class="header">
    <div class="logo-block">
        @if($logoData)<img src="data:image/png;base64,{{ $logoData }}" class="logo" alt="ESCOM">@endif
    </div>
    <div style="flex:1; padding-left: 20px;">
        <h2 class="agence-name">{{ $agence['nom'] }}</h2>
        <p class="agence-tagline">{{ $agence['tagline'] }}</p>
        <p class="agence-info">{{ $agence['adresse'] }}<br>{{ $agence['email'] }} • {{ $agence['telephone'] }}</p>
    </div>
    <div class="doc-title">
        <h1>DEVIS</h1>
        <div class="doc-numero">{{ $devis->numero_devis }}</div>
    </div>
</div>

<div class="meta">
    <div class="meta-block">
        <h3>Émis pour</h3>
        <p><strong>{{ $devis->client->nom_complet }}</strong></p>
        @if($devis->client->raison_sociale)<p>{{ $devis->client->raison_sociale }}</p>@endif
        <p>{{ $devis->client->email }}</p>
        <p>{{ $devis->client->telephone }}</p>
        @if($devis->client->adresse)<p>{{ $devis->client->adresse }}</p>@endif
    </div>
    <div class="meta-block">
        <h3>Détails</h3>
        <p><strong>Date d'émission :</strong> {{ \Carbon\Carbon::parse($devis->date_creation)->format('d/m/Y') }}</p>
        <p><strong>Validité jusqu'au :</strong> {{ \Carbon\Carbon::parse($devis->date_validite)->format('d/m/Y') }}</p>
        <p><strong>Statut :</strong> {{ ucfirst($devis->statut) }}</p>
        @if($devis->employe)<p><strong>Commercial :</strong> {{ $devis->employe->prenom }} {{ $devis->employe->nom }}</p>@endif
    </div>
</div>

<table>
<thead>
<tr>
    <th>Désignation</th>
    <th style="text-align:right">Qté</th>
    <th style="text-align:right">PU HT</th>
    <th style="text-align:right">Remise</th>
    <th style="text-align:right">Total HT</th>
</tr>
</thead>
<tbody>
@foreach($devis->lignes as $l)
<tr>
    <td>{{ $l->designation }}<br><small style="color:#6b7280">{{ $l->type_service }}</small></td>
    <td style="text-align:right">{{ number_format($l->quantite, 2, ',', ' ') }}</td>
    <td style="text-align:right">{{ number_format($l->prix_unitaire_ht, 0, ',', ' ') }}</td>
    <td style="text-align:right">{{ number_format($l->remise_ligne_pct, 1) }}%</td>
    <td style="text-align:right"><strong>{{ number_format($l->total_ligne_ht, 0, ',', ' ') }} XAF</strong></td>
</tr>
@endforeach
</tbody>
</table>

<div class="totaux">
    <div><span>Sous-total HT</span><span>{{ number_format($devis->sous_total_ht, 0, ',', ' ') }} XAF</span></div>
    <div><span>Remise globale ({{ number_format($devis->remise_pct, 2) }}%)</span><span>-{{ number_format($devis->sous_total_ht * $devis->remise_pct / 100, 0, ',', ' ') }} XAF</span></div>
    <div><span>TVA ({{ number_format($devis->taux_tva, 2) }}%)</span><span>{{ number_format(($devis->sous_total_ht * (1 - $devis->remise_pct / 100)) * $devis->taux_tva / 100, 0, ',', ' ') }} XAF</span></div>
    <div class="total"><span>TOTAL TTC</span><span>{{ number_format($devis->total_ttc, 0, ',', ' ') }} XAF</span></div>
</div>
<div class="clear"></div>

@if($devis->notes_internes)
<div class="notes"><strong>Notes :</strong><br>{{ $devis->notes_internes }}</div>
@endif

<div class="footer">
    <strong>ESCOM</strong> — {{ $agence['adresse'] }} — Devis valable 30 jours, prix en XAF, TVA 19,25%<br>
    Code unique : {{ $devis->numero_devis }}-{{ \Carbon\Carbon::parse($devis->date_creation)->format('Ymd') }}-{{ str_pad($devis->id_devis, 6, '0', STR_PAD_LEFT) }}
</div>
</body>
</html>
