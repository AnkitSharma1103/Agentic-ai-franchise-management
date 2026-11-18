import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import Modal from './Modal'
import { Field, Input } from './Field'

const PHONE = /^[+\d][\d\s-]{8,14}$/
function buildSchema(fields) {
  const shape = {}
  for (const f of fields) {
    let s
    if (f.type === 'number') { s = z.coerce.number({ invalid_type_error: 'Enter a number' }).min(f.min ?? 0, `Minimum is ${f.min ?? 0}`); if (f.max != null) s = s.max(f.max, `Maximum is ${f.max}`); if (f.int) s = s.int('Whole numbers only') }
    else if (f.type === 'email') s = z.string().email('Enter a valid email')
    else if (f.type === 'tel') s = z.string().regex(PHONE, 'Enter a valid phone number')
    else if (f.type === 'date' || f.type === 'time') s = z.string().min(1, `Select ${f.label.toLowerCase()}`)
    else if (f.type === 'select') s = z.string().min(1, `Select ${f.label.toLowerCase()}`)
    else s = z.string().trim().min(f.min ?? 2, `Enter ${f.label.toLowerCase()}`)
    shape[f.name] = f.optional ? z.union([z.literal(''), s]).optional() : s
  }
  return z.object(shape)
}
const opts = (f, values) => (typeof f.options === 'function' ? f.options(values) : f.options ?? [])

// fields: [{ name, label, type, options: [{value,label}] | (values)=>[...], optional, placeholder, hint, span, disabled, onPick(value, values) => patch }]
export default function FormModal({ title, fields, defaults, onSubmit, onClose, submitLabel = 'Save', size = 'max-w-xl', children }) {
  const schema = useMemo(() => buildSchema(fields), [fields])
  const [serverErr, setServerErr] = useState('')
  const { register, handleSubmit, watch, setValue, getValues, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: defaults })
  const values = watch()

  // Clear a dependent select when its current value is no longer offered (e.g. branch changed).
  useEffect(() => {
    for (const f of fields) if (f.type === 'select' && typeof f.options === 'function') {
      const cur = getValues(f.name), list = opts(f, getValues())
      if (cur && !list.some((o) => o.value === cur)) setValue(f.name, '')
    }
  }, [JSON.stringify(values)]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = handleSubmit(async (v) => {
    setServerErr('')
    const clean = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x === '' ? undefined : x]))
    const err = await onSubmit(clean)
    if (err) setServerErr(err)
  })
  return (
    <Modal open onClose={onClose} title={title} size={size}
      footer={<><button type="button" className="btn-outline" onClick={onClose}>Cancel</button><button form="record-form" disabled={isSubmitting} className="btn-primary">{isSubmitting ? <><Loader2 size={15} className="animate-spin" />Saving…</> : submitLabel}</button></>}>
      <form id="record-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const err = errors[f.name]?.message, list = f.type === 'select' ? opts(f, values) : null
          const reg = register(f.name, f.onPick ? { onChange: (e) => { const patch = f.onPick(e.target.value, getValues()); Object.entries(patch ?? {}).forEach(([k, v]) => setValue(k, v, { shouldValidate: true })) } } : undefined)
          return (
            <div key={f.name} className={f.span === 2 ? 'sm:col-span-2' : ''}>
              <Field label={f.label} optional={f.optional} error={err} hint={f.hint}>
                {f.type === 'select'
                  ? <select className={`input ${err ? 'input-error' : ''}`} disabled={f.disabled} {...reg}><option value="">{f.placeholder ?? `Select ${f.label.toLowerCase()}`}</option>{list.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                  : f.type === 'textarea' ? <textarea rows={3} className="input" {...reg} />
                  : <Input type={f.type ?? 'text'} step={f.type === 'number' ? 'any' : undefined} placeholder={f.placeholder} disabled={f.disabled} error={err} {...reg} />}
              </Field>
            </div>
          )
        })}
        {children && <div className="sm:col-span-2">{children}</div>}
        {serverErr && <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger sm:col-span-2">{serverErr}</p>}
      </form>
    </Modal>
  )
}
