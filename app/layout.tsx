import type { Metadata } from 'next'
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-mono',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AgentBreaker — Break Your AI Before Hackers Do',
  description: 'Point at any website, system prompt, or codebase. Run 57 adversarial attacks and get a step-by-step fix report.',
  openGraph: {
    title: 'AgentBreaker — AI Security Testing Platform',
    description: 'Run 57 adversarial attacks on your AI agent. Find prompt injections, jailbreaks, and data exfiltration vulnerabilities before your users do.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ibmPlexMono.variable} ${spaceGrotesk.variable}`}>
      <head>
        <meta name="theme-color" content="#000000" />
      </head>
      <body>{children}</body>
    </html>
  )
}
