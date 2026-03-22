/**
 * AI client factory — uses AWS Bedrock if AWS credentials are set,
 * falls back to direct Anthropic API if ANTHROPIC_API_KEY is set.
 *
 * Env vars for Bedrock:
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION (default: us-east-1)
 *
 * Env vars for direct Anthropic:
 *   ANTHROPIC_API_KEY
 */

const USE_BEDROCK = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)

// Model IDs differ between Bedrock and direct API
export const MODELS = {
  haiku: USE_BEDROCK
    ? 'anthropic.claude-haiku-4-5-20251001-v1:0'
    : 'claude-haiku-4-5-20251001',
  sonnet: USE_BEDROCK
    ? 'us.anthropic.claude-sonnet-4-6-20250514-v1:0'
    : 'claude-sonnet-4-6',
}

export function getClient() {
  if (USE_BEDROCK) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AnthropicBedrock = require('@anthropic-ai/bedrock-sdk').default
    return new AnthropicBedrock({
      awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
      awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
      awsRegion: process.env.AWS_REGION || 'us-east-1',
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Anthropic = require('@anthropic-ai/sdk').default
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
}

export { USE_BEDROCK }
