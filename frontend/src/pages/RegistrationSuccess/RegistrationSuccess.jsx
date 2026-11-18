import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { CheckCircle2, Copy, Download, Check } from 'lucide-react'
import { toast } from 'sonner'
import Logo from '../../components/common/Logo'
import { typeLabel } from '../../config/businessTypes'

export default function RegistrationSuccess() {
  const nav = useNavigate()
  const [copied, setCopied] = useState(false)
  let r = null
  try { r = JSON.parse(sessionStorage.getItem('fai_last_registration') || 'null') } catch { /* ignore */ }
  if (!r) return <Navigate to="/register" replace />

  const copy = async () => {
    try { await navigator.clipboard.writeText(r.businessId); setCopied(true); toast.success('Business ID copied'); setTimeout(() => setCopied(false), 2000) }
    catch { toast.error('Copy failed. Select the ID and copy it manually.') }
  }
  const download = () => {
    const text = [
      'FranchiseAI — Registration details', '',
      `Business Name: ${r.businessName}`, `Business ID: ${r.businessId}`, `Owner: ${r.ownerName}`,
      `Business Type: ${typeLabel(r.businessType)}`, `Status: ${r.status}`, `Registered: ${new Date(r.registeredAt).toLocaleString('en-IN')}`, '',
      'Use the Business ID, your email and password to log in.', 'The Business ID identifies your business. It is not a secret, but keep your password private.',
    ].join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })), download: `${r.businessId}-registration.txt` })
    a.click(); URL.revokeObjectURL(a.href)
  }
  const rows = [['Business name', r.businessName], ['Owner', r.ownerName], ['Business type', typeLabel(r.businessType)], ['Registration status', r.status]]

  return (
    <div className="min-h-screen bg-canvas px-5 py-10">
      <div className="mx-auto max-w-xl">
        <Logo />
        <div className="card mt-8 p-6 sm:p-10">
          <CheckCircle2 size={44} className="text-success" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Your business has been successfully registered!</h1>
          <p className="mt-2 text-sm text-muted">Save your Business ID. You’ll need it every time you log in.</p>

          <div className="mt-6 rounded-2xl bg-navy p-5 text-white">
            <p className="text-xs text-white/60">Business ID</p>
            <p className="mt-1 break-all text-3xl font-bold tracking-wider" data-testid="business-id">{r.businessId}</p>
          </div>

          <dl className="mt-6 divide-y divide-line text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{k === 'Registration status' ? <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-success">{v}</span> : v}</dd></div>
            ))}
          </dl>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button onClick={copy} className="btn-outline">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy Business ID'}</button>
            <button onClick={download} className="btn-outline"><Download size={16} />Download details</button>
          </div>
          <button onClick={() => nav('/login', { state: { businessId: r.businessId } })} className="btn-primary mt-3 w-full">Continue to login</button>
          <p className="mt-4 text-center text-xs text-muted">Registered by mistake? <Link to="/register" className="text-primary hover:underline">Register another business</Link></p>
        </div>
      </div>
    </div>
  )
}
