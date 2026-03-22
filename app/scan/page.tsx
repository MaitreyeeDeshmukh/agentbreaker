'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'

interface ScanLog {
  text: string
  type: 'info' | 'pass' | 'fail' | 'system' | 'warn'
}

interface ScanParams {
  mode: 'website' | 'prompt' | 'code'
  targetUrl?: string
  endpointPath?: string
  format?: string
  systemPrompt?: string
  code?: string
  language?: string
  filename?: string
}

function ScanContent() {
  const router = useRouter()
  const [logs, setLogs] = useState<ScanLog[]>([])
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Initializing scanner...')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  const addLog = (log: ScanLog) => setLogs(prev => [...prev, log])

  useEffect(() => {
    const raw = sessionStorage.getItem('scan-params')
    if (!raw) { router.push('/'); return }

    let params: ScanParams
    try { params = JSON.parse(raw) } catch { router.push('/'); return }

    let cancelled = false

    async function runScan() {
      addLog({ text: '◆ AgentBreaker — Security Scanner', type: 'system' })

      if (params.mode === 'website') {
        addLog({ text: `◇ Mode: Live Website Attack`, type: 'info' })
        addLog({ text: `◇ Target: ${params.targetUrl}`, type: 'info' })
        if (params.endpointPath) addLog({ text: `◇ Endpoint: ${params.endpointPath}`, type: 'info' })
        addLog({ text: '◇ Loading 57 attack vectors...', type: 'info' })
        setStatus('Preparing website attacks...')
        setProgress(5)
      } else if (params.mode === 'prompt') {
        addLog({ text: `◇ Mode: System Prompt Scan`, type: 'info' })
        addLog({ text: `◇ Target: "${(params.systemPrompt || '').slice(0, 60)}..."`, type: 'info' })
        addLog({ text: '◇ Loading 57 attack vectors...', type: 'info' })
        setStatus('Preparing adversarial attacks...')
        setProgress(5)
      } else {
        addLog({ text: `◇ Mode: Code Security Scan`, type: 'info' })
        if (params.filename) addLog({ text: `◇ File: ${params.filename}`, type: 'info' })
        addLog({ text: '◇ Analyzing code for AI security vulnerabilities...', type: 'info' })
        setStatus('Running code analysis...')
        setProgress(5)
      }

      await new Promise(r => setTimeout(r, 600))
      if (cancelled) return

      try {
        // Build endpoint and body
        let apiEndpoint: string
        let body: object

        if (params.mode === 'website') {
          apiEndpoint = '/api/scan-website'
          body = {
            targetUrl: params.targetUrl,
            endpointPath: params.endpointPath || '',
            format: params.format || '',
          }
          addLog({ text: '◆ Launching live attack sequence...', type: 'system' })
        } else if (params.mode === 'prompt') {
          apiEndpoint = '/api/scan-stream'
          body = { systemPrompt: params.systemPrompt }
          addLog({ text: '◆ Starting adversarial prompt testing...', type: 'system' })
        } else {
          apiEndpoint = '/api/scan-code'
          body = { code: params.code, language: params.language, filename: params.filename }
          addLog({ text: '◆ Running CodeRabbit-style AI security analysis...', type: 'system' })
        }

        setProgress(10)
        setStatus(params.mode === 'code' ? 'Analyzing code...' : 'Running attacks...')

        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error((data as { error?: string }).error || `Server error ${res.status}`)
        }

        if (res.headers.get('content-type')?.includes('text/event-stream')) {
          // Streaming SSE response
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
                  setProgress(12)
                  if (params.mode === 'website') {
                    addLog({ text: `◇ Endpoint: ${event.endpoint || params.endpointPath || 'auto-detected'}`, type: 'info' })
                  }
                  addLog({ text: `◇ Total tests: ${event.total}`, type: 'info' })

                } else if (event.type === 'result') {
                  const r = event.result
                  const pct = 12 + Math.round((event.progress / event.total) * 83)
                  setProgress(pct)
                  setStatus(`Testing: ${r.name}`)
                  addLog({
                    text: `${r.passed ? '✓' : '✗'} [${r.severity.toUpperCase()}] ${r.name}${!r.passed && params.mode === 'website' ? ` (HTTP ${r.httpStatus || '?'})` : ''}`,
                    type: r.passed ? 'pass' : 'fail',
                  })

                } else if (event.type === 'issue') {
                  // Code scan issue
                  const iss = event.issue
                  const pct = 12 + Math.round((event.progress / 10) * 83)
                  setProgress(Math.min(pct, 90))
                  setStatus(`Found: ${iss.title}`)
                  addLog({
                    text: `✗ [${iss.severity.toUpperCase()}] ${iss.title}`,
                    type: 'fail',
                  })

                } else if (event.type === 'progress') {
                  addLog({ text: `◇ ${event.message}`, type: 'info' })

                } else if (event.type === 'complete') {
                  setProgress(100)
                  setStatus('Scan complete')
                  addLog({ text: '', type: 'info' })

                  const rep = event.report
                  if (params.mode === 'code') {
                    addLog({ text: `◆ Code scan complete: ${rep.totalIssues} issues found`, type: 'system' })
                    addLog({ text: `◆ Security Score: ${rep.securityScore}/100`, type: rep.securityScore >= 50 ? 'pass' : 'fail' })
                  } else {
                    addLog({ text: `◆ Results: ${rep.passed} resisted / ${rep.failed} vulnerable`, type: 'system' })
                    addLog({ text: `◆ Security Score: ${rep.securityScore}/100`, type: rep.securityScore >= 50 ? 'pass' : 'fail' })
                    if (params.mode === 'website' && rep.targetEndpoint) {
                      addLog({ text: `◆ Endpoint tested: ${rep.targetEndpoint}`, type: 'system' })
                    }
                  }

                  sessionStorage.setItem(`report-${rep.id}`, JSON.stringify(rep))
                  await new Promise(r => setTimeout(r, 1200))
                  if (!cancelled) { setDone(true); router.push(`/report/${rep.id}`) }
                }
              } catch { /* skip malformed SSE */ }
            }
          }
        } else {
          // JSON response (fallback for non-streaming)
          const data = await res.json()
          setProgress(100)
          setStatus('Scan complete')
          const rep = data.report
          addLog({ text: `◆ Results: ${rep.passed} resisted / ${rep.failed} vulnerable`, type: 'system' })
          addLog({ text: `◆ Security Score: ${rep.securityScore}/100`, type: rep.securityScore >= 50 ? 'pass' : 'fail' })
          sessionStorage.setItem(`report-${rep.id}`, JSON.stringify(rep))
          await new Promise(r => setTimeout(r, 1000))
          if (!cancelled) { setDone(true); router.push(`/report/${rep.id}`) }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Scan failed'
        setError(msg)
        setStatus('Error')
        addLog({ text: `✗ Error: ${msg}`, type: 'fail' })
      }
    }

    runScan()
    return () => { cancelled = true }
  }, [router])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  const modeLabel = (() => {
    try {
      const p: ScanParams = JSON.parse(sessionStorage.getItem('scan-params') || '{}')
      return p.mode === 'website' ? 'Website Attack' : p.mode === 'code' ? 'Code Scan' : 'Prompt Scan'
    } catch { return 'Security Scan' }
  })()

  return (
    <div className="page-wrapper">
      <nav className="nav">
        <div className="nav__brand">
          <div className="nav__logo">⚡</div>
          <span className="nav__title">AgentBreaker</span>
          <span className="nav__path">/{modeLabel.toLowerCase().replace(' ', '-')}</span>
        </div>
        <span className="nav__timestamp">{status}</span>
      </nav>

      <div className="page-container" style={{ paddingTop: 32, maxWidth: 700 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 4, animation: 'fadeInUp 0.4s ease-out',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {done ? 'Complete — redirecting to report...' : error ? 'Scan failed' : `Running ${modeLabel.toLowerCase()}...`}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{progress}%</span>
        </div>

        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="scan-terminal" style={{ marginTop: 16 }}>
          <div className="scan-terminal__header">
            <div className="scan-terminal__dot scan-terminal__dot--red" />
            <div className="scan-terminal__dot scan-terminal__dot--yellow" />
            <div className="scan-terminal__dot scan-terminal__dot--green" />
            <div className="scan-terminal__title">agentbreaker — {modeLabel.toLowerCase()}</div>
          </div>
          <div className="scan-terminal__body" ref={logRef} style={{ maxHeight: 440 }}>
            <div className="scan-log">
              {logs.map((log, i) => (
                <div key={i} className="scan-log__line" style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s` }}>
                  <span className="scan-log__prefix">
                    {log.type === 'system' ? '›' : ' '}
                  </span>
                  <span className={
                    log.type === 'pass' ? 'scan-log__text--pass' :
                    log.type === 'fail' ? 'scan-log__text--fail' :
                    log.type === 'warn' ? '' :
                    log.type === 'system' ? '' :
                    'scan-log__text--info'
                  } style={log.type === 'system' ? { color: 'var(--text-primary)', fontWeight: 600 } : log.type === 'warn' ? { color: 'var(--orange)' } : undefined}>
                    {log.text}
                  </span>
                </div>
              ))}
              {!done && !error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Running...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{
              background: 'var(--red-bg)', border: '1px solid rgba(226,75,74,0.2)',
              borderRadius: 'var(--radius-md)', padding: '14px 16px',
              fontSize: 12, color: 'var(--red)', marginBottom: 12,
            }}>
              ⚠ {error}
            </div>
            <button className="btn btn--primary" onClick={() => router.push('/')}>
              ← Back to Scanner
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Initializing...</div>
        </div>
      </div>
    }>
      <ScanContent />
    </Suspense>
  )
}
