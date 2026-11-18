import Modal from './Modal'
export default function ConfirmDialog({ open, title, text, confirmLabel = 'Confirm', danger, busy, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="max-w-md"
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button disabled={busy} onClick={onConfirm} className={danger ? 'btn bg-danger text-white hover:bg-red-600' : 'btn-primary'}>{confirmLabel}</button></>}>
      <p className="text-sm text-muted">{text}</p>
    </Modal>
  )
}
