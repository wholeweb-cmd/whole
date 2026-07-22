import { Card, Stat } from "./Card";

const points = [
  42, 44, 43, 46, 48, 47, 50, 49, 52, 55, 54, 57, 60, 58, 62, 65, 64, 68, 71, 70,
  73, 76, 75, 78, 82, 80, 84, 88,
];

function Sparkline() {
  const w = 260;
  const h = 56;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => [i * step, h - ((p - min) / range) * h] as const);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-14 w-full">
      <path d={area} fill="#B8FF00" fillOpacity="0.08" />
      <path d={line} fill="none" stroke="#B8FF00" strokeWidth="1.25" />
    </svg>
  );
}

export function PortfolioSummary() {
  return (
    <Card
      title="Portfolio Summary"
      action={
        <div className="flex items-center gap-2">
          {["1D", "1W", "1M", "1Y"].map((r, i) => (
            <button
              key={r}
              className={`rounded-sm px-2 py-0.5 text-[10px] font-medium ${
                i === 1 ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid grid-cols-2 gap-6">
          <Stat label="Portfolio Value" value="$248,192.44" delta="2.14%" positive />
          <Stat label="Today's PnL" value="+$5,318.02" delta="1.28%" positive />
          <Stat label="Claimable Fees" value="$1,204.87" />
          <Stat label="Available Balance" value="$42,880.10" />
        </div>
        <div className="flex flex-col justify-between border-l border-border pl-6">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Performance
            </span>
            <span className="font-mono text-[11px] text-primary">▲ 8.42%</span>
          </div>
          <Sparkline />
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </Card>
  );
}