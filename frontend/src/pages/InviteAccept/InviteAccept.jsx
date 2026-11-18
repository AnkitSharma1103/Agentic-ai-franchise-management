import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, MailX } from 'lucide-react'
import AuthShell from '../../components/layout/AuthShell'
import SimulatedBadge from '../../components/common/SimulatedBadge'
import { Field, PasswordInput } from '../../components/common/Field'
import { Skeleton } from '../../components/common/ui'
import { useAsync } from '../../hooks/useAsync'
import { userService } from '../../services/userService'
import { errorMessage } from '../../services/apiClient'
import { passwordStrength } from '../../utils/password'

const schema = z.object({
  password: z.string().min(8, 'At least 8 characters').regex(/[a-z]/, 'Add a lowercase letter').regex(/[A-Z]/, 'Add an uppercase letter').regex(/\d/, 'Add a number').regex(/[^A-Za-z0-9]/, 'Add a special character'),
  confirm: z.string().min(1, 'Confirm your password'),
  terms: z.literal(true, { errorMap: () => ({ message: 'Accept the terms to continue' }) }),
}).refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' })

export default function InviteAccept() {
  const { token } = useParams()
  const nav = useNavigate()
  const { data: inv, loading, error } = useAsync(() => userService.getInvitation(token), [token])
  const [err, setErr] = useState('')
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { password: '', confirm: '', terms: false } })
  const strength = passwordStrength(watch('password'))

  const onSubmit = async (v) => {
    setErr('')
    try {
      await userService.acceptInvitation(token, v.password)
      toast.success('Account created. Log in to continue.')
      nav('/login', { replace: true, state: { businessId: inv.businessId, email: inv.email } })
    } catch (e) { setErr(errorMessage(e)) }
  }

  if (loading) return <AuthShell title="Loading invitation…"><Skeleton className="h-40" /></AuthShell>
  if (error) return (
    <AuthShell title="This invitation can’t be used">
      <div className="card p-6 text-center"><MailX className="mx-auto text-danger" size={34} /><p className="mt-3 text-sm text-muted">{error}</p><p className="mt-1 text-sm text-muted">Ask the business owner to send a new invitation.</p></div>
      <Link to="/login" className="btn-outline mt-6 w-full">Go to login</Link>
    </AuthShell>
  )
  return (
    <AuthShell title={`Join ${inv.businessName}`} subtitle={`${inv.name}, you’ve been invited as a manager for ${inv.branchNames.join(', ')}.`}>
      <div className="mb-5 rounded-xl bg-canvas px-4 py-3 text-sm"><p className="text-muted">Business ID <span className="font-semibold text-ink">{inv.businessId}</span></p><p className="text-muted">Login email <span className="font-semibold text-ink">{inv.email}</span></p></div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field label="Create password" error={errors.password?.message}><PasswordInput autoComplete="new-password" error={errors.password} {...register('password')} /></Field>
        {strength.score > 0 && <div><div className="flex gap-1.5">{[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= strength.score ? strength.color : 'bg-line'}`} />)}</div><p className="mt-1.5 text-xs text-muted">Strength: {strength.label}</p></div>}
        <Field label="Confirm password" error={errors.confirm?.message}><PasswordInput autoComplete="new-password" error={errors.confirm} {...register('confirm')} /></Field>
        <div><label className="flex items-start gap-2.5 text-sm text-muted"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" {...register('terms')} />I accept the Terms of Service and Privacy Policy.</label>{errors.terms && <p className="field-error">{errors.terms.message}</p>}</div>
        {err && <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{err}</p>}
        <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 size={16} className="animate-spin" />Creating account…</> : 'Accept invitation'}</button>
      </form>
      <div className="mt-4"><SimulatedBadge>Simulated invitation: no email is sent.</SimulatedBadge></div>
    </AuthShell>
  )
}
