'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, ShoppingCart, ArrowLeft, Plus, Minus, Calendar, MapPin, CreditCard } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { PaiementForceModal } from '@/components/dashboard/paiement-force-modal'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { formatXAF } from '@/lib/utils'
import { toast } from 'sonner'

const TYPE_ENDPOINTS: Record<string, { endpoint: string; idKey: string; priceKey: string; label: string; typeBackend: string }> = {
  conception: { endpoint: '/public/services/conception', idKey: 'id_service_conception', priceKey: 'prix_unitaire_ht', label: 'Conception', typeBackend: 'CONCEPTION' },
  impression: { endpoint: '/public/services/impression', idKey: 'id_service_impression', priceKey: 'prix_unitaire_ht', label: 'Impression', typeBackend: 'IMPRESSION' },
  social: { endpoint: '/public/services/social', idKey: 'id_service_social', priceKey: 'prix_ht', label: 'Social Media', typeBackend: 'SOCIAL' },
  campagnes: { endpoint: '/public/services/campagnes', idKey: 'id_campagne', priceKey: 'prix_indicatif_min', label: 'Campagne', typeBackend: 'CAMPAGNE' },
}

function NouvelleCommandeContent() {
  const router = useRouter()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type') || 'conception'
  const serviceIdParam = searchParams.get('service')

  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [service, setService] = useState<any>(null)
  const [quantite, setQuantite] = useState(1)
  const [dateLivraison, setDateLivraison] = useState('')
  const [adresseLivraison, setAdresseLivraison] = useState('')
  const [notes, setNotes] = useState('')
  const [modeLivraison, setModeLivraison] = useState('remise_en_main')
  const [planPaiement, setPlanPaiement] = useState<'integral' | 'tranches'>('integral')
  const [nbTranches, setNbTranches] = useState(2)
  const [pourcentageAvance, setPourcentageAvance] = useState(30)
  const [showPaiementModal, setShowPaiementModal] = useState(false)

  const config = TYPE_ENDPOINTS[typeParam] || TYPE_ENDPOINTS.conception

  // Les campagnes passent obligatoirement par un devis (demande de campagne)
  const demandeId = searchParams.get('demande')
  const prixDevis = searchParams.get('prix')

  useEffect(() => {
    if (typeParam === 'campagnes' && !demandeId) {
      toast.error('Les campagnes nécessitent un devis accepté.')
      router.replace('/dashboard/client/demandes')
      return
    }
    setLoading(true)
    api.get(config.endpoint)
      .then((r: any) => {
        const list = r.data || []
        setServices(list)
        if (serviceIdParam) {
          const found = list.find((s: any) => String(s[config.idKey]) === serviceIdParam)
          if (found) setService(found)
        }
      })
      .finally(() => setLoading(false))
  }, [typeParam, serviceIdParam])

  useEffect(() => {
    if (service) return
    try {
      const intent = sessionStorage.getItem('escom_order_intent')
      if (intent) {
        const { id } = JSON.parse(intent)
        const found = services.find((s: any) => String(s[config.idKey]) === String(id))
        if (found) {
          setService(found)
          sessionStorage.removeItem('escom_order_intent')
        }
      }
    } catch {}
  }, [services])

  // Pour les campagnes sur devis, le prix est celui du devis accepté
  const prixUnitaire = (typeParam === 'campagnes' && prixDevis)
    ? Number(prixDevis)
    : (service ? Number(service[config.priceKey] || 0) : 0)
  const totalHT = prixUnitaire * quantite
  const totalTTC = totalHT

  // Calcul des tranches dynamique
  const tranches = (() => {
    if (planPaiement === 'integral') {
      return [{ libelle: 'Paiement intégral', pourcentage: 100, montant_du_ttc: totalTTC }]
    }
    const avance = Math.round((totalTTC * pourcentageAvance) / 100)
    const reste = totalTTC - avance
    const result = [
      { libelle: 'Avance', pourcentage: pourcentageAvance, montant_du_ttc: avance },
    ]
    if (nbTranches === 2) {
      result.push({ libelle: 'Solde', pourcentage: 100 - pourcentageAvance, montant_du_ttc: reste })
    } else if (nbTranches === 3) {
      const intermediaire = Math.round(reste / 2)
      result.push(
        { libelle: 'Tranche intermédiaire', pourcentage: (100 - pourcentageAvance) / 2, montant_du_ttc: intermediaire },
        { libelle: 'Solde', pourcentage: (100 - pourcentageAvance) / 2, montant_du_ttc: reste - intermediaire },
      )
    }
    return result
  })()

  // Calcul des dates d'échéance des tranches
  const buildPanierPayload = () => {
    const livraisonDate = new Date(dateLivraison)
    const today = new Date()

    const tranchesPayload = tranches.map((t, idx) => {
      const echeance = idx === 0
        ? today
        : new Date(today.getTime() + ((livraisonDate.getTime() - today.getTime()) * (idx / Math.max(tranches.length - 1, 1))))
      return {
        libelle: t.libelle,
        montant_du_ttc: t.montant_du_ttc,
        date_echeance_prevue: echeance.toISOString().split('T')[0],
      }
    })

    return {
      lignes: [{
        type_service: config.typeBackend,
        id_service: service[config.idKey],
        designation: service.libelle,
        quantite,
        prix_unitaire_ht: prixUnitaire,
      }],
      total_ttc: totalTTC,
      paiement_en_tranches: planPaiement === 'tranches',
      tranches_prevues: planPaiement === 'tranches' ? tranchesPayload : undefined,
      mode_livraison: modeLivraison,
      date_livraison_souhaitee: dateLivraison,
      notes: modeLivraison === 'livraison_physique' && adresseLivraison.trim()
        ? `Adresse de livraison : ${adresseLivraison.trim()}${notes ? '\n' + notes : ''}`
        : notes || null,
      ...(demandeId ? { id_demande_campagne: Number(demandeId) } : {}),
    }
  }

  const handleClickCommander = () => {
    if (!service) {
      toast.error('Veuillez sélectionner un service')
      return
    }
    if (!dateLivraison) {
      toast.error('Veuillez choisir une date de livraison souhaitée')
      return
    }
    if (planPaiement === 'tranches' && pourcentageAvance < 30) {
      toast.error('L\'avance minimum est de 30% du montant total')
      return
    }
    if (modeLivraison === 'livraison_physique' && !adresseLivraison.trim()) {
      toast.error('Veuillez préciser l\'adresse de livraison')
      return
    }

    // Ouvrir la modale de paiement OBLIGATOIRE
    setShowPaiementModal(true)
  }

  // La date de livraison doit être DEMAIN au plus tôt (jamais aujourd'hui)
  const minDate = (() => {
    const demain = new Date()
    demain.setDate(demain.getDate() + 1)
    return demain.toISOString().split('T')[0]
  })()

  return (
    <DashboardLayout role="client">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Nouvelle commande</h1>
          <p className="text-sm text-escom-neutral-500">Choisissez le service et précisez votre besoin</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-escom-blue-600" /></div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-6">

            <div className="card-escom p-5">
              <h2 className="font-semibold mb-3">1. Type de service</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(TYPE_ENDPOINTS).filter(([k]) => k !== 'campagnes' || demandeId).map(([k, v]) => (
                  <button key={k}
                    onClick={() => k === 'campagnes' ? null : router.push(`/dashboard/client/commandes/nouveau?type=${k}`)}
                    className={`p-3 rounded-lg text-sm font-semibold transition ${
                      typeParam === k ? 'bg-escom-blue-600 text-white' : 'bg-escom-neutral-100 hover:bg-escom-neutral-200'
                    } ${k === 'campagnes' ? 'cursor-default' : ''}`}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-escom p-5">
              <h2 className="font-semibold mb-3">2. Service souhaité *</h2>
              {services.length === 0 ? (
                <p className="text-sm text-escom-neutral-500 py-3">Aucun service disponible. Essayez une autre catégorie.</p>
              ) : (
                <select value={service?.[config.idKey] || ''}
                  onChange={e => {
                    const found = services.find((s: any) => String(s[config.idKey]) === e.target.value)
                    setService(found || null)
                  }}
                  className="input-escom">
                  <option value="">-- Choisir un service --</option>
                  {services.map((s: any) => (
                    <option key={s[config.idKey]} value={s[config.idKey]}>
                      {s.libelle} — {formatXAF(s[config.priceKey])}
                    </option>
                  ))}
                </select>
              )}

              {service && (
                <div className="mt-4 p-4 bg-escom-blue-50 rounded-lg">
                  <p className="font-semibold">{service.libelle}</p>
                  {service.description && <p className="text-sm text-escom-neutral-700 mt-1">{service.description}</p>}
                  {service.delai_realisation_jours && (
                    <p className="text-xs text-escom-neutral-600 mt-2">⏱ Délai : {service.delai_realisation_jours} jours</p>
                  )}
                </div>
              )}
            </div>

            {service && (
              <div className="card-escom p-5">
                <h2 className="font-semibold mb-3">3. Quantité</h2>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantite(Math.max(1, quantite - 1))}
                    className="w-10 h-10 rounded-lg bg-escom-neutral-100 hover:bg-escom-neutral-200 flex items-center justify-center">
                    <Minus size={16} />
                  </button>
                  <input type="number" min={1} value={quantite}
                    onChange={e => setQuantite(Math.max(1, Number(e.target.value)))}
                    className="input-escom w-24 text-center" />
                  <button onClick={() => setQuantite(quantite + 1)}
                    className="w-10 h-10 rounded-lg bg-escom-neutral-100 hover:bg-escom-neutral-200 flex items-center justify-center">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}

            <div className="card-escom p-5">
              <h2 className="font-semibold mb-3">4. Livraison</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Mode de livraison *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'remise_en_main', label: 'Retrait en agence', desc: 'Je passe récupérer' },
                      { id: 'livraison_physique', label: 'Livraison à domicile', desc: 'Douala / Yaoundé / Bafoussam' },
                      { id: 'envoi_email', label: 'Envoi par email', desc: 'Livrables numériques' },
                    ].map(m => (
                      <button key={m.id} type="button"
                        onClick={() => setModeLivraison(m.id)}
                        className={`p-3 rounded-lg border-2 text-left transition ${
                          modeLivraison === m.id
                            ? 'border-escom-blue-600 bg-escom-blue-50'
                            : 'border-escom-neutral-200 hover:border-escom-neutral-300'
                        }`}>
                        <p className="font-semibold text-sm">{m.label}</p>
                        <p className="text-xs text-escom-neutral-500 mt-1">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1 flex items-center gap-2">
                    <Calendar size={14} /> Date de livraison souhaitée *
                  </label>
                  <input type="date" value={dateLivraison} min={minDate}
                    onChange={e => setDateLivraison(e.target.value)} className="input-escom" />
                </div>

                {modeLivraison === 'livraison_physique' && (
                  <div>
                    <label className="text-sm font-medium block mb-1 flex items-center gap-2">
                      <MapPin size={14} /> Adresse de livraison *
                    </label>
                    <input value={adresseLivraison} onChange={e => setAdresseLivraison(e.target.value)}
                      placeholder="Ex: Douala, Akwa..." className="input-escom" />
                  </div>
                )}
              </div>
            </div>

            <div className="card-escom p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><CreditCard size={18} /> 5. Mode de paiement *</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button type="button" onClick={() => setPlanPaiement('integral')}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      planPaiement === 'integral'
                        ? 'border-escom-blue-600 bg-escom-blue-50'
                        : 'border-escom-neutral-200 hover:border-escom-neutral-300'
                    }`}>
                    <p className="font-semibold">💳 Paiement intégral</p>
                    <p className="text-xs text-escom-neutral-500 mt-1">Tout payer maintenant</p>
                  </button>
                  <button type="button" onClick={() => setPlanPaiement('tranches')}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      planPaiement === 'tranches'
                        ? 'border-escom-blue-600 bg-escom-blue-50'
                        : 'border-escom-neutral-200 hover:border-escom-neutral-300'
                    }`}>
                    <p className="font-semibold">📅 Paiement en tranches</p>
                    <p className="text-xs text-escom-neutral-500 mt-1">Acompte 30% + reste</p>
                  </button>
                </div>

                {planPaiement === 'tranches' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3 p-4 bg-escom-neutral-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium block mb-2">Nombre de tranches</label>
                      <div className="flex gap-2">
                        {[2, 3].map(n => (
                          <button key={n} type="button" onClick={() => setNbTranches(n)}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                              nbTranches === n ? 'bg-escom-blue-600 text-white' : 'bg-white hover:bg-escom-neutral-100'
                            }`}>
                            {n} tranches
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Acompte à payer maintenant : <span className="text-escom-blue-700 font-bold">{pourcentageAvance}%</span>
                      </label>
                      <input type="range" min={30} max={90} step={5}
                        value={pourcentageAvance}
                        onChange={e => setPourcentageAvance(Number(e.target.value))}
                        className="w-full" />
                      <div className="flex justify-between text-xs text-escom-neutral-500 mt-1">
                        <span>30% min</span><span>50%</span><span>90% max</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded border space-y-2">
                      <p className="text-xs font-semibold text-escom-neutral-600 uppercase mb-2">Échéancier prévu</p>
                      {tranches.map((t, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            <span className="text-escom-blue-600 font-semibold">#{idx + 1}</span> {t.libelle} ({t.pourcentage.toFixed(0)}%)
                          </span>
                          <span className="font-bold">{formatXAF(t.montant_du_ttc)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-escom-neutral-600 bg-escom-gold-50 p-3 rounded border border-escom-gold-200">
                      💡 <strong>À retenir :</strong> Vous payez l'acompte maintenant. Les autres tranches seront à régler aux dates prévues. Vos livrables HD seront débloqués au paiement du solde.
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="card-escom p-5">
              <h2 className="font-semibold mb-3">6. Notes complémentaires</h2>
              <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Précisez vos attentes, contraintes, références..."
                className="input-escom" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
            <div className="card-escom p-5 sticky top-24">
              <h2 className="font-semibold mb-4 pb-3 border-b">Récapitulatif</h2>

              {service ? (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-escom-neutral-600">Service :</span>
                      <span className="font-medium text-right">{service.libelle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-escom-neutral-600">Prix unitaire :</span>
                      <span>{formatXAF(prixUnitaire)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-escom-neutral-600">Quantité :</span>
                      <span>{quantite}</span>
                    </div>
                  </div>

                  <div className="border-t mt-3 pt-3 flex justify-between items-center">
                    <span className="font-semibold">Total TTC :</span>
                    <span className="text-2xl font-bold text-escom-blue-700">{formatXAF(totalTTC)}</span>
                  </div>

                  {planPaiement === 'tranches' && (
                    <div className="border-t mt-3 pt-3 space-y-1">
                      <p className="text-xs font-semibold text-escom-neutral-500 uppercase mb-1">Échéancier</p>
                      {tranches.map((t, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span>Tranche {idx + 1} ({t.pourcentage.toFixed(0)}%)</span>
                          <span className="font-semibold">{formatXAF(t.montant_du_ttc)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold text-escom-gold-700 pt-2 border-t mt-2">
                        <span>À payer maintenant :</span>
                        <span>{formatXAF(tranches[0].montant_du_ttc)}</span>
                      </div>
                    </div>
                  )}

                  <button onClick={handleClickCommander} disabled={!dateLivraison}
                    className="btn-primary w-full mt-5">
                    <ShoppingCart size={16} />
                    Payer & Commander
                  </button>

                  <p className="text-[11px] text-escom-neutral-500 mt-3 text-center">
                    🔒 Paiement Mobile Money requis pour valider la commande.
                  </p>
                </>
              ) : (
                <p className="text-sm text-escom-neutral-500">Sélectionnez un service pour voir le récapitulatif.</p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* MODALE DE PAIEMENT OBLIGATOIRE */}
      {service && dateLivraison && (
        <PaiementForceModal
          open={showPaiementModal}
          onClose={() => setShowPaiementModal(false)}
          panierPayload={buildPanierPayload()}
        />
      )}
    </DashboardLayout>
  )
}

export default function NouvelleCommandePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>}>
      <NouvelleCommandeContent />
    </Suspense>
  )
}