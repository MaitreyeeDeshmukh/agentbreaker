export interface TestResult {
  attackId: string
  category: string
  name: string
  severity: string
  passed: boolean
  agentResponse: string
  reasoning: string
  reproductionSteps: string
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
}
