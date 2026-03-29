'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Globe, Terminal, FileCode, Zap, ArrowRight, Trash2 } from 'lucide-react'
import Nav from '@/app/components/Nav'
import { supabase } from '@/lib/supabase'

const BORDER = 'border-[hsl(0_0%_100%/0.06)]'

// Shape returned by Supabase (snake_case columns)
interface RawReport {
  id: string
  created_at: string
  mode: ScanRecord['mode']
  security_score: number
  passed: number
  failed: number
  total_tests: number
  label: string
}

interface ScanRecord {
  id: string
  createdAt: string
  mode: 'browser' | 'prompt' | 'website' | 'code'
  score: number
  passed: number
  failed: number
  totalTests: number
  label: string
}

const MODE_META = {
  browser:  { icon: Globe,     color: 'text-agent-green',  label: 'Browser Attack' },
  prompt:   { icon: Terminal,  color: 'text-primary',      label: 'Prompt Scan'    },
  website:  { icon: Zap,       color: 'text-agent-blue',   label: 'API Attack'     },
  code:     { icon: FileCode,  color: 'text-agent-amber',  label: 'Code Scan'      },
}

function scoreColor(s: number) {
  if (s >= 80) return 'text-agent-green'
  if (s >= 60) return 'text-agent-amber'
  return 'text-primary'
}

function scoreLabel(s: number) {
  if (s >= 80) return 'SECURE'
  if (s >= 60) return 'AT RISK'
  return 'CRITICAL'
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function DashboardPage() {
  const [scans, setScans] = useState<ScanRecord[]>([])

  useEffect(() => {
    async function loadScans() {
      // Try Supabase first (authenticated users)
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        try {
          const res = await fetch('/api/reports', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          })
          const json = await res.json() as { reports?: RawReport[] }
          if (json.reports && json.reports.length > 0) {
            // Map Supabase snake_case to our camelCase interface
            const mapped: ScanRecord[] = json.reports.map((r) => ({
              id: r.id,
              createdAt: r.created_at,
              mode: r.mode,
              score: r.security_score,
              passed: r.passed,
              failed: r.failed,
              totalTests: r.total_tests,
              label: r.label,
            }))
            setScans(mapped)
            return
          }
        } catch { /* fall through to localStorage */ }
      }
      // Fallback: localStorage for anonymous users
      try {
        const stored = localStorage.getItem('agentbreaker-scans')
        if (stored) setScans(JSON.parse(stored) as ScanRecord[])
      } catch { /* ignore */ }
    }
    loadScans()
  }, [])

  const clearHistory = () => {
    localStorage.removeItem('agentbreaker-scans')
    setScans([])
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Nav />

      <div className="flex-1 px-8 pt-28 pb-20 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <LayoutDashboard className="w-5 h-5 text-white/50" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">Scan History</span>
            </div>
            <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-white">
              DASHBOARD
            </h1>
          </div>
          {scans.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-white/30 hover:text-primary"
              style={{ transition: 'color 0ms' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear history
            </button>
          )}
        </div>

        {scans.length === 0 ? (
          <div className={`border ${BORDER} bg-card px-8 py-16 text-center`}>
            <div className="text-[48px] font-display font-black text-white/10 mb-4">0</div>
            <p className="text-[13px] text-white/40 font-mono mb-8">No scans yet. Run your first attack to see results here.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {Object.entries(MODE_META).map(([mode, meta]) => {
                const Icon = meta.icon
                const href = mode === 'website' ? '/attack/api' : `/attack/${mode}`
                return (
                  <Link key={mode} href={href}
                    className={`flex items-center gap-2 border ${BORDER} px-4 py-2 text-[11px] font-mono uppercase tracking-wider ${meta.color} hover:border-white/30`}
                    style={{ transition: 'border-color 0ms' }}>
                    <Icon className="w-3.5 h-3.5" />
                    {meta.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-px bg-[hsl(0_0%_100%/0.06)] mb-8">
              {[
                { label: 'Total Scans',    value: scans.length },
                { label: 'Vulnerabilities Found', value: scans.reduce((a, s) => a + s.failed, 0) },
                { label: 'Avg Security Score', value: Math.round(scans.reduce((a, s) => a + s.score, 0) / scans.length) },
              ].map(s => (
                <div key={s.label} className="bg-background px-6 py-6">
                  <div className="text-[40px] font-display font-black text-white tabular-nums leading-none">{s.value}</div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/40 mt-2">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Scan list */}
            <div className="flex flex-col gap-px bg-[hsl(0_0%_100%/0.06)]">
              {[...scans].reverse().map(scan => {
                const meta = MODE_META[scan.mode] || MODE_META.prompt
                const Icon = meta.icon
                return (
                  <Link
                    key={scan.id}
                    href={`/report/${scan.id}`}
                    className="group bg-background hover:bg-card flex items-center gap-6 px-6 py-5"
                    style={{ transition: 'background 0ms' }}
                  >
                    <div className={`text-[32px] font-display font-black tabular-nums leading-none w-16 ${scoreColor(scan.score)}`}>
                      {scan.score}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                        <span className={`text-[10px] font-mono uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                        <span className={`text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 ${scoreColor(scan.score)} border border-current opacity-70`}>{scoreLabel(scan.score)}</span>
                      </div>
                      <div className="text-[13px] font-mono text-white truncate">{scan.label}</div>
                      <div className="text-[11px] font-mono text-white/30 mt-0.5">
                        {scan.passed}/{scan.totalTests} passed · {scan.failed} vulnerabilities · {timeAgo(scan.createdAt)}
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 flex-shrink-0" style={{ transition: 'color 0ms' }} />
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
