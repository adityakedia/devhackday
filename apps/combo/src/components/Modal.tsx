import { useEffect, useRef, type ReactNode } from "react";

export function Modal({ children, className, label, onClose }: { children: ReactNode; className: string; label: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className={className} aria-label={label} onCancel={onClose} onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>{children}</dialog>;
}
