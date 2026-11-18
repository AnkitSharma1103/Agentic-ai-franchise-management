import { useMemo, useState } from 'react'
import { Package, IndianRupee, AlertTriangle, PackageX, Plus, Download, Pencil, Trash2, PackagePlus, Sparkles } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { useAction, useBranchOptions } from '../../hooks/useAction'
import { inventoryService } from '../../services/inventoryService'
import { PageHeader, KpiCard, SearchBox, Select, StatusBadge, IconBtn, ErrorState } from '../../components/common/ui'
import DataTable from '../../components/common/DataTable'
import FormModal from '../../components/common/FormModal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { exportCsv } from '../../utils/csv'
import { inr, num } from '../../utils/format'

export default function Inventory() {
  const { data, loading, error, reload } = useAsync(inventoryService.list)
  const branches = useBranchOptions()
  const { run, busy } = useAction(reload)
  const [q, setQ] = useState(''), [branchId, setBranchId] = useState(''), [category, setCategory] = useState(''), [status, setStatus] = useState('')
  const [form, setForm] = useState(null), [stock, setStock] = useState(null), [del, setDel] = useState(null)

  const rows = data ?? []
  const filtered = useMemo(() => rows.filter((i) => (!branchId || i.branchId === branchId) && (!category || i.category === category) && (!status || i.status === status) && `${i.name} ${i.sku}`.toLowerCase().includes(q.toLowerCase())), [rows, q, branchId, category, status])
  if (error) return <ErrorState message={error} onRetry={reload} />

  const low = rows.filter((i) => i.status === 'Low stock'), out = rows.filter((i) => i.status === 'Out of stock')
  const urgent = [...out, ...low].slice(0, 4)
  const bopts = (branches.data ?? []).map((b) => ({ value: b.id, label: b.name })), multi = bopts.length > 1
  const fields = [
    { name: 'branchId', label: 'Branch', type: 'select', options: bopts }, { name: 'name', label: 'Product name', placeholder: 'Keratin Hair Mask 500ml' },
    { name: 'category', label: 'Category', placeholder: 'Hair Care' }, { name: 'sku', label: 'SKU', optional: true, placeholder: 'Auto-generated if empty' },
    { name: 'quantity', label: 'Quantity', type: 'number', int: true }, { name: 'reorderLevel', label: 'Reorder level', type: 'number', int: true, hint: 'Low-stock alert at or below this.' },
    { name: 'unitPrice', label: 'Unit price (₹)', type: 'number' },
  ]
  const cols = [
    { key: 'name', label: 'Product', sortable: true, render: (i) => <div><p className="font-semibold">{i.name}</p><p className="font-mono text-xs text-muted">{i.sku}</p></div> },
    { key: 'category', label: 'Category', sortable: true }, { key: 'branchName', label: 'Branch', sortable: true },
    { key: 'quantity', label: 'Quantity', sortable: true, render: (i) => <span className={i.quantity === 0 ? 'font-semibold text-danger' : ''}>{num(i.quantity)}</span> },
    { key: 'reorderLevel', label: 'Reorder level', sortable: true }, { key: 'unitPrice', label: 'Unit price', sortable: true, render: (i) => inr(i.unitPrice) },
    { key: 'status', label: 'Status', sortable: true, render: (i) => <StatusBadge status={i.status} /> },
    { key: 'a', label: 'Actions', render: (i) => <div className="flex"><IconBtn icon={PackagePlus} label={`Update stock for ${i.name}`} onClick={() => setStock(i)} /><IconBtn icon={Pencil} label={`Edit ${i.name}`} onClick={() => setForm({ edit: i })} /><IconBtn icon={Trash2} danger label={`Delete ${i.name}`} onClick={() => setDel(i)} /></div> },
  ]
  const csvCols = [['name', 'Product'], ['sku', 'SKU'], ['category', 'Category'], ['branchName', 'Branch'], ['quantity', 'Quantity'], ['reorderLevel', 'Reorder Level'], ['unitPrice', 'Unit Price (INR)'], ['status', 'Status']].map(([key, label]) => ({ key, label }))

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader title="Inventory" text="Stock levels, reorder alerts and product values.">
        <button className="btn-outline" disabled={!filtered.length} onClick={() => exportCsv('inventory.csv', csvCols, filtered)}><Download size={16} />Export CSV</button>
        <button className="btn-primary" disabled={!branches.data} onClick={() => setForm({})}><Plus size={16} />Add product</button>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Package} label="Total products" value={num(rows.length)} /><KpiCard icon={IndianRupee} label="Total stock value" value={inr(rows.reduce((t, i) => t + i.value, 0))} tone="success" />
        <KpiCard icon={AlertTriangle} label="Low stock" value={low.length} tone="warning" /><KpiCard icon={PackageX} label="Out of stock" value={out.length} tone="info" />
      </div>
      {urgent.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5"><h2 className="flex items-center gap-2 font-semibold"><AlertTriangle size={17} className="text-warning" />Low-stock alerts</h2>
            <ul className="mt-3 space-y-2 text-sm">{urgent.map((i) => <li key={i.id} className="flex justify-between gap-3"><span>{i.name} <span className="text-muted">· {i.branchName}</span></span><span className={i.quantity === 0 ? 'font-semibold text-danger' : 'text-[#B45309]'}>{i.quantity === 0 ? 'Out of stock' : `${i.quantity} left`}</span></li>)}</ul></div>
          <div className="rounded-2xl bg-primary/10 p-5"><p className="flex items-center gap-2 font-semibold text-primary"><Sparkles size={18} />AI recommendations <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-muted">simulated</span></p>
            <ul className="mt-3 space-y-2 text-sm">{urgent.map((i) => { const n = Math.max(i.reorderLevel * 2 - i.quantity, i.reorderLevel); return <li key={i.id}>Reorder {n} × {i.name} for {i.branchName} (about {inr(n * i.unitPrice)}).</li> })}</ul></div>
        </div>)}
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search product or SKU" />
        {multi && <Select label="Branch filter" value={branchId} onChange={setBranchId} all="All branches" options={bopts} />}
        <Select label="Category filter" value={category} onChange={setCategory} all="All categories" options={[...new Set(rows.map((i) => i.category))].sort()} />
        <Select label="Status filter" value={status} onChange={setStatus} all="All statuses" options={['In stock', 'Low stock', 'Out of stock']} />
        {(q || branchId || category || status) && <button className="btn-ghost" onClick={() => { setQ(''); setBranchId(''); setCategory(''); setStatus('') }}>Clear</button>}
      </div>
      <DataTable columns={cols} rows={filtered} loading={loading} minWidth={950} icon={Package} emptyTitle="No products match" emptyText="Adjust the filters or add a product." initialSort={{ key: 'status', dir: 'desc' }} />

      {form && <FormModal title={form.edit ? 'Edit product' : 'Add product'} fields={fields} submitLabel={form.edit ? 'Save changes' : 'Add product'} onClose={() => setForm(null)}
        defaults={form.edit ? { branchId: form.edit.branchId, name: form.edit.name, category: form.edit.category, sku: form.edit.sku, quantity: form.edit.quantity, reorderLevel: form.edit.reorderLevel, unitPrice: form.edit.unitPrice } : { branchId: bopts.length === 1 ? bopts[0].value : '', name: '', category: '', sku: '', quantity: '', reorderLevel: 20, unitPrice: '' }}
        onSubmit={async (v) => { const ok = await run(() => (form.edit ? inventoryService.update(form.edit.id, v) : inventoryService.create(v)), form.edit ? 'Product updated' : 'Product added'); if (ok) setForm(null) }} />}
      {stock && <FormModal title={`Update stock: ${stock.name}`} size="max-w-md" fields={[{ name: 'quantity', label: 'New quantity', type: 'number', int: true, span: 2, hint: `Currently ${stock.quantity} at ${stock.branchName}. Reorder level is ${stock.reorderLevel}.` }]} defaults={{ quantity: stock.quantity }} submitLabel="Update stock" onClose={() => setStock(null)}
        onSubmit={async (v) => { const ok = await run(() => inventoryService.update(stock.id, { quantity: v.quantity }), 'Stock updated'); if (ok) setStock(null) }} />}
      <ConfirmDialog open={!!del} danger busy={busy} title={`Delete ${del?.name}?`} confirmLabel="Delete" onClose={() => setDel(null)} text="This removes the product from this branch’s inventory."
        onConfirm={async () => { const i = del; setDel(null); await run(() => inventoryService.remove(i.id), 'Product deleted') }} />
    </div>
  )
}
