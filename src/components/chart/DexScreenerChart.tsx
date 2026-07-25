interface Props {
  poolAddress: string;
}

export function DexScreenerChart({ poolAddress }: Props) {
  return (
    <div className="surface-panel overflow-hidden rounded-xl border border-border">
      <iframe
        // Keyed on the pool so switching tokens swaps the embed instead of
        // leaving the previous chart mounted with a stale src.
        key={poolAddress}
        src={`https://dexscreener.com/robinhood/${poolAddress}?embed=1&theme=dark&info=0`}
        title="DexScreener price chart"
        className="h-[540px] w-full border-0"
        // The embed loads its own charting bundle; defer it until it's near
        // the viewport so it doesn't compete with the page's first paint.
        loading="lazy"
        referrerPolicy="no-referrer"
        allowFullScreen
      />
    </div>
  );
}
