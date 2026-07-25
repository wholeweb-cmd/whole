import { useMarkets } from "@/hooks/useMarkets";
import { useBlockNumber } from "@/hooks/useBlockNumber";
import { useGasPrice } from "@/hooks/useGasPrice";
import { formatUSD } from "@/lib/format";
import { Card, StatTile } from "./Card";

export function ProtocolOverview() {
  const { data: markets, isLoading } = useMarkets();
  const block = useBlockNumber();
  const gas = useGasPrice();

  const rows = markets ?? [];
  const loading = isLoading && rows.length === 0;

  const volume24h = rows.reduce((sum, m) => sum + (m.volume24h ?? 0), 0);
  const tvl = rows.reduce((sum, m) => sum + (m.tvl ?? 0), 0);
  const pools = new Set(rows.map((m) => m.poolAddress).filter(Boolean)).size;

  const pending = "…";

  return (
    <Card
      title="Protocol Overview"
      action={
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Robinhood Chain
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Total Markets" value={loading ? pending : rows.length.toLocaleString()} />

        <StatTile label="Liquidity Pools" value={loading ? pending : pools.toLocaleString()} />

        <StatTile label="24H Volume" value={loading ? pending : formatUSD(volume24h)} accent />

        {/* No indexer on this chain exposes wallet counts, so total pooled
            liquidity stands in as the protocol-wide size metric. */}
        <StatTile label="Total Liquidity" value={loading ? pending : formatUSD(tvl)} />

        <StatTile label="Latest Block" value={block === "0" ? pending : `#${block}`} />

        <StatTile label="Current Gas" value={gas} hint="gwei" />
      </div>
    </Card>
  );
}
