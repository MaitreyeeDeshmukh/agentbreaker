/**
 * agentbreaker_scan_code — Static analysis of AI-related code for security issues.
 *
 * Uses Claude Sonnet to analyze code for prompt injection sinks, hardcoded secrets,
 * missing auth, and other AI security patterns.
 */

import Anthropic from '@anthropic-ai/sdk';

const CODE_ANALYSIS_SYSTEM = `You are an expert AI security auditor. Analyze the provided code for security vulnerabilities specific to AI/LLM applications.

Focus on:
1. **Prompt Injection Sinks** — User input directly concatenated into system prompts or LLM inputs without sanitization
2. **Hardcoded Secrets** — API keys, tokens, credentials in code or config
3. **Missing Input Validation** — No sanitization before passing user input to AI models
4. **Insecure Tool/Function Calls** — Allowing the LLM to execute arbitrary code, file access, or network requests
5. **System Prompt Leakage** — System prompts exposed in client-side code or API responses
6. **Missing Rate Limiting** — No protection against abuse of AI endpoints
7. **Insufficient Output Filtering** — Not checking AI responses before returning to users

For each issue found, provide:
- severity: "critical" | "high" | "medium" | "low"
- category: short category name
- title: concise issue title
- description: what the vulnerability is and why it matters
- location: file/line references if identifiable
- fixSuggestion: specific code fix or approach

Respond with valid JSON array: [{"severity":"...","category":"...","title":"...","description":"...","location":"...","fixSuggestion":"..."}]
If no issues found, return: []`;

export async function scanCode(code: string, language?: string, filename?: string): Promise<string> {
  const client = new Anthropic();

  let prompt = `Analyze this ${language || 'code'} for AI security vulnerabilities`;
  if (filename) prompt += ` (file: ${filename})`;
  prompt += `:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: CODE_ANALYSIS_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content[0].type === 'text' ? (msg.content[0].text ?? '[]') : '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const issues = JSON.parse(jsonMatch ? jsonMatch[0] : text) as Array<{
      severity: string;
      category: string;
      title: string;
      description: string;
      location: string;
      fixSuggestion: string;
    }>;

    if (issues.length === 0) {
      return `# AgentBreaker Code Scan\n\n✅ **No AI security issues found.**\n\nThe code appears to follow security best practices for AI/LLM applications.`;
    }

    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const score = Math.max(0, 100 - criticalCount * 25 - highCount * 12 - issues.length * 3);

    let output = `# AgentBreaker Code Scan\n\n`;
    output += `**Score: ${score}/100** ${score >= 80 ? '✅ SECURE' : score >= 60 ? '⚠️ AT RISK' : '🔴 CRITICAL'}\n\n`;
    output += `**${issues.length} issues found** (${criticalCount} critical, ${highCount} high)\n\n`;

    for (const issue of issues) {
      const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'high' ? '🟠' : issue.severity === 'medium' ? '🟡' : '🔵';
      output += `## ${icon} [${issue.severity.toUpperCase()}] ${issue.title}\n\n`;
      output += `**Category:** ${issue.category}\n`;
      if (issue.location) output += `**Location:** ${issue.location}\n`;
      output += `\n${issue.description}\n\n`;
      output += `**Fix:** ${issue.fixSuggestion}\n\n---\n\n`;
    }

    return output;
  } catch (e) {
    return `# AgentBreaker Code Scan\n\n❌ **Scan failed:** ${(e as Error).message}\n\nMake sure ANTHROPIC_API_KEY is set.`;
  }
}
