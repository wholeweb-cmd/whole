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
      className={`mt-5 w-full rounded-lg py-4 font-mono text-sm font-semibold uppercase tracking-wide transition ${
        disabled || loading
          ? "cursor-not-allowed bg-muted text-muted-foreground"
          : "glow-primary glow-primary-hover bg-primary text-primary-foreground hover:opacity-95"
      }`}
    >
      {loading ? "Processing…" : label}
    </button>
  );
}
