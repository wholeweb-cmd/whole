import { useState } from "react";

type Props = {
  symbol: string;
  name?: string | null;
  logo?: string | null;
  size?: number;
};

const KNOWN_TOKEN_LOGOS: Record<string, string> = {
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  WETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  USDG: "https://cryptologo.org/icons/svg/cryptocurrency/stablecoin/global-dollar.svg",
};

function stockLogo(symbol: string, name?: string | null) {
  if (!name || !/robinhood token/i.test(name)) return null;
  const ticker = symbol.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker)) return null;
  return `https://financialmodelingprep.com/image-stock/${encodeURIComponent(ticker)}.png`;
}

/**
 * Token avatar with a resilient source chain:
 * 1. on-chain/explorer artwork,
 * 2. known token artwork,
 * 3. underlying-company artwork for Robinhood stock tokens,
 * 4. a ticker chip only when every real source is unavailable.
 */
export function TokenIcon({ symbol, name, logo, size = 36 }: Props) {
  const [failedLogos, setFailedLogos] = useState<string[]>([]);
  const dimension = { width: size, height: size };
  const knownLogo = KNOWN_TOKEN_LOGOS[symbol.trim().toUpperCase()] ?? null;
  const candidates = [
    ...new Set([logo, knownLogo, stockLogo(symbol, name)].filter(Boolean)),
  ] as string[];
  const activeLogo = candidates.find((candidate) => !failedLogos.includes(candidate));

  if (activeLogo) {
    return (
      <img
        src={activeLogo}
        alt={`${name ?? symbol} logo`}
        style={dimension}
        onError={() =>
          setFailedLogos((failed) =>
            failed.includes(activeLogo) ? failed : [...failed, activeLogo],
          )
        }
        className="shrink-0 rounded-full border border-border bg-white object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      style={dimension}
      className="flex shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised font-mono text-[10px] font-bold uppercase text-primary"
    >
      {symbol.substring(0, 3)}
    </div>
  );
}
