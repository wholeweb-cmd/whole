import { useGasPrice } from "@/hooks/useGasPrice";

interface Props {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  slippage: number;
}

export function SwapSummary({ fromToken, toToken, fromAmount, toAmount, slippage }: Props) {
  const gasPrice = useGasPrice();

  const amountIn = Number(fromAmount || 0);
  const amountOut = Number(toAmount || 0);

  const rate = amountIn > 0 ? (amountOut / amountIn).toFixed(4) : "0";

  // 0.30% LP Fee
  const lpFee = amountOut * 0.003;

  // Receive after LP Fee
  const minimumReceived = amountOut * (1 - slippage / 100);

  // Fake Price Impact
  const priceImpact = amountIn === 0 ? 0 : Math.min(0.01 + amountIn * 0.005, 1);

  return (
    <div className="mt-3 space-y-2.5 border border-border bg-background p-4 font-mono [&_span]:tabular-nums">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Rate</span>

        <span>
          1 {fromToken} = {rate} {toToken}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">LP Fee</span>

        <span>
          {lpFee.toFixed(4)} {toToken}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Price Impact</span>

        <span className={priceImpact > 0.5 ? "text-yellow-400" : "text-green-400"}>
          {priceImpact.toFixed(2)}%
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Minimum Received</span>

        <span>
          {minimumReceived.toFixed(4)} {toToken}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Network Fee</span>

        <span>~0.00008 ETH ({gasPrice} Gwei)</span>
      </div>

      <div className="border-t border-border pt-3 flex justify-between text-sm">
        <span className="text-muted-foreground">Estimated Time</span>

        <span>~5 sec</span>
      </div>
    </div>
  );
}
