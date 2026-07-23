# Fellow

Fellow is a conversational DeFi terminal for Robinhood Chain — swap tokens, manage Uniswap-v3-style
liquidity, and check your portfolio, either through the normal UI or by asking the command bar in
plain language. See [`docs/`](docs) for the full product vision, architecture, and rules.

Every on-chain action (swap, add/remove liquidity, claim fees) is read live from the chain and
always requires manual wallet approval before anything is signed — Fellow never holds funds or
executes a transaction on its own.

## Development

```sh
npm install
npm run dev
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `VITE_PRIVY_APP_ID` — wallet connect/auth, from the [Privy dashboard](https://dashboard.privy.io).
- `GROQ_API_KEY` — powers the "Ask Fellow" command bar's natural language understanding, from the
  [Groq console](https://console.groq.com/keys). Server-side only. Without it, the command bar
  falls back to a small set of fixed phrasings (e.g. `swap 10 USDG to ETH`).

## Build

```sh
npm run build
```

Builds an SSR app via TanStack Start/Nitro. The deploy target auto-detects from the hosting
platform's environment (e.g. `VERCEL=1`), or can be pinned with `NITRO_PRESET=<preset>`.

## Deploy (Vercel)

1. Import this repository in Vercel.
2. Set `VITE_PRIVY_APP_ID` and `GROQ_API_KEY` as project environment variables.
3. Deploy — Vercel's build sets `NITRO_PRESET` automatically, no extra config needed.

To deploy from the CLI instead:

```sh
npx vercel deploy --prod
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- wagmi / viem / Privy
- Groq API (Llama 3.3 70B)
