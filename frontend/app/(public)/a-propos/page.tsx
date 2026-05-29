'use client'

import { motion } from 'framer-motion'
import { Target, Heart, Users, TrendingUp, Award } from 'lucide-react'

export default function APropos() {
  return (
    <>
      <section className="bg-escom-gradient text-white py-20">
        <div className="container-escom text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-4">
            À <span className="text-escom-gold-400">propos</span> de nous
          </motion.h1>
          <p className="text-lg text-escom-blue-100 max-w-2xl mx-auto">
            Une équipe passionnée au service de votre communication.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container-escom max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold mb-6 gradient-text">Notre histoire</h2>
            <p className="text-lg text-escom-neutral-700 leading-relaxed mb-4">
              Fondée à Douala, ESCOM est née de la conviction qu'une communication moderne, créative et accessible peut transformer les entreprises camerounaises et africaines. Aujourd'hui présente à <strong>Douala, Yaoundé et Bafoussam</strong>, notre agence accompagne plus de 180 marques dans leur stratégie de visibilité.
            </p>
            <p className="text-lg text-escom-neutral-700 leading-relaxed">
              De la conception graphique à la production imprimée, du community management aux campagnes digitales, nous concevons chaque projet comme une histoire à raconter. Notre nom — ESCOM, contraction d'<em>Excellence</em> et de <em>Communication</em> — incarne cette ambition : viser l'excellence dans chaque détail.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-escom-neutral-50">
        <div className="container-escom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nos <span className="gradient-text">valeurs</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'Excellence', desc: 'La qualité avant tout. Chaque livrable porte notre signature.' },
              { icon: Heart, title: 'Proximité', desc: 'Une relation de confiance, à l\'écoute, dans la durée.' },
              { icon: TrendingUp, title: 'Innovation', desc: 'Nous suivons l\'évolution du digital pour vous garder en tête.' },
            ].map((v, i) => (
              <motion.div key={v.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-escom p-8 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-escom-blue-100 text-escom-blue-600 rounded-full flex items-center justify-center">
                  <v.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">{v.title}</h3>
                <p className="text-escom-neutral-600">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container-escom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Une équipe <span className="gradient-text">pluridisciplinaire</span></h2>
              <p className="text-lg text-escom-neutral-700 leading-relaxed mb-4">
                Designers, chefs de projet, community managers, imprimeurs et commerciaux : tous nos talents sont réunis pour concevoir, piloter et déployer vos projets de communication.
              </p>
              <ul className="space-y-3 mt-6">
                {['Direction artistique & graphisme','Production print & finition','Stratégie social media & contenu','Conseil & relation client'].map(s => (
                  <li key={s} className="flex items-center gap-3"><Award size={18} className="text-escom-gold-500" />{s}</li>
                ))}
              </ul>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="grid grid-cols-2 gap-4">
              {[Users, Award, Target, Heart].map((Icon, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-escom-gradient flex items-center justify-center">
                  <Icon className="w-16 h-16 text-escom-gold-300" />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
