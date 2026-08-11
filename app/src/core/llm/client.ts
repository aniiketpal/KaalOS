export interface LLMConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function callLLM(config: LLMConfig, messages: ChatMessage[], options?: {
  temperature?: number
  maxTokens?: number
}): Promise<LLMResponse> {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options?.temperature ?? 0.8,
      max_tokens: options?.maxTokens ?? 500,
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.error?.message || `LLM request failed: ${res.status}`)
  }

  const data = await res.json()
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    usage: data.usage,
  }
}

export async function testLLMConnection(config: LLMConfig): Promise<boolean> {
  try {
    const res = await callLLM(config, [
      { role: 'user', content: 'Hello' }
    ], { maxTokens: 10 })
    return !!res.content
  } catch {
    return false
  }
}

export function getLLMConfig(): LLMConfig | null {
  if (typeof window === 'undefined') return null

  const apiKey = localStorage.getItem('lt_llm_api_key')
  const baseUrl = localStorage.getItem('lt_llm_base_url') || 'https://api.tokenrouter.com/v1'
  const model = localStorage.getItem('lt_llm_model') || 'kimi-k3'

  if (!apiKey) return null

  return { apiKey, baseUrl, model }
}

export function setLLMConfig(config: Partial<LLMConfig>): void {
  if (config.apiKey) localStorage.setItem('lt_llm_api_key', config.apiKey)
  if (config.baseUrl) localStorage.setItem('lt_llm_base_url', config.baseUrl)
  if (config.model) localStorage.setItem('lt_llm_model', config.model)
}

export function clearLLMConfig(): void {
  localStorage.removeItem('lt_llm_api_key')
  localStorage.removeItem('lt_llm_base_url')
  localStorage.removeItem('lt_llm_model')
}