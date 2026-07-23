import { useState } from "react";

type Props = {
  symbol: string;
  logo?: string | null;
  size?: number;
};

/**
 * Token avatar: renders the real on-chain/explorer logo when available,
 * falling back to a monospace ticker chip. The fallback is also used if the
 * remote image fails to load.
 */
export function TokenIcon({ symbol, logo, size = 36 }: Props) {
  const [broken, setBroken] = useState(false);
  const dimension = { width: size, height: size };

  if (logo && !broken) {
    return (
      <img
        src={logo}
        alt={symbol}
        style={dimension}
        onError={() => setBroken(true)}
        className="shrink-0 rounded-full border border-border bg-[#15171C] object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div
      style={dimension}
      className="flex shrink-0 items-center justify-center rounded-full border border-border bg-[#15171C] font-mono text-[10px] font-bold uppercase text-primary"
    >
      {symbol.substring(0, 3)}
    </div>
  );
}
