interface Props {
  message: string;
}

export function ChartError({ message }: Props) {
  return (
    <div className="surface-panel flex h-[420px] items-center justify-center rounded-xl border border-red-500/20">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-red-400">Chart Error</h3>

        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
