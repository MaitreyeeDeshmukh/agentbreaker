'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Mail, Lock, ArrowRight, Github, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Check your email to confirm your account, then sign in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGithub = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const BORDER = 'border-[hsl(0_0%_100%/0.08)]'

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-12 group">
        <Shield className="w-6 h-6 text-primary" />
        <span className="text-[15px] font-display font-black uppercase tracking-[0.08em] text-white group-hover:text-primary" style={{ transition: 'color 0ms' }}>
          AgentBreaker
        </span>
      </Link>

      <div className={`w-full max-w-sm border ${BORDER} bg-card p-8`}>
        {/* Tab toggle */}
        <div className={`flex border-b ${BORDER} mb-8`}>
          {(['signin', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess('') }}
              className={`flex-1 pb-3 text-[11px] font-mono uppercase tracking-widest ${
                mode === m ? 'text-white border-b-2 border-primary -mb-[2px]' : 'text-white/30 hover:text-white/60'
              }`}
              style={{ transition: 'color 0ms' }}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* GitHub OAuth */}
        <button
          onClick={handleGithub}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 border ${BORDER} py-2.5 text-[12px] font-mono uppercase tracking-wider text-white/70 hover:text-white hover:border-white/30 mb-6 disabled:opacity-50`}
          style={{ transition: 'color 0ms, border-color 0ms' }}
        >
          <Github className="w-4 h-4" />
          Continue with GitHub
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className={`flex-1 border-t ${BORDER}`} />
          <span className="text-[10px] font-mono text-white/20 uppercase tracking-wider">or</span>
          <div className={`flex-1 border-t ${BORDER}`} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Email</label>
            <div className={`flex items-center border ${BORDER} bg-background px-3 gap-2`}>
              <Mail className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="flex-1 bg-transparent py-2.5 text-[13px] font-mono text-white placeholder:text-white/20 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Password</label>
            <div className={`flex items-center border ${BORDER} bg-background px-3 gap-2`}>
              <Lock className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="flex-1 bg-transparent py-2.5 text-[13px] font-mono text-white placeholder:text-white/20 outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-[11px] font-mono text-primary bg-primary/10 border border-primary/20 px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-[11px] font-mono text-agent-green bg-agent-green/10 border border-agent-green/20 px-3 py-2">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-primary text-white py-2.5 text-[12px] font-mono uppercase tracking-wider hover:bg-primary/80 disabled:opacity-50 mt-2"
            style={{ transition: 'background 0ms' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-[11px] font-mono text-white/20">
        <Link href="/" className="hover:text-white/50" style={{ transition: 'color 0ms' }}>← Back to home</Link>
      </p>
    </div>
  )
}
