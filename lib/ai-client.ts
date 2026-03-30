/**
 * AI client factory — supports three auth modes (auto-detected by env vars):
 *   1. AWS Bedrock bearer token  (AWS_BEARER_TOKEN_BEDROCK)   ← hackathon setup
 *   2. AWS Bedrock IAM creds     (AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY)
 *   3. Direct Anthropic API      (ANTHROPIC_API_KEY)
 */

const USE_BEDROCK_BEARER = !!(process.env.AWS_BEARER_TOKEN_BEDROCK?.trim())
const USE_BEDROCK_IAM    = !USE_BEDROCK_BEARER && !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
const USE_BEDROCK        = USE_BEDROCK_BEARER || USE_BEDROCK_IAM

// Model IDs differ between Bedrock and direct Anthropic API
// Using confirmed ACTIVE inference profiles from this Bedrock account
export const MODELS = {
  /** Haiku 3.5 — fast evaluations, summaries, per-attack scoring */
  haiku: USE_BEDROCK
    ? process.env.BEDROCK_MODEL_HAIKU || 'us.anthropic.claude-3-5-haiku-20241022-v1:0'
    : 'claude-3-5-haiku-20241022',
  /** Claude Sonnet 3.5 — heavy analysis: code scan, complex reasoning */
  sonnet: USE_BEDROCK
    ? process.env.BEDROCK_MODEL_SONNET || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
    : 'claude-3-5-sonnet-20241022',
}

// ── Shared types (minimal subset used across routes) ─────────────────────────

interface MessageParam {
  role: 'user' | 'assistant'
  content: string
}

interface CreateParams {
  model: string
  max_tokens: number
  system?: string
  messages: MessageParam[]
}

interface ContentBlock {
  type: string
  text?: string
}

export interface AIMessage {
  content: ContentBlock[]
}

// ── Bedrock bearer-token client ───────────────────────────────────────────────
// Makes direct HTTP calls to the Bedrock Runtime API using the bearer token
// provided in AWS_BEARER_TOKEN_BEDROCK (format used by hackathon / Bedrock API keys).

function createBedrockBearerClient() {
  const token  = process.env.AWS_BEARER_TOKEN_BEDROCK!.trim()
  const region = (process.env.AWS_REGION || 'us-east-1').trim()

  return {
    messages: {
      async create(params: CreateParams): Promise<AIMessage> {
        const url = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(params.model)}/invoke`

        const body: Record<string, unknown> = {
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: params.max_tokens,
          messages: params.messages,
        }
        if (params.system) body.system = params.system

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const errText = await res.text().catch(() => res.statusText)
          throw new Error(`Bedrock HTTP ${res.status}: ${errText}`)
        }

        return res.json() as Promise<AIMessage>
      },
    },
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function getClient() {
  if (USE_BEDROCK_BEARER) {
    return createBedrockBearerClient()
  }

  if (USE_BEDROCK_IAM) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AnthropicBedrock = require('@anthropic-ai/bedrock-sdk').default
    return new AnthropicBedrock({
      awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
      awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
      awsRegion: region(),
    }) as { messages: { create: (p: CreateParams) => Promise<AIMessage> } }
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Anthropic = require('@anthropic-ai/sdk').default
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }) as {
    messages: { create: (p: CreateParams) => Promise<AIMessage> }
  }
}

function region() { return (process.env.AWS_REGION || 'us-east-1').trim() }

export { USE_BEDROCK }
