import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mohamed Saad Elzarif — Automation & Control Engineer',
  description:
    'Automation & Control Engineer in Riyadh, Saudi Arabia. Specializing in SCADA systems (Motorola ICC/ICC Pro), irrigation automation across 103+ sites, solar energy integration, and industrial control panel design.',
  keywords: [
    'Automation Engineer', 'Control Engineer', 'SCADA Engineer',
    'Mechatronics', 'Riyadh', 'Saudi Arabia', 'Motorola ICC',
    'Solar Energy', 'Control Panels', 'SOLIDWORKS', 'PLC',
  ],
  authors: [{ name: 'Mohamed Saad Elzarif' }],
  openGraph: {
    title: 'Mohamed Saad Elzarif — Automation & Control Engineer',
    description:
      'SCADA systems, irrigation automation, solar energy, and control panel design. Based in Riyadh, Saudi Arabia.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Mohamed Saad Elzarif — Automation & Control Engineer',
    description: 'SCADA · Solar Energy · Control Panels · Riyadh, KSA',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
