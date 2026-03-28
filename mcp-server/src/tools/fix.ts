/**
 * agentbreaker_fix — Generate actionable fix instructions from vulnerability results.
 *
 * Takes a description of vulnerabilities and generates a structured fix prompt
 * that a coding agent can immediately apply.
 */

import Anthropic from '@anthropic-ai/sdk';

const FIX_SYSTEM = `You are an AI security engineer. Given a list of vulnerabilities found in an AI application, generate specific, actionable fix instructions.

For each vulnerability:
1. Explain what needs to change and why
2. Provide concrete code examples if the vulnerability type implies code changes
3. Reference specific defense patterns (input sanitization, output filtering, role isolation)

Format your response as clear, numbered steps the developer can follow immediately. Include code snippets where helpful.`;

export async function generateFix(
  vulnerabilities: string,
  context?: string,
): Promise<string> {
  const client = new Anthropic();

  let prompt = `Fix these AI security vulnerabilities:\n\n${vulnerabilities}`;
  if (context) prompt += `\n\nAdditional context:\n${context}`;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: FIX_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content[0].type === 'text' ? (msg.content[0].text ?? '') : '';
    return `# AgentBreaker Fix Suggestions\n\n${text}`;
  } catch (e) {
    return `# AgentBreaker Fix\n\n❌ **Failed to generate fixes:** ${(e as Error).message}\n\nMake sure ANTHROPIC_API_KEY is set.`;
  }
}
