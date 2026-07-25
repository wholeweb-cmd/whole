interface Props {
  symbol: string;

  price: number;

  change: number;
}

export function ChartHeader({ symbol, price, change }: Props) {
  const positive = change >= 0;

  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-4">
      <div>
        <h2 className="text-lg font-semibold">{symbol}</h2>

        <div className="mt-1 flex items-center gap-3">
          <span className="text-3xl font-bold">
            $
            {price.toLocaleString(undefined, {
              maximumFractionDigits: 6,
            })}
          </span>

          <span className={positive ? "text-primary" : "text-red-400"}>
            {positive ? "+" : ""}
            {change.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
