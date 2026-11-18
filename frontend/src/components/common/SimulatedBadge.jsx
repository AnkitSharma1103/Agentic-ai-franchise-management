import { FlaskConical } from 'lucide-react'
export default function SimulatedBadge({ children = 'Simulated frontend authentication — no real accounts or servers are used.' }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-primary/5 px-3.5 py-2.5 text-xs text-muted">
      <FlaskConical size={14} className="mt-0.5 shrink-0 text-primary" />{children}
    </p>
  )
}
