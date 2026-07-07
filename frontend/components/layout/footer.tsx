import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-escom-blue-950 text-white">
      <div className="container-escom py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="p-3 rounded-xl inline-block mb-4">
              <Logo size={48} withText />
            </div>
            <p className="text-sm text-escom-blue-100 leading-relaxed">
              Agence de communication 360° basée au Cameroun. Conception, impression, social media et campagnes marketing.
            </p>
            <div className="flex gap-3 mt-5">
              <a className="bg-white/10 hover:bg-escom-gold-500 hover:text-escom-blue-950 p-2 rounded-full transition" href="#" aria-label="Facebook"><Facebook size={18} /></a>
              <a className="bg-white/10 hover:bg-escom-gold-500 hover:text-escom-blue-950 p-2 rounded-full transition" href="#" aria-label="Instagram"><Instagram size={18} /></a>
              <a className="bg-white/10 hover:bg-escom-gold-500 hover:text-escom-blue-950 p-2 rounded-full transition" href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
            </div>
          </div>

          <div>
            <h3 className="text-escom-gold-400 font-semibold mb-4 uppercase text-sm tracking-wide">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-escom-gold-300 transition">Accueil</Link></li>
              <li><Link href="/services" className="hover:text-escom-gold-300 transition">Services</Link></li>
              <li><Link href="/realisations" className="hover:text-escom-gold-300 transition">Réalisations</Link></li>
              <li><Link href="/processus" className="hover:text-escom-gold-300 transition">Notre processus</Link></li>
              <li><Link href="/a-propos" className="hover:text-escom-gold-300 transition">À propos</Link></li>
              <li><Link href="/faq" className="hover:text-escom-gold-300 transition">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-escom-gold-400 font-semibold mb-4 uppercase text-sm tracking-wide">Nos agences</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2"><MapPin size={16} className="text-escom-gold-400 mt-0.5 shrink-0" /><span><strong className="text-white">Douala</strong><br/>Ndogbong, Entree de l'IUT</span></li>
              <li className="flex gap-2"><MapPin size={16} className="text-escom-gold-400 mt-0.5 shrink-0" /><span><strong className="text-white">Bafoussam</strong><br/>Tamdja, 2e Rue Finances (a environ 100 metres apres l'agence Camtel)</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-escom-gold-400 font-semibold mb-4 uppercase text-sm tracking-wide">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2"><Mail size={16} className="text-escom-gold-400 mt-0.5" /><a href="mailto:contact@escom.cm" className="hover:text-escom-gold-300 transition">contact@escom.cm</a></li>
              <li className="flex gap-2"><Phone size={16} className="text-escom-gold-400 mt-0.5" /><a href="tel:+237600000000" className="hover:text-escom-gold-300 transition">+237 659 404 339</a></li>
              <li className="flex gap-2"><Phone size={16} className="text-escom-gold-400 mt-0.5" /><span>Lun-Ven : 8h–18h<br/>Sam : 9h–13h</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-escom py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-escom-blue-200">
          <p>© {new Date().getFullYear()} ESCOM — Tous droits réservés.</p>
          <p className="text-escom-gold-300 italic">La Communication à l'ère du digital</p>
        </div>
      </div>
    </footer>
  )
}
