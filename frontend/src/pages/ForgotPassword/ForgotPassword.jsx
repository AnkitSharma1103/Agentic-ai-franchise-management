import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MailCheck, Loader2, ArrowLeft } from 'lucide-react'
import AuthShell from '../../components/layout/AuthShell'
import SimulatedBadge from '../../components/common/SimulatedBadge'
import { Field, Input } from '../../components/common/Field'
import { authService } from '../../services/authService'
import { errorMessage } from '../../services/apiClient'

const schema = z.object({
  businessId: z.string().trim().regex(/^FAI-[A-Za-z0-9]{6}$/, 'Business ID looks like FAI-7K2M9Q'),
  email: z.string().email('Enter a valid email'),
})

export default function ForgotPassword() {
  const [sentTo, setSentTo] = useState(null)
  const [err, setErr] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })
  const onSubmit = async (v) => {
    setErr('')
    try { await authService.forgotPassword(v); setSentTo(v.email) } catch (e) { setErr(errorMessage(e)) }
  }
  return (
    <AuthShell title="Reset your password" subtitle="Enter your Business ID and email. We’ll send a reset link.">
      {sentTo ? (
        <div className="card p-6 text-center">
          <MailCheck className="mx-auto text-success" size={36} />
          <p className="mt-4 font-semibold">Check your inbox</p>
          <p className="mt-1 text-sm text-muted">If an account exists for {sentTo}, a reset link is on its way.</p>
          <div className="mt-4"><SimulatedBadge>Simulated: no email is actually sent.</SimulatedBadge></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Field label="Business ID" error={errors.businessId?.message}><Input placeholder="FAI-7K2M9Q" className="uppercase" error={errors.businessId} {...register('businessId')} /></Field>
          <Field label="Email" error={errors.email?.message}><Input type="email" placeholder="you@business.com" error={errors.email} {...register('email')} /></Field>
          {err && <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{err}</p>}
          <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 size={16} className="animate-spin" />Sending…</> : 'Send reset link'}</button>
        </form>
      )}
      <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><ArrowLeft size={14} />Back to login</Link>
    </AuthShell>
  )
}
