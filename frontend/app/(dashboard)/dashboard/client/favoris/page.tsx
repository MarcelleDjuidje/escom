'use client'

import { useEffect, useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

export default function ClientFavoris() {
  const [favoris, setFavoris] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/favoris').then(r => setFavoris(r.data || [])).finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout role="client">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mes favoris</h1>
        <p className="text-escom-neutral-500 text-sm">Services et réalisations sauvegardés</p>
      </div>
      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-escom-blue-600" /> : favoris.length === 0 ? (
        <div className="card-escom p-12 text-center">
          <Heart className="w-12 h-12 text-escom-neutral-300 mx-auto mb-3" />
          <p className="text-escom-neutral-500">Aucun favori. Cliquez sur le ❤️ d'un service pour le sauvegarder.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoris.map(f => (
            <div key={f.id_favori} className="card-escom p-5">
              <Heart className="w-5 h-5 text-red-500 fill-current" />
              <p className="font-semibold mt-2">{f.type_service} #{f.id_service_ref}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
