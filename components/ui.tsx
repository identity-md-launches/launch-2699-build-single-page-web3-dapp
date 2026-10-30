import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
export function Logo({ large = false }: { large?: boolean }) {
  return (
    <a
      href="#top"
      aria-label="PLEA home"
      className={`logo ${large ? "logo-large" : ""}`}
    >
      PLEA<span className="logo-dot">.</span>
    </a>
  );
}
export function SectionTitle({
  children,
  number,
  aside,
}: {
  children: ReactNode;
  number?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div className="flex items-center gap-3">
        {number && (
          <span className="section-number" aria-hidden="true">
            {number}
          </span>
        )}
        <h2>{children}</h2>
      </div>
      {aside}
    </div>
  );
}
export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <ArrowUpRight
      size={20}
      strokeWidth={2}
      className={diagonal ? "" : "arrow-right"}
      aria-hidden="true"
    />
  );
}
export function Stamp({
  kind,
  children,
}: {
  kind: string;
  children?: ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      key={kind}
      className={`stamp stamp-${kind.toLowerCase().replace(/!/g, "")}`}
      initial={reduced ? false : { scale: 1.6, rotate: -14, opacity: 0 }}
      animate={{
        scale: 1,
        rotate: -8,
        opacity: 1,
        x: reduced ? 0 : [0, -3, 3, 0],
      }}
      transition={{ duration: reduced ? 0 : 0.4, ease: "easeOut" }}
    >
      <strong>{kind}</strong>
      {children && <span>{children}</span>}
    </motion.div>
  );
}
export function CountUp({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / 650);
      setShown(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  return <>{shown}</>;
}
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
      onClose={onClose}
    >
      <div className="modal-body">
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function Typewriter({
  line = "Buying is open. Selling needs a plea.",
}: {
  line?: string;
}) {
  const [length, setLength] = useState(line.length);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      setLength(line.length);
      return;
    }
    setLength(0);
    const timer = setInterval(
      () =>
        setLength((v) => {
          if (v >= line.length) {
            clearInterval(timer);
            return v;
          }
          return v + 1;
        }),
      28,
    );
    return () => clearInterval(timer);
  }, [line, reduced]);
  return (
    <p className="typewriter">
      <span className="sr-only">{line}</span>
      <span aria-hidden="true">
        {line.slice(0, length)}
        <span className="cursor">▍</span>
      </span>
    </p>
  );
}
