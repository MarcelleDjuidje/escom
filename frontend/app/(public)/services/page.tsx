'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, Printer, Megaphone, Target, Loader2, X, ShoppingCart, Clock, Search, Tag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { formatXAF } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

const TABS = [
  { id: 'conception', label: 'Conception', icon: Palette, endpoint: '/public/services/conception', idKey: 'id_service_conception', priceKey: 'prix_unitaire_ht' },
  { id: 'impression', label: 'Impression', icon: Printer, endpoint: '/public/services/impression', idKey: 'id_service_impression', priceKey: 'prix_unitaire_ht' },
  { id: 'social', label: 'Social Media', icon: Megaphone, endpoint: '/public/services/social', idKey: 'id_service_social', priceKey: 'prix_ht' },
  { id: 'campagnes', label: 'Campagnes', icon: Target, endpoint: '/public/services/campagnes', idKey: 'id_campagne', priceKey: 'prix_indicatif_min' },
]

export default function ServicesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [active, setActive] = useState(TABS[0])
  const [data, setData] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [promotions, setPromotions] = useState<any[]>([])

  useEffect(() => {
    api.get('/public/promotions').then((r: any) => setPromotions(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (data[active.id]) return
    setLoading(true)
    api.get(active.endpoint).then((r: any) => {
      setData(prev => ({ ...prev, [active.id]: r.data || [] }))
    }).catch(() => setData(prev => ({ ...prev, [active.id]: [] })))
      .finally(() => setLoading(false))
  }, [active])

  const handleOrder = (service: any) => {
    if (!user) {
      try {
        sessionStorage.setItem('escom_order_intent', JSON.stringify({
          type: active.id,
          id: service[active.idKey],
          libelle: service.libelle,
          prix: service[active.priceKey],
        }))
        sessionStorage.setItem(
          'escom_redirect_after_login',
          `/dashboard/client/commandes/nouveau?type=${active.id}&service=${service[active.idKey]}`
        )
      } catch {}
      router.push('/login')
      return
    }
    if (user.is_staff) {
      alert('Cette action est réservée aux clients.')
      return
    }
    router.push(`/dashboard/client/commandes/nouveau?type=${active.id}&service=${service[active.idKey]}`)
  }

  const filteredItems = (data[active.id] || []).filter((s: any) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return String(s.libelle || '').toLowerCase().includes(q) ||
           String(s.description || '').toLowerCase().includes(q)
  })

  return (
    <>
      <section className="bg-escom-gradient text-white py-20">
        <div className="container-escom text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-4">
            Nos <span className="text-escom-gold-400">services</span>
          </motion.h1>
          <p className="text-lg text-escom-blue-100 max-w-2xl mx-auto">
            Une offre 360° pour porter votre communication à son meilleur niveau.
          </p>
        </div>
      </section>

      {promotions.length > 0 && (
        <section className="py-10 bg-escom-gold-50 border-b border-escom-gold-200">
          <div className="container-escom">
            <div className="flex items-center gap-2 mb-5">
              <Tag className="text-escom-gold-600" size={20} />
              <h2 className="text-xl font-bold text-escom-blue-900">Promotions en cours</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotions.map((p: any) => (
                <motion.div key={p.id_promotion}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-escom-gold-200 rounded-xl p-4 flex items-start gap-4 shadow-sm"
                >
                  <div className="w-14 h-14 rounded-xl bg-escom-gold-500 text-white flex flex-col items-center justify-center shrink-0 text-center leading-tight">
                    <span className="text-lg font-black">-{p.taux_remise_pct}%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-escom-blue-900 truncate">{p.libelle_service}</p>
                    {p.notes && <p className="text-xs text-escom-neutral-500 mb-2">{p.notes}</p>}
                    <div className="flex items-center gap-2">
                      <span className="text-escom-neutral-400 line-through text-sm">{formatXAF(p.prix_original_ht)}</span>
                      <span className="text-escom-gold-700 font-bold">{formatXAF(p.prix_promo_ht)}</span>
                    </div>
                    {p.date_fin && (
                      <p className="text-[11px] text-escom-neutral-400 mt-1 flex items-center gap-1">
                        <Clock size={10} /> Expire le {new Date(p.date_fin).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-white">
        <div className="container-escom">
          <div className="flex flex-wrap justify-center gap-3 mb-8 sticky top-20 z-30 bg-white/95 backdrop-blur py-3 -mx-4 px-4">
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setActive(t); setSearch('') }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  active.id === t.id
                    ? 'bg-escom-blue-600 text-white shadow-lg'
                    : 'bg-escom-neutral-100 text-escom-neutral-700 hover:bg-escom-neutral-200'
                }`}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>

          <div className="max-w-md mx-auto mb-10 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-escom-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Rechercher un service ${active.label.toLowerCase()}...`}
              className="w-full pl-12 pr-12 py-3 rounded-full border-2 border-escom-neutral-200 focus:border-escom-blue-500 focus:outline-none transition shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-escom-neutral-400 hover:text-escom-neutral-700">
                <X size={18} />
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-escom-blue-600" />
            </div>
          ) : (
            <motion.div key={active.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredItems.map((s: any, i: number) => (
                <motion.div key={s[active.idKey]}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-escom p-6 flex flex-col cursor-pointer hover:border-escom-blue-300"
                  onClick={() => setSelected(s)}
                >
                  <h3 className="text-lg font-bold mb-2">{s.libelle || s.titre}</h3>
                  <p className="text-sm text-escom-neutral-600 mb-4 line-clamp-3 flex-1">{s.description}</p>
                  {s.delai_realisation_jours && (
                    <p className="text-xs text-escom-neutral-500 mb-3 flex items-center gap-1">
                      <Clock size={12} /> Délai : {s.delai_realisation_jours} jours
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <span className="text-xs text-escom-neutral-500 block">À partir de</span>
                      <span className="text-xl font-bold text-escom-blue-700">
                        {formatXAF(s[active.priceKey])}
                      </span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleOrder(s) }}
                      className="btn-primary !py-2 !px-3 text-sm">
                      <ShoppingCart size={14} /> Commander
                    </button>
                  </div>
                </motion.div>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full text-center py-12 text-escom-neutral-500">
                  {search ? `Aucun résultat pour "${search}"` : 'Aucun service disponible pour le moment.'}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-escom-blue-950/80 backdrop-blur flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b bg-escom-gradient text-white relative">
                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full">
                  <X size={20} />
                </button>
                <active.icon className="w-10 h-10 text-escom-gold-300 mb-2" />
                <h2 className="text-2xl font-bold">{selected.libelle || selected.titre}</h2>
                <p className="text-escom-blue-100 mt-1 text-sm">{active.label}</p>
              </div>

              <div className="p-6 space-y-4">
                {selected.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-escom-neutral-500 uppercase mb-1">Description</h3>
                    <p className="text-escom-neutral-700">{selected.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  {selected.delai_realisation_jours && (
                    <div className="bg-escom-neutral-50 p-3 rounded-lg">
                      <p className="text-xs text-escom-neutral-500 uppercase">Délai</p>
                      <p className="text-lg font-bold text-escom-blue-700 flex items-center gap-1">
                        <Clock size={16} /> {selected.delai_realisation_jours} j
                      </p>
                    </div>
                  )}
                  <div className="bg-escom-gold-50 p-3 rounded-lg">
                    <p className="text-xs text-escom-gold-700 uppercase">À partir de</p>
                    <p className="text-lg font-bold text-escom-gold-700">
                      {formatXAF(selected[active.priceKey])}
                    </p>
                  </div>
                </div>

                {!user && (
                  <div className="mt-4 p-4 bg-escom-blue-50 border border-escom-blue-200 rounded-lg flex items-start gap-3">
                    <ShoppingCart className="text-escom-blue-600 shrink-0" size={20} />
                    <div className="text-sm">
                      <p className="font-semibold text-escom-blue-900">Pour commander ce service</p>
                      <p className="text-escom-blue-700 mt-1">
                        Vous devez d'abord <strong>créer un compte gratuit</strong> ou vous connecter. C'est rapide !
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setSelected(null)} className="btn-outline flex-1">Fermer</button>
                  <button onClick={() => handleOrder(selected)} className="btn-primary flex-1">
                    <ShoppingCart size={16} />
                    {user ? 'Commander' : 'S\'inscrire pour commander'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}