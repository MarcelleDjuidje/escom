'use client'

import { motion } from 'framer-motion'
import { MessageSquare, FileSignature, Palette, CheckCircle, Truck } from 'lucide-react'

const STEPS = [
  { icon: MessageSquare, title: '1. Échange initial', desc: 'Nous discutons de vos besoins, votre cible et vos objectifs pour cerner précisément votre projet.' },
  { icon: FileSignature, title: '2. Devis personnalisé', desc: 'Sous 24-48h, vous recevez un devis détaillé adapté à votre budget et à votre échéance.' },
  { icon: Palette, title: '3. Conception & validation', desc: 'Notre équipe créative produit les premières propositions et nous itérons jusqu\'à votre validation totale.' },
  { icon: CheckCircle, title: '4. Production', desc: 'Une fois validé, nous lançons la production avec un suivi en temps réel via votre espace client.' },
  { icon: Truck, title: '5. Livraison', desc: 'Livraison soignée, support post-projet et accompagnement dans la durée.' },
]

export default function ProcessusPage() {
  return (
    <>
      <section className="bg-escom-gradient text-white py-20">
        <div className="container-escom text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-4">
            Notre <span className="text-escom-gold-400">processus</span>
          </motion.h1>
          <p className="text-lg text-escom-blue-100 max-w-2xl mx-auto">
            Une méthodologie en 5 étapes pour donner vie à votre projet en toute sérénité.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container-escom max-w-4xl">
          <div className="relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-escom-blue-500 via-escom-gold-500 to-escom-blue-500 -translate-x-1/2 hidden sm:block" />

            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex flex-col sm:flex-row gap-6 items-start mb-12 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}
              >
                <div className="flex-1 sm:text-right">
                  {i % 2 === 0 && <div className="card-escom p-6 inline-block text-left">
                    <h3 className="text-xl font-bold mb-2 text-escom-blue-700">{step.title}</h3>
                    <p className="text-escom-neutral-600">{step.desc}</p>
                  </div>}
                </div>
                <div className="relative w-16 h-16 rounded-full bg-escom-gradient flex items-center justify-center shrink-0 ring-4 ring-white shadow-lg z-10 sm:mx-0">
                  <step.icon className="w-7 h-7 text-escom-gold-300" />
                </div>
                <div className="flex-1">
                  {i % 2 !== 0 && <div className="card-escom p-6 inline-block text-left">
                    <h3 className="text-xl font-bold mb-2 text-escom-blue-700">{step.title}</h3>
                    <p className="text-escom-neutral-600">{step.desc}</p>
                  </div>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
