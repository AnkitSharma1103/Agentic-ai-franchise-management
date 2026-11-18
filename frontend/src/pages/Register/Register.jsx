import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Check, Loader2, MailCheck, Pencil } from 'lucide-react'
import Logo from '../../components/common/Logo'
import SimulatedBadge from '../../components/common/SimulatedBadge'
import { Field, Input, PasswordInput } from '../../components/common/Field'
import { BUSINESS_TYPES, typeLabel } from '../../config/businessTypes'
import { COUNTRIES, STATES } from '../../config/geo'
import { registrationSchema, STEP_FIELDS } from '../../schemas/registration'
import { passwordStrength } from '../../utils/password'
import { businessService } from '../../services/businessService'
import { errorMessage } from '../../services/apiClient'

const STEPS = ['Business', 'Operations', 'Owner', 'Review']
const DEMO_CODE = '123456'

export default function Register() {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [verify, setVerify] = useState({ sent: false, code: '', verified: false, error: '' })
  const [submitError, setSubmitError] = useState('')

  const form = useForm({
    resolver: zodResolver(registrationSchema),
    mode: 'onTouched',
    defaultValues: {
      businessName: '', businessType: 'salon', category: '', businessEmail: '', businessPhone: '', website: '', country: 'India', state: '', city: '', address: '', description: '',
      branchCount: 1, employeeCount: '', monthlyCustomers: '', monthlyTransactions: '', openTime: '10:00', closeTime: '20:00', openingDate: '', offerings: '', branches: [{ name: '', city: '' }],
      ownerName: '', ownerEmail: '', ownerPhone: '', password: '', confirmPassword: '', terms: false,
    },
  })
  const { register, control, watch, setValue, trigger, getValues, handleSubmit, formState: { errors, isSubmitting } } = form
  const { fields, replace } = useFieldArray({ control, name: 'branches' })
  const type = watch('businessType'), country = watch('country'), branchCount = Number(watch('branchCount')) || 0, pw = watch('password'), ownerEmail = watch('ownerEmail')
  const strength = passwordStrength(pw)

  // Keep branch rows in sync with the branch count.
  useEffect(() => {
    const n = Math.min(Math.max(branchCount, 0), 50), cur = getValues('branches')
    if (n === cur.length) return
    replace(n > cur.length ? [...cur, ...Array.from({ length: n - cur.length }, () => ({ name: '', city: '' }))] : cur.slice(0, n))
  }, [branchCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // Changing the email invalidates a previous verification.
  useEffect(() => { setVerify((v) => (v.verified || v.sent ? { sent: false, code: '', verified: false, error: '' } : v)) }, [ownerEmail])

  const next = async () => {
    if (!(await trigger(STEP_FIELDS[step]))) { toast.error('Fix the highlighted fields to continue.'); return }
    if (step === 2 && !verify.verified) { setVerify((v) => ({ ...v, error: 'Verify your email to continue.' })); return }
    setStep((s) => s + 1); window.scrollTo({ top: 0 })
  }
  const back = () => { setStep((s) => s - 1); window.scrollTo({ top: 0 }) }

  const sendCode = async () => {
    if (!(await trigger('ownerEmail'))) return
    setVerify({ sent: true, code: '', verified: false, error: '' })
    toast.success(`Verification code sent to ${getValues('ownerEmail')}`)
  }
  const checkCode = () => {
    if (verify.code === DEMO_CODE) { setVerify((v) => ({ ...v, verified: true, error: '' })); toast.success('Email verified') }
    else setVerify((v) => ({ ...v, error: 'That code is incorrect. Try again.' }))
  }

  const onSubmit = async (v) => {
    setSubmitError('')
    try {
      const res = await businessService.register({
        business: { name: v.businessName, type: v.businessType, category: v.category, email: v.businessEmail, phone: v.businessPhone, website: v.website, country: v.country, state: v.state, city: v.city, address: v.address, description: v.description },
        operations: { branchCount: v.branchCount, employeeCount: v.employeeCount, monthlyCustomers: v.monthlyCustomers, monthlyTransactions: v.monthlyTransactions, hours: `${v.openTime}-${v.closeTime}`, openingDate: v.openingDate, offerings: v.offerings, branches: v.branches },
        owner: { fullName: v.ownerName, email: v.ownerEmail, phone: v.ownerPhone, password: v.password },
      })
      sessionStorage.setItem('fai_last_registration', JSON.stringify(res))
      nav('/registration-success', { replace: true })
    } catch (e) { setSubmitError(errorMessage(e)) }
  }

  const cfg = BUSINESS_TYPES[type]
  const e = (n) => errors[n]?.message

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Logo />
          <p className="text-sm text-muted">Have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link></p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Register your business</h1>
        <p className="mt-2 text-sm text-muted">Four short steps. You’ll receive a unique Business ID to log in.</p>

        <nav aria-label="Registration progress" className="mt-8">
          <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
          <ol className="mt-3 grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button type="button" disabled={i > step} onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined}
                  className={`flex w-full items-center gap-2 text-left text-sm ${i === step ? 'font-semibold text-primary' : i < step ? 'text-ink' : 'text-muted'}`}>
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${i < step ? 'bg-primary text-white' : i === step ? 'border-2 border-primary text-primary' : 'border border-line'}`}>{i < step ? <Check size={13} /> : i + 1}</span>
                  <span className="hidden sm:inline">{s}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <form onSubmit={handleSubmit(onSubmit, () => toast.error('Some details are invalid. Check each step.'))} noValidate className="card mt-6 p-5 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="space-y-6">

              {step === 0 && (<>
                <div>
                  <p className="label">Business type</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Business type">
                    {Object.entries(BUSINESS_TYPES).map(([k, t]) => {
                      const Icon = t.icon, on = type === k
                      return (
                        <button key={k} type="button" role="radio" aria-checked={on} onClick={() => { setValue('businessType', k, { shouldValidate: true }); setValue('category', '') }}
                          className={`flex flex-col items-center gap-2 rounded-xl border p-3.5 text-center text-xs font-medium transition-colors ${on ? 'border-primary bg-primary/5 text-primary' : 'border-line text-ink hover:border-secondary'}`}>
                          <Icon size={22} />{t.label}
                        </button>
                      )
                    })}
                  </div>
                  {e('businessType') && <p className="field-error">{e('businessType')}</p>}
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Business name" error={e('businessName')}><Input placeholder="Royal Salon" error={errors.businessName} {...register('businessName')} /></Field>
                  <Field label="Business category" error={e('category')}>
                    <select className={`input ${errors.category ? 'input-error' : ''}`} {...register('category')}><option value="">Select category</option>{cfg.categories.map((c) => <option key={c}>{c}</option>)}</select>
                  </Field>
                  <Field label="Business email" error={e('businessEmail')}><Input type="email" placeholder="hello@royalsalon.in" error={errors.businessEmail} {...register('businessEmail')} /></Field>
                  <Field label="Business phone" error={e('businessPhone')}><Input type="tel" placeholder="+91 98765 43210" error={errors.businessPhone} {...register('businessPhone')} /></Field>
                  <Field label="Website" optional error={e('website')}><Input placeholder="www.royalsalon.in" error={errors.website} {...register('website')} /></Field>
                  <Field label="Country" error={e('country')}>
                    <select className="input" {...register('country')} onChange={(ev) => { setValue('country', ev.target.value); setValue('state', '') }}>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select>
                  </Field>
                  <Field label="State" error={e('state')}>
                    <select className={`input ${errors.state ? 'input-error' : ''}`} {...register('state')}><option value="">Select state</option>{(STATES[country] ?? []).map((s) => <option key={s}>{s}</option>)}</select>
                  </Field>
                  <Field label="City" error={e('city')}><Input placeholder="Modinagar" error={errors.city} {...register('city')} /></Field>
                </div>
                <Field label="Complete address" error={e('address')}><Input placeholder="Shop no., street, locality, PIN" error={errors.address} {...register('address')} /></Field>
                <Field label="Business description" optional error={e('description')}><textarea rows={3} className="input" placeholder="What does your business do?" {...register('description')} /></Field>
              </>)}

              {step === 1 && (<>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Number of branches" error={e('branchCount')}><Input type="number" min={1} max={50} error={errors.branchCount} {...register('branchCount')} /></Field>
                  <Field label="Number of employees" error={e('employeeCount')}><Input type="number" min={1} placeholder="e.g. 42" error={errors.employeeCount} {...register('employeeCount')} /></Field>
                  <Field label="Expected monthly customers" optional error={e('monthlyCustomers')} hint="A rough estimate is fine."><Input inputMode="numeric" placeholder="e.g. 1200" error={errors.monthlyCustomers} {...register('monthlyCustomers')} /></Field>
                  <Field label="Expected monthly transactions" optional error={e('monthlyTransactions')}><Input inputMode="numeric" placeholder="e.g. 1500" error={errors.monthlyTransactions} {...register('monthlyTransactions')} /></Field>
                  <Field label="Opens at" error={e('openTime')}><Input type="time" error={errors.openTime} {...register('openTime')} /></Field>
                  <Field label="Closes at" error={e('closeTime')}><Input type="time" error={errors.closeTime} {...register('closeTime')} /></Field>
                  <Field label="Business opening date" error={e('openingDate')}><Input type="date" max={new Date().toISOString().slice(0, 10)} error={errors.openingDate} {...register('openingDate')} /></Field>
                </div>
                <Field label={`${cfg.labels.catalog} offered`} error={e('offerings')} hint="Separate with commas."><Input placeholder="Haircut, Facial, Bridal makeup, Spa" error={errors.offerings} {...register('offerings')} /></Field>
                <div>
                  <p className="label">Branch details</p>
                  <div className="space-y-3">
                    {fields.map((f, i) => (
                      <div key={f.id} className="grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-2">
                        <Field error={errors.branches?.[i]?.name?.message}><Input placeholder={`Branch ${i + 1} name`} aria-label={`Branch ${i + 1} name`} error={errors.branches?.[i]?.name} {...register(`branches.${i}.name`)} /></Field>
                        <Field error={errors.branches?.[i]?.city?.message}><Input placeholder="City" aria-label={`Branch ${i + 1} city`} error={errors.branches?.[i]?.city} {...register(`branches.${i}.city`)} /></Field>
                      </div>
                    ))}
                  </div>
                </div>
              </>)}

              {step === 2 && (<>
                <p className="rounded-xl bg-primary/5 px-3.5 py-2.5 text-sm text-muted">You’ll be the business <strong className="text-ink">Owner</strong>. Managers join later through an invitation from you.</p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Owner full name" error={e('ownerName')}><Input placeholder="Riya Sharma" autoComplete="name" error={errors.ownerName} {...register('ownerName')} /></Field>
                  <Field label="Phone number" error={e('ownerPhone')}><Input type="tel" placeholder="+91 98765 43210" error={errors.ownerPhone} {...register('ownerPhone')} /></Field>
                </div>
                <Field label="Owner email" error={e('ownerEmail')}>
                  <div className="flex gap-2">
                    <Input type="email" placeholder="owner@business.com" autoComplete="email" error={errors.ownerEmail} {...register('ownerEmail')} />
                    <button type="button" onClick={sendCode} disabled={verify.verified} className="btn-outline shrink-0">{verify.verified ? <><Check size={15} />Verified</> : verify.sent ? 'Resend' : 'Verify'}</button>
                  </div>
                </Field>
                {verify.sent && !verify.verified && (
                  <div className="rounded-xl border border-line p-4">
                    <p className="flex items-center gap-2 text-sm font-medium"><MailCheck size={16} className="text-primary" />Enter the 6-digit code</p>
                    <p className="mt-1 text-xs text-muted">Simulated: no email is sent. Use code <strong>{DEMO_CODE}</strong>.</p>
                    <div className="mt-3 flex gap-2">
                      <Input inputMode="numeric" maxLength={6} placeholder="123456" aria-label="Verification code" value={verify.code} onChange={(ev) => setVerify((v) => ({ ...v, code: ev.target.value.replace(/\D/g, ''), error: '' }))} />
                      <button type="button" onClick={checkCode} className="btn-primary shrink-0">Confirm</button>
                    </div>
                  </div>
                )}
                {verify.error && <p className="field-error" role="alert">{verify.error}</p>}
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Password" error={e('password')}><PasswordInput placeholder="Create a password" autoComplete="new-password" error={errors.password} {...register('password')} /></Field>
                  <Field label="Confirm password" error={e('confirmPassword')}><PasswordInput placeholder="Repeat password" autoComplete="new-password" error={errors.confirmPassword} {...register('confirmPassword')} /></Field>
                </div>
                {pw && (
                  <div aria-live="polite">
                    <div className="flex gap-1.5">{[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= strength.score ? strength.color : 'bg-line'}`} />)}</div>
                    <p className="mt-1.5 text-xs text-muted">Strength: <span className="font-medium text-ink">{strength.label}</span>. Use 8+ characters with upper and lower case, a number and a symbol.</p>
                  </div>
                )}
                <div>
                  <label className="flex items-start gap-2.5 text-sm text-muted"><input type="checkbox" className="mt-0.5 h-4 w-4 rounded accent-primary" {...register('terms')} />I accept the Terms of Service and Privacy Policy.</label>
                  {e('terms') && <p className="field-error">{e('terms')}</p>}
                </div>
              </>)}

              {step === 3 && <Review values={getValues()} goTo={setStep} />}
            </motion.div>
          </AnimatePresence>

          {submitError && <p role="alert" className="mt-6 rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{submitError}</p>}

          <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
            {step > 0 ? <button type="button" onClick={back} className="btn-ghost"><ArrowLeft size={16} />Back</button> : <span />}
            {step < 3
              ? <button key="next" type="button" onClick={next} className="btn-primary">Continue<ArrowRight size={16} /></button>
              : <button key="submit" type="submit" disabled={isSubmitting} className="btn-primary">{isSubmitting ? <><Loader2 size={16} className="animate-spin" />Registering…</> : 'Register business'}</button>}
          </div>
        </form>
        <div className="mt-4"><SimulatedBadge>Simulated registration: details are saved in this browser only.</SimulatedBadge></div>
      </div>
    </div>
  )
}

function Review({ values: v, goTo }) {
  const sections = [
    { title: 'Business', step: 0, rows: [['Name', v.businessName], ['Type', `${typeLabel(v.businessType)} · ${v.category}`], ['Email', v.businessEmail], ['Phone', v.businessPhone], ['Location', `${v.city}, ${v.state}, ${v.country}`], ['Address', v.address], ['Website', v.website || '—']] },
    { title: 'Operations', step: 1, rows: [['Branches', `${v.branchCount} (${v.branches.map((b) => b.name).join(', ')})`], ['Employees', v.employeeCount], ['Hours', `${v.openTime} – ${v.closeTime}`], ['Opened', v.openingDate], ['Offerings', v.offerings], ['Monthly customers', v.monthlyCustomers || '—'], ['Monthly transactions', v.monthlyTransactions || '—']] },
    { title: 'Owner', step: 2, rows: [['Name', v.ownerName], ['Email', `${v.ownerEmail} (verified)`], ['Phone', v.ownerPhone], ['Password', '••••••••'], ['Role', 'Owner']] },
  ]
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">Check everything below, then register.</p>
      {sections.map((s) => (
        <section key={s.title} className="rounded-xl border border-line">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">{s.title}</h2>
            <button type="button" onClick={() => goTo(s.step)} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Pencil size={12} />Edit</button>
          </div>
          <dl className="divide-y divide-line text-sm">
            {s.rows.map(([k, val]) => <div key={k} className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-muted">{k}</dt><dd className="break-words text-right font-medium">{val}</dd></div>)}
          </dl>
        </section>
      ))}
    </div>
  )
}
