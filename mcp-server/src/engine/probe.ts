/**
 * AI endpoint probing — discovers chat API endpoints on a target URL.
 */

const PROBE_PATHS = [
  '/api/chat', '/api/assistant', '/api/ai', '/api/message', '/api/messages',
  '/chat', '/api/completion', '/api/completions', '/api/llm', '/api/query',
];
const PROBE_FORMATS = ['messages', 'message', 'prompt', 'input'] as const;
type Format = typeof PROBE_FORMATS[number];

function buildBody(format: Format, text: string): string {
  switch (format) {
    case 'messages': return JSON.stringify({ messages: [{ role: 'user', content: text }] });
    case 'message': return JSON.stringify({ message: text });
    case 'prompt': return JSON.stringify({ prompt: text });
    case 'input': return JSON.stringify({ input: text });
  }
}

export interface ProbeResult {
  found: boolean;
  endpoint?: string;
  format?: Format;
  sampleResponse?: string;
}

export async function probeEndpoint(baseUrl: string): Promise<ProbeResult> {
  const testPrompt = 'Hello, what can you do?';

  for (const path of PROBE_PATHS) {
    for (const format of PROBE_FORMATS) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${baseUrl}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: buildBody(format, testPrompt),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data) {
            const text = extractResponseText(data);
            if (text && text.length > 5) {
              return { found: true, endpoint: `${baseUrl}${path}`, format, sampleResponse: text.slice(0, 200) };
            }
          }
        }
      } catch {
        // continue
      }
    }
  }

  return { found: false };
}

export function extractResponseText(data: unknown): string {
  if (typeof data === 'string') return data;
  if (!data || typeof data !== 'object') return '';
  const d = data as Record<string, unknown>;
  if (d.content) {
    if (Array.isArray(d.content)) return d.content.map((c: { text?: string }) => c.text || '').join(' ');
    return String(d.content);
  }
  if (d.message) return String(d.message);
  if (d.text) return String(d.text);
  if (d.response) return String(d.response);
  if (d.output) return String(d.output);
  if (d.choices && Array.isArray(d.choices) && d.choices[0]) {
    const choice = d.choices[0] as Record<string, unknown>;
    if (choice.message && typeof choice.message === 'object' && (choice.message as Record<string, unknown>).content) {
      return String((choice.message as Record<string, unknown>).content);
    }
    if (choice.text) return String(choice.text);
  }
  return JSON.stringify(data).slice(0, 300);
}

export function buildRequestBody(format: string, prompt: string): string {
  return buildBody(format as Format, prompt);
}
