import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

// Memakai elemen dialog bawaan: fokus terkunci di dalam dan Escape menutup.
export default function Modal({ open, title, onClose, children, footer, wide = false, labelId = 'dlg-title' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  if (!open) return null;
  return (
    <dialog
      ref={ref}
      className={`dialog${wide ? ' wide' : ''}`}
      aria-labelledby={labelId}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      <div className="dialog-head">
        <h2 id={labelId}>{title}</h2>
        <button type="button" className="btn ghost icon-btn" onClick={onClose} aria-label="Tutup dialog">
          <Icon name="tutup" />
        </button>
      </div>
      <div className="dialog-body">{children}</div>
      {footer && <div className="dialog-foot">{footer}</div>}
    </dialog>
  );
}

export function ConfirmDialog({ open, title, children, confirmLabel = 'Hapus', busy, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      labelId="confirm-title"
      footer={(
        <>
          <button type="button" className="btn ghost" onClick={onClose}>Batal</button>
          <button type="button" className="btn danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Memproses' : confirmLabel}
          </button>
        </>
      )}
    >
      <p>{children}</p>
    </Modal>
  );
}
