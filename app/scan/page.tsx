'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'

interface ScanParams {
  mode: 'website' | 'browser' | 'prompt' | 'code'
  targetUrl?: string
  endpointPath?: string
  format?: string
  systemPrompt?: string
  code?: string
  language?: string
  filename?: string
}

interface AttackRow {
  id: string
  name: string
  category: string
  severity: string
  passed: boolean
  httpStatus?: number
}

const catColor: Record<string, string> = {
  prompt_injection: 'text-agent-red',
  goal_hijacking:   'text-agent-amber',
  data_exfiltration:'text-agent-blue',
  tool_misuse:      'text-agent-green',
}

function ScanContent() {
  const router = useRouter()
  const [rows, setRows]         = useState<AttackRow[]>([])
  const [total, setTotal]       = useState(57)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')
  const [status, setStatus]     = useState('Initializing...')
  const [mode, setMode]         = useState<ScanParams['mode']>('prompt')
  const [reportId, setReportId] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const vulnerable = rows.filter(r => !r.passed).length
  const critical   = rows.filter(r => !r.passed && r.severity === 'critical').length
  const high       = rows.filter(r => !r.passed && r.severity === 'high').length
  const medium     = rows.filter(r => !r.passed && r.severity === 'medium').length
  const low        = rows.filter(r => !r.passed && r.severity === 'low').length
  const score      = done ? Math.max(0, Math.min(100, 100 - critical * 25 - high * 12 - medium * 5 - low * 2)) : 0

  const scoreColor = (s: number) => s >= 80 ? 'hsl(var(--agent-green))' : s >= 60 ? 'hsl(var(--agent-amber))' : 'hsl(var(--primary))'

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [rows])

  useEffect(() => {
    const raw = sessionStorage.getItem('scan-params')
    if (!raw) { router.push('/'); return }
    let params: ScanParams
    try { params = JSON.parse(raw) } catch { router.push('/'); return }
    setMode(params.mode)

    let cancelled = false

    async function runScan() {
      let apiEndpoint: string
      let body: object

      if (params.mode === 'website') {
        apiEndpoint = '/api/scan-website'
        body = { targetUrl: params.targetUrl, endpointPath: params.endpointPath || '', format: params.format || '' }
      } else if (params.mode === 'browser') {
        apiEndpoint = '/api/scan-browser'
        body = { targetUrl: params.targetUrl }
      } else if (params.mode === 'prompt') {
        apiEndpoint = '/api/scan-stream'
        body = { systemPrompt: params.systemPrompt }
      } else {
        apiEndpoint = '/api/scan-code'
        body = { code: params.code, language: params.language, filename: params.filename }
      }

      try {
        setStatus('Launching attacks...')
        const res = await fetch(apiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error(`Server error ${res.status}`)

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          if (cancelled) { reader.cancel(); return }
          const { done: streamDone, value } = await reader.read()
          if (streamDone) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))
              if (event.type === 'start') {
                setTotal(event.total || 57)
              } else if (event.type === 'result') {
                const r = event.result
                setRows(prev => [...prev, { id: r.attackId, name: r.name, category: r.category, severity: r.severity, passed: r.passed, httpStatus: r.httpStatus }])
                setStatus(`Testing: ${r.name}`)
              } else if (event.type === 'issue') {
                const iss = event.issue
                setRows(prev => [...prev, { id: iss.id, name: iss.title, category: iss.category, severity: iss.severity, passed: false }])
                setStatus(`Found: ${iss.title}`)
              } else if (event.type === 'progress') {
                setStatus(event.message)
              } else if (event.type === 'complete') {
                const rep = event.report
                setReportId(rep.id)
                sessionStorage.setItem(`report-${rep.id}`, JSON.stringify(rep))
                setDone(true)
                setStatus('Scan complete')
                await new Promise(r => setTimeout(r, 1200))
                if (!cancelled) router.push(`/report/${rep.id}`)
              }
            } catch { /* skip malformed */ }
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Scan failed'
        setError(msg)
        setStatus('Error')
      }
    }

    runScan()
    return () => { cancelled = true }
  }, [router])

  const modeLabel = mode === 'website' ? 'API Attack' : mode === 'browser' ? 'Browser Attack' : mode === 'code' ? 'Code Scan' : 'Prompt Scan'
  const BORDER = 'border-[hsl(0_0%_100%/0.06)]'

  return (
    <div className={`min-h-screen flex flex-col scan-cursor bg-background`}>

      {/* Progress bar — 3px glowing */}
      {!done && (
        <div className={`h-[3px] bg-card relative overflow-hidden`}>
          <div className="h-full bg-primary" style={{
            width: `${total > 0 ? (rows.length / total) * 100 : 0}%`,
            transition: 'width 150ms ease-out',
            boxShadow: '0 0 12px rgba(226,75,74,0.5)',
          }} />
        </div>
      )}

      {/* Nav */}
      <nav className={`border-b ${BORDER} px-8 py-4 flex items-center gap-4`}>
        <a href="/" className="text-muted-foreground hover:text-foreground" style={{ transition: 'color 0ms' }}>
          <ArrowLeft className="w-4 h-4" />
        </a>
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono">
          AgentBreaker / {modeLabel.toLowerCase().replace(' ', '-')}
        </span>
        <span className="ml-auto text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-mono tabular-nums">
          {done ? `Complete · ${rows.length} tests` : status}
        </span>
      </nav>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 53px)' }}>

        {/* ── Left: attack log ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Massive counter */}
          <div className={`px-8 py-8 border-b ${BORDER}`}>
            <span className="text-[80px] md:text-[100px] font-display font-black leading-none tabular-nums text-foreground tracking-tight">
              {rows.length}<span className="text-muted-foreground">/{total}</span>
            </span>
          </div>

          {/* Column headers */}
          <div className={`border-b ${BORDER} px-8 py-2 flex text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-mono`}>
            <span className="w-5" />
            <span className="w-14">Sev</span>
            <span className="w-24">Category</span>
            <span className="flex-1">Attack</span>
            <span className="w-14 text-right">Result</span>
          </div>

          {/* Rows */}
          <div ref={listRef} className="flex-1 overflow-y-auto">
            {rows.map((r, i) => (
              <div
                key={`${r.id}-${i}`}
                className={`flex items-center px-8 py-2.5 text-[11px] border-b ${BORDER}/50 font-mono ${i === rows.length - 1 && !done ? 'bg-primary/[0.03]' : ''}`}
                style={{ animation: 'slide-in-left 0.15s ease-out forwards', opacity: 0 }}
              >
                <span className="w-5 flex-shrink-0">
                  <span className={`w-2 h-2 inline-block ${r.passed ? 'bg-agent-green' : 'bg-primary'}`}
                    style={!r.passed ? { animation: 'pulse-dot 1.5s ease-in-out 2' } : {}} />
                </span>
                <span className="w-14 flex-shrink-0 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {r.severity === 'critical' ? 'CRIT' : r.severity?.toUpperCase()}
                </span>
                <span className={`w-24 flex-shrink-0 text-[10px] truncate ${catColor[r.category] || 'text-muted-foreground'}`}>
                  {r.category?.replace('_', ' ')}
                </span>
                <span className="flex-1 text-muted-foreground truncate">{r.name}</span>
                <span className={`w-14 text-right font-bold text-[9px] uppercase tracking-wider ${r.passed ? 'text-agent-green' : 'text-primary'}`}>
                  {r.passed ? 'PASS' : 'VULN'}
                </span>
              </div>
            ))}

            {/* Loading indicator */}
            {!done && !error && (
              <div className="px-8 py-4 flex items-center gap-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 bg-primary rounded-full"
                      style={{ animation: 'typing-dot 1.2s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Running...</span>
              </div>
            )}

            {error && (
              <div className="px-8 py-6">
                <p className="text-[12px] text-primary font-mono">⚠ {error}</p>
                <a href="/" className="mt-4 inline-block text-[11px] font-mono text-muted-foreground hover:text-foreground uppercase tracking-wider">← Back to scanner</a>
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className={`w-[220px] border-l ${BORDER} p-8 flex flex-col gap-8 bg-card`}>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground font-mono">Vulnerabilities</span>

          {done ? (
            <div style={{ animation: 'snap-up 0.2s ease-out forwards' }}>
              <div className="flex flex-col items-center gap-2 mb-8">
                <span className="text-[72px] font-display font-black leading-none tabular-nums" style={{ color: scoreColor(score) }}>
                  {score}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono" style={{ color: scoreColor(score) }}>
                  {score >= 80 ? 'SECURE' : score >= 60 ? 'AT RISK' : 'CRITICAL'}
                </span>
              </div>
              <a href={`/report/${reportId}`}
                className="block w-full text-center text-[11px] bg-primary text-primary-foreground px-4 py-4 font-display font-bold uppercase tracking-wider active:scale-[0.97]"
                style={{ transition: 'transform 100ms' }}>
                View full report →
              </a>
            </div>
          ) : (
            <>
              <div>
                <div className="text-[64px] font-display font-black text-primary tabular-nums leading-none">{vulnerable}</div>
                <span className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-mono">found</span>
              </div>

              <div className="space-y-4">
                {([['CRIT', critical, 'bg-primary'], ['HIGH', high, 'bg-agent-amber'], ['MED', medium, 'bg-agent-blue'], ['LOW', low, 'bg-agent-green']] as const).map(
                  ([label, count, bg]) => (
                    <div key={label}>
                      <div className={`flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground font-mono mb-1`}>
                        <span>{label}</span>
                        <span className="tabular-nums text-foreground">{count}</span>
                      </div>
                      <div className={`w-full h-1 bg-[hsl(0_0%_100%/0.06)] overflow-hidden`}>
                        <div className={`h-full ${bg}`} style={{ width: `${Math.min((count / 10) * 100, 100)}%`, transition: 'width 150ms ease-out' }} />
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="mt-auto">
                <div className={`flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground font-mono mb-2`}>
                  <span>Progress</span>
                  <span className="tabular-nums text-foreground">{rows.length}/{total}</span>
                </div>
                <div className={`w-full h-1 bg-[hsl(0_0%_100%/0.06)] overflow-hidden`}>
                  <div className="h-full bg-primary" style={{ width: `${total > 0 ? (rows.length / total) * 100 : 0}%`, transition: 'width 150ms ease-out' }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-2 h-2 bg-primary rounded-full"
                style={{ animation: 'typing-dot 1.2s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Initializing scanner...</span>
        </div>
      </div>
    }>
      <ScanContent />
    </Suspense>
  )
}
