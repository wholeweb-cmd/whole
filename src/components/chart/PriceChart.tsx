import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

import { useMarketDetail } from "@/hooks/useMarkets";
import { useChart } from "@/hooks/useChart";
import type { ChartRange } from "@/functions/chart";

interface Props {
  symbol: string;
}

interface Point {
  t: number;
  price: number;
  label: string;
}

const RANGES: { value: ChartRange; label: string }[] = [
  { value: "1", label: "1D" },
  { value: "7", label: "7D" },
  { value: "30", label: "30D" },
  { value: "365", label: "1Y" },
];

function fmtLabel(t: number, range: ChartRange) {
  const d = new Date(t);
  if (range === "1") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function fmtPrice(v: number | null | undefined) {
  if (v == null) return "—";
  if (v >= 1) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${v.toPrecision(4)}`;
}

export function PriceChart({ symbol }: Props) {
  const [range, setRange] = useState<ChartRange>("7");
  const { data: market } = useMarketDetail(symbol);
  const { data: chart, isLoading } = useChart(symbol, range, market?.price);

  // When CoinGecko has no history for this token, sample the live spot price
  // into a session-local series so the chart is never empty.
  const [live, setLive] = useState<Point[]>([]);
  const hasHistory = (chart?.points?.length ?? 0) > 1;

  useEffect(() => {
    setLive([]);
  }, [symbol, range]);

  useEffect(() => {
    if (hasHistory || market?.price == null) return;
    setLive((prev) =>
      [...prev, { t: Date.now(), price: market.price!, label: fmtLabel(Date.now(), range) }].slice(
        -60,
      ),
    );
  }, [market?.price, hasHistory, range]);

  const data = useMemo<Point[]>(() => {
    if (hasHistory) {
      const pts = chart!.points.map((p) => ({
        t: p.t,
        price: p.price,
        label: fmtLabel(p.t, range),
      }));
      // Keep the tip in sync with the live spot price.
      if (market?.price != null) {
        pts.push({ t: Date.now(), price: market.price, label: fmtLabel(Date.now(), range) });
      }
      return pts;
    }
    return live;
  }, [hasHistory, chart, live, market?.price, range]);

  const first = data[0]?.price;
  const last = data[data.length - 1]?.price ?? market?.price ?? null;
  const change = first && last ? ((last - first) / first) * 100 : null;
  const up = (change ?? 0) >= 0;
  const stroke = up ? "#B8FF00" : "#ef4444";

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-[#0b0d11] px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="text-primary">▍</span> Price / {market?.pair ?? `${symbol}/USDG`}
        </span>
        <div className="flex items-center gap-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-2 py-0.5 font-mono text-[10px] uppercase transition ${
                range === r.value
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end justify-between px-4 pt-4">
        <div>
          <div className="font-mono text-3xl font-bold tabular-nums">{fmtPrice(last)}</div>
          {change != null && (
            <div className={`font-mono text-sm ${up ? "text-primary" : "text-red-400"}`}>
              {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
              <span className="ml-1 text-muted-foreground">
                {hasHistory ? RANGES.find((r) => r.value === range)?.label : "session"}
              </span>
            </div>
          )}
        </div>
        {!hasHistory && (
          <span className="font-mono text-[10px] text-muted-foreground">
            {isLoading ? "loading history…" : "live-sampled · no CoinGecko history"}
          </span>
        )}
      </div>

      <div className="h-[320px] px-2 pb-2 pt-4">
        {data.length < 2 ? (
          <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
            <span className="text-primary">▸</span>&nbsp;
            {isLoading ? "fetching price history…" : "collecting live price data…"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                orientation="right"
                width={64}
                tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v) => fmtPrice(v)}
              />
              <Tooltip
                contentStyle={{
                  background: "#0b0d11",
                  border: "1px solid #252933",
                  borderRadius: 0,
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
                labelStyle={{ color: "#9CA3AF" }}
                formatter={(v: number) => [fmtPrice(v), "Price"]}
              />
              <Area
                dataKey="price"
                stroke={stroke}
                strokeWidth={2}
                fill="url(#chartFill)"
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
