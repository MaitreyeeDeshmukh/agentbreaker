'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import LoadingScreen from './components/LoadingScreen'

type ScanMode = 'prompt' | 'website' | 'browser' | 'code'

const stats = [
  { num: 73,  suffix: '%',  desc: 'of production agents vulnerable' },
  { num: 540, suffix: '%',  desc: 'YoY increase in AI security reports' },
  { prefix: '#', num: 1, suffix: '', desc: 'OWASP #1 LLM vulnerability' },
]

const categories = [
  { count: 15, label: 'Prompt Injection',  borderColor: 'border-l-agent-red' },
  { count: 12, label: 'Goal Hijacking',    borderColor: 'border-l-agent-amber' },
  { count: 12, label: 'Data Exfiltration', borderColor: 'border-l-agent-blue' },
  { count: 11, label: 'Tool Misuse',       borderColor: 'border-l-agent-green' },
]

const MODES: { id: ScanMode; short: string }[] = [
  { id: 'prompt',  short: 'PROMPT' },
  { id: 'website', short: 'API' },
  { id: 'browser', short: 'BROWSER' },
  { id: 'code',    short: 'CODE' },
]

function useTickUp(target: number, duration = 1500, delay = 800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        setVal(Math.floor(progress * target))
        if (progress < 1) requestAnimationFrame(tick)
        else setVal(target)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, duration, delay])
  return val
}

const HOLES_LETTERS = ['H', 'O', 'L', 'E', 'S', '.']

function HolesTypewriter() {
  const [count, setCount] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    const startDelay = setTimeout(() => {
      let i = 0
      const interval = setInterval(() => {
        i++
        setCount(i)
        if (i >= HOLES_LETTERS.length) {
          clearInterval(interval)
          setTimeout(() => setShowCursor(false), 1000)
        }
      }, 80)
      return () => clearInterval(interval)
    }, 600)
    return () => clearTimeout(startDelay)
  }, [])

  return (
    <h1
      className="text-[clamp(3.5rem,12vw,8rem)] font-display font-black uppercase leading-[0.9] tracking-[-0.02em]"
      style={{ color: 'hsl(var(--primary))' }}
    >
      {HOLES_LETTERS.slice(0, count).join('')}
      {showCursor && (
        <span
          className="inline-block w-[0.06em] bg-primary ml-[0.02em] align-baseline"
          style={{ height: '0.85em', animation: 'cursor-blink 0.6s step-end infinite' }}
        />
      )}
    </h1>
  )
}

export default function Home() {
  const router = useRouter()
  const [loaded, setLoaded]       = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [mode, setMode]           = useState<ScanMode>('prompt')
  const [focused, setFocused]     = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [endpointPath, setEndpointPath] = useState('')
  const [format, setFormat]       = useState('')
  const [probing, setProbing]     = useState(false)
  const [probeResult, setProbeResult] = useState<{ found: boolean; endpoint?: string; format?: string } | null>(null)
  const [code, setCode]           = useState('')
  const [language, setLanguage]   = useState('typescript')

  const onLoadComplete = useCallback(() => setLoaded(true), [])
  const stat0 = useTickUp(73,  1200, loaded ? 1800 : 99999)
  const stat1 = useTickUp(540, 1200, loaded ? 1800 : 99999)

  const canScan = () => {
    if (mode === 'prompt')  return systemPrompt.trim().length >= 10
    if (mode === 'website') return targetUrl.trim().length > 0
    if (mode === 'browser') return targetUrl.trim().length > 0
    if (mode === 'code')    return code.trim().length > 0
    return false
  }

  const handleProbe = async () => {
    if (!targetUrl.trim()) return
    setProbing(true)
    setProbeResult(null)
    try {
      const res  = await fetch('/api/probe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: targetUrl }) })
      const data = await res.json()
      setProbeResult(data)
      if (data.found) { setEndpointPath(new URL(data.endpoint).pathname); setFormat(data.format || '') }
    } catch { setProbeResult({ found: false }) }
    finally { setProbing(false) }
  }

  const runScan = () => {
    if (!canScan()) return
    const params =
      mode === 'prompt'  ? { mode, systemPrompt } :
      mode === 'website' ? { mode, targetUrl, endpointPath, format } :
      mode === 'browser' ? { mode, targetUrl } :
      { mode, code, language }
    sessionStorage.setItem('scan-params', JSON.stringify(params))
    router.push('/scan')
  }

  if (!loaded) return <LoadingScreen onComplete={onLoadComplete} />

  const BORDER = 'border-[hsl(0_0%_100%/0.06)]'

  return (
    <div className="min-h-screen flex flex-col relative bg-background">

      {/* Fixed SCAN NOW button */}
      <button
        onClick={runScan}
        className="fixed bottom-8 right-8 z-50 w-20 h-20 bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold uppercase tracking-widest font-display hover:bg-foreground hover:text-background active:scale-95 rounded-full"
        style={{ transition: 'background 0ms, color 0ms, transform 100ms', animation: 'fade-in-simple 0.4s ease-out forwards', animationDelay: '1200ms', opacity: 0 }}
      >
        SCAN<br />NOW
      </button>

      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-6"
        style={{ animation: 'fade-in-simple 0.4s ease-out forwards', animationDelay: '1200ms', opacity: 0 }}
      >
        <button
          onClick={() => setMenuOpen(true)}
          className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground font-mono"
          style={{ transition: 'color 0ms' }}
        >
          ≡ MENU
        </button>
        <span className="text-[11px] uppercase tracking-[0.15em] text-foreground font-display font-bold">AGENTBREAKER</span>
      </nav>

      {/* Menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col items-start justify-center px-12 gap-4">
          <button onClick={() => setMenuOpen(false)} className="absolute top-6 left-8 text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground font-mono">✕ CLOSE</button>
          {[['Home', '/'], ['Scan', '/scan'], ['Demo', '/demo']].map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}
              className="text-5xl md:text-7xl font-display font-black uppercase tracking-tight text-foreground hover:text-primary"
              style={{ transition: 'color 0ms' }}>
              {label}
            </a>
          ))}
        </div>
      )}

      {/* ── HERO ── */}
      <section className="min-h-screen flex flex-col md:flex-row items-start px-8 pt-[80px] pb-16 relative overflow-hidden">
        <div className="flex-[7] flex flex-col justify-start pt-[100px]">
          <h1
            className="text-[clamp(3.5rem,12vw,8rem)] font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-foreground"
            style={{ animation: 'crash-in-left 0.6s ease-out forwards', transform: 'translateX(-100vw)' }}
          >
            YOUR AI<br />AGENT HAS
          </h1>
          <HolesTypewriter />
        </div>

        <div
          className="flex-[3] flex flex-col justify-start gap-8 md:pl-12 pt-[100px]"
          style={{ animation: 'fade-in-simple 0.4s ease-out forwards', animationDelay: '1200ms', opacity: 0 }}
        >
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono">01 / WHAT IT DOES</span>
          <p className="text-[14px] text-foreground leading-[1.6] font-mono max-w-[380px]">
            Run 57 adversarial attacks — prompt injections, jailbreaks, goal hijacking, data exfiltration — against any website, prompt, or codebase. Get a fix report before your users find the holes.
          </p>
          <div className="flex items-baseline gap-6 flex-wrap">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <span className="text-[52px] font-display font-black tabular-nums leading-none"
                  style={{ color: i === 2 ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
                  {s.prefix || ''}{i === 0 ? stat0 : i === 1 ? stat1 : s.num}{s.suffix}
                </span>
                <span className="text-[11px] uppercase font-mono leading-tight max-w-[120px]"
                  style={{ letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)' }}>
                  {s.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Red diagonal stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-primary"
          style={{ clipPath: 'polygon(0 60%, 100% 0, 100% 100%, 0 100%)', animation: 'fade-in-simple 0.4s ease-out forwards', animationDelay: '1200ms', opacity: 0 }} />
      </section>

      {/* ── SCAN INPUT ── */}
      <section className="px-8 py-24 flex flex-col md:flex-row gap-12 md:gap-24">
        <div className="flex-1 flex flex-col justify-start"
          style={{ animation: 'snap-up 0.3s ease-out forwards', animationDelay: '1.5s', opacity: 0 }}>
          <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-foreground">
            SCAN<br />YOUR<br />AGENT
          </h2>
          <p className="mt-6 text-[11px] text-muted-foreground font-mono leading-relaxed max-w-[240px]">
            Choose an attack surface. Paste your target. Run 57 adversarial attacks.
          </p>
        </div>

        <div className="flex-[1.4]" style={{ animation: 'snap-up 0.3s ease-out forwards', animationDelay: '1.7s', opacity: 0 }}>
          {/* Mode selector */}
          <div className={`flex border ${BORDER}`}>
            {MODES.map((m, i) => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex-1 text-[10px] px-3 py-3 font-mono font-bold uppercase tracking-[0.12em] ${i > 0 ? `border-l ${BORDER}` : ''} ${mode === m.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground bg-background'}`}
                style={{ transition: 'background 0ms, color 0ms' }}>
                {m.short}
              </button>
            ))}
          </div>

          {/* Input card */}
          <div className={`border ${BORDER} border-t-0 bg-card`}
            style={{ boxShadow: focused ? '0 0 40px rgba(226,75,74,0.15), inset 0 0 0 1px rgba(226,75,74,0.3)' : 'none', transition: 'box-shadow 150ms ease-out' }}>

            {/* Card header */}
            <div className={`flex items-center justify-between border-b ${BORDER} px-6 py-4`}>
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono">
                {mode === 'prompt' ? 'Agent system prompt' : mode === 'code' ? 'Application code' : 'Target URL'}
              </span>
              {mode === 'website' && (
                <button onClick={handleProbe} disabled={probing || !targetUrl.trim()}
                  className="text-[11px] text-primary hover:text-foreground font-mono uppercase tracking-wider disabled:opacity-40"
                  style={{ transition: 'color 0ms' }}>
                  {probing ? 'Probing...' : 'Auto-detect →'}
                </button>
              )}
            </div>

            {/* Prompt mode */}
            {mode === 'prompt' && (
              <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                rows={7} placeholder="Paste your agent's system prompt here..."
                className="w-full bg-transparent p-6 text-[13px] text-foreground placeholder:text-muted-foreground/30 resize-none focus:outline-none leading-relaxed font-mono" />
            )}

            {/* Website / Browser mode */}
            {(mode === 'website' || mode === 'browser') && (
              <div className="p-6 flex flex-col gap-4" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
                <input type="url" value={targetUrl} onChange={e => setTargetUrl(e.target.value)}
                  placeholder="https://your-app.vercel.app"
                  className={`w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none font-mono border-b ${BORDER} pb-3`} />
                {mode === 'website' && (
                  <>
                    <input type="text" value={endpointPath} onChange={e => setEndpointPath(e.target.value)}
                      placeholder="/api/chat  (leave blank to auto-detect)"
                      className={`w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none font-mono border-b ${BORDER} pb-3`} />
                    {probeResult && (
                      <p className={`text-[11px] font-mono ${probeResult.found ? 'text-agent-green' : 'text-primary'}`}>
                        {probeResult.found ? `✓ Found: ${probeResult.endpoint} (${probeResult.format})` : '✗ No endpoint found — enter manually'}
                      </p>
                    )}
                  </>
                )}
                {mode === 'browser' && (
                  <p className="text-[11px] text-muted-foreground font-mono mt-2">Real browser navigates to this URL and types attack prompts via TinyFish Web Agent.</p>
                )}
                <div className="h-8" />
              </div>
            )}

            {/* Code mode */}
            {mode === 'code' && (
              <div onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
                <div className={`flex gap-0 border-b ${BORDER} px-6 py-2`}>
                  {['typescript', 'javascript', 'python', 'other'].map((l, i) => (
                    <button key={l} onClick={() => setLanguage(l)}
                      className={`text-[10px] px-3 py-1.5 font-mono uppercase tracking-wider ${i > 0 ? `border-l ${BORDER}` : ''} ${language === l ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      style={{ transition: 'color 0ms' }}>
                      {l}
                    </button>
                  ))}
                </div>
                <textarea value={code} onChange={e => setCode(e.target.value)} rows={7}
                  placeholder="// Paste your AI application code here..."
                  className="w-full bg-transparent p-6 text-[13px] text-foreground placeholder:text-muted-foreground/30 resize-none focus:outline-none leading-relaxed font-mono" />
              </div>
            )}

            {/* Footer */}
            <div className={`border-t ${BORDER} px-6 py-4 flex flex-col gap-3`}>
              <span className="text-[10px] text-muted-foreground tabular-nums font-mono">
                {mode === 'code' ? `${code.length} chars` : mode === 'prompt' ? `${systemPrompt.length} chars` : targetUrl || 'No target set'} · 57 adversarial attacks ready
              </span>
              <button onClick={runScan} disabled={!canScan()}
                className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground px-6 py-4 text-[13px] font-display font-bold uppercase tracking-wider disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.97]"
                style={{ transition: 'transform 100ms' }}>
                <Shield className="w-4 h-4" />
                RUN SECURITY SCAN
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="px-8 pb-24">
        <div className={`grid grid-cols-2 gap-px bg-[hsl(0_0%_100%/0.06)]`}>
          {categories.map((c, i) => (
            <div key={c.label}
              className={`bg-background border-l-2 ${c.borderColor} px-8 py-10`}
              style={{ animation: 'snap-up 0.15s ease-out forwards', animationDelay: `${2100 + i * 80}ms`, opacity: 0 }}>
              <div className="text-[clamp(2rem,4vw,4rem)] font-display font-black tabular-nums text-foreground leading-none">{c.count}</div>
              <div className="text-[13px] font-display font-bold uppercase tracking-wider text-muted-foreground mt-3">{c.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Ethical note */}
      <section className={`border-t border-[hsl(0_0%_100%/0.06)] px-8 py-8 flex items-center justify-between flex-wrap gap-4`}>
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono">
          Built for developers testing their own agents. Always get permission.
        </span>
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono">
          HackASU 2026 · $52B AI Security Market
        </span>
      </section>

      {/* Footer */}
      <footer className={`border-t border-[hsl(0_0%_100%/0.06)] px-8 py-6 flex items-center justify-between flex-wrap gap-4 text-[10px] text-muted-foreground font-mono`}>
        <span className="uppercase tracking-[0.15em]">AgentBreaker · v1.0</span>
        <span className="uppercase tracking-[0.15em]">Claude-powered · Vendor-neutral · Works with any agent</span>
      </footer>
    </div>
  )
}
