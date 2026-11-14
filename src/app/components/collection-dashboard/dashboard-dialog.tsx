'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './dashboard-panels.module.css';

export function DashboardDialog({
  title,
  eyebrow,
  subtitle,
  onClose,
  children,
  drawer = true,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  drawer?: boolean;
}) {
  const mounted = useRef(false);
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    mounted.current = true;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      mounted.current = false;
      if (dialog?.open) dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${drawer ? styles.drawer : styles.modal}`}
      aria-labelledby={id}
      onCancel={onClose}
      onClose={() => {
        if (mounted.current && !ref.current?.open) onClose();
      }}
    >
      <header className={styles.panelHeader}>
        <div>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h2 id={id}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          type="button"
          autoFocus
          className={styles.close}
          aria-label={`Close ${title}`}
          onClick={onClose}
        >
          ×
        </button>
      </header>
      {children}
    </dialog>
  );
}
