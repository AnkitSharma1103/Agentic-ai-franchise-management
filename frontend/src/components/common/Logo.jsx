import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
export default function Logo({ dark = false, to = '/', iconOnly = false }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white"><Sparkles size={18} /></span>
      {!iconOnly && <span className={`text-lg font-bold tracking-tight ${dark ? 'text-white' : 'text-ink'}`}>FranchiseAI</span>}
    </Link>
  )
}
