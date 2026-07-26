import { CheckCircle2, LoaderCircle } from "lucide-react";

interface Props {
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  label?: string;
  onClick?(): void;
}

export function SwapButton({
  disabled = false,
  loading = false,
  success = false,
  label = "Swap",
  onClick,
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-4 font-mono text-sm font-semibold uppercase tracking-wide transition ${
        disabled || loading
          ? `cursor-not-allowed bg-muted text-muted-foreground ${loading ? "transaction-pulse" : ""}`
          : "glow-primary glow-primary-hover bg-primary text-primary-foreground hover:opacity-95"
      }`}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {success && !loading && <CheckCircle2 className="success-pop h-4 w-4" />}
      <span>{loading ? "Processing…" : label}</span>
    </button>
  );
}
