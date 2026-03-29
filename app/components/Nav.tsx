'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Shield, Github, X, LogOut, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const MENU_LINKS = [
  { label: 'Home',           href: '/' },
  { label: 'Dashboard',      href: '/dashboard' },
  { label: 'Browser Attack', href: '/attack/browser', badge: 'MAIN' },
  { label: 'Prompt Scan',    href: '/attack/prompt' },
  { label: 'API Attack',     href: '/attack/api' },
  { label: 'Code Scan',      href: '/attack/code' },
]

export default function Nav({ transparent = false }: { transparent?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 ${transparent ? '' : 'bg-background/80 backdrop-blur-sm border-b border-[hsl(0_0%_100%/0.06)]'}`}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-[15px] font-display font-black uppercase tracking-[0.08em] text-white group-hover:text-primary" style={{ transition: 'color 0ms' }}>
            AgentBreaker
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.12em] text-white/50 hover:text-white"
                style={{ transition: 'color 0ms' }}
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:block max-w-[120px] truncate">{user.email?.split('@')[0]}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.12em] text-white/50 hover:text-primary border border-white/20 hover:border-primary/40 px-3 py-1.5"
                style={{ transition: 'color 0ms, border-color 0ms' }}
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.12em] text-white/70 hover:text-white border border-white/20 hover:border-white/60 px-3 py-1.5"
              style={{ transition: 'color 0ms, border-color 0ms' }}
            >
              <Github className="w-3.5 h-3.5" />
              Sign In
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(true)}
            className="text-[14px] font-bold uppercase tracking-[0.15em] text-white hover:text-primary font-mono px-2 py-1"
            style={{ transition: 'color 0ms' }}
          >
            ≡ MENU
          </button>
        </div>
      </nav>

      {/* Full-screen menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col px-12" style={{ animation: 'fade-in-simple 0.15s ease-out forwards' }}>
          <div className="flex items-center justify-between py-5 border-b border-[hsl(0_0%_100%/0.06)]">
            <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-[15px] font-display font-black uppercase tracking-[0.08em] text-white">AgentBreaker</span>
            </Link>
            <button onClick={() => setMenuOpen(false)} className="text-white/60 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col justify-center flex-1 gap-1">
            {MENU_LINKS.map(({ label, href, badge }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-baseline gap-4 text-[clamp(2.2rem,7vw,5rem)] font-display font-black uppercase tracking-tight leading-[1.1] ${pathname === href ? 'text-primary' : 'text-white hover:text-primary'}`}
                style={{ transition: 'color 0ms' }}
              >
                {label}
                {badge && (
                  <span className="text-[10px] bg-primary text-white px-2 py-0.5 font-mono font-bold tracking-widest align-middle">
                    {badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="py-6 border-t border-[hsl(0_0%_100%/0.06)] flex items-center justify-between">
            <span className="text-[11px] font-mono text-white/30 uppercase tracking-wider">HackASU 2026</span>
            {user ? (
              <button
                onClick={() => { handleSignOut(); setMenuOpen(false) }}
                className="flex items-center gap-1.5 text-[11px] font-mono text-white/30 hover:text-primary uppercase tracking-wider"
                style={{ transition: 'color 0ms' }}
              >
                <LogOut className="w-3 h-3" />
                Sign out · {user.email?.split('@')[0]}
              </button>
            ) : (
              <Link
                href="/auth"
                onClick={() => setMenuOpen(false)}
                className="text-[11px] font-mono text-white/30 hover:text-primary uppercase tracking-wider"
                style={{ transition: 'color 0ms' }}
              >
                Sign in →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
