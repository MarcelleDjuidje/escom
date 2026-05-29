'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Search } from 'lucide-react'
import { api, fileUrl } from '@/lib/api'

const CATEGORIES = [
  { id: '', label: 'Toutes' },
  { id: 'conception', label: 'Conception' },
  { id: 'impression', label: 'Impression' },
  { id: 'social', label: 'Social Media' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'audio', label: 'Audio' },
]

export default function RealisationsPage() {
  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)

  const fetchData = async (reset = false) => {
    setLoading(true)
    try {
      const res = await api.get('/public/realisations', {
        params: { page: reset ? 1 : page, categorie: category || undefined, search: search || undefined }
      })
      const newItems = res.data.data || []
      setItems(reset ? newItems : [...items, ...newItems])
      setHasMore(res.data.current_page < res.data.last_page)
      if (reset) setPage(2); else setPage(p => p + 1)
    } catch {
      setHasMore(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    setItems([]); setPage(1); setHasMore(true); fetchData(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  return (
    <>
      <section className="bg-escom-gradient text-white py-20">
        <div className="container-escom text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-4">
            Nos <span className="text-escom-gold-400">réalisations</span>
          </motion.h1>
          <p className="text-lg text-escom-blue-100 max-w-2xl mx-auto">
            Découvrez quelques-uns des projets que nous avons eu le plaisir de mener pour nos clients.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container-escom">
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-escom-neutral-400" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchData(true)}
                className="input-escom pl-10"
                placeholder="Rechercher une réalisation..."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    category === c.id
                      ? 'bg-escom-blue-600 text-white'
                      : 'bg-escom-neutral-100 hover:bg-escom-neutral-200'
                  }`}>{c.label}</button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {items.map((r, i) => (
                <motion.div
                  key={r.id_realisation}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: (i % 12) * 0.05 }}
                  className="group cursor-pointer"
                  onClick={() => setSelected(r)}
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-escom-neutral-100 mb-3">
                    <img
                      src={fileUrl(r.image_principale)}
                      alt={r.titre}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/placeholder.svg' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-escom-blue-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <div>
                        <span className="inline-block bg-escom-gold-500 text-escom-blue-950 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded mb-2">{r.categorie}</span>
                        <h3 className="text-white font-bold">{r.titre}</h3>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-escom-neutral-900">{r.titre}</h3>
                  <p className="text-xs text-escom-neutral-500 capitalize">{r.categorie}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {loading && (
            <div className="flex justify-center mt-10">
              <Loader2 className="w-8 h-8 animate-spin text-escom-blue-600" />
            </div>
          )}

          {!loading && hasMore && (
            <div className="text-center mt-10">
              <button onClick={() => fetchData()} className="btn-outline">Charger plus</button>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-center py-20 text-escom-neutral-500">
              Aucune réalisation à afficher pour le moment.
            </div>
          )}
        </div>
      </section>

      {/* MODAL */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-escom-blue-950/80 backdrop-blur flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative">
                <img src={fileUrl(selected.image_principale)} alt={selected.titre}
                  className="w-full max-h-96 object-cover" />
                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 bg-white p-2 rounded-full shadow hover:bg-escom-neutral-100">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <span className="inline-block bg-escom-gold-100 text-escom-gold-800 text-xs font-semibold uppercase px-2 py-1 rounded mb-3">{selected.categorie}</span>
                <h2 className="text-2xl font-bold mb-3">{selected.titre}</h2>
                <p className="text-escom-neutral-600 leading-relaxed">{selected.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
