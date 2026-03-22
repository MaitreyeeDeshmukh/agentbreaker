import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentBreaker — AI Agent Security Testing',
  description: 'Run 50 adversarial attacks on your AI agent before your users find the holes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
