import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getIP } from '@/lib/rate-limit';

export const maxDuration = 60;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const COMMON_PATHS = [
  '/api/chat',
  '/api/message',
  '/api/messages',
  '/api/chat/completions',
  '/api/ask',
  '/api/ai',
  '/api/assistant',
  '/api/query',
  '/api/agent',
  '/api/bot',
  '/chat',
  '/api/completions',
];

const COMMON_FORMATS: Array<{ name: string; build: (msg: string) => Record<string, unknown> }> = [
  { name: 'messages', build: (msg) => ({ messages: [{ role: 'user', content: msg }] }) },
  { name: 'message',  build: (msg) => ({ message: msg }) },
  { name: 'prompt',   build: (msg) => ({ prompt: msg }) },
  { name: 'input',    build: (msg) => ({ input: msg }) },
];

const TEST_MESSAGE = 'Hello! Can you help me?';

function extractTextReply(json: unknown): string {
  if (json && typeof json === 'object') {
    const j = json as Record<string, unknown>;
    if (typeof j.message === 'string') return j.message;
    if (typeof j.content === 'string') return j.content;
    if (typeof j.text === 'string') return j.text;
    if (typeof j.response === 'string') return j.response;
    const choices = j.choices;
    if (Array.isArray(choices) && choices[0]) {
      const msg = (choices[0] as Record<string, unknown>).message;
      if (msg && typeof msg === 'object') {
        const content = (msg as Record<string, unknown>).content;
        if (typeof content === 'string') return content;
      }
    }
    if (typeof j.output === 'string') return j.output;
    if (typeof j.answer === 'string') return j.answer;
  }
  return JSON.stringify(json).slice(0, 200);
}

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = checkRateLimit(getIP(req), 20, 60_000)
  if (!allowed) return NextResponse.json({ found: false, error: 'Too many requests.' }, { status: 429, headers: { ...CORS_HEADERS, 'Retry-After': String(retryAfter) } })

  try {
    const { url } = await req.json() as { url: string };

    if (!url) {
      return NextResponse.json({ found: false, error: 'URL is required' }, { status: 400, headers: CORS_HEADERS });
    }

    const baseUrl = url.replace(/\/$/, '');

    for (const path of COMMON_PATHS) {
      for (const fmt of COMMON_FORMATS) {
        const endpoint = `${baseUrl}${path}`;
        const body = fmt.build(TEST_MESSAGE);

        let res: Response | undefined;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch {
          // timeout or network error — try next combination
          continue;
        }

        if (res.status >= 200 && res.status <= 499) {
          const contentType = res.headers.get('content-type') ?? '';
          let sampleResponse: string;

          if (contentType.includes('text/event-stream') || contentType.includes('application/stream')) {
            const reader = res.body?.getReader();
            if (reader) {
              const chunks: Uint8Array[] = [];
              let totalBytes = 0;
              while (totalBytes < 2000) {
                const { done, value } = await reader.read();
                if (done || !value) break;
                chunks.push(value);
                totalBytes += value.length;
              }
              reader.cancel();
              const raw = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf-8').slice(0, 2000);
              sampleResponse = raw;
            } else {
              sampleResponse = '(streaming — no body reader)';
            }
          } else {
            try {
              const json = await res.json();
              sampleResponse = extractTextReply(json);
            } catch {
              sampleResponse = (await res.text()).slice(0, 200);
            }
          }

          return NextResponse.json(
            { found: true, endpoint, format: fmt.name, sampleResponse },
            { headers: CORS_HEADERS },
          );
        }
      }
    }

    return NextResponse.json(
      { found: false, error: 'No AI endpoint found at this URL' },
      { headers: CORS_HEADERS },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ found: false, error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
