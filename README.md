# AgentBreaker 🛡️

**AI agent security testing platform — break your AI before hackers do.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Anthropic](https://img.shields.io/badge/Anthropic-Claude_3-purple.svg)](https://www.anthropic.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)

---

## 🚨 The Problem

As AI agents and LLM-powered applications become ubiquitous, they introduce a completely new attack surface. Production agents are vulnerable to modern exploit techniques:
- **Prompt Injection:** Circumventing safety filters.
- **Goal Hijacking:** Tricking the AI into ignoring system instructions.
- **Data Exfiltration:** Leaking PII or proprietary context.
- **Tool Misuse:** Forcing agents to execute unauthorized backend actions.

Manual testing is slow, unscalable, and inherently misses complex adversarial edge cases. Over 73% of production agents have critical vulnerabilities.

## 💡 Our Solution

**AgentBreaker** is a red-teaming platform designed specifically for AI. It automates adversarial testing by firing sophisticated evasion techniques and payloads at your agent, allowing you to patch vulnerabilities *before* they are exploited in the wild. 

We generate easy-to-read reports and step-by-step fix suggestions for every security hole we find.

## 🚀 What We Built

AgentBreaker supports four primary attack vectors:

1. **Prompt Injection Scan:** Paste your agent's system prompt. We fire 57 jailbreaks, role-override attacks, and instruction-hijacking payloads at it to evaluate its resistance. Powered directly by an evaluator model.
2. **Code Scan:** Input your AI application code (e.g. your Python or TypeScript logic). We perform static analysis looking for hardcoded prompts, unsafe tool calls, missing input validations, excessive permissions, and data leakages.
3. **API Attack:** Point our system at your AI API endpoints to evaluate the responses for unsafe or un-sanitized output.
4. **Browser Attack:** A live browser navigates your web app and types adversarial prompts into chats, forms, and input fields to test the actual product surface.

### Key Features
- **Real-Time Streaming:** Watch attacks unfold in real-time via Server-Sent Events (SSE).
- **Vulnerability Dashboard:** Scorecard generation (`0-100` Security Score) calculating the severity of vulnerabilities.
- **Fix Suggestions:** Actionable remediation suggestions specific to your framework and prompt.
- **PDF Reporting:** Export full audit reports using `jspdf` and `html2canvas`.

## 🛠️ Tech Stack

We built AgentBreaker to be fast, responsive, and easy to deploy:

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React
- **Backend:** Next.js API Routes (Serverless streaming)
- **AI/Eval Engine:** Anthropic SDK (`@anthropic-ai/sdk`), Amazon Bedrock SDK
- **Language:** TypeScript
- **Exporting/Utils:** `uuid`, `jspdf`, `html2canvas`

## 🏃 Getting Started

### Prerequisites

Ensure you have Node.js 18+ installed. You also need an Anthropic API Key or AWS Bedrock credentials configured in your `.env.local`.

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/MaitreyeeDeshmukh/agentbreaker.git
   cd agentbreaker
   ```

2. Install dependencies
   ```bash
   npm install
   # or yarn / pnpm install
   ```

3. Set up environment variables
   Create a `.env.local` file in the root and add your API keys:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key
   # other optional keys
   ```

4. Run the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📝 License

This project is licensed under the MIT License.
