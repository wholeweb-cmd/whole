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
    <section
      className={`surface-panel flex flex-col overflow-hidden rounded-xl border border-border ${className}`}
    >
      <header className="surface-head flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-primary/70">▍</span>
          <h3 className="truncate font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2.5">
          {action}
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="h-2 w-2 rounded-full bg-primary/70" />
            <span className="h-2 w-2 rounded-full bg-border-strong" />
            <span className="h-2 w-2 rounded-full bg-border-strong" />
          </span>
        </div>
      </header>
      <div className="flex-1 p-5">{children}</div>
    </section>
  );
}

/**
 * Compact metric tile, for dense stat grids where `Stat`'s display type would
 * be too loud.
 */
export function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="surface-tile flex flex-col gap-1.5 rounded-lg border border-border bg-background/40 p-4 transition-colors hover:border-border-strong">
      <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span
        className={`truncate font-mono text-lg font-semibold tracking-tight ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </span>
      {hint && <span className="font-mono text-[10px] text-muted-foreground">{hint}</span>}
    </div>
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
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </span>
      {delta && (
        <span className={`font-mono text-[11px] ${positive ? "text-primary" : "text-destructive"}`}>
          {positive ? "▲" : "▼"} {delta}
        </span>
      )}
    </div>
  );
}
