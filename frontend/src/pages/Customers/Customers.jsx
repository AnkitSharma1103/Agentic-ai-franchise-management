import { useMemo, useState } from 'react'
import { Users, UserPlus, Repeat, Percent, Plus, Download, Pencil, Trash2, Eye, Sparkles } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { useAction, useBranchOptions } from '../../hooks/useAction'
import { customerService } from '../../services/customerService'
import { PageHeader, KpiCard, SearchBox, Select, StatusBadge, IconBtn, ErrorState, Skeleton, EmptyState } from '../../components/common/ui'
import DataTable from '../../components/common/DataTable'
import FormModal from '../../components/common/FormModal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Modal from '../../components/common/Modal'
import { exportCsv } from '../../utils/csv'
import { inr, num, fmtDate, fmtTime } from '../../utils/format'

const SEGMENTS = ['High-value', 'Regular', 'Occasional', 'At-risk']
const SEG_NOTE = { 'High-value': 'Spend ₹25,000+', Regular: '5+ visits', Occasional: 'Few visits', 'At-risk': 'No visit in 60+ days' }
const DAY = 86400000

export default function Customers() {
  const { data, loading, error, reload } = useAsync(customerService.list)
  const branches = useBranchOptions()
  const { run, busy } = useAction(reload)
  const [q, setQ] = useState(''), [branchId, setBranchId] = useState(''), [segment, setSegment] = useState('')
  const [form, setForm] = useState(null), [del, setDel] = useState(null), [profile, setProfile] = useState(null)

  const rows = data ?? []
  const filtered = useMemo(() => rows.filter((c) => (!branchId || c.branchId === branchId) && (!segment || c.segment === segment) && `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(q.toLowerCase())), [rows, q, branchId, segment])
  if (error) return <ErrorState message={error} onRetry={reload} />

  const total = rows.length, fresh = rows.filter((c) => Date.now() - new Date(c.joinedOn) <= 30 * DAY).length, returning = rows.filter((c) => c.visits >= 2).length
  const count = (s) => rows.filter((c) => c.segment === s).length
  const risk = rows.filter((c) => c.segment === 'At-risk'), hv = rows.filter((c) => c.segment === 'High-value')
  const totalSpend = rows.reduce((t, c) => t + c.totalSpend, 0) || 1, hvShare = Math.round((hv.reduce((t, c) => t + c.totalSpend, 0) / totalSpend) * 100)
  const multi = (branches.data?.length ?? 0) > 1
  const bopts = (branches.data ?? []).map((b) => ({ value: b.id, label: b.name }))

  const fields = [
    { name: 'branchId', label: 'Branch', type: 'select', options: bopts }, { name: 'name', label: 'Full name', placeholder: 'Priya Sharma' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 98765 43210' }, { name: 'email', label: 'Email', type: 'email', optional: true, placeholder: 'priya@example.com' },
  ]
  const cols = [
    { key: 'name', label: 'Customer', sortable: true, render: (c) => <div><p className="font-semibold">{c.name}</p><p className="text-xs text-muted">{c.phone}</p></div> },
    { key: 'branchName', label: 'Branch', sortable: true }, { key: 'segment', label: 'Segment', sortable: true, render: (c) => <StatusBadge status={c.segment} /> },
    { key: 'visits', label: 'Visits', sortable: true }, { key: 'totalSpend', label: 'Total spent', sortable: true, render: (c) => <span className="font-medium">{inr(c.totalSpend)}</span> },
    { key: 'lastVisit', label: 'Last visit', sortable: true, value: (c) => c.lastVisit ?? '', render: (c) => fmtDate(c.lastVisit) },
    { key: 'a', label: 'Actions', render: (c) => <div className="flex"><IconBtn icon={Eye} label={`View ${c.name}`} onClick={() => setProfile(c)} /><IconBtn icon={Pencil} label={`Edit ${c.name}`} onClick={() => setForm({ edit: c })} /><IconBtn icon={Trash2} danger label={`Delete ${c.name}`} onClick={() => setDel(c)} /></div> },
  ]
  const csvCols = [['name', 'Name'], ['phone', 'Phone'], ['email', 'Email'], ['branchName', 'Branch'], ['segment', 'Segment'], ['visits', 'Visits'], ['totalSpend', 'Total Spent (INR)'], ['lastVisit', 'Last Visit', (c) => c.lastVisit?.slice(0, 10) ?? '']].map(([key, label, csv]) => ({ key, label, csv }))

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader title="Customers" text="Profiles, spending and retention.">
        <button className="btn-outline" disabled={!filtered.length} onClick={() => exportCsv('customers.csv', csvCols, filtered)}><Download size={16} />Export CSV</button>
        <button className="btn-primary" disabled={!branches.data} onClick={() => setForm({})}><Plus size={16} />Add customer</button>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} label="Total customers" value={num(total)} /><KpiCard icon={UserPlus} label="New (last 30 days)" value={num(fresh)} tone="success" />
        <KpiCard icon={Repeat} label="Returning" value={num(returning)} tone="info" /><KpiCard icon={Percent} label="Retention rate" value={`${total ? Math.round((returning / total) * 100) : 0}%`} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <div className="card p-5"><h2 className="font-semibold">Segments</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">{SEGMENTS.map((s) => (
            <button key={s} onClick={() => setSegment(segment === s ? '' : s)} aria-pressed={segment === s} className={`rounded-xl border p-3 text-left transition-colors ${segment === s ? 'border-primary bg-primary/5' : 'border-line hover:border-secondary'}`}>
              <p className="text-2xl font-bold">{count(s)}</p><p className="text-sm font-medium">{s}</p><p className="text-xs text-muted">{SEG_NOTE[s]}</p></button>))}</div></div>
        <div className="rounded-2xl bg-primary/10 p-5"><p className="flex items-center gap-2 font-semibold text-primary"><Sparkles size={18} />AI insights <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-muted">simulated</span></p>
          {loading && !data ? <Skeleton className="mt-4 h-24" /> : (
          <ul className="mt-3 space-y-2.5 text-sm">
            <li>{risk.length} customers haven’t visited in over 60 days, with {inr(risk.reduce((t, c) => t + c.totalSpend, 0))} in lifetime spend. A win-back offer this week is worth trying.</li>
            <li>High-value customers ({hv.length}) bring in {hvShare}% of customer revenue. Offer them priority booking.</li>
            <li>{total ? Math.round((returning / total) * 100) : 0}% of customers have visited more than once. Follow up new customers within a week of their first visit to lift this.</li>
          </ul>)}</div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, phone or email" />
        {multi && <Select label="Branch filter" value={branchId} onChange={setBranchId} all="All branches" options={bopts} />}
        <Select label="Segment filter" value={segment} onChange={setSegment} all="All segments" options={SEGMENTS} />
        {(q || branchId || segment) && <button className="btn-ghost" onClick={() => { setQ(''); setBranchId(''); setSegment('') }}>Clear</button>}
      </div>
      <DataTable columns={cols} rows={filtered} loading={loading} icon={Users} emptyTitle="No customers match" emptyText="Adjust the filters or add a customer." initialSort={{ key: 'totalSpend', dir: 'desc' }} />

      {form && <FormModal title={form.edit ? 'Edit customer' : 'Add customer'} fields={fields} submitLabel={form.edit ? 'Save changes' : 'Add customer'} onClose={() => setForm(null)}
        defaults={form.edit ? { branchId: form.edit.branchId, name: form.edit.name, phone: form.edit.phone, email: form.edit.email } : { branchId: branches.data?.length === 1 ? branches.data[0].id : '', name: '', phone: '', email: '' }}
        onSubmit={async (v) => { const body = { ...v, email: v.email ?? '' }; const ok = await run(() => (form.edit ? customerService.update(form.edit.id, body) : customerService.create(body)), form.edit ? 'Customer updated' : 'Customer added'); if (ok) setForm(null) }} />}
      <ConfirmDialog open={!!del} danger busy={busy} title={`Delete ${del?.name}?`} confirmLabel="Delete" onClose={() => setDel(null)} text="Their purchase history stays in sales reports as a deleted customer. Customers with scheduled appointments can’t be deleted."
        onConfirm={async () => { const c = del; setDel(null); await run(() => customerService.remove(c.id), `${c.name} deleted`) }} />
      {profile && <Profile c={profile} onClose={() => setProfile(null)} onEdit={() => { setForm({ edit: profile }); setProfile(null) }} />}
    </div>
  )
}

function Profile({ c, onClose, onEdit }) {
  const { data: h, loading } = useAsync(() => customerService.history(c.id), [c.id])
  const upcoming = (h?.appointments ?? []).filter((a) => a.status === 'Scheduled')
  return (
    <Modal open onClose={onClose} title={c.name} size="max-w-2xl" footer={<><button className="btn-outline" onClick={onClose}>Close</button><button className="btn-primary" onClick={onEdit}><Pencil size={15} />Edit</button></>}>
      <div className="space-y-5 text-sm">
        <div className="flex flex-wrap items-center gap-2"><StatusBadge status={c.segment} /><span className="text-muted">{c.branchName} · {c.phone}{c.email && ` · ${c.email}`}</span></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Total spent', inr(c.totalSpend)], ['Visits', c.visits], ['Visits / month', c.visitsPerMonth], ['Last visit', fmtDate(c.lastVisit)]].map(([k, v]) => <div key={k} className="rounded-xl bg-canvas p-3"><p className="text-xs text-muted">{k}</p><p className="mt-0.5 font-semibold">{v}</p></div>)}</div>
        {upcoming.length > 0 && <div><p className="mb-2 font-semibold">Upcoming</p>{upcoming.map((a) => <p key={a.id} className="text-muted">{a.service} on {fmtDate(a.date)}, {fmtTime(a.time)} with {a.employeeName}</p>)}</div>}
        <div><p className="mb-2 font-semibold">Purchase history</p>
          {loading ? <Skeleton className="h-24" /> : !h.sales.length ? <EmptyState title="No purchases yet" /> : (
            <div className="max-h-64 overflow-auto rounded-xl border border-line"><table className="w-full min-w-[420px]"><tbody>{h.sales.map((s) => <tr key={s.id} className="border-b border-line last:border-0"><td className="px-3 py-2">{fmtDate(s.date)}</td><td className="px-3">{s.item}</td><td className="px-3 font-medium">{inr(s.amount)}</td><td className="px-3"><StatusBadge status={s.status} /></td></tr>)}</tbody></table></div>)}
        </div>
      </div>
    </Modal>
  )
}
