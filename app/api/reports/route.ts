import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// POST /api/reports — save a completed report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, mode, securityScore, passed, failed, totalTests, label, reportJson } = body

    if (!id || !mode || !reportJson) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Try to get user from auth header (optional — anonymous saves are allowed)
    const authHeader = req.headers.get('authorization')
    let userId: string | null = null
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data } = await supabase.auth.getUser(token)
      userId = data.user?.id ?? null
    }

    const { error } = await supabase.from('reports').upsert({
      id,
      user_id: userId,
      mode,
      security_score: securityScore ?? 0,
      passed: passed ?? 0,
      failed: failed ?? 0,
      total_tests: totalTests ?? 0,
      label: label ?? mode,
      report_json: reportJson,
    })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('[reports POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// GET /api/reports — fetch reports for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient()

    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ reports: [] })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ reports: [] })

    const { data, error } = await supabase
      .from('reports')
      .select('id, created_at, mode, security_score, passed, failed, total_tests, label')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json({ reports: data ?? [] })
  } catch (err: unknown) {
    console.error('[reports GET]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// GET /api/reports/[id] — fetch a single report by ID (public)
