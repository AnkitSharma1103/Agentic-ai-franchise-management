import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { UserPlus, Pencil, PauseCircle, PlayCircle, Trash2, Link2, Copy, ExternalLink, Loader2, ShieldCheck } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { userService } from '../../services/userService'
import { errorMessage } from '../../services/apiClient'
import Modal from '../../components/common/Modal'
import { Field, Input } from '../../components/common/Field'
import { Skeleton, ErrorState, StatusBadge } from '../../components/common/ui'
import { PERMISSIONS, MANAGER_DEFAULT } from '../../config/permissions'
import { initials, ago } from '../../utils/format'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter the manager’s full name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^$|^[+\d][\d\s-]{8,14}$/, 'Enter a valid phone number').optional(),
})
const GRANTABLE = PERMISSIONS.filter((p) => p.key !== 'users.invite')
const linkFor = (t) => `${window.location.origin}/invite/${t}`

export default function UsersPage() {
  const { data, loading, error, reload } = useAsync(userService.list)
  const [form, setForm] = useState(null) // { mode: 'invite' | 'edit', user? }
  const [sent, setSent] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  if (error) return <ErrorState message={error} onRetry={reload} />
  const branchName = (id) => data.branches.find((b) => b.id === id)?.name ?? 'Unknown'

  const run = async (fn, okMsg) => {
    setBusy(true)
    try { await fn(); toast.success(okMsg); reload(); return true } catch (e) { toast.error(errorMessage(e)); return false } finally { setBusy(false) }
  }
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); toast.success('Invitation link copied') } catch { toast.error('Copy failed. Select the link and copy it manually.') } }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-2xl font-bold tracking-tight">Team & managers</h2><p className="text-sm text-muted">Invite managers and choose which branches and tools they can use.</p></div>
        <button onClick={() => setForm({ mode: 'invite' })} className="btn-primary" disabled={!data}><UserPlus size={16} />Add manager</button>
      </div>

      <div className="card overflow-hidden">
        {!data ? <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm">
            <thead><tr className="border-b border-line bg-canvas text-left text-muted">{['Name', 'Email', 'Role', 'Assigned branches', 'Status', 'Last login', 'Actions'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{data.users.map((u) => {
              const owner = u.role === 'OWNER', invited = u.status === 'Invited'
              return (
                <tr key={u.id} className={`border-b border-line last:border-0 ${loading ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3.5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(u.name)}</span><span className="font-semibold">{u.name}</span></div></td>
                  <td className="px-4">{u.email}</td>
                  <td className="px-4"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${owner ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>{owner ? 'Owner' : 'Manager'}</span></td>
                  <td className="px-4">{owner ? <span className="text-muted">All branches</span> : <div className="flex flex-wrap gap-1.5">{u.branchIds.map((id) => <span key={id} className="rounded-full border border-line px-2.5 py-0.5 text-xs">{branchName(id)}</span>)}</div>}</td>
                  <td className="px-4"><StatusBadge status={u.status} /></td>
                  <td className="px-4 text-muted">{invited ? 'Invitation pending' : ago(u.lastLogin)}</td>
                  <td className="px-4">
                    {owner ? <span className="text-xs text-muted">—</span> : (
                      <div className="flex gap-1">
                        {invited && <IconBtn label={`Copy invitation link for ${u.name}`} icon={Link2} onClick={() => copy(linkFor(u.inviteToken))} />}
                        <IconBtn label={`Edit ${u.name}`} icon={Pencil} onClick={() => setForm({ mode: 'edit', user: u })} />
                        {!invited && (u.status === 'Suspended'
                          ? <IconBtn label={`Reactivate ${u.name}`} icon={PlayCircle} onClick={() => run(() => userService.update(u.id, { status: 'Active' }), `${u.name} reactivated`)} />
                          : <IconBtn label={`Suspend ${u.name}`} icon={PauseCircle} onClick={() => run(() => userService.update(u.id, { status: 'Suspended' }), `${u.name} suspended`)} />)}
                        <IconBtn label={invited ? `Revoke invitation for ${u.name}` : `Remove ${u.name}`} icon={Trash2} danger onClick={() => setConfirm(u)} />
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}</tbody>
          </table></div>
        )}
      </div>

      {form && <ManagerForm key={form.user?.id ?? 'new'} mode={form.mode} user={form.user} branches={data.branches} onClose={() => setForm(null)}
        onSubmit={async (payload) => {
          try {
            if (form.mode === 'invite') { const inv = await userService.invite(payload); setForm(null); setSent(inv); reload() }
            else { await userService.update(form.user.id, payload); toast.success('Manager updated'); setForm(null); reload() }
          } catch (e) { return errorMessage(e) }
        }} />}

      <Modal open={!!sent} onClose={() => setSent(null)} title="Invitation created" footer={<button className="btn-primary" onClick={() => setSent(null)}>Done</button>}>
        {sent && (<div className="space-y-4 text-sm">
          <p>An invitation for <strong>{sent.name}</strong> ({sent.email}) is ready. In the live product this link is emailed automatically. Share it with them now:</p>
          <div className="break-all rounded-xl bg-canvas p-3 font-mono text-xs">{linkFor(sent.inviteToken)}</div>
          <div className="flex gap-2"><button className="btn-outline flex-1" onClick={() => copy(linkFor(sent.inviteToken))}><Copy size={15} />Copy link</button><a className="btn-outline flex-1" href={linkFor(sent.inviteToken)} target="_blank" rel="noreferrer"><ExternalLink size={15} />Open as manager</a></div>
          <p className="text-xs text-muted">Simulated: no email is sent.</p>
        </div>)}
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.status === 'Invited' ? 'Revoke invitation?' : 'Remove manager?'} size="max-w-md"
        footer={<><button className="btn-outline" onClick={() => setConfirm(null)}>Cancel</button><button disabled={busy} className="btn bg-danger text-white hover:bg-red-600" onClick={async () => { const u = confirm; setConfirm(null); await run(() => userService.remove(u.id), u.status === 'Invited' ? 'Invitation revoked' : `${u.name} removed`) }}>{confirm?.status === 'Invited' ? 'Revoke' : 'Remove'}</button></>}>
        <p className="text-sm text-muted">{confirm?.status === 'Invited' ? `The invitation link for ${confirm?.name} will stop working.` : `${confirm?.name} will lose access immediately and the branches they managed will have no manager.`}</p>
      </Modal>
    </div>
  )
}

const IconBtn = ({ icon: I, label, onClick, danger }) => <button onClick={onClick} title={label} aria-label={label} className={`rounded-lg p-2 hover:bg-canvas ${danger ? 'text-danger' : 'text-muted hover:text-ink'}`}><I size={17} /></button>

function ManagerForm({ mode, user, branches, onClose, onSubmit }) {
  const edit = mode === 'edit'
  const [branchIds, setBranchIds] = useState(user?.branchIds ?? [])
  const [perms, setPerms] = useState(user?.permissions ?? MANAGER_DEFAULT.filter((p) => p !== 'users.invite'))
  const [branchErr, setBranchErr] = useState(''), [serverErr, setServerErr] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' } })
  const toggle = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const submit = handleSubmit(async (v) => {
    if (!branchIds.length) { setBranchErr('Assign at least one branch'); return }
    setServerErr('')
    const err = await onSubmit({ name: v.name, email: v.email, phone: v.phone, branchIds, permissions: perms })
    if (err) setServerErr(err)
  }, () => { if (!branchIds.length) setBranchErr('Assign at least one branch') })
  return (
    <Modal open onClose={onClose} title={edit ? 'Edit manager' : 'Add manager'} size="max-w-xl"
      footer={<><button type="button" className="btn-outline" onClick={onClose}>Cancel</button><button form="manager-form" disabled={isSubmitting} className="btn-primary">{isSubmitting ? <><Loader2 size={15} className="animate-spin" />Saving…</> : edit ? 'Save changes' : 'Send invitation'}</button></>}>
      <form id="manager-form" onSubmit={submit} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name?.message}><Input placeholder="Aman Verma" error={errors.name} {...register('name')} /></Field>
          <Field label="Phone" optional error={errors.phone?.message}><Input type="tel" placeholder="+91 98765 43210" error={errors.phone} {...register('phone')} /></Field>
        </div>
        <Field label="Email" error={errors.email?.message} hint={edit ? 'Email can’t be changed after the invitation.' : undefined}><Input type="email" disabled={edit} placeholder="manager@business.com" error={errors.email} {...register('email')} /></Field>
        <fieldset><legend className="label">Assigned branches</legend>
          <div className="flex flex-wrap gap-2">{branches.map((b) => { const on = branchIds.includes(b.id); return <label key={b.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm ${on ? 'border-primary bg-primary/5 text-primary' : 'border-line'}`}><input type="checkbox" className="accent-primary" checked={on} onChange={() => { toggle(branchIds, setBranchIds, b.id); setBranchErr('') }} />{b.name}</label> })}</div>
          {branchErr && <p className="field-error" role="alert">{branchErr}</p>}
        </fieldset>
        <fieldset><legend className="label flex items-center gap-1.5"><ShieldCheck size={15} className="text-primary" />Permissions</legend>
          <div className="grid gap-2 sm:grid-cols-2">{GRANTABLE.map((p) => <label key={p.key} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" checked={perms.includes(p.key)} onChange={() => toggle(perms, setPerms, p.key)} />{p.label}</label>)}</div>
          <p className="mt-2 text-xs text-muted">Managers can’t invite or promote users, change owner settings, or see unassigned branches.</p>
        </fieldset>
        {serverErr && <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{serverErr}</p>}
      </form>
    </Modal>
  )
}
