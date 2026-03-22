'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TestResult } from '@/lib/types'
import { ATTACK_CATEGORIES, SEVERITY_CONFIG } from '@/lib/attacks'

const CAT_COLORS: Record<string,string> = { prompt_injection:'#E24B4A', goal_hijacking:'#F5A623', data_exfiltration:'#4A9EFF', tool_misuse:'#3DDC84' }

function ScanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const systemPrompt = searchParams.get('prompt') || ''
  const [status, setStatus] = useState<'scanning'|'complete'|'error'>('scanning')
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<TestResult[]>([])
  const [reportId, setReportId] = useState('')
  const [stats, setStats] = useState({criticalCount:0,highCount:0,mediumCount:0,lowCount:0})
  const [currentAttack, setCurrentAttack] = useState('')
  const [finalScore, setFinalScore] = useState<number|null>(null)
  const total = 50
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!systemPrompt) { router.push('/'); return }
    async function startScan() {
      try {
        const res = await fetch('/api/scan-stream', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({systemPrompt}) })
        if (!res.ok || !res.body) throw new Error('Stream failed')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const {done,value} = await reader.read()
          if (done) break
          buffer += decoder.decode(value, {stream:true})
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'start') setReportId(data.reportId)
              else if (data.type === 'result') {
                setProgress(data.progress)
                setCurrentAttack(data.result.name)
                setResults(prev => [data.result, ...prev])
                setStats(data.runningStats)
              } else if (data.type === 'complete') {
                setFinalScore(data.report.securityScore)
                sessionStorage.setItem(`report-${data.report.id}`, JSON.stringify(data.report))
                setStatus('complete')
                setCurrentAttack('')
              }
            } catch {}
          }
        }
      } catch { setStatus('error') }
    }
    startScan()
  }, [systemPrompt, router])

  const pct = Math.round((progress/total)*100)
  const vulnerableCount = results.filter(r=>!r.passed).length
  const scoreColor = finalScore !== null ? (finalScore>=80?'#3DDC84':finalScore>=50?'#F5A623':'#E24B4A') : '#E24B4A'

  const S = { fontFamily:"'IBM Plex Mono',monospace" }

  return (
    <div style={{...S,minHeight:'100vh',background:'#0A0A0F',color:'#E2E2F0',display:'flex',flexDirection:'column'}}>
      <nav style={{borderBottom:'1px solid #1E1E2E',padding:'10px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#0A0A0F',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={()=>router.push('/')} style={{background:'none',border:'none',color:'#6B6B8A',cursor:'pointer',fontSize:16}}>←</button>
          <span style={{fontSize:13,fontWeight:600,color:'#E2E2F0'}}>AgentBreaker</span>
          <span style={{fontSize:11,color:'#6B6B8A'}}>/scan</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {status==='scanning' && <span style={{fontSize:11,color:'#6B6B8A'}}>
            <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'#E24B4A',marginRight:6,animation:'pulse 1.5s infinite'}}/>
            Running attack {progress} of {total}{currentAttack && ` — ${currentAttack}`}
          </span>}
          {status==='complete' && <button onClick={()=>router.push(`/report/${reportId}`)} style={{background:'#E24B4A',color:'#fff',border:'none',borderRadius:7,padding:'6px 16px',fontSize:11,fontWeight:600,fontFamily:'inherit',cursor:'pointer'}}>View full report →</button>}
        </div>
      </nav>

      <div style={{height:2,background:'#111118'}}>
        <div style={{height:'100%',background:status==='complete'?scoreColor:'#E24B4A',width:`${pct}%`,transition:'width 0.3s'}}/>
      </div>

      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #1E1E2E',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:'#E2E2F0',marginBottom:4}}>
                {status==='scanning'?<span className="cursor-blink">Scanning agent</span>:status==='complete'?'Scan complete':'Scan failed'}
              </div>
              <div style={{fontSize:10,color:'#6B6B8A',maxWidth:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{systemPrompt.substring(0,80)}...</div>
            </div>
            <div style={{display:'flex',gap:20,textAlign:'right'}}>
              <div><div style={{fontSize:24,fontWeight:600,color:'#E24B4A'}}>{vulnerableCount}</div><div style={{fontSize:10,color:'#6B6B8A'}}>vulnerable</div></div>
              <div><div style={{fontSize:24,fontWeight:600,color:'#E2E2F0'}}>{progress}</div><div style={{fontSize:10,color:'#6B6B8A'}}>tested</div></div>
              {finalScore!==null && <div><div style={{fontSize:24,fontWeight:600,color:scoreColor}}>{finalScore}</div><div style={{fontSize:10,color:'#6B6B8A'}}>score</div></div>}
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'12px 70px 130px 1fr 80px',gap:8,padding:'6px 16px',background:'#111118',borderBottom:'1px solid #1E1E2E',fontSize:10,color:'#6B6B8A'}}>
            <span/><span>Severity</span><span>Category</span><span>Attack</span><span style={{textAlign:'right'}}>Result</span>
          </div>

          <div style={{flex:1,overflowY:'auto'}} ref={logRef}>
            {results.length===0&&status==='scanning'&&(
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:'#6B6B8A',fontSize:12}}>
                Initializing attacks...
              </div>
            )}
            {results.map((r,i)=>{
              const catColor = CAT_COLORS[r.category]||'#888'
              const sev = SEVERITY_CONFIG[r.severity as keyof typeof SEVERITY_CONFIG]
              return (
                <div key={r.attackId} className="result-card" style={{display:'grid',gridTemplateColumns:'12px 70px 130px 1fr 80px',gap:8,padding:'7px 16px',borderBottom:'1px solid #1E1E2E',fontSize:11,alignItems:'center',animationDelay:`${Math.min(i*20,200)}ms`}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:r.passed?'#3DDC84':'#E24B4A'}}/>
                  <span style={{fontSize:10,padding:'2px 6px',borderRadius:4,background:sev?.bg,color:sev?.color,border:`1px solid ${sev?.color}44`,textAlign:'center'}}>{r.severity.toUpperCase()}</span>
                  <span style={{fontSize:10,color:catColor}}>{ATTACK_CATEGORIES[r.category as keyof typeof ATTACK_CATEGORIES]?.label||r.category}</span>
                  <span style={{color:'#E2E2F0'}}>{r.name}</span>
                  <span style={{textAlign:'right',fontWeight:600,color:r.passed?'#3DDC84':'#E24B4A',fontSize:10}}>{r.passed?'RESISTED':'VULNERABLE'}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{width:220,borderLeft:'1px solid #1E1E2E',background:'#111118',padding:16,overflowY:'auto'}}>
          <div style={{fontSize:10,color:'#6B6B8A',marginBottom:12,letterSpacing:'0.05em'}}>LIVE STATS</div>
          <div style={{textAlign:'center',marginBottom:16}}>
            <div style={{fontSize:48,fontWeight:600,color:'#E24B4A',lineHeight:1}}>{vulnerableCount}</div>
            <div style={{fontSize:11,color:'#6B6B8A',marginTop:4}}>vulnerabilities found</div>
          </div>
          {[{k:'criticalCount',l:'CRITICAL',c:'#E24B4A'},{k:'highCount',l:'HIGH',c:'#F5A623'},{k:'mediumCount',l:'MEDIUM',c:'#4A9EFF'},{k:'lowCount',l:'LOW',c:'#3DDC84'}].map(s=>(
            <div key={s.k} style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <span style={{fontSize:9,padding:'2px 5px',borderRadius:3,background:s.c+'22',color:s.c,border:`1px solid ${s.c}44`,minWidth:52,textAlign:'center'}}>{s.l}</span>
              <div style={{flex:1,background:'#1E1E2E',borderRadius:2,height:4,overflow:'hidden'}}>
                <div style={{height:'100%',background:s.c,width:`${Math.min(100,stats[s.k as keyof typeof stats]*20)}%`,transition:'width 0.4s'}}/>
              </div>
              <span style={{fontSize:11,fontWeight:600,color:s.c,minWidth:14,textAlign:'right'}}>{stats[s.k as keyof typeof stats]}</span>
            </div>
          ))}
          <div style={{borderTop:'1px solid #1E1E2E',paddingTop:12,marginTop:12}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#6B6B8A',marginBottom:6}}>
              <span>{progress}/{total}</span><span>{pct}%</span>
            </div>
            <div style={{background:'#1E1E2E',borderRadius:2,height:3,overflow:'hidden'}}>
              <div style={{height:'100%',background:'#E24B4A',width:`${pct}%`,transition:'width 0.3s'}}/>
            </div>
          </div>
          {status==='complete'&&finalScore!==null&&(
            <div style={{marginTop:16,padding:14,background:'#2A0A0A',border:'1px solid #7A1A1A',borderRadius:8,textAlign:'center'}}>
              <div style={{fontSize:40,fontWeight:600,color:scoreColor,lineHeight:1,marginBottom:4}}>{finalScore}</div>
              <div style={{fontSize:11,fontWeight:600,color:scoreColor,marginBottom:12}}>{finalScore>=80?'SECURE':finalScore>=50?'AT RISK':'CRITICAL RISK'}</div>
              <button onClick={()=>router.push(`/report/${reportId}`)} style={{width:'100%',background:'#E24B4A',color:'#fff',border:'none',borderRadius:6,padding:'8px',fontSize:11,fontWeight:600,fontFamily:'inherit',cursor:'pointer'}}>View full report →</button>
            </div>
          )}
          {status==='error'&&<div style={{marginTop:16,color:'#E24B4A',fontSize:11,textAlign:'center'}}>Scan failed.<br/><button onClick={()=>router.push('/')} style={{color:'#6B6B8A',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:11,marginTop:8}}>← Try again</button></div>}
        </div>
      </div>
    </div>
  )
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#0A0A0F',display:'flex',alignItems:'center',justifyContent:'center',color:'#6B6B8A',fontFamily:'monospace'}}>Loading...</div>}>
      <ScanContent/>
    </Suspense>
  )
}
