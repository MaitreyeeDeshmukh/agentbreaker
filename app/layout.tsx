import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentBreaker — Break Your AI Before Hackers Do',
  description: 'Point at any website, system prompt, or codebase. Run 57 adversarial attacks — prompt injection, goal hijacking, data exfiltration & tool misuse — and get a step-by-step fix report.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#06060C" />
      </head>
      <body>
        {/* Ambient background effects */}
        <div className="bg-grid" />
        <div className="bg-gradient-spot bg-gradient-spot--red" />
        <div className="bg-gradient-spot bg-gradient-spot--blue" />
        {children}
      </body>
    </html>
  )
}
