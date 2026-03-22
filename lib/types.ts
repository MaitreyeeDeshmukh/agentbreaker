export type AttackCategory = 'prompt_injection' | 'goal_hijacking' | 'data_exfiltration' | 'tool_misuse'
export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type ScanMode = 'prompt' | 'website' | 'code'

export interface TestResult {
  attackId: string
  category: string
  name: string
  severity: string
  passed: boolean
  agentResponse: string
  reasoning: string
  reproductionSteps: string
  fixSuggestion?: string
  attackPayload?: string
  httpStatus?: number
}

export interface ScanReport {
  id: string
  createdAt: string
  systemPromptSnippet: string
  totalTests: number
  passed: number
  failed: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  securityScore: number
  results: TestResult[]
  mode: ScanMode
  targetUrl?: string
  targetEndpoint?: string
}

export interface ProbeResult {
  found: boolean
  endpoint?: string
  format?: string
  sampleResponse?: string
  error?: string
}

export interface CodeIssue {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  location?: string
  fixSuggestion: string
  codeSnippet?: string
  fixCode?: string
}

export interface CodeScanReport {
  id: string
  createdAt: string
  totalIssues: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  securityScore: number
  issues: CodeIssue[]
  fixPrompt: string
  mode: 'code'
}

export type AnyReport = ScanReport | CodeScanReport
