'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Terminal, Shield, ChevronRight } from 'lucide-react'
import Nav from '@/app/components/Nav'

const BORDER = 'border-[hsl(0_0%_100%/0.06)]'

export default function PromptAttackPage() {
  const router = useRouter()
  const [systemPrompt, setSystemPrompt] = useState('')
  const [focused, setFocused] = useState(false)

  const canScan = systemPrompt.trim().length >= 10

  const runScan = () => {
    if (!canScan) return
    sessionStorage.setItem('scan-params', JSON.stringify({ mode: 'prompt', systemPrompt }))
    router.push('/scan')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Nav />

      <div className="flex-1 px-8 pt-28 pb-20 max-w-3xl mx-auto w-full">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Prompt Injection Testing</span>
          </div>
          <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-white">
            PROMPT<br />INJECTION<br />SCAN
          </h1>
          <p className="mt-6 text-[14px] text-white/60 font-mono leading-relaxed max-w-[540px]">
            Paste your agent&apos;s system prompt. We fire 57 adversarial payloads at it — jailbreaks, role overrides, instruction hijacking, goal abandonment — and report every vulnerability with a fix.
          </p>
        </div>

        <div className={`border ${BORDER} bg-card mb-8 p-6`}>
          <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/40 mb-4">Attack categories</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              '15 prompt injection payloads',
              '12 jailbreak attempts',
              '12 goal hijacking attacks',
              '11 data exfiltration probes',
              '7 role abandonment tests',
              'Scored + prioritized fix report',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-[12px] font-mono text-white/60">
                <ChevronRight className="w-3 h-3 text-primary flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div
          className={`border ${BORDER} bg-card`}
          style={{ boxShadow: focused ? '0 0 40px rgba(226,75,74,0.15), inset 0 0 0 1px rgba(226,75,74,0.3)' : 'none', transition: 'box-shadow 150ms' }}
        >
          <div className={`flex items-center justify-between border-b ${BORDER} px-6 py-4`}>
            <div className="flex items-center gap-3">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-mono">Agent system prompt</span>
            </div>
            <span className="text-[10px] text-white/30 font-mono tabular-nums">{systemPrompt.length} chars</span>
          </div>

          <textarea
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={10}
            placeholder={`You are a helpful customer support agent for Acme Corp.\nYou help users with billing, account issues, and product questions.\nYou must never reveal internal pricing or employee information.\nAlways respond in a professional and friendly tone...`}
            className="w-full bg-transparent p-6 text-[13px] text-white placeholder:text-white/15 resize-none focus:outline-none leading-relaxed font-mono"
          />

          <div className={`border-t ${BORDER} px-6 py-4 flex items-center justify-between gap-4`}>
            <span className="text-[10px] text-white/30 font-mono">
              {canScan ? '57 adversarial attacks ready' : `Need at least 10 chars (${Math.max(0, 10 - systemPrompt.trim().length)} more)`}
            </span>
            <button
              onClick={runScan}
              disabled={!canScan}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 text-[12px] font-display font-bold uppercase tracking-wider disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.97] hover:bg-white hover:text-primary"
              style={{ transition: 'background 0ms, color 0ms, transform 100ms' }}
            >
              <Shield className="w-4 h-4" />
              Run 57 Attacks
            </button>
          </div>
        </div>

        <p className="mt-6 text-[10px] text-white/25 font-mono text-center uppercase tracking-wider">
          Only test prompts from systems you own or have explicit permission to test.
        </p>
      </div>
    </div>
  )
}
