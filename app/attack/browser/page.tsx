'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, ChevronRight, Shield } from 'lucide-react'
import Nav from '@/app/components/Nav'

const BORDER = 'border-[hsl(0_0%_100%/0.06)]'

export default function BrowserAttackPage() {
  const router = useRouter()
  const [targetUrl, setTargetUrl] = useState('')
  const [focused, setFocused] = useState(false)

  const canScan = targetUrl.trim().length > 0

  const runScan = () => {
    if (!canScan) return
    sessionStorage.setItem('scan-params', JSON.stringify({ mode: 'browser', targetUrl: targetUrl.trim() }))
    router.push('/scan')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Nav />

      <div className="flex-1 px-8 pt-28 pb-20 max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-agent-green" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-agent-green">Browser Attack · Main Feature</span>
          </div>
          <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-white">
            REAL BROWSER<br />ATTACK
          </h1>
          <p className="mt-6 text-[14px] text-white/60 font-mono leading-relaxed max-w-[540px]">
            A real Chrome browser navigates to your live web app. It finds every chat widget, text input, and prompt field, then types 57 adversarial attack payloads directly into your UI — exactly how a real attacker would.
          </p>
          <p className="mt-3 text-[13px] text-white/40 font-mono leading-relaxed max-w-[540px]">
            This tests your <span className="text-white/70">actual product</span>, not just an API. If your chat widget passes user input to an LLM without sanitization, we will find it.
          </p>
        </div>

        {/* What it tests */}
        <div className={`border ${BORDER} bg-card mb-8 p-6`}>
          <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/40 mb-4">What this tests</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Chat widgets and AI assistants',
              'Customer support bots',
              'AI-powered search bars',
              'LLM-connected form fields',
              'Agent tool call interfaces',
              'Any text input connected to an LLM',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-[12px] font-mono text-white/60">
                <ChevronRight className="w-3 h-3 text-agent-green flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Input */}
        <div
          className={`border ${BORDER} bg-card`}
          style={{ boxShadow: focused ? '0 0 40px rgba(226,75,74,0.15), inset 0 0 0 1px rgba(226,75,74,0.3)' : 'none', transition: 'box-shadow 150ms' }}
        >
          <div className={`flex items-center gap-3 border-b ${BORDER} px-6 py-4`}>
            <Globe className="w-4 h-4 text-agent-green" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-mono">Your web app URL</span>
          </div>

          <div className="p-6">
            <input
              type="url"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => e.key === 'Enter' && runScan()}
              placeholder="https://your-app.vercel.app"
              className={`w-full bg-transparent text-[16px] text-white placeholder:text-white/20 focus:outline-none font-mono border-b ${BORDER} pb-3`}
            />
            <p className="mt-4 text-[11px] text-white/30 font-mono">
              Must be publicly accessible. The browser will navigate here and interact with your UI.
            </p>
          </div>

          <div className={`border-t ${BORDER} px-6 py-4`}>
            <button
              onClick={runScan}
              disabled={!canScan}
              className="w-full flex items-center justify-center gap-3 bg-agent-green text-black px-6 py-4 text-[13px] font-display font-bold uppercase tracking-wider disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.97] hover:bg-white"
              style={{ transition: 'background 0ms, transform 100ms' }}
            >
              <Shield className="w-4 h-4" />
              Launch Browser Attack
            </button>
          </div>
        </div>

        <p className="mt-6 text-[10px] text-white/25 font-mono text-center uppercase tracking-wider">
          Only test apps you own or have explicit permission to test.
        </p>
      </div>
    </div>
  )
}
