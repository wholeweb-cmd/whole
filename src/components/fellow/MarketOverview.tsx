import { Card, Stat } from "./Card";

const trending = [
  { pair: "ETH / USDG", apr: "24.8%", tvl: "$18.2M" },
  { pair: "BTC / USDG", apr: "19.2%", tvl: "$12.7M" },
  { pair: "SOL / USDG", apr: "31.4%", tvl: "$6.4M" },
  { pair: "RHC / ETH", apr: "42.1%", tvl: "$4.1M" },
];

export function MarketOverview() {
  return (
    <Card title="Market Overview">
      <div className="grid grid-cols-3 gap-6">
        <Stat label="Network TVL" value="$1.24B" delta="0.82%" positive />
        <Stat label="24H Volume" value="$318.4M" delta="4.12%" positive />
        <Stat label="Top APR" value="42.1%" />
      </div>
      <div className="mt-6 border-t border-border pt-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Trending Pools
        </p>
        <div className="divide-y divide-border">
          {trending.map((t) => (
            <div key={t.pair} className="flex items-center justify-between py-2.5">
              <span className="text-xs font-medium text-foreground">{t.pair}</span>
              <div className="flex items-center gap-6 font-mono text-xs">
                <span className="text-muted-foreground">{t.tvl}</span>
                <span className="w-14 text-right text-primary">{t.apr}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}