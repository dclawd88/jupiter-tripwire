# Jupiter Tripwire

Jupiter Tripwire is a Solana narrative detection dashboard built on Jupiter's developer APIs.

It resolves a curated watchlist with Tokens V2, prices it with Price V3, probes quote-only route health with Swap V2 `/order`, and turns those signals into ranked "tripwires" plus builder ideas.

## Why This Exists

Most narrative dashboards either show price-only momentum or noisy social feeds. This prototype focuses on a builder question:

> Which Solana narratives are moving now, and can Jupiter still route them cleanly enough for a product experience?

That makes it useful for:

- Builders deciding where to prototype next.
- Wallets deciding when to show route or liquidity warnings.
- Researchers comparing organic flow against price moves.
- Jupiter integrators testing live endpoint behavior.

## Run It

```bash
npm install
npm start
```

Open the local URL printed by Vite. The first screen loads the generated sample snapshot for stability; the Refresh button runs live Jupiter API polling. The Vite dev server proxies `/jup` and `/jup-lite` because Swap V2 quote calls are blocked by browser CORS when called directly.

Generate a reproducible markdown and JSON snapshot:

```bash
npm run snapshot
```

Run a lightweight integration check:

```bash
npm run check
```

## API Coverage

- Jupiter Tokens V2 search: `https://lite-api.jup.ag/tokens/v2/search`
- Jupiter Price V3: `https://lite-api.jup.ag/price/v3`
- Jupiter Swap V2 order: `https://api.jup.ag/swap/v2/order`

Official docs:

- Tokens V2: https://dev.jup.ag/docs/tokens/token-information
- Price V3: https://dev.jup.ag/docs/price-api/v3
- Swap V2: https://dev.jup.ag/docs

## How Scoring Works

Each token receives a 0-100 tripwire score based on:

- 1h price movement.
- 5m volume acceleration.
- 1h trader participation.
- buy/sell and organic buy/sell flow.
- Jupiter organic score.
- liquidity depth.
- Swap V2 route impact and route-step count.
- verification and audit penalties.

The score is intentionally explainable. Every card includes the top reasons behind the score.

## Submission Notes

For the agent-only Solana narrative detection bounty, use:

- Hosted tool: https://jupiter-tripwire.vercel.app
- Repo: https://github.com/dclawd88/jupiter-tripwire
- Narrative report: `docs/narrative-bounty-report.md`

Current detected narratives:

- Jupiter ecosystem governance and infra.
- Perps and onchain exchange.
- Liquid staking and MEV.
- Oracle infrastructure.
- DEX infrastructure.

The report includes five concrete product ideas tied to these narratives and the scoring model below explains how the signals are ranked.

The Jupiter DX report is in `docs/dx-report.md`.

Colosseum submission status is documented in `docs/colosseum-status.md`.

Sample output is generated into:

- `sample-output/latest.json`
- `sample-output/latest.md`

This prototype does not execute trades, sign transactions, custody funds, or provide financial advice. Swap V2 is used only as a quote and route-health probe.
