import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import AuthShell from '../../components/layout/AuthShell'
import SimulatedBadge from '../../components/common/SimulatedBadge'
import { Field, Input, PasswordInput } from '../../components/common/Field'
import { useAuthStore, homeFor } from '../../stores/authStore'
import { errorMessage } from '../../services/apiClient'

const schema = z.object({
  businessId: z.string().trim().regex(/^FAI-[A-Za-z0-9]{6}$/, 'Business ID looks like FAI-7K2M9Q'),
  email: z.string().trim().min(3, 'Enter your email or username'),
  password: z.string().min(1, 'Enter your password'),
  remember: z.boolean().optional(),
})
const DEMOS = [
  { role: 'Brand Owner', email: 'owner@demo.com' },
  { role: 'Franchise Owner', email: 'franchise@demo.com' },
  { role: 'Store Manager', email: 'manager@demo.com' },
  { role: 'Staff', email: 'staff@demo.com' },
]

export default function Login() {
  const login = useAuthStore((s) => s.login)
  const nav = useNavigate()
  const { state } = useLocation()
  const [formError, setFormError] = useState('')
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { businessId: state?.businessId ?? '', email: state?.email ?? '', password: '', remember: false },
  })

  const fillDemo = (email) => {
    setValue('businessId', 'FAI-DEMO01'); setValue('email', email); setValue('password', 'Demo@123'); setFormError('')
  }
  const onSubmit = async (v) => {
    setFormError('')
    try {
      const s = await login({ ...v, businessId: v.businessId.toUpperCase() })
      toast.success(`Welcome back, ${s.user.name.split(' ')[0]}`)
      nav(homeFor(s), { replace: true })
    } catch (e) { setFormError(errorMessage(e)) }
  }

  return (
    <AuthShell title="Log in to your business" subtitle="Use the Business ID you received at registration.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Business ID" error={errors.businessId?.message}>
          <Input placeholder="FAI-7K2M9Q" autoComplete="organization" className="uppercase" error={errors.businessId} {...register('businessId')} />
        </Field>
        <Field label="Business email or username" error={errors.email?.message}>
          <Input placeholder="owner@business.com" autoComplete="username" error={errors.email} {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <PasswordInput placeholder="Your password" autoComplete="current-password" error={errors.password} {...register('password')} />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted"><input type="checkbox" className="h-4 w-4 rounded border-line accent-primary" {...register('remember')} />Remember me</label>
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">Forgot password?</Link>
        </div>
        {formError && <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{formError}</p>}
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" />Logging in…</> : 'Log in'}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-dashed border-line p-4">
        <p className="text-sm font-semibold">Demo accounts</p>
        <p className="mt-1 text-xs text-muted">Business ID FAI-DEMO01 · password Demo@123</p>
        <div className="mt-3 flex gap-2">
          {DEMOS.map((d) => <button key={d.role} type="button" onClick={() => fillDemo(d.email)} className="btn-outline flex-1 !py-2">Use {d.role}</button>)}
        </div>
      </div>
      <div className="mt-4"><SimulatedBadge /></div>
      <p className="mt-6 text-center text-sm text-muted">New here? <Link to="/register" className="font-semibold text-primary hover:underline">Register your business</Link></p>
    </AuthShell>
  )
}
