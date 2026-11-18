import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function Field({ label, error, hint, children, optional }) {
  return (
    <div>
      {label && <label className="label">{label}{optional && <span className="ml-1 font-normal text-muted">(optional)</span>}</label>}
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  )
}

export const Input = forwardRef(function Input({ error, className = '', ...p }, ref) {
  return <input ref={ref} className={`input ${error ? 'input-error' : ''} ${className}`} aria-invalid={!!error} {...p} />
})

export const PasswordInput = forwardRef(function PasswordInput({ error, ...p }, ref) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input ref={ref} type={show ? 'text' : 'password'} error={error} className="pr-11" {...p} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
})
