import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getClient, MODELS } from '@/lib/ai-client';
import { checkRateLimit, getIP, rateLimitResponse } from '@/lib/rate-limit';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

interface CodeIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  location?: string;
  fixSuggestion: string;
  codeSnippet?: string;
  fixCode?: string;
}

function buildFixPrompt(issues: CodeIssue[]): string {
  return (
    'Fix these AI security vulnerabilities in the codebase:\n\n' +
    issues
      .map(
        (i) =>
          `${i.severity.toUpperCase()}: ${i.title}\n  Location: ${i.location}\n  Fix: ${i.fixSuggestion}\n  ${i.fixCode ? 'Fixed code: ' + i.fixCode : ''
          }`
      )
      .join('\n\n')
  );
}

const SYSTEM_PROMPT = `You are a security auditor specializing in AI application security — like CodeRabbit but focused on AI-specific vulnerabilities. Analyze the provided code for security issues.

Focus on these AI security categories:
1. PROMPT_INJECTION: User input passed directly to AI without sanitization
2. SYSTEM_PROMPT_EXPOSURE: System prompt may be extractable (stored in client, logged, etc.)
3. MISSING_INPUT_VALIDATION: No length/content validation on user messages
4. INSECURE_API_KEY: API keys hardcoded, in client-side code, or not using env vars
5. MISSING_RATE_LIMITING: No rate limiting on AI endpoints
6. UNSAFE_OUTPUT: AI response displayed without sanitization (XSS risk)
7. EXCESSIVE_PERMISSIONS: AI given too many tool permissions
8. MISSING_AUTHENTICATION: AI endpoint has no auth
9. DATA_LEAKAGE: User data or conversation history exposed
10. MISSING_OUTPUT_FILTERING: No filtering of AI responses for sensitive content

For each issue found, return a JSON array of issues. Each issue MUST have ALL these fields:
{
  "id": "issue-N",
  "severity": "critical|high|medium|low",
  "category": "CATEGORY_NAME",
  "title": "Short title",
  "description": "What the issue is and why it is dangerous",
  "location": "function/line/file where issue occurs",
  "codeSnippet": "the vulnerable code snippet (max 3 lines)",
  "fixSuggestion": "How to fix this specific issue",
  "fixCode": "The fixed version of the code snippet (max 3 lines)"
}

Return ONLY a JSON array. No markdown. No explanation. Just the raw JSON array.
If no issues found, return [].`;

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = checkRateLimit(getIP(req), 5, 60_000)
  if (!allowed) return rateLimitResponse(retryAfter)

  const reportId = uuidv4();
  const anthropic = getClient();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: unknown) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const body = await req.json();
        const { code, language, filename } = body as {
          code: string;
          language?: string;
          filename?: string;
        };

        if (!code) {
          send({ type: 'error', message: 'code is required' });
          controller.close();
          return;
        }

        // Send start event
        send({ type: 'start', reportId, total: 10 });

        // Send fake progress messages
        send({ type: 'progress', message: 'Analyzing for prompt injection vulnerabilities...' });

        // Call Claude for analysis
        const response = await anthropic.messages.create({
          model: MODELS.sonnet,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Language: ${language || 'unknown'}\nFilename: ${filename || 'unknown'}\n\nCode:\n${code.slice(0, 8000)}`,
            },
          ],
        });

        send({ type: 'progress', message: 'Checking authentication & rate limiting...' });
        send({ type: 'progress', message: 'Reviewing API key handling...' });

        const rawText = response.content[0].type === 'text' ? (response.content[0].text ?? '[]') : '[]';

        let issues: CodeIssue[] = [];
        try {
          // Strip any accidental markdown fences
          const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
          issues = JSON.parse(cleaned);
          if (!Array.isArray(issues)) issues = [];
        } catch {
          issues = [];
        }

        // Stream each issue
        issues.forEach((issue, idx) => {
          send({
            type: 'issue',
            issue,
            progress: Math.round(((idx + 1) / Math.max(issues.length, 1)) * 100),
          });
        });

        // Build final report
        const criticalCount = issues.filter((i) => i.severity === 'critical').length;
        const highCount = issues.filter((i) => i.severity === 'high').length;
        const mediumCount = issues.filter((i) => i.severity === 'medium').length;
        const lowCount = issues.filter((i) => i.severity === 'low').length;

        const securityScore = Math.max(
          0,
          Math.min(100, 100 - criticalCount * 25 - highCount * 12 - mediumCount * 5 - lowCount * 2)
        );

        const report = {
          id: reportId,
          createdAt: new Date().toISOString(),
          totalIssues: issues.length,
          criticalCount,
          highCount,
          mediumCount,
          lowCount,
          securityScore,
          issues,
          fixPrompt: buildFixPrompt(issues),
          mode: 'code',
        };

        send({ type: 'complete', report });
      } catch (err) {
        console.error('[scan-code] Error:', err);
        send({ type: 'error', message: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
