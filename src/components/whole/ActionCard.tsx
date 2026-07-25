import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowRight, X } from "lucide-react";

import type { Intent } from "@/lib/intent/types";
import { useSwapExecute } from "@/hooks/useSwapExecute";
import { useSwapQuote } from "@/hooks/useSwapQuote";
import { useSwapTokens } from "@/hooks/useSwapTokens";
import { useLiquidity } from "@/hooks/useLiquidity";
import { useClaimFees } from "@/hooks/useClaimFees";
import { useLiquidityPositions } from "@/hooks/useLiquidityPositions";
import { getToken } from "@/lib/tokens/index";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { SERVICE_FEE_PERCENT } from "@/lib/config/swapFee";

interface Props {
  intent: Intent;
  onDismiss(): void;
}

function Frame({
  title,
  onDismiss,
  children,
}: {
  title: string;
  onDismiss(): void;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-panel mb-2 overflow-hidden rounded-xl border border-border font-mono">
      <div className="surface-head flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
          ▍ {title}
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ConfirmButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold uppercase tracking-wide transition ${
        disabled
          ? "cursor-not-allowed bg-muted text-muted-foreground"
          : "glow-primary glow-primary-hover bg-primary text-primary-foreground hover:opacity-95"
      }`}
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </button>
  );
}

function SwapAction({
  intent,
  onDismiss,
}: {
  intent: Extract<Intent, { kind: "swap" }>;
  onDismiss(): void;
}) {
  const { authenticated, login } = usePrivy();
  const { execute, step, error } = useSwapExecute();
  const { tokens } = useSwapTokens();
  const defaultSlippage = useSettingsStore((s) => s.defaultSlippage);

  const fromSymbol = intent.fromToken.toUpperCase();
  const toSymbol = intent.toToken.toUpperCase();
  const fromToken =
    tokens.find((token) =>
      fromSymbol === "ETH"
        ? token.isNative
        : !token.isNative && token.symbol.toUpperCase() === fromSymbol,
    ) ?? null;
  const toToken =
    tokens.find((token) =>
      toSymbol === "ETH"
        ? token.isNative
        : !token.isNative && token.symbol.toUpperCase() === toSymbol,
    ) ?? null;
  const nativePrice = tokens.find((token) => token.isNative)?.price ?? null;

  const {
    out: quote,
    grossOut,
    serviceFee,
    route,
    loading: quoting,
    noRoute,
  } = useSwapQuote(fromToken, toToken, intent.amount, nativePrice);

  const loading = step === "approving" || step === "swapping";

  async function handleConfirm() {
    if (!authenticated) {
      login();
      return;
    }

    if (!fromToken || !toToken || !route) return;

    await execute({
      tokenIn: fromToken,
      tokenOut: toToken,
      amountIn: intent.amount,
      grossAmountOut: grossOut,
      slippage: defaultSlippage,
      route,
    });
  }

  let label = "Confirm Swap";
  if (!authenticated) label = "Connect Wallet";
  else if (quoting) label = "Finding best route...";
  else if (noRoute || !route) label = "No route found";
  else if (loading) label = step === "approving" ? "Approving..." : "Swapping...";
  else if (step === "success") label = "Swapped ✓";

  return (
    <Frame title="Swap" onDismiss={onDismiss}>
      <p className="text-sm text-foreground">
        Swap{" "}
        <span className="font-semibold">
          {intent.amount} {intent.fromToken}
        </span>{" "}
        for <span className="font-semibold">{intent.toToken}</span>
      </p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        Estimated: {quoting ? "..." : quote} {intent.toToken}
      </p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        Service fee ({SERVICE_FEE_PERCENT.toFixed(2)}%): {quoting ? "..." : serviceFee}{" "}
        {intent.toToken}
      </p>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <ConfirmButton
        label={label}
        disabled={
          loading ||
          step === "success" ||
          (authenticated && (quoting || noRoute || !fromToken || !toToken || !route))
        }
        onClick={handleConfirm}
      />
    </Frame>
  );
}

function AddLiquidityAction({
  intent,
  onDismiss,
}: {
  intent: Extract<Intent, { kind: "add_liquidity" }>;
  onDismiss(): void;
}) {
  const { authenticated, login } = usePrivy();
  const { addLiquidity, step, error } = useLiquidity();

  const [amountA, setAmountA] = useState(intent.amountA);
  const [amountB, setAmountB] = useState(intent.amountB);

  const infoA = getToken(intent.tokenA);
  const infoB = getToken(intent.tokenB);

  const loading = step === "approving" || step === "submitting";
  const disabled = !amountA || !amountB || loading || step === "success";

  async function handleConfirm() {
    if (!authenticated) {
      login();
      return;
    }
    if (!infoA || !infoB) return;

    await addLiquidity({
      tokenASymbol: infoA.symbol,
      tokenAAddress: infoA.address,
      tokenBSymbol: infoB.symbol,
      tokenBAddress: infoB.address,
      amountA,
      amountB,
      fee: infoA.feeTier ?? 3000,
    });
  }

  let label = "Confirm Add Liquidity";
  if (!authenticated) label = "Connect Wallet";
  else if (loading) label = step === "approving" ? "Approving..." : "Submitting...";
  else if (step === "success") label = "Added ✓";

  return (
    <Frame title="Add Liquidity" onDismiss={onDismiss}>
      <p className="text-sm text-foreground">
        Add liquidity to{" "}
        <span className="font-semibold">
          {intent.tokenA}/{intent.tokenB}
        </span>{" "}
        (full range)
      </p>

      <div className="mt-3 flex gap-2">
        <input
          value={amountA}
          onChange={(e) => setAmountA(e.target.value)}
          placeholder={`Amount ${intent.tokenA}`}
          className="surface-tile w-1/2 rounded-lg border border-border bg-background/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60"
        />
        <input
          value={amountB}
          onChange={(e) => setAmountB(e.target.value)}
          placeholder={`Amount ${intent.tokenB}`}
          className="surface-tile w-1/2 rounded-lg border border-border bg-background/40 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60"
        />
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <ConfirmButton label={label} disabled={disabled} onClick={handleConfirm} />
    </Frame>
  );
}

function RemoveLiquidityAction({
  intent,
  onDismiss,
}: {
  intent: Extract<Intent, { kind: "remove_liquidity" }>;
  onDismiss(): void;
}) {
  const navigate = useNavigate();
  const { positions } = useLiquidityPositions();
  const { removeLiquidity, step, error } = useLiquidity();

  const match = intent.positionId
    ? positions.find((p) => p.tokenId.toString() === intent.positionId)
    : undefined;

  if (!match) {
    return (
      <Frame title="Remove Liquidity" onDismiss={onDismiss}>
        <p className="text-sm text-foreground">
          I can't tell which position to remove from that alone — head to the Liquidity page to pick
          one and remove it.
        </p>
        <ConfirmButton
          label="Go to Liquidity"
          onClick={() => {
            navigate({ to: "/liquidity" });
            onDismiss();
          }}
        />
      </Frame>
    );
  }

  const label = `${match.token0Symbol}/${match.token1Symbol}`;
  const loading = step === "approving" || step === "submitting";

  return (
    <Frame title="Remove Liquidity" onDismiss={onDismiss}>
      <p className="text-sm text-foreground">
        Remove all liquidity from <span className="font-semibold">{label}</span> (position #
        {match.tokenId.toString()})
      </p>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <ConfirmButton
        label={loading ? "Removing..." : step === "success" ? "Removed ✓" : "Confirm Remove"}
        disabled={loading || step === "success"}
        onClick={() => removeLiquidity(match.tokenId, match.liquidity, label)}
      />
    </Frame>
  );
}

function ClaimFeesAction({
  intent,
  onDismiss,
}: {
  intent: Extract<Intent, { kind: "claim_fees" }>;
  onDismiss(): void;
}) {
  const navigate = useNavigate();
  const { positions } = useLiquidityPositions();
  const { claimFees, step, error } = useClaimFees();

  const candidates = intent.positionId
    ? positions.filter((p) => p.tokenId.toString() === intent.positionId)
    : positions.filter((p) => Number(p.tokensOwed0) > 0 || Number(p.tokensOwed1) > 0);

  if (candidates.length !== 1) {
    return (
      <Frame title="Claim Fees" onDismiss={onDismiss}>
        <p className="text-sm text-foreground">
          {candidates.length === 0
            ? "I don't see any claimable fees right now."
            : "You have fees on multiple positions — head to the Liquidity page to claim them."}
        </p>
        <ConfirmButton
          label="Go to Liquidity"
          onClick={() => {
            navigate({ to: "/liquidity" });
            onDismiss();
          }}
        />
      </Frame>
    );
  }

  const match = candidates[0];
  const label = `${match.token0Symbol}/${match.token1Symbol}`;
  const loading = step === "claiming";

  return (
    <Frame title="Claim Fees" onDismiss={onDismiss}>
      <p className="text-sm text-foreground">
        Claim{" "}
        <span className="font-semibold">
          {Number(match.tokensOwed0).toFixed(4)} {match.token0Symbol}
        </span>{" "}
        +{" "}
        <span className="font-semibold">
          {Number(match.tokensOwed1).toFixed(4)} {match.token1Symbol}
        </span>{" "}
        from {label}
      </p>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <ConfirmButton
        label={loading ? "Claiming..." : step === "success" ? "Claimed ✓" : "Confirm Claim"}
        disabled={loading || step === "success"}
        onClick={() => claimFees(match.tokenId, label)}
      />
    </Frame>
  );
}

function NavigateAction({
  intent,
  onDismiss,
}: {
  intent: Extract<Intent, { kind: "navigate" }>;
  onDismiss(): void;
}) {
  const navigate = useNavigate();

  return (
    <Frame title="Navigate" onDismiss={onDismiss}>
      <p className="text-sm text-foreground">Open {intent.label}?</p>
      <ConfirmButton
        label={`Go to ${intent.label}`}
        onClick={() => {
          navigate({ to: intent.to });
          onDismiss();
        }}
      />
    </Frame>
  );
}

function AnswerAction({
  intent,
  onDismiss,
}: {
  intent: Extract<Intent, { kind: "answer" }>;
  onDismiss(): void;
}) {
  return (
    <Frame title="WHOLE" onDismiss={onDismiss}>
      <p className="text-sm text-foreground">{intent.reply}</p>
    </Frame>
  );
}

function UnknownAction({
  intent,
  onDismiss,
}: {
  intent: Extract<Intent, { kind: "unknown" }>;
  onDismiss(): void;
}) {
  return (
    <Frame title="I'm not sure" onDismiss={onDismiss}>
      <p className="text-sm text-muted-foreground">{intent.reason}</p>
    </Frame>
  );
}

export function ActionCard({ intent, onDismiss }: Props) {
  switch (intent.kind) {
    case "swap":
      return <SwapAction intent={intent} onDismiss={onDismiss} />;
    case "add_liquidity":
      return <AddLiquidityAction intent={intent} onDismiss={onDismiss} />;
    case "remove_liquidity":
      return <RemoveLiquidityAction intent={intent} onDismiss={onDismiss} />;
    case "claim_fees":
      return <ClaimFeesAction intent={intent} onDismiss={onDismiss} />;
    case "navigate":
      return <NavigateAction intent={intent} onDismiss={onDismiss} />;
    case "answer":
      return <AnswerAction intent={intent} onDismiss={onDismiss} />;
    case "unknown":
      return <UnknownAction intent={intent} onDismiss={onDismiss} />;
  }
}
