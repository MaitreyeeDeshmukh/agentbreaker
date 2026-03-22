'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'website' | 'prompt' | 'code'

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('website')

  // Website mode
  const [targetUrl, setTargetUrl] = useState('')
  const [endpointPath, setEndpointPath] = useState('')
  const [probing, setProbing] = useState(false)
  const [probeResult, setProbeResult] = useState<{ found: boolean; endpoint?: string; format?: string; error?: string } | null>(null)

  // Prompt mode
  const [systemPrompt, setSystemPrompt] = useState('')

  // Code mode
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('')
  const [filename, setFilename] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const probe = async () => {
    if (!targetUrl.trim()) { setError('Enter a URL to probe'); return }
    setError('')
    setProbing(true)
    setProbeResult(null)
    try {
      const res = await fetch('/api/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      })
      const data = await res.json()
      setProbeResult(data)
      if (data.found && data.endpoint) setEndpointPath(data.endpoint)
    } catch {
      setProbeResult({ found: false, error: 'Failed to probe URL' })
    } finally {
      setProbing(false)
    }
  }

  const run = async () => {
    setError('')

    if (mode === 'website') {
      if (!targetUrl.trim()) { setError('Enter a target URL'); return }
      setLoading(true)
      const params = { mode: 'website', targetUrl, endpointPath: endpointPath || '', format: probeResult?.format || '' }
      sessionStorage.setItem('scan-params', JSON.stringify(params))
      router.push('/scan')
    } else if (mode === 'prompt') {
      if (!systemPrompt.trim() || systemPrompt.trim().length < 10) { setError('System prompt too short (min 10 chars)'); return }
      setLoading(true)
      const params = { mode: 'prompt', systemPrompt }
      sessionStorage.setItem('scan-params', JSON.stringify(params))
      router.push('/scan')
    } else {
      if (!code.trim() || code.trim().length < 20) { setError('Paste some code to analyze (min 20 chars)'); return }
      setLoading(true)
      const params = { mode: 'code', code, language, filename }
      sessionStorage.setItem('scan-params', JSON.stringify(params))
      router.push('/scan')
    }
  }

  const modeConfig: Record<Mode, { icon: string; label: string; desc: string }> = {
    website: { icon: '🌐', label: 'Website', desc: 'Point at any live URL and break it' },
    prompt: { icon: '🧠', label: 'System Prompt', desc: 'Test a prompt before deploying' },
    code: { icon: '📂', label: 'Code Scan', desc: 'CodeRabbit-style AI security review' },
  }

  return (
    <div className="page-wrapper">
      <div className="bg-grid" />
      <div className="bg-gradient-spot bg-gradient-spot--red" />
      <div className="bg-gradient-spot bg-gradient-spot--blue" />

      <nav className="nav">
        <div className="nav__brand">
          <div className="nav__logo">⚡</div>
          <span className="nav__title">AgentBreaker</span>
        </div>
        <button className="btn btn--ghost" onClick={() => router.push('/demo')}>
          Live Demo →
        </button>
      </nav>

      <div className="page-container">
        <div className="page-hero">
          <div className="hero__badge">AI Security Testing</div>
          <h1 className="hero__title">
            Break your AI<br />
            <span>before hackers do.</span>
          </h1>
          <p className="hero__subtitle">
            Point at any website, system prompt, or codebase — run 57 adversarial attacks
            and get a step-by-step fix report.
          </p>
        </div>

        {/* Mode Tabs */}
        <div style={{
          display: 'flex', gap: 6, maxWidth: 600, margin: '0 auto 20px',
          background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
          padding: 5, border: '1px solid var(--border-subtle)',
          animation: 'fadeInUp 0.5s ease-out 0.1s both',
        }}>
          {(Object.keys(modeConfig) as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setProbeResult(null) }}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: mode === m ? 'var(--bg-card)' : 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: mode === m ? 'var(--shadow-card)' : 'none',
                borderColor: mode === m ? 'var(--border-default)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 14 }}>{modeConfig[m].icon}</span>
              <span>{modeConfig[m].label}</span>
            </button>
          ))}
        </div>

        {/* Mode description */}
        <p style={{
          textAlign: 'center', fontSize: 11, color: 'var(--text-muted)',
          marginBottom: 24, animation: 'fadeIn 0.3s ease-out',
          letterSpacing: '0.04em',
        }}>
          {modeConfig[mode].desc}
        </p>

        {/* Form Card */}
        <div className="card" style={{ maxWidth: 600, margin: '0 auto', animation: 'fadeInUp 0.5s ease-out 0.15s both' }}>

          {/* ── WEBSITE MODE ── */}
          {mode === 'website' && (
            <>
              <div className="form-group">
                <label className="form-label">
                  <span className="form-label__icon">🌐</span>
                  Target URL
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    type="url"
                    placeholder="http://localhost:3000  or  https://myapp.vercel.app"
                    value={targetUrl}
                    onChange={e => { setTargetUrl(e.target.value); setProbeResult(null) }}
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn btn--ghost"
                    onClick={probe}
                    disabled={probing}
                    style={{ whiteSpace: 'nowrap', padding: '0 16px' }}
                  >
                    {probing ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5, borderTopColor: 'var(--text-secondary)' }} /> Probing...</> : '🔍 Auto-detect'}
                  </button>
                </div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                  Works with localhost, Vercel, Render, Railway, or any deployed URL
                </p>
              </div>

              {/* Probe result */}
              {probeResult && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 16,
                  fontSize: 11,
                  border: `1px solid ${probeResult.found ? 'rgba(61,220,132,0.2)' : 'rgba(226,75,74,0.2)'}`,
                  background: probeResult.found ? 'var(--green-bg)' : 'var(--red-bg)',
                  color: probeResult.found ? 'var(--green)' : 'var(--red)',
                  animation: 'fadeInUp 0.3s ease-out',
                }}>
                  {probeResult.found ? (
                    <>✓ Found endpoint: <strong>{probeResult.endpoint}</strong> (format: {probeResult.format})</>
                  ) : (
                    <>✗ {probeResult.error || 'No AI endpoint found — enter the path manually below'}</>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  <span className="form-label__icon">📡</span>
                  Endpoint Path
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>(auto-filled or enter manually)</span>
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="/api/chat  or  /api/message  or  /chat"
                  value={endpointPath}
                  onChange={e => setEndpointPath(e.target.value)}
                />
              </div>

              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-elevated)',
                fontSize: 10,
                color: 'var(--text-muted)',
                lineHeight: 1.7,
                marginBottom: 20,
              }}>
                <strong style={{ color: 'var(--text-secondary)' }}>How it works:</strong> AgentBreaker will send 57 real attack payloads (prompt injection,
                goal hijacking, data exfiltration, tool misuse) via HTTP to your AI endpoint, record every response,
                and tell you exactly what broke and how to fix it.
              </div>
            </>
          )}

          {/* ── PROMPT MODE ── */}
          {mode === 'prompt' && (
            <>
              <div className="form-group">
                <label className="form-label">
                  <span className="form-label__icon">🧠</span>
                  System Prompt
                </label>
                <textarea
                  className={`input input--textarea ${error && !systemPrompt.trim() ? 'input--error' : ''}`}
                  placeholder="Paste your agent's system prompt here — e.g., 'You are a helpful customer support agent for Acme Corp...'"
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  style={{ minHeight: 160 }}
                />
              </div>
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-elevated)',
                fontSize: 10,
                color: 'var(--text-muted)',
                lineHeight: 1.7,
                marginBottom: 20,
              }}>
                <strong style={{ color: 'var(--text-secondary)' }}>How it works:</strong> AgentBreaker simulates your agent using this system prompt
                and attacks it with 57 adversarial prompts, then gives you a security report with fixes you can paste right back into your prompt.
              </div>
            </>
          )}

          {/* ── CODE MODE ── */}
          {mode === 'code' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">
                    <span className="form-label__icon">📝</span>
                    Language
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>(optional)</span>
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="TypeScript, Python, JS..."
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">
                    <span className="form-label__icon">📂</span>
                    Filename
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>(optional)</span>
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="app/api/chat/route.ts"
                    value={filename}
                    onChange={e => setFilename(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="form-label__icon">💻</span>
                  Code to Scan
                </label>
                <textarea
                  className={`input input--textarea ${error && !code.trim() ? 'input--error' : ''}`}
                  placeholder="Paste your AI route handler, chat API, or any code that calls an LLM..."
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  style={{ minHeight: 200, fontFamily: 'var(--font-mono)', fontSize: 11 }}
                />
              </div>
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-elevated)',
                fontSize: 10,
                color: 'var(--text-muted)',
                lineHeight: 1.7,
                marginBottom: 20,
              }}>
                <strong style={{ color: 'var(--text-secondary)' }}>How it works:</strong> Like CodeRabbit for AI security — scans for prompt injection
                risks, exposed API keys, missing auth, unsafe output handling, and 7 more AI-specific vulnerability classes.
              </div>
            </>
          )}

          {error && (
            <div style={{
              fontSize: 11, color: 'var(--red)', background: 'var(--red-bg)',
              border: '1px solid rgba(226,75,74,0.2)', borderRadius: 'var(--radius-sm)',
              padding: '8px 12px', marginBottom: 16, animation: 'fadeIn 0.3s ease-out',
            }}>
              ⚠ {error}
            </div>
          )}

          <button
            className={`btn btn--primary ${loading ? 'btn--loading' : ''}`}
            onClick={run}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" /> Starting scan...</>
            ) : mode === 'website' ? (
              <>⚡ Break This Website</>
            ) : mode === 'prompt' ? (
              <>⚡ Attack This Prompt</>
            ) : (
              <>⚡ Scan This Code</>
            )}
          </button>
        </div>

        {/* Feature cards */}
        <div className="features" style={{ maxWidth: 600, margin: '32px auto 0' }}>
          {[
            { icon: '💉', title: 'Prompt Injection', desc: '15 attacks — instruction override, role switching, nested injection.' },
            { icon: '🎯', title: 'Goal Hijacking', desc: '12 attacks — mission reframe, authority claim, emotional manipulation.' },
            { icon: '📡', title: 'Data Exfiltration', desc: '12 attacks — system prompt leak, API key extraction, context dump.' },
            { icon: '🔧', title: 'Tool Misuse', desc: '11 attacks — unauthorized file access, code execution, tool chaining.' },
          ].map((f, i) => (
            <div className="feature" key={i}>
              <div className="feature__icon">{f.icon}</div>
              <div className="feature__title">{f.title}</div>
              <div className="feature__desc">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Install banner */}
        <div style={{
          maxWidth: 600, margin: '24px auto 0',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
          animation: 'fadeInUp 0.5s ease-out 0.4s both',
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            CLI — 2-step install
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              '$ npm install -g agentbreaker',
              '$ agentbreaker scan --url http://localhost:3000',
            ].map((cmd, i) => (
              <div key={i} style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                fontSize: 11,
                color: i === 0 ? 'var(--text-secondary)' : 'var(--green)',
                fontFamily: 'var(--font-mono)',
              }}>
                {cmd}
              </div>
            ))}
          </div>
        </div>

        {/* Ethical use statement */}
        <div style={{
          maxWidth: 600, margin: '20px auto 0',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(74,158,255,0.15)',
          background: 'rgba(74,158,255,0.04)',
          fontSize: 10,
          color: 'var(--text-muted)',
          lineHeight: 1.8,
          animation: 'fadeInUp 0.5s ease-out 0.5s both',
        }}>
          <span style={{ color: 'var(--blue)', fontWeight: 600 }}>Responsible use: </span>
          AgentBreaker is built for developers to test their own AI agents and applications.
          Never use it against agents or systems you don&apos;t own or have explicit permission to test.
          Security testing is only ethical when you&apos;re the one who built it, or have been asked to break it.
        </div>

        {/* Market context */}
        <p style={{
          textAlign: 'center', fontSize: 10, color: 'var(--text-muted)',
          maxWidth: 600, margin: '14px auto 0', lineHeight: 1.7,
        }}>
          $52B AI agent market by 2030 — every deployment is a potential attack surface.
        </p>

        <div className="footer">AgentBreaker — AI security testing for the vibe-code era</div>
      </div>
    </div>
  )
}
