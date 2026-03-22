'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ChevronRight, Zap } from 'lucide-react'
import Nav from '@/app/components/Nav'

const BORDER = 'border-[hsl(0_0%_100%/0.06)]'

const FORMAT_OPTIONS = [
  { id: 'messages', label: 'messages', desc: '{ messages: [{ role, content }] }  — OpenAI style' },
  { id: 'prompt',   label: 'prompt',   desc: '{ prompt: "..." }  — simple string' },
  { id: 'message',  label: 'message',  desc: '{ message: "..." }  — single message' },
  { id: 'input',    label: 'input',    desc: '{ input: "..." }  — Anthropic style' },
]

export default function ApiAttackPage() {
  const router = useRouter()
  const [targetUrl, setTargetUrl]     = useState('')
  const [endpointPath, setEndpointPath] = useState('')
  const [format, setFormat]           = useState('')
  const [probing, setProbing]         = useState(false)
  const [probeResult, setProbeResult] = useState<{ found: boolean; endpoint?: string; format?: string } | null>(null)
  const [focused, setFocused]         = useState(false)

  const canScan = targetUrl.trim().length > 0

  const handleProbe = async () => {
    if (!targetUrl.trim()) return
    setProbing(true)
    setProbeResult(null)
    try {
      const res  = await fetch('/api/probe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: targetUrl.trim() }) })
      const data = await res.json() as { found: boolean; endpoint?: string; format?: string }
      setProbeResult(data)
      if (data.found && data.endpoint) {
        try { setEndpointPath(new URL(data.endpoint).pathname) } catch { setEndpointPath(data.endpoint) }
        setFormat(data.format || '')
      }
    } catch { setProbeResult({ found: false }) }
    finally { setProbing(false) }
  }

  const runScan = () => {
    if (!canScan) return
    sessionStorage.setItem('scan-params', JSON.stringify({ mode: 'website', targetUrl: targetUrl.trim(), endpointPath, format }))
    router.push('/scan')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Nav />

      <div className="flex-1 px-8 pt-28 pb-20 max-w-3xl mx-auto w-full">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-agent-blue" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-agent-blue">API Endpoint Attack</span>
          </div>
          <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-white">
            API<br />ATTACK
          </h1>
          <p className="mt-6 text-[14px] text-white/60 font-mono leading-relaxed max-w-[540px]">
            Point at your AI API endpoint — the server route that receives user messages and returns AI responses. We send 57 adversarial payloads in every supported format and evaluate each response for vulnerabilities.
          </p>
          <p className="mt-3 text-[13px] text-white/40 font-mono">
            Use <span className="text-white/60">Auto-Detect</span> to find your endpoint automatically, or specify it manually.
          </p>
        </div>

        <div className={`border ${BORDER} bg-card mb-6 p-6`}>
          <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/40 mb-4">Supported request formats (auto-detected)</div>
          <div className="flex flex-col gap-2">
            {FORMAT_OPTIONS.map(f => (
              <div key={f.id} className="flex items-center gap-3 text-[11px] font-mono text-white/50">
                <ChevronRight className="w-3 h-3 text-agent-blue flex-shrink-0" />
                <span className="text-white/70 w-20">{f.label}</span>
                <span className="text-white/30">{f.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`border ${BORDER} bg-card`}
          style={{ boxShadow: focused ? '0 0 40px rgba(226,75,74,0.15), inset 0 0 0 1px rgba(226,75,74,0.3)' : 'none', transition: 'box-shadow 150ms' }}
        >
          <div className={`flex items-center justify-between border-b ${BORDER} px-6 py-4`}>
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-mono">Target configuration</span>
            <button
              onClick={handleProbe}
              disabled={probing || !targetUrl.trim()}
              className="text-[11px] text-agent-blue hover:text-white font-mono uppercase tracking-wider disabled:opacity-30 flex items-center gap-1.5"
              style={{ transition: 'color 0ms' }}
            >
              <Zap className="w-3 h-3" />
              {probing ? 'Detecting...' : 'Auto-Detect Endpoint'}
            </button>
          </div>

          <div className="p-6 flex flex-col gap-5" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
            <div>
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-2 block">Base URL</label>
              <input
                type="url"
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                placeholder="https://your-app.vercel.app"
                className={`w-full bg-transparent text-[14px] text-white placeholder:text-white/20 focus:outline-none font-mono border-b ${BORDER} pb-2`}
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-2 block">
                API Endpoint Path <span className="text-white/25">(optional — leave blank to auto-detect)</span>
              </label>
              <input
                type="text"
                value={endpointPath}
                onChange={e => setEndpointPath(e.target.value)}
                placeholder="/api/chat"
                className={`w-full bg-transparent text-[14px] text-white placeholder:text-white/20 focus:outline-none font-mono border-b ${BORDER} pb-2`}
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-2 block">
                Request Format <span className="text-white/25">(optional — auto-detected if blank)</span>
              </label>
              <div className="flex gap-0">
                {['', ...FORMAT_OPTIONS.map(f => f.id)].map((f, i) => (
                  <button key={f || 'auto'} onClick={() => setFormat(f)}
                    className={`flex-1 text-[10px] px-2 py-2 font-mono uppercase tracking-wider ${i > 0 ? `border-l ${BORDER}` : ''} ${format === f ? 'bg-agent-blue text-black' : 'text-white/40 hover:text-white border border-[hsl(0_0%_100%/0.06)]'}`}
                    style={{ transition: 'background 0ms, color 0ms' }}>
                    {f || 'auto'}
                  </button>
                ))}
              </div>
            </div>

            {probeResult && (
              <div className={`text-[12px] font-mono px-4 py-3 ${probeResult.found ? 'bg-agent-green/10 text-agent-green border border-agent-green/30' : 'bg-primary/10 text-primary border border-primary/30'}`}>
                {probeResult.found
                  ? `✓ Found: ${probeResult.endpoint} · Format: ${probeResult.format || 'auto'}`
                  : '✗ No endpoint auto-detected — enter the path manually above'}
              </div>
            )}
          </div>

          <div className={`border-t ${BORDER} px-6 py-4`}>
            <button
              onClick={runScan}
              disabled={!canScan}
              className="w-full flex items-center justify-center gap-3 bg-agent-blue text-black px-6 py-4 text-[13px] font-display font-bold uppercase tracking-wider disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.97] hover:bg-white"
              style={{ transition: 'background 0ms, transform 100ms' }}
            >
              <Shield className="w-4 h-4" />
              Launch API Attack
            </button>
          </div>
        </div>

        <p className="mt-6 text-[10px] text-white/25 font-mono text-center uppercase tracking-wider">
          Only test endpoints you own or have explicit permission to test.
        </p>
      </div>
    </div>
  )
}
