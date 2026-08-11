import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Key, CheckCircle, AlertCircle, WifiOff, Loader2 } from 'lucide-react'
import { PageHeader } from '../../shared/ui/PageHeader'
import { getLLMConfig, setLLMConfig, testLLMConnection, clearLLMConfig } from '../../core/llm/client'

export function LLMSettingsPage() {
  const [config, setConfig] = useState<{ apiKey: string; baseUrl: string; model: string }>({
    apiKey: '',
    baseUrl: 'https://api.tokenrouter.com/v1',
    model: 'kimi-k3',
  })
  const [savedConfig, setSavedConfig] = useState<typeof config | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    const stored = getLLMConfig()
    if (stored) {
      setConfig(stored)
      setSavedConfig(stored)
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus(null)
    try {
      setLLMConfig(config)
      setSavedConfig({ ...config })
      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 3000)
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!config.apiKey) {
      setTestResult('error')
      return
    }
    setTesting(true)
    setTestResult(null)
    const success = await testLLMConnection(config)
    setTestResult(success ? 'success' : 'error')
    setTesting(false)
  }

  const handleClear = () => {
    clearLLMConfig()
    setConfig({ apiKey: '', baseUrl: 'https://api.tokenrouter.com/v1', model: 'kimi-k3' })
    setSavedConfig(null)
    setTestResult(null)
  }

  const hasChanges = savedConfig &&
    (config.apiKey !== savedConfig.apiKey ||
      config.baseUrl !== savedConfig.baseUrl ||
      config.model !== savedConfig.model)

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader
        title="AI / LLM Configuration"
        subtitle="Configure Token Router (OpenAI-compatible) for AI-powered features"
      />

      <div className="space-y-6">
        <div className="rounded-xl border border-border-subtle bg-bg-secondary p-5">
          <h3 className="mb-4 text-sm font-medium text-text-primary">API Credentials</h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">API Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
                />
                {savedConfig?.apiKey && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-success">
                    Saved
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Your Token Router API key. Stored locally in your browser/app storage.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Base URL</label>
              <input
                type="text"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
              />
              <p className="mt-1 text-xs text-text-muted">
                Token Router endpoint (default: https://api.tokenrouter.com/v1)
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Model</label>
              <input
                type="text"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
              />
              <p className="mt-1 text-xs text-text-muted">
                Model identifier (default: kimi-k3)
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex items-center gap-2 rounded-md bg-accent-blue px-4 py-2 text-sm font-medium text-text-inverse transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
            <button
              onClick={handleTest}
              disabled={testing || !config.apiKey}
              className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-50"
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : <WifiOff size={14} />}
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            {savedConfig && (
              <button
                onClick={handleClear}
                className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10"
              >
                <Key size={14} />
                Clear Key
              </button>
            )}
          </div>

          {saveStatus && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 rounded-lg border p-3 flex items-center gap-2 text-sm ${
                saveStatus === 'success'
                  ? 'border-success/30 bg-success/5 text-success'
                  : 'border-error/30 bg-error/5 text-error'
              }`}
            >
              {saveStatus === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {saveStatus === 'success' ? 'Configuration saved' : 'Failed to save'}
            </motion.div>
          )}

          {testResult && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 rounded-lg border p-3 flex items-center gap-2 text-sm ${
                testResult === 'success'
                  ? 'border-success/30 bg-success/5 text-success'
                  : 'border-error/30 bg-error/5 text-error'
              }`}
            >
              {testResult === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {testResult === 'success' ? 'Connection successful!' : 'Connection failed — check key and URL'}
            </motion.div>
          )}
        </div>

        <div className="rounded-xl border border-border-subtle bg-bg-secondary p-5">
          <h3 className="mb-4 text-sm font-medium text-text-primary">How It Works</h3>
          <dl className="space-y-3 text-sm text-text-secondary">
            <div className="flex gap-3">
              <dt className="font-medium text-text-primary min-w-[120px]">Provider</dt>
              <dd>Token Router — OpenAI-compatible API proxy for multiple models</dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-medium text-text-primary min-w-[120px]">Used For</dt>
              <dd>Journal question generation, feed curation, graph embeddings</dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-medium text-text-primary min-w-[120px]">Privacy</dt>
              <dd>Keys stored locally only. Journal content sent only when privacy toggle is ON.</dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-medium text-text-primary min-w-[120px]">Cost</dt>
              <dd>Pay-per-use via Token Router. Approx $0.001-0.01 per request.</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-warning">
            <AlertCircle size={14} /> Security Note
          </h3>
          <p className="text-sm text-text-secondary">
            Your API key is stored in <strong>localStorage</strong> (browser) or the app's local storage (Tauri).
            It is never sent to our servers, never committed to git, and never leaves your device except
            for direct API calls to Token Router.
          </p>
        </div>
      </div>
    </div>
  )
}