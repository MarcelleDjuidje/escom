'use client'

import Image from 'next/image'
import Link from 'next/link'

export function Logo({ size = 40, withText = true, className = '' }: { size?: number; withText?: boolean; className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <Image src="/assets/images/logo.png" alt="ESCOM" width={size} height={size} className="rounded-full" priority />
      {withText && (
        <div className="leading-tight">
          <div className="font-display text-xl font-bold text-escom-blue-700">ESCOM</div>
          <div className="text-[9px] text-escom-gold-600 italic font-medium">La Communication à l'ère du digital</div>
        </div>
      )}
    </Link>
  )
}
