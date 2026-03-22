'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Shield, Globe, Terminal, FileCode, LayoutDashboard, ArrowRight, X } from 'lucide-react'
import LoadingScreen from './components/LoadingScreen'
import Nav from './components/Nav'

const stats = [
  { num: 73,  suffix: '%',  desc: 'of production agents vulnerable' },
  { num: 540, suffix: '%',  desc: 'YoY increase in AI security reports' },
  { prefix: '#', num: 1, suffix: '', desc: 'OWASP #1 LLM vulnerability' },
]

const features = [
  {
    icon: Globe,
    label: 'Browser Attack',
    href: '/attack/browser',
    badge: 'MAIN FEATURE',
    color: 'text-agent-green',
    borderColor: 'border-l-agent-green',
    desc: 'A real browser navigates your live web app and types adversarial prompts into every chat, form, and input field. Tests your actual product, not just an API.',
  },
  {
    icon: Terminal,
    label: 'Prompt Injection',
    href: '/attack/prompt',
    badge: null,
    color: 'text-primary',
    borderColor: 'border-l-primary',
    desc: "Paste your agent's system prompt. We fire 57 jailbreaks, role-override attacks, and instruction-hijacking payloads at it and report every hole.",
  },
  {
    icon: Shield,
    label: 'API Attack',
    href: '/attack/api',
    badge: null,
    color: 'text-agent-blue',
    borderColor: 'border-l-agent-blue',
    desc: 'Point at your AI API endpoint. We send adversarial payloads in every supported format and evaluate every response for vulnerabilities.',
  },
  {
    icon: FileCode,
    label: 'Code Scan',
    href: '/attack/code',
    badge: null,
    color: 'text-agent-amber',
    borderColor: 'border-l-agent-amber',
    desc: 'Paste your AI application code. We analyze it for hardcoded prompts, unsafe tool calls, missing input validation, and injection sinks.',
  },
]

function useTickUp(target: number, delay = 800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now()
      const duration = 1200
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        setVal(Math.floor(p * target))
        if (p < 1) requestAnimationFrame(tick)
        else setVal(target)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, delay])
  return val
}

const HOLES_LETTERS = ['H', 'O', 'L', 'E', 'S', '.']

function HolesTypewriter() {
  const [count, setCount] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => {
      let i = 0
      const iv = setInterval(() => {
        i++; setCount(i)
        if (i >= HOLES_LETTERS.length) { clearInterval(iv); setTimeout(() => setShowCursor(false), 1000) }
      }, 80)
      return () => clearInterval(iv)
    }, 600)
    return () => clearTimeout(t)
  }, [])
  return (
    <h1 className="text-[clamp(3.5rem,12vw,8rem)] font-display font-black uppercase leading-[0.9] tracking-[-0.02em]" style={{ color: 'hsl(var(--primary))' }}>
      {HOLES_LETTERS.slice(0, count).join('')}
      {showCursor && <span className="inline-block w-[0.06em] bg-primary ml-[0.02em] align-baseline" style={{ height: '0.85em', animation: 'cursor-blink 0.6s step-end infinite' }} />}
    </h1>
  )
}

const ATTACK_OPTIONS = [
  { icon: Globe,     label: 'Browser Attack', href: '/attack/browser', color: 'text-agent-green', borderColor: 'border-l-agent-green', badge: 'MAIN', desc: 'Real browser navigates your live app and tests every input.' },
  { icon: Terminal,  label: 'Prompt Scan',    href: '/attack/prompt',  color: 'text-primary',     borderColor: 'border-l-primary',     badge: null,   desc: 'Fire 57 jailbreaks at your system prompt and find every hole.' },
  { icon: Shield,    label: 'API Attack',     href: '/attack/api',     color: 'text-agent-blue',  borderColor: 'border-l-agent-blue',  badge: null,   desc: 'Send adversarial payloads to your AI API endpoint.' },
  { icon: FileCode,  label: 'Code Scan',      href: '/attack/code',    color: 'text-agent-amber', borderColor: 'border-l-agent-amber', badge: null,   desc: 'Static analysis for injection sinks and unsafe patterns.' },
]

export default function Home() {
  const [loaded, setLoaded] = useState(false)
  const [scanModalOpen, setScanModalOpen] = useState(false)
  const stat0 = useTickUp(73,  loaded ? 1800 : 99999)
  const stat1 = useTickUp(540, loaded ? 1900 : 99999)

  if (!loaded) return <LoadingScreen onComplete={() => setLoaded(true)} />

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav transparent />

      {/* Fixed SCAN NOW button */}
      <button
        onClick={() => setScanModalOpen(true)}
        className="fixed bottom-8 right-8 z-50 w-28 h-28 bg-primary text-white border-2 border-white flex items-center justify-center text-[10px] font-bold uppercase tracking-widest font-display hover:bg-white hover:text-primary active:scale-95 rounded-full text-center leading-tight"
        style={{ transition: 'background 0ms, color 0ms, transform 100ms', animation: 'fade-in-simple 0.4s ease-out forwards', animationDelay: '1200ms', opacity: 0 }}
      >
        SCAN<br />NOW
      </button>

      {/* Attack selector modal */}
      {scanModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl" style={{ animation: 'snap-up 0.2s ease-out forwards' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono mb-1">SELECT ATTACK TYPE</div>
                <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] font-display font-black uppercase leading-none text-white">Choose Your Vector</h2>
              </div>
              <button onClick={() => setScanModalOpen(false)} className="text-white/40 hover:text-white p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[hsl(0_0%_100%/0.08)]">
              {ATTACK_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <Link
                    key={opt.href}
                    href={opt.href}
                    onClick={() => setScanModalOpen(false)}
                    className={`group bg-background border-l-2 ${opt.borderColor} px-6 py-6 flex flex-col gap-3 hover:bg-card`}
                    style={{ transition: 'background 0ms' }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${opt.color}`} />
                      <span className={`text-[11px] font-mono font-bold uppercase tracking-[0.15em] ${opt.color}`}>{opt.label}</span>
                      {opt.badge && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 font-mono font-bold uppercase tracking-widest">{opt.badge}</span>}
                    </div>
                    <p className="text-[12px] text-white/50 font-mono leading-[1.5]">{opt.desc}</p>
                    <span className={`text-[10px] font-mono uppercase tracking-wider ${opt.color} group-hover:underline mt-auto`}>Start →</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="min-h-screen flex flex-col md:flex-row items-start px-8 pt-[80px] pb-16 relative overflow-hidden">
        <div className="flex-[7] flex flex-col justify-start pt-[100px]">
          <h1
            className="text-[clamp(3.5rem,12vw,8rem)] font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-white"
            style={{ animation: 'crash-in-left 0.6s ease-out forwards', transform: 'translateX(-100vw)' }}
          >
            YOUR VIBECODED<br />PLATFORM HAS
          </h1>
          <HolesTypewriter />
        </div>

        <div className="flex-[3] flex flex-col justify-start gap-8 md:pl-12 pt-[100px]" style={{ animation: 'fade-in-simple 0.4s ease-out forwards', animationDelay: '1000ms', opacity: 0 }}>
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-mono">01 / WHAT IT DOES</span>
          <p className="text-[14px] text-white leading-[1.6] font-mono max-w-[380px]">
            AgentBreaker runs 57 real adversarial attacks against your AI agent: prompt injections, jailbreaks, goal hijacking, data exfiltration. Every hole gets a step-by-step fix report.
          </p>
          <div className="flex items-baseline gap-6 flex-wrap">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <span className="text-[52px] font-display font-black tabular-nums leading-none" style={{ color: i === 2 ? 'hsl(var(--primary))' : 'white' }}>
                  {s.prefix || ''}{i === 0 ? stat0 : i === 1 ? stat1 : s.num}{s.suffix}
                </span>
                <span className="text-[11px] uppercase font-mono leading-tight max-w-[120px] text-white/55" style={{ letterSpacing: '0.08em' }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Red diagonal stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-primary"
          style={{ clipPath: 'polygon(0 60%, 100% 0, 100% 100%, 0 100%)', animation: 'fade-in-simple 0.4s ease-out forwards', animationDelay: '1200ms', opacity: 0 }} />
      </section>

      {/* ── FEATURES ── */}
      <section className="px-8 py-20">
        <div className="mb-12" style={{ animation: 'snap-up 0.3s ease-out forwards', animationDelay: '1.4s', opacity: 0 }}>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">02 / ATTACK SURFACES</span>
          <h2 className="mt-4 text-[clamp(2rem,5vw,4rem)] font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-white">
            CHOOSE YOUR<br />ATTACK VECTOR
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[hsl(0_0%_100%/0.06)]">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <Link
                key={f.href}
                href={f.href}
                className={`group bg-background border-l-2 ${f.borderColor} px-8 py-10 flex flex-col gap-4 hover:bg-card`}
                style={{ animation: 'snap-up 0.2s ease-out forwards', animationDelay: `${1600 + i * 100}ms`, opacity: 0, transition: 'background 0ms' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${f.color}`} />
                    <span className={`text-[11px] font-mono font-bold uppercase tracking-[0.15em] ${f.color}`}>{f.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {f.badge && <span className="text-[9px] bg-agent-green text-black px-2 py-0.5 font-mono font-bold uppercase tracking-widest">{f.badge}</span>}
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/80" style={{ transition: 'color 0ms' }} />
                  </div>
                </div>
                <p className="text-[13px] text-white/60 leading-[1.6] font-mono">{f.desc}</p>
                <span className={`text-[10px] font-mono uppercase tracking-wider ${f.color} group-hover:underline mt-auto`}>
                  Start attack →
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── DASHBOARD CTA ── */}
      <section className="px-8 pb-20" style={{ animation: 'snap-up 0.3s ease-out forwards', animationDelay: '2.1s', opacity: 0 }}>
        <Link href="/dashboard"
          className="flex items-center justify-between px-8 py-6 border border-[hsl(0_0%_100%/0.1)] hover:border-white/40 hover:bg-card group"
          style={{ transition: 'background 0ms, border-color 0ms' }}>
          <div className="flex items-center gap-4">
            <LayoutDashboard className="w-5 h-5 text-white/50 group-hover:text-white" style={{ transition: 'color 0ms' }} />
            <div>
              <div className="text-[13px] font-display font-bold uppercase tracking-wider text-white">View Past Scans</div>
              <div className="text-[11px] font-mono text-white/40 mt-0.5">Dashboard · all your previous security reports</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white" style={{ transition: 'color 0ms' }} />
        </Link>
      </section>

      {/* ── ATTACK CATEGORIES ── */}
      <section className="px-8 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[hsl(0_0%_100%/0.06)]">
          {[
            { n: 15, label: 'Prompt Injection',  color: 'text-primary' },
            { n: 12, label: 'Goal Hijacking',    color: 'text-agent-amber' },
            { n: 12, label: 'Data Exfiltration', color: 'text-agent-blue' },
            { n: 11, label: 'Tool Misuse',       color: 'text-agent-green' },
          ].map((c, i) => (
            <div key={c.label} className="bg-background px-6 py-8" style={{ animation: 'snap-up 0.15s ease-out forwards', animationDelay: `${2200 + i * 80}ms`, opacity: 0 }}>
              <div className={`text-[clamp(2rem,4vw,3.5rem)] font-display font-black tabular-nums leading-none ${c.color}`}>{c.n}</div>
              <div className="text-[11px] font-display font-bold uppercase tracking-wider text-white/50 mt-2">{c.label}</div>
              <div className="text-[10px] font-mono text-white/30 mt-1">attacks</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(0_0%_100%/0.06)] px-8 py-6 flex items-center justify-between flex-wrap gap-4 text-[10px] text-white/30 font-mono">
        <span className="uppercase tracking-[0.15em]">AgentBreaker · v1.0 · HackASU 2026</span>
        <span className="uppercase tracking-[0.15em]">Claude-powered · 57 attacks · Works with any AI agent</span>
      </footer>
    </div>
  )
}
