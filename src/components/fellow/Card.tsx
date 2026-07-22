import type { ReactNode } from "react";

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex flex-col border border-border bg-card ${className}`}>
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
        {action}
      </header>
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  delta,
  positive,
}: {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-xl font-semibold tracking-tight text-foreground">
        {value}
      </span>
      {delta && (
        <span
          className={`font-mono text-[11px] ${
            positive ? "text-primary" : "text-[#ef4444]"
          }`}
        >
          {positive ? "▲" : "▼"} {delta}
        </span>
      )}
    </div>
  );
}