export function ChartLoading() {
  return (
    <div className="surface-panel flex h-[420px] items-center justify-center rounded-xl border border-border">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />

        <p className="text-sm text-muted-foreground">Loading chart...</p>
      </div>
    </div>
  );
}
