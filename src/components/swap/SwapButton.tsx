interface Props {
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  onClick?(): void;
}

export function SwapButton({ disabled = false, loading = false, label = "Swap", onClick }: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`mt-4 w-full py-3.5 font-mono text-sm font-semibold uppercase tracking-wide transition ${
        disabled || loading
          ? "cursor-not-allowed bg-muted text-muted-foreground"
          : "bg-primary text-black hover:opacity-90"
      }`}
    >
      {loading ? "Processing…" : label}
    </button>
  );
}
