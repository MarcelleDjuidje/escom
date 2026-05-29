'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'

const FAQS = [
  {
    cat: 'Devis & Tarifs',
    items: [
      { q: 'Comment obtenir un devis ?', a: 'Inscrivez-vous gratuitement, soumettez votre demande depuis votre espace client (catalogue de services ou demande de campagne) — un commercial vous répond sous 24h avec un devis détaillé.' },
      { q: 'Vos tarifs sont-ils négociables ?', a: 'Nous proposons des tarifs justes basés sur le périmètre réel du projet. Pour les volumes importants ou contrats récurrents, nous offrons des remises dégressives.' },
      { q: 'Quels modes de paiement acceptez-vous ?', a: 'Mobile Money (Orange / MTN), virement bancaire, espèces et chèque. Les commandes peuvent être réglées en plusieurs tranches selon le projet.' },
    ],
  },
  {
    cat: 'Production & Délais',
    items: [
      { q: 'Quels sont les délais moyens ?', a: 'Logo : 5 à 7 jours · Flyer : 2 à 4 jours · Pack social media mensuel : démarrage immédiat · Campagne complète : 2 à 3 semaines selon ampleur.' },
      { q: 'Puis-je suivre l\'avancement de mon projet ?', a: 'Oui ! Votre espace client vous permet de suivre chaque étape, voir les livrables en temps réel, échanger avec l\'équipe par messagerie intégrée.' },
      { q: 'Que se passe-t-il si je ne suis pas satisfait ?', a: 'Toutes les étapes incluent des allers-retours de validation. Aucune commande ne passe en production sans votre accord explicite.' },
    ],
  },
  {
    cat: 'Livrables & Propriété',
    items: [
      { q: 'Quand puis-je télécharger les fichiers HD ?', a: 'Dès le solde de votre commande payé, les fichiers haute définition sont automatiquement débloqués dans votre espace client. Avant cela, des aperçus filigranés sont consultables.' },
      { q: 'À qui appartiennent les créations ?', a: 'Une fois votre commande intégralement réglée, vous êtes pleinement propriétaire des fichiers livrés et de leurs droits d\'usage.' },
    ],
  },
  {
    cat: 'Communication',
    items: [
      { q: 'Comment vous joindre ?', a: 'Par la messagerie intégrée à votre espace client (la plus rapide), par email à contact@escom.cm ou par téléphone aux heures ouvrables.' },
      { q: 'Avez-vous un service après-vente ?', a: 'Bien sûr. Nous restons disponibles après livraison pour toute question, modification mineure ou conseil.' },
    ],
  },
]

export default function FAQPage() {
  const [open, setOpen] = useState<string | null>('0-0')

  return (
    <>
      <section className="bg-escom-gradient text-white py-20">
        <div className="container-escom text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-4">
            Questions <span className="text-escom-gold-400">fréquentes</span>
          </motion.h1>
          <p className="text-lg text-escom-blue-100 max-w-2xl mx-auto">
            Toutes les réponses aux questions que vous vous posez.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container-escom max-w-3xl">
          {FAQS.map((cat, ci) => (
            <div key={cat.cat} className="mb-10">
              <h2 className="text-xl font-bold text-escom-blue-700 mb-4 flex items-center gap-3">
                <span className="w-2 h-8 bg-escom-gold-500 rounded" />
                {cat.cat}
              </h2>
              <div className="space-y-3">
                {cat.items.map((it, ii) => {
                  const id = `${ci}-${ii}`
                  const isOpen = open === id
                  return (
                    <div key={id} className="card-escom overflow-hidden">
                      <button
                        onClick={() => setOpen(isOpen ? null : id)}
                        className="w-full flex justify-between items-center text-left px-6 py-4 hover:bg-escom-neutral-50 transition"
                      >
                        <span className="font-semibold pr-4">{it.q}</span>
                        <Plus className={`w-5 h-5 text-escom-blue-600 shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-5 text-escom-neutral-700 leading-relaxed">{it.a}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
