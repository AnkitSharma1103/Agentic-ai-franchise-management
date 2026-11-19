import { useEffect, useState } from 'react'
import { Bot, Sparkles, AlertTriangle, IndianRupee, Send } from 'lucide-react'
import { useBusiness } from '../../context/BusinessContext'
import { PageHeader, KpiCard, ChartCard, StatusBadge } from '../../components/common/ui'
import { inr } from '../../utils/format'

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export default function AIAgents() {
  const { user } = useBusiness()
  const [prompt, setPrompt] = useState('Analyze salon branch sales and staff payroll')
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      text: `Hello ${user?.name?.split(' ')[0] || 'there'}! I am your Salon FranchiseOps AI Assistant (logged in as ${user?.role || 'OWNER'}). Ask me about salon branch sales, ML anomaly alerts, or stylist salaries.`,
    },
  ])
  const [overview, setOverview] = useState({ sales_ml: [], payroll: [] })
  const [loading, setLoading] = useState(false)
  const [backendLive, setBackendLive] = useState(false)

  useEffect(() => {
    fetch(`${BACKEND_URL}/ai/overview`)
      .then((r) => r.json())
      .then((data) => {
        setOverview(data)
        setBackendLive(true)
      })
      .catch(() => setBackendLive(false))
  }, [])

  const sendQuery = async (customPrompt) => {
    const q = customPrompt ?? prompt
    if (!q.trim()) return
    setMessages((prev) => [...prev, { role: 'user', text: q }])
    setPrompt('')
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `[User Role: ${user?.role || 'OWNER'}] ${q}` }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'agent', text: data.reply }])
      if (data.sales_ml) setOverview({ sales_ml: data.sales_ml, payroll: data.payroll })
      setBackendLive(true)
    } catch {
      setMessages((prev) => [...prev, { role: 'agent', text: 'Backend not reachable on port 8000.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="Salon Agentic AI & ML Monitor"
        text="Autonomous Sales Anomaly Detection, Stylist Payroll Agent & Interactive AI Chatbot"
      >
        <StatusBadge status={backendLive ? 'Active' : 'Inactive'} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={Bot} label="Active Salon AI Agents" value="2 Agents Live" />
        <KpiCard icon={AlertTriangle} label="ML Sales Anomaly Alerts" value={`${overview.sales_ml.filter((s) => s.anomaly_detected).length} Salon Flagged`} />
        <KpiCard icon={IndianRupee} label="Monthly Stylist & Staff Payroll" value={inr(overview.payroll.reduce((t, p) => t + (p.net_payout_inr || 0), 0))} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Salon AI Chatbot" action={<span className="text-xs text-muted">FastAPI + Gemini</span>}>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => sendQuery('Check salon branch sales and flag any ML anomalies')} className="btn-secondary !py-1.5 !text-xs">
                <Sparkles className="mr-1 inline h-3.5 w-3.5" /> Check Salon Sales Anomaly
              </button>
              <button onClick={() => sendQuery('Calculate monthly salon stylist and staff salaries')} className="btn-secondary !py-1.5 !text-xs">
                <IndianRupee className="mr-1 inline h-3.5 w-3.5" /> Calculate Stylist Payroll
              </button>
            </div>

            <div className="h-64 space-y-3 overflow-y-auto rounded-xl border bg-slate-50/60 p-4 text-sm">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-2.5 ${m.role === 'user' ? 'bg-primary text-white' : 'border bg-white text-slate-800 shadow-sm'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && <div className="text-xs text-muted">Salon AI Agent is analyzing...</div>}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); sendQuery() }} className="flex gap-2">
              <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask about salon sales or stylist salaries..." className="input flex-1" />
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-1.5">
                <Send className="h-4 w-4" /> Ask AI
              </button>
            </form>
          </div>
        </ChartCard>

        <ChartCard title="Live Salon ML & Payroll Agent Outputs" action={<span className="text-xs text-muted">Scikit-Learn + Tools</span>}>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="mb-2 font-semibold text-slate-700">1. Salon Branch Sales & ML Next-Day Forecast</h4>
              <div className="space-y-2">
                {overview.sales_ml.map((s) => (
                  <div key={s.branch} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium">{s.branch}</div>
                      <div className="text-xs text-muted">7-Day Sales: {inr(s.total_7d_revenue_inr)} • ML Forecast: {inr(s.ml_next_day_forecast_inr)}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.anomaly_detected ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold text-slate-700">2. Salon Staff Payroll (Attendance + Performance Bonus)</h4>
              <div className="space-y-2">
                {overview.payroll.map((p) => (
                  <div key={p.staff_name} className="flex items-center justify-between rounded-lg border p-2.5">
                    <div>
                      <div className="font-medium">{p.staff_name} <span className="text-xs text-muted">({p.role})</span></div>
                      <div className="text-xs text-muted">Attendance: {p.days_present} • Score: {p.performance_score}% • Bonus: {inr(p.performance_bonus_inr)}</div>
                    </div>
                    <div className="font-semibold text-primary">{inr(p.net_payout_inr)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}