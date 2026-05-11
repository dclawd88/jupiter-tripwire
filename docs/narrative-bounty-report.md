# Solana Narrative Detection Report

Jupiter Tripwire is a lightweight Solana narrative detection tool built by the `dclawd-codex-round2` agent. It monitors a curated watchlist of ecosystem tokens, refreshes live Jupiter data, ranks early signals, and turns the strongest signals into build ideas.

## Data Sources

- Jupiter Tokens V2 search for metadata, verification status, organic score, liquidity, holder distribution, and 5m/1h/24h token stats.
- Jupiter Price V3 for compact USD pricing across the watchlist.
- Jupiter Swap V2 `/order` in quote-only mode for route depth, route labels, route-step count, and price-impact behavior.
- The current prototype is intentionally source-conservative: it avoids scraped social data and focuses on explainable API signals that can be reproduced from the repo.

## Ranking Method

Each token receives a 0-100 tripwire score. The score combines short-window price movement, 5m volume acceleration, 1h trader participation, buy/sell and organic buy/sell flow, Jupiter organic score, liquidity depth, and Swap V2 route health. It subtracts risk penalties for unverified tokens, concentrated holders, or unsafe audit fields.

The goal is not to predict price. The goal is to answer a builder question: which Solana themes are showing enough market attention, organic flow, and route health to justify prototyping a product around them?

## Detected Narratives

- Jupiter ecosystem governance and infra: governance, aggregator UX, and integration tooling around JUP.
- Perps and onchain exchange: DRIFT and related venues as a signal for derivatives UX and risk tooling.
- Liquid staking and MEV: JTO as a proxy for staking, validator economics, and MEV-aware products.
- Oracle infrastructure: PYTH as a proxy for data reliability, price feeds, and cross-app market structure.
- DEX infrastructure: RAY and route labels as a proxy for liquidity depth and routing resilience.

## Product Ideas

1. Narrative watch alerts: notify builders when a token shows short-window volume acceleration while Jupiter route impact stays low.
2. Route friction monitor: detect when attention rises faster than route depth, then surface swap warnings or alternate paths in wallets and trading UIs.
3. Organic launch filter: combine organic score, holder concentration, and net buyer stats to filter durable ecosystem narratives from thin spikes.
4. Integration drift harness: run scheduled snapshots of endpoint latency, missing fields, route labels, and schema changes so Jupiter integrators catch API behavior changes early.
5. Founder idea feed: publish a fortnightly ranked list of narratives with suggested MVPs, target users, and the exact signal reasons behind each recommendation.

## Reproduce

```bash
npm install
npm run snapshot
npm run check
npm start
```

The generated machine-readable output is in `sample-output/latest.json`, and the markdown snapshot is in `sample-output/latest.md`.
