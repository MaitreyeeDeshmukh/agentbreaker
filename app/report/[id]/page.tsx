'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { buildFixPrompt } from '@/lib/fix-suggestions'

// ── Types ──────────────────────────────────────────────────────────────────
interface TestResult {
  attackId: string
  name: string
  category: string
  severity: string
  passed: boolean
  agentResponse: string
  reasoning: string
  reproductionSteps: string
  fixSuggestion?: string
  attackPayload?: string
  httpStatus?: number
}

interface CodeIssue {
  id: string
  severity: string
  category: string
  title: string
  description: string
  location?: string
  fixSuggestion: string
  codeSnippet?: string
  fixCode?: string
}

interface AttackReport {
  id: string
  createdAt: string
  systemPromptSnippet: string
  totalTests: number
  passed: number
  failed: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  securityScore: number
  results: TestResult[]
  mode: 'prompt' | 'website'
  targetUrl?: string
  targetEndpoint?: string
}

interface CodeReport {
  id: string
  createdAt: string
  totalIssues: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  securityScore: number
  issues: CodeIssue[]
  fixPrompt: string
  mode: 'code'
}

type AnyReport = AttackReport | CodeReport
function isCodeReport(r: AnyReport): r is CodeReport { return r.mode === 'code' }

// ── Helpers ────────────────────────────────────────────────────────────────
const SEV: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: 'var(--red)', bg: 'var(--red-bg)', border: 'rgba(226,75,74,0.2)' },
  high: { color: 'var(--orange)', bg: 'var(--orange-bg)', border: 'rgba(245,166,35,0.2)' },
  medium: { color: 'var(--blue)', bg: 'var(--blue-bg)', border: 'rgba(74,158,255,0.2)' },
  low: { color: 'var(--green)', bg: 'var(--green-bg)', border: 'rgba(61,220,132,0.2)' },
}

function getGrade(score: number) {
  if (score >= 90) return { label: 'A', color: 'var(--green)', bg: 'var(--green-bg)' }
  if (score >= 75) return { label: 'B', color: 'var(--blue)', bg: 'var(--blue-bg)' }
  if (score >= 50) return { label: 'C', color: 'var(--orange)', bg: 'var(--orange-bg)' }
  return { label: 'F', color: 'var(--red)', bg: 'var(--red-bg)' }
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ReportPage() {
  const { id } = useParams()
  const router = useRouter()
  const [report, setReport] = useState<AnyReport | null>(null)
  const [filter, setFilter] = useState<'all' | 'failed' | 'passed'>('all')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [copied, setCopied] = useState(false)
  const [copiedFix, setCopiedFix] = useState<string | null>(null)

  useEffect(() => {
    const data = sessionStorage.getItem(`report-${id}`)
    if (!data) return
    const parsed: AnyReport = JSON.parse(data)
    setReport(parsed)
    let current = 0
    const target = parsed.securityScore
    const step = Math.max(1, Math.floor(target / 40))
    const timer = setInterval(() => {
      current = Math.min(current + step, target)
      setAnimatedScore(current)
      if (current >= target) clearInterval(timer)
    }, 30)
    return () => clearInterval(timer)
  }, [id])

  const copyFixPrompt = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFix(key)
      setTimeout(() => setCopiedFix(null), 2000)
    })
  }

  const copyFullFixPrompt = () => {
    if (!report || isCodeReport(report)) return
    const failed = report.results.filter(r => !r.passed)
    const prompt = buildFixPrompt(failed)
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!report) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', animation: 'fadeInUp 0.4s ease-out' }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>📊</div>
          <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 6 }}>Report not found</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Run a scan to generate a security report.</div>
          <button className="btn btn--primary" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => router.push('/')}>← New Scan</button>
        </div>
      </div>
    )
  }

  const grade = getGrade(report.securityScore)

  // ── Code Report View ──
  if (isCodeReport(report)) {
    const issues = report.issues || []
    const filtered = issues.filter(iss =>
      filter === 'all' ? true : filter === 'failed' ? true : false
    )

    return (
      <div className="page-wrapper">
        <nav className="nav">
          <div className="nav__brand">
            <div className="nav__logo">⚡</div>
            <span className="nav__title">AgentBreaker</span>
            <span className="nav__path">/code-report</span>
          </div>
          <button className="btn btn--ghost" onClick={() => router.push('/')}>New Scan →</button>
        </nav>

        <div className="page-container" style={{ paddingTop: 28, maxWidth: 760 }}>
          {/* Score card */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '24px 28px', marginBottom: 20, animation: 'fadeInUp 0.5s ease-out' }}>
            <ScoreRing score={animatedScore} grade={grade} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: grade.color, padding: '2px 10px', borderRadius: 6, background: grade.bg, border: `1px solid ${grade.color}30` }}>
                  Grade {grade.label}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Code Security Report</span>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <Stat value={report.totalIssues} label="ISSUES" color="var(--red)" />
                <Stat value={report.criticalCount} label="CRITICAL" color="var(--red)" />
                <Stat value={report.highCount} label="HIGH" color="var(--orange)" />
                <Stat value={report.mediumCount} label="MEDIUM" color="var(--blue)" />
              </div>
            </div>
          </div>

          {/* Copy fix prompt banner */}
          {issues.length > 0 && (
            <div style={{
              padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: 20,
              border: '1px solid rgba(74,158,255,0.2)', background: 'var(--blue-bg)',
              display: 'flex', alignItems: 'center', gap: 14,
              animation: 'fadeInUp 0.5s ease-out 0.1s both',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', marginBottom: 2 }}>
                  Give this to your AI agent to fix everything
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  One-click copy — paste into Cursor, v0, Lovable, Claude, etc.
                </div>
              </div>
              <button
                onClick={() => copyFixPrompt(report.fixPrompt, 'code-fix')}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                  background: copiedFix === 'code-fix' ? 'var(--green-bg)' : 'var(--blue)',
                  color: copiedFix === 'code-fix' ? 'var(--green)' : '#fff',
                  border: copiedFix === 'code-fix' ? '1px solid rgba(61,220,132,0.3)' : 'none',
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                }}
              >
                {copiedFix === 'code-fix' ? '✓ Copied!' : '📋 Copy Fix Prompt'}
              </button>
            </div>
          )}

          {/* Issues list */}
          <div style={{ marginBottom: 10, animation: 'fadeInUp 0.5s ease-out 0.15s both' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              {issues.length} Issue{issues.length !== 1 ? 's' : ''} Found
            </div>
            {issues.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '36px', color: 'var(--green)' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>✓</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No AI security issues found</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>This code looks clean for AI security best practices.</div>
              </div>
            ) : filtered.map((iss, i) => {
              const sev = SEV[iss.severity] || SEV.low
              const isExp = expandedIdx === i
              return (
                <div key={i} className="finding" style={{ borderColor: !isExp ? sev.border : sev.color, animationDelay: `${0.04 * i}s` }} onClick={() => setExpandedIdx(isExp ? null : i)}>
                  <div className="finding__header">
                    <div className={`finding__status-dot finding__status-dot--fail`} />
                    <span className="finding__severity" style={{ color: sev.color, background: sev.bg, borderColor: sev.border }}>{iss.severity.toUpperCase()}</span>
                    <span className="finding__category" style={{ color: sev.color }}>{iss.category}</span>
                    <span className="finding__name">{iss.title}</span>
                    {iss.location && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{iss.location}</span>}
                    <span className={`finding__chevron ${isExp ? 'finding__chevron--open' : ''}`}>▾</span>
                  </div>
                  {isExp && (
                    <div className="finding__details">
                      <div className="finding__detail-label">Description</div>
                      <div className="finding__detail-content">{iss.description}</div>

                      {iss.codeSnippet && (
                        <>
                          <div className="finding__detail-label">Vulnerable Code</div>
                          <div className="finding__detail-content finding__detail-content--danger" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                            {iss.codeSnippet}
                          </div>
                        </>
                      )}

                      <div className="finding__detail-label">Fix</div>
                      <div className="finding__detail-content" style={{ color: 'var(--green)' }}>{iss.fixSuggestion}</div>

                      {iss.fixCode && (
                        <>
                          <div className="finding__detail-label">Fixed Code</div>
                          <div className="finding__detail-content" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green)' }}>
                            {iss.fixCode}
                          </div>
                        </>
                      )}

                      <button
                        onClick={e => { e.stopPropagation(); copyFixPrompt(`Fix this issue: ${iss.title}\n\nDescription: ${iss.description}\n\nFix: ${iss.fixSuggestion}${iss.fixCode ? '\n\nFixed code:\n' + iss.fixCode : ''}`, iss.id) }}
                        style={{ marginTop: 12, padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: `1px solid ${sev.border}`, color: sev.color, fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer' }}
                      >
                        {copiedFix === iss.id ? '✓ Copied!' : '📋 Copy fix prompt'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="footer" style={{ marginTop: 24 }}>Report ID: {id}</div>
        </div>
      </div>
    )
  }

  // ── Attack Report View (prompt / website) ──
  const attackReport = report as AttackReport
  const failed = attackReport.results.filter(r => !r.passed)
  const filtered = attackReport.results.filter(r =>
    filter === 'all' ? true : filter === 'failed' ? !r.passed : r.passed
  )
  const categories = Array.from(new Set(attackReport.results.map(r => r.category)))

  return (
    <div className="page-wrapper">
      <nav className="nav">
        <div className="nav__brand">
          <div className="nav__logo">⚡</div>
          <span className="nav__title">AgentBreaker</span>
          <span className="nav__path">/report</span>
        </div>
        <button className="btn btn--ghost" onClick={() => router.push('/')}>New Scan →</button>
      </nav>

      <div className="page-container" style={{ paddingTop: 28, maxWidth: 760 }}>
        {/* Mode indicator */}
        {attackReport.mode === 'website' && attackReport.targetUrl && (
          <div style={{
            padding: '8px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16,
            border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)',
            fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8,
            animation: 'fadeInUp 0.4s ease-out',
          }}>
            <span style={{ color: 'var(--green)' }}>🌐</span>
            <span>Tested: <strong style={{ color: 'var(--text-primary)' }}>{attackReport.targetEndpoint || attackReport.targetUrl}</strong></span>
          </div>
        )}

        {/* Score Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '24px 28px', marginBottom: 20, animation: 'fadeInUp 0.5s ease-out' }}>
          <ScoreRing score={animatedScore} grade={grade} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: grade.color, padding: '2px 10px', borderRadius: 6, background: grade.bg, border: `1px solid ${grade.color}30` }}>
                Grade {grade.label}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {attackReport.mode === 'website' ? 'Website Security Report' : 'Prompt Security Report'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <Stat value={attackReport.totalTests} label="TESTS" />
              <Stat value={attackReport.passed} label="RESISTED" color="var(--green)" />
              <Stat value={attackReport.failed} label="VULNERABLE" color="var(--red)" />
              {attackReport.criticalCount > 0 && <Stat value={attackReport.criticalCount} label="CRITICAL" color="var(--red)" />}
            </div>
          </div>
        </div>

        {/* Category Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, 1fr)`, gap: 8, marginBottom: 20, animation: 'fadeInUp 0.5s ease-out 0.1s both' }}>
          {categories.map(cat => {
            const catResults = attackReport.results.filter(r => r.category === cat)
            const catFailed = catResults.filter(r => !r.passed).length
            const catColor = catFailed > 0 ? 'var(--red)' : 'var(--green)'
            return (
              <div key={cat} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {cat.replace(/_/g, ' ')}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: catColor }}>{catResults.length - catFailed}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ {catResults.length}</span>
                </div>
                {catFailed > 0 && <div style={{ fontSize: 9, color: 'var(--red)', marginTop: 2 }}>{catFailed} vulnerable</div>}
              </div>
            )
          })}
        </div>

        {/* Fix Prompt Banner — shown when there are failures */}
        {failed.length > 0 && (
          <div style={{
            padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: 20,
            border: '1px solid rgba(226,75,74,0.2)', background: 'rgba(226,75,74,0.05)',
            display: 'flex', alignItems: 'center', gap: 14,
            animation: 'fadeInUp 0.5s ease-out 0.15s both',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', marginBottom: 2 }}>
                {failed.length} vulnerabilit{failed.length === 1 ? 'y' : 'ies'} found — give this to your AI to fix them
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Copy this fix prompt and paste it into Cursor, Claude, ChatGPT, or your AI agent builder
              </div>
            </div>
            <button
              onClick={copyFullFixPrompt}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                background: copied ? 'var(--green-bg)' : 'var(--red)',
                color: copied ? 'var(--green)' : '#fff',
                border: copied ? '1px solid rgba(61,220,132,0.3)' : 'none',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s ease', whiteSpace: 'nowrap',
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Fix Prompt'}
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
          {(['all', 'failed', 'passed'] as const).map(f => (
            <button key={f} className={`btn ${filter === f ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setFilter(f)} style={{ fontSize: 10, padding: '5px 12px', width: 'auto' }}>
              {f === 'all' ? `All (${attackReport.totalTests})` : f === 'failed' ? `⚠ Vulnerable (${attackReport.failed})` : `✓ Resisted (${attackReport.passed})`}
            </button>
          ))}
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((r, i) => {
            const sev = SEV[r.severity] || SEV.low
            const isExp = expandedIdx === i
            return (
              <div
                key={i}
                className="finding"
                style={{ borderColor: !r.passed ? sev.border : undefined, animationDelay: `${0.04 * i}s` }}
                onClick={() => setExpandedIdx(isExp ? null : i)}
              >
                <div className="finding__header">
                  <div className={`finding__status-dot finding__status-dot--${r.passed ? 'pass' : 'fail'}`} />
                  <span className="finding__severity" style={{ color: sev.color, background: sev.bg, borderColor: sev.border }}>{r.severity.toUpperCase()}</span>
                  <span className="finding__category" style={{ color: 'var(--text-muted)', fontSize: 9 }}>{r.category.replace(/_/g, ' ')}</span>
                  <span className="finding__name">{r.name}</span>
                  {attackReport.mode === 'website' && r.httpStatus && (
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>HTTP {r.httpStatus}</span>
                  )}
                  <span className={`finding__result finding__result--${r.passed ? 'pass' : 'fail'}`}>
                    {r.passed ? 'RESISTED' : 'VULNERABLE'}
                  </span>
                  <span className={`finding__chevron ${isExp ? 'finding__chevron--open' : ''}`}>▾</span>
                </div>

                {isExp && (
                  <div className="finding__details">
                    {/* Attack payload */}
                    {r.attackPayload && (
                      <>
                        <div className="finding__detail-label">Attack Payload</div>
                        <div className="finding__detail-content finding__detail-content--danger" style={{ fontSize: 11 }}>
                          {r.attackPayload}
                        </div>
                      </>
                    )}

                    {/* Agent response */}
                    <div className="finding__detail-label">Agent Response</div>
                    <div className="finding__detail-content" style={{ fontSize: 11 }}>
                      {r.agentResponse || '(no response)'}
                    </div>

                    {/* Reasoning */}
                    <div className="finding__detail-label">Analysis</div>
                    <div className="finding__detail-reasoning">{r.reasoning}</div>

                    {/* Reproduction steps */}
                    {r.reproductionSteps && r.reproductionSteps !== 'N/A' && (
                      <>
                        <div className="finding__detail-label">How to Reproduce</div>
                        <div className="finding__detail-content" style={{ fontSize: 11 }}>{r.reproductionSteps}</div>
                      </>
                    )}

                    {/* Fix suggestion — only for failures */}
                    {!r.passed && r.fixSuggestion && (
                      <>
                        <div className="finding__detail-label" style={{ color: 'var(--green)' }}>How to Fix</div>
                        <div className="finding__detail-content" style={{ color: 'var(--green)', fontSize: 11 }}>{r.fixSuggestion}</div>
                        <button
                          onClick={e => { e.stopPropagation(); copyFixPrompt(r.fixSuggestion!, r.attackId) }}
                          style={{
                            marginTop: 10, padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                            background: 'transparent', border: '1px solid rgba(61,220,132,0.3)',
                            color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
                          }}
                        >
                          {copiedFix === r.attackId ? '✓ Copied!' : '📋 Copy this fix'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="footer" style={{ marginTop: 24 }}>
          Report ID: {id} · {new Date(attackReport.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────
function ScoreRing({ score, grade }: { score: number; grade: { color: string; label: string; bg: string } }) {
  return (
    <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
      <svg viewBox="0 0 80 80" style={{ width: 80, height: 80, transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border-subtle)" strokeWidth="5" />
        <circle
          cx="40" cy="40" r="34" fill="none"
          stroke={grade.color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 213.6} 213.6`}
          style={{ transition: 'stroke-dasharray 0.3s ease-out', filter: `drop-shadow(0 0 6px ${grade.color})` }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: grade.color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>/ 100</span>
      </div>
    </div>
  )
}

function Stat({ value, label, color = 'var(--text-primary)' }: { value: number; label: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  )
}
