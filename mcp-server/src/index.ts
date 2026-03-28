#!/usr/bin/env node

/**
 * AgentBreaker MCP Server
 *
 * Security-as-a-Service for vibe-coders.
 * Drop this into any project's .mcp.json and get AI security testing
 * directly in Claude Code, Cursor, or any MCP-compatible tool.
 *
 * Usage in .mcp.json:
 * {
 *   "mcpServers": {
 *     "agentbreaker": {
 *       "command": "npx",
 *       "args": ["-y", "agentbreaker-mcp@latest"],
 *       "env": { "ANTHROPIC_API_KEY": "sk-ant-..." }
 *     }
 *   }
 * }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { scanPrompt } from './tools/scan-prompt.js';
import { scanCode } from './tools/scan-code.js';
import { scanUrl } from './tools/scan-url.js';
import { generateFix } from './tools/fix.js';

const server = new McpServer({
  name: 'agentbreaker',
  version: '0.1.0',
});

// ─── Tool 1: Scan a system prompt ────────────────────────────────────
server.tool(
  'agentbreaker_scan_prompt',
  'Test an AI system prompt for security vulnerabilities. Runs 20 attack vectors (prompt injection, data exfiltration, goal hijacking, tool misuse) against the prompt and returns a security score with detailed findings.',
  {
    systemPrompt: z.string().describe('The full system prompt text to test for security vulnerabilities'),
  },
  async ({ systemPrompt }: { systemPrompt: string }) => {
    console.error('[AgentBreaker] Starting prompt scan...');
    const result = await scanPrompt(systemPrompt);
    return { content: [{ type: 'text' as const, text: result }] };
  },
);

// ─── Tool 2: Scan code for AI security issues ───────────────────────
server.tool(
  'agentbreaker_scan_code',
  'Analyze code for AI security vulnerabilities. Checks for prompt injection sinks, hardcoded secrets, missing input validation, insecure tool calls, and system prompt leakage.',
  {
    code: z.string().describe('The source code to analyze for security vulnerabilities'),
    language: z.string().optional().describe('Programming language (e.g., typescript, python, javascript)'),
    filename: z.string().optional().describe('Filename for context (e.g., api/chat/route.ts)'),
  },
  async ({ code, language, filename }: { code: string; language?: string; filename?: string }) => {
    console.error('[AgentBreaker] Starting code scan...');
    const result = await scanCode(code, language, filename);
    return { content: [{ type: 'text' as const, text: result }] };
  },
);

// ─── Tool 3: Scan a live URL / API endpoint ─────────────────────────
server.tool(
  'agentbreaker_scan_url',
  'Test a live AI API endpoint for security vulnerabilities. Auto-detects the chat endpoint, then runs attack vectors against it. Requires the target to be a running web application with an AI chat API.',
  {
    url: z.string().url().describe('Base URL of the target application (e.g., https://myapp.vercel.app)'),
    endpoint: z.string().optional().describe('Specific API endpoint path (e.g., /api/chat). Auto-detected if not provided.'),
    format: z.enum(['messages', 'message', 'prompt', 'input']).optional().describe('Request body format. Auto-detected if not provided.'),
    quickMode: z.boolean().optional().describe('If true, only runs top 10 attacks instead of all 20 (faster).'),
  },
  async ({ url, endpoint, format, quickMode }: { url: string; endpoint?: string; format?: string; quickMode?: boolean }) => {
    console.error(`[AgentBreaker] Starting URL scan of ${url}...`);
    const result = await scanUrl(url, endpoint, format, quickMode);
    return { content: [{ type: 'text' as const, text: result }] };
  },
);

// ─── Tool 4: Generate fix suggestions ───────────────────────────────
server.tool(
  'agentbreaker_fix',
  'Generate specific, actionable fix instructions for AI security vulnerabilities. Takes a description of the vulnerabilities found and returns step-by-step remediation with code examples.',
  {
    vulnerabilities: z.string().describe('Description of the vulnerabilities to fix (from a previous scan result)'),
    context: z.string().optional().describe('Additional context like the relevant code or system prompt'),
  },
  async ({ vulnerabilities, context }: { vulnerabilities: string; context?: string }) => {
    console.error('[AgentBreaker] Generating fix suggestions...');
    const result = await generateFix(vulnerabilities, context);
    return { content: [{ type: 'text' as const, text: result }] };
  },
);

// ─── Start server ────────────────────────────────────────────────────
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[AgentBreaker] WARNING: ANTHROPIC_API_KEY not set. Scans will fail.');
    console.error('[AgentBreaker] Set it in your .mcp.json env or export it.');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[AgentBreaker] MCP server running on stdio');
  console.error('[AgentBreaker] Tools: agentbreaker_scan_prompt, agentbreaker_scan_code, agentbreaker_scan_url, agentbreaker_fix');
}

main().catch((e) => {
  console.error('[AgentBreaker] Fatal:', e);
  process.exit(1);
});
