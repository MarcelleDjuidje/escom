'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Palette, Printer, Megaphone, Target, Sparkles, Users, Award, Clock, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-escom-gradient text-white">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, #d4af37 0%, transparent 40%), radial-gradient(circle at 80% 70%, #ffffff 0%, transparent 40%)'
        }} />

        <div className="container-escom relative py-24 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <span className="inline-flex items-center gap-2 bg-escom-gold-500/20 text-escom-gold-200 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 border border-escom-gold-500/30">
                <Sparkles size={14} /> Agence 360° au Cameroun
              </span>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-balance">
                Donnons à votre marque <span className="text-escom-gold-400">la voix qu'elle mérite</span>
              </h1>
              <p className="text-lg md:text-xl text-escom-blue-100 mb-8 max-w-xl">
                Conception, impression, social media et campagnes marketing — un partenaire unique pour faire rayonner votre communication à l'ère du digital.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/services" className="btn-gold">
                  Découvrir nos services <ArrowRight size={18} />
                </Link>
                <Link href="/realisations" className="bg-white/10 backdrop-blur border border-white/30 hover:bg-white hover:text-escom-blue-700 px-6 py-3 rounded-lg font-semibold transition">
                  Voir nos réalisations
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Palette, label: 'Design', color: 'from-pink-400 to-purple-500' },
                    { icon: Printer, label: 'Print', color: 'from-emerald-400 to-teal-500' },
                    { icon: Megaphone, label: 'Social', color: 'from-amber-400 to-orange-500' },
                    { icon: Target, label: 'Campagnes', color: 'from-blue-400 to-indigo-500' },
                  ].map((s, i) => (
                    <motion.div key={s.label}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className={`bg-gradient-to-br ${s.color} rounded-2xl p-6 text-center hover:scale-105 transition`}
                    >
                      <s.icon className="w-10 h-10 mx-auto mb-2" />
                      <p className="font-semibold">{s.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* CHIFFRES CLÉS */}
      <section className="py-16 bg-white">
        <div className="container-escom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Projets livrés', icon: Award },
              { value: '180+', label: 'Clients satisfaits', icon: Users },
              { value: '6 ans', label: "d'expertise", icon: Clock },
              { value: '4.9/5', label: 'Note moyenne', icon: Star },
            ].map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <s.icon className="w-10 h-10 mx-auto mb-3 text-escom-gold-500" />
                <div className="text-4xl font-bold gradient-text">{s.value}</div>
                <div className="text-sm text-escom-neutral-600 mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-20 bg-escom-neutral-50">
        <div className="container-escom">
          <div className="text-center mb-14">
            <span className="text-escom-gold-600 font-semibold uppercase tracking-wider text-sm">Notre savoir-faire</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-2 mb-4">Une expertise <span className="gradient-text">complète</span></h2>
            <p className="text-lg text-escom-neutral-600 max-w-2xl mx-auto">
              De la conception à la diffusion, nous orchestrons chaque étape de votre communication avec une exigence de qualité absolue.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Palette, title: 'Conception graphique', desc: 'Logos, identité visuelle, supports print et digital sur-mesure.', href: '/services#conception' },
              { icon: Printer, title: 'Impression', desc: 'Flyers, banderoles, cartes de visite, brochures, T-shirts personnalisés.', href: '/services#impression' },
              { icon: Megaphone, title: 'Social media', desc: 'Community management, contenus visuels, animation de vos pages.', href: '/services#social' },
              { icon: Target, title: 'Campagnes marketing', desc: 'Stratégies 360°, publicité Facebook/Google, événementiel.', href: '/services#campagnes' },
            ].map((s, i) => (
              <motion.div key={s.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-escom p-6 group"
              >
                <div className="w-14 h-14 rounded-xl bg-escom-blue-100 text-escom-blue-600 flex items-center justify-center mb-4 group-hover:bg-escom-gold-500 group-hover:text-white transition-all">
                  <s.icon size={28} />
                </div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-escom-neutral-600 mb-4">{s.desc}</p>
                <Link href={s.href} className="text-escom-blue-600 font-semibold text-sm inline-flex items-center gap-1 hover:gap-2 transition-all">
                  En savoir plus <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-escom-gradient" />
        <div className="container-escom relative text-center text-white">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Prêt à donner vie à votre projet ?</h2>
            <p className="text-lg md:text-xl text-escom-blue-100 mb-8 max-w-2xl mx-auto">
              Démarrons ensemble la communication qui fera décoller votre activité.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/register" className="btn-gold">Créer mon compte gratuit</Link>
              <Link href="/services" className="bg-white/10 border border-white/30 hover:bg-white hover:text-escom-blue-700 px-6 py-3 rounded-lg font-semibold transition">
                Demander un devis
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
