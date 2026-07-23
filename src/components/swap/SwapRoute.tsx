interface Props {
  fromToken: string;
  toToken: string;
}

export function SwapRoute({ fromToken, toToken }: Props) {
  return (
    <div className="mt-3 border border-border bg-background p-4 font-mono">
      <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Route</div>
      <div className="flex items-center gap-2 text-sm">
        <div className="border border-border px-3 py-1">{fromToken}</div>
        <span className="text-primary">→</span>
        <div className="border border-border px-3 py-1">{toToken}</div>
      </div>
    </div>
  );
}
