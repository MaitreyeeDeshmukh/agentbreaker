'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileCode, Shield, ChevronRight } from 'lucide-react'
import Nav from '@/app/components/Nav'

const BORDER = 'border-[hsl(0_0%_100%/0.06)]'
const LANGS = ['typescript', 'javascript', 'python', 'other']

export default function CodeScanPage() {
  const router = useRouter()
  const [code, setCode]         = useState('')
  const [language, setLanguage] = useState('typescript')
  const [filename, setFilename] = useState('')
  const [focused, setFocused]   = useState(false)

  const canScan = code.trim().length > 0

  const runScan = () => {
    if (!canScan) return
    sessionStorage.setItem('scan-params', JSON.stringify({ mode: 'code', code, language, filename }))
    router.push('/scan')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Nav />

      <div className="flex-1 px-8 pt-28 pb-20 max-w-3xl mx-auto w-full">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <FileCode className="w-5 h-5 text-agent-amber" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-agent-amber">Code Security Scan</span>
          </div>
          <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-white">
            CODE<br />SCAN
          </h1>
          <p className="mt-6 text-[14px] text-white/60 font-mono leading-relaxed max-w-[540px]">
            Paste your AI application code. We analyze it statically for security vulnerabilities — hardcoded system prompts, missing input validation, unsafe tool calls, injection sinks, and credential exposure.
          </p>
        </div>

        <div className={`border ${BORDER} bg-card mb-6 p-6`}>
          <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/40 mb-4">What we look for</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Hardcoded system prompts',
              'Missing input sanitization',
              'Unsafe tool call permissions',
              'Prompt injection sinks',
              'Exposed API keys or secrets',
              'Overly permissive agent tools',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-[12px] font-mono text-white/60">
                <ChevronRight className="w-3 h-3 text-agent-amber flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div
          className={`border ${BORDER} bg-card`}
          style={{ boxShadow: focused ? '0 0 40px rgba(226,75,74,0.15), inset 0 0 0 1px rgba(226,75,74,0.3)' : 'none', transition: 'box-shadow 150ms' }}
        >
          <div className={`flex items-center justify-between border-b ${BORDER} px-6 py-3`}>
            <div className="flex gap-0">
              {LANGS.map((l, i) => (
                <button key={l} onClick={() => setLanguage(l)}
                  className={`text-[10px] px-3 py-1.5 font-mono uppercase tracking-wider ${i > 0 ? `border-l ${BORDER}` : ''} ${language === l ? 'text-agent-amber' : 'text-white/30 hover:text-white'}`}
                  style={{ transition: 'color 0ms' }}>
                  {l}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              placeholder="agent.ts (optional)"
              className="bg-transparent text-[11px] text-white/40 placeholder:text-white/15 focus:outline-none font-mono text-right w-36"
            />
          </div>

          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={14}
            placeholder={`// Paste your AI application code here\nimport Anthropic from '@anthropic-ai/sdk'\n\nconst client = new Anthropic()\n\nexport async function POST(req: Request) {\n  const { message } = await req.json()\n  const response = await client.messages.create({\n    model: 'claude-opus-4-6',\n    system: 'You are a helpful assistant.',\n    messages: [{ role: 'user', content: message }],\n  })\n  return Response.json({ reply: response.content[0].text })\n}`}
            className="w-full bg-transparent p-6 text-[13px] text-white placeholder:text-white/15 resize-none focus:outline-none leading-relaxed font-mono"
          />

          <div className={`border-t ${BORDER} px-6 py-4 flex items-center justify-between gap-4`}>
            <span className="text-[10px] text-white/30 font-mono tabular-nums">{code.length} chars · {language}</span>
            <button
              onClick={runScan}
              disabled={!canScan}
              className="flex items-center gap-2 bg-agent-amber text-black px-6 py-3 text-[12px] font-display font-bold uppercase tracking-wider disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.97] hover:bg-white"
              style={{ transition: 'background 0ms, transform 100ms' }}
            >
              <Shield className="w-4 h-4" />
              Scan Code
            </button>
          </div>
        </div>

        <p className="mt-6 text-[10px] text-white/25 font-mono text-center uppercase tracking-wider">
          Code is not stored. Analyzed in memory and discarded after the scan.
        </p>
      </div>
    </div>
  )
}
