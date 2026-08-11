import { useState, useEffect } from 'react'
import { Eye, EyeOff, Brain, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { PageHeader } from '../../shared/ui/PageHeader'
import { getPrivacyOptIn, setPrivacyOptIn } from '../../core/llm/questions'

export function PrivacyPage() {
  const [optIn, setOptIn] = useState(false)

  useEffect(() => {
    setOptIn(getPrivacyOptIn())
  }, [])

  const handleToggle = (enabled: boolean) => {
    setPrivacyOptIn(enabled)
    setOptIn(enabled)
  }

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader
        title="Journal Privacy"
        subtitle="Control how your journal entries interact with AI features"
      />

      <div className="space-y-6">
        <div className="rounded-xl border border-border-subtle bg-bg-secondary p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
                  {optIn ? <Eye size={20} /> : <EyeOff size={20} />}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-primary">
                    {optIn ? 'Personalized AI Prompts Enabled' : 'Personalized AI Prompts Disabled'}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {optIn
                      ? 'Your journal entries will be used to generate personalized reflection questions'
                      : 'Only the built-in 15-prompt bank will be used for journal prompts'}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={optIn}
                  onChange={(e) => handleToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 rounded-full bg-bg-tertiary peer-focus:ring-2 peer-focus:ring-accent-blue peer-checked:bg-accent-blue transition-colors" />
                <span className="absolute left-1 top-0.5 h-5 w-5 rounded-full bg-white shadow-lg peer-checked:translate-x-5 transition-transform" />
              </label>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-bg-tertiary">
            <p className="text-sm text-text-secondary">
              <strong>What this controls:</strong> When enabled, your recent journal entries (up to 7) are sent
              to the LLM to generate 10 personalized reflection questions. These are cached locally and used
              alongside the built-in prompts. When disabled, only the 15 built-in prompts are used.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border-subtle bg-bg-secondary p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-text-primary">
            <Brain size={16} className="text-accent-blue" /> How Personalized Prompts Work
          </h3>
          <ol className="space-y-3 text-sm text-text-secondary">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-xs font-medium text-accent-blue">1</span>
              <span>You write journal entries (mood, energy, free text or guided prompts)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-xs font-medium text-accent-blue">2</span>
              <span>Once per week (if opted in), your last 7 entries are sent to the LLM</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-xs font-medium text-accent-blue">3</span>
              <span>LLM generates 10 personalized questions based on your themes/patterns</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-xs font-medium text-accent-blue">4</span>
              <span>Questions are cached locally in your database (table: <code>llm_questions</code>)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-xs font-medium text-accent-blue">5</span>
              <span>When you open Journal, a question is picked from cached LLM + built-in pool</span>
            </li>
          </ol>
        </div>

        <div className="rounded-xl border border-border-subtle bg-bg-secondary p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-text-primary">
            <Lock size={16} className="text-success" /> Privacy Guarantees
          </h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex gap-3">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-success" />
              <span><strong>Local-first:</strong> Your journal entries never leave your device except for the LLM API call</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-success" />
              <span><strong>Opt-in only:</strong> Disabled by default. You must explicitly enable it</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-success" />
              <span><strong>No training:</strong> Your data is not used to train any models</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-success" />
              <span><strong>Revocable:</strong> Disable anytime — future entries won't be sent</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-success" />
              <span><strong>Transparent:</strong> You can view cached LLM questions in the database</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-success" />
              <span><strong>Minimal data:</strong> Only last 7 entries sent, no personal identifiers</span>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-warning">
            <AlertCircle size={14} /> Important Notes
          </h3>
          <ul className="space-y-1 text-sm text-text-secondary">
            <li>• Token Router (your API provider) will receive your journal text during question generation</li>
            <li>• Review Token Router's privacy policy: <a href="https://tokenrouter.com/privacy" target="_blank" rel="noopener" className="text-accent-blue underline">tokenrouter.com/privacy</a></li>
            <li>• If you use a local model via Token Router, data may not leave your network</li>
            <li>• Built-in prompts work 100% offline with zero data transmission</li>
          </ul>
        </div>

        <details className="group rounded-xl border border-border-subtle bg-bg-secondary p-5">
          <summary className="flex items-center gap-2 cursor-pointer list-none text-sm font-medium text-text-primary">
            <Brain size={16} className="text-text-muted" />
            Technical Details
            <span className="ml-auto text-xs text-text-muted group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-4 space-y-3 text-sm text-text-secondary">
            <div>
              <p className="font-medium text-text-primary mb-1">LLM Request Payload</p>
              <pre className="rounded bg-bg-tertiary p-3 text-xs overflow-x-auto"><code>{`{
  "model": "kimi-k3",
  "messages": [
    {"role": "system", "content": "You are a psychotherapist..."},
    {"role": "user", "content": "Recent entries: [your 7 entries]"}
  ],
  "temperature": 0.8,
  "max_tokens": 500
}`}</code></pre>
            </div>
            <div>
              <p className="font-medium text-text-primary mb-1">Cached Questions Schema</p>
              <pre className="rounded bg-bg-tertiary p-3 text-xs overflow-x-auto"><code>{`llm_questions:
  id (UUID)
  prompt (TEXT)
  source ('llm' | 'builtin')
  created_at (INTEGER)
  asked (BOOLEAN)`}</code></pre>
            </div>
            <div>
              <p className="font-medium text-text-primary mb-1">localStorage Keys</p>
              <ul className="list-disc list-inside space-y-1">
                <li><code>lt_journal_privacy_opt_in</code> — boolean</li>
                <li><code>lt_llm_last_batch_at</code> — timestamp</li>
                <li><code>lt_llm_api_key</code>, <code>lt_llm_base_url</code>, <code>lt_llm_model</code> — LLM config</li>
              </ul>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}