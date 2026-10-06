import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface DialogProps {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  dismissible?: boolean;
}

export default function Dialog({ title, eyebrow, children, onClose, className = '', dismissible = true }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const element = ref.current;
    const previousFocus = document.activeElement;
    element?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) closeRef.current();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && dismissible) closeRef.current();
      }}
    >
      <motion.div className="dialog-inner" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {dismissible && <button className="icon-button dialog-close" onClick={onClose} aria-label="Fermer"><X size={20} /></button>}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id="dialog-title">{title}</h2>
        {children}
      </motion.div>
    </dialog>
  );
}