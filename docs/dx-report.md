# Jupiter Tripwire DX Report

## What I Built

Jupiter Tripwire is a narrative detection dashboard for Solana builders. It watches a small, explainable set of ecosystem tokens and turns Jupiter API data into ranked "tripwires" that answer three questions:

- Is attention or flow accelerating right now?
- Does the token still have healthy route depth through Jupiter?
- Is the signal credible enough to become a builder narrative instead of a thin spike?

The repo includes:

- A browser dashboard in `index.html` and `src/app.js`.
- A reproducible CLI snapshot generator in `scripts/snapshot.mjs`.
- Machine-readable and markdown sample output in `sample-output/`.

## Jupiter APIs Used

- Tokens V2 `/tokens/v2/search`: token metadata, verification, organic score, liquidity, holder count, audit fields, and 5m/1h/24h market stats.
- Price V3 `/price/v3`: compact USD price lookup for the resolved token mints.
- Swap V2 `/swap/v2/order`: quote-only route health without a taker, including router, route plan, price impact, and transaction-null behavior.

## What Worked Well

- Tokens V2 is unusually rich. The organic score, audit fields, liquidity, and time-window stats make it possible to build useful signal products without stitching together multiple vendors.
- Price V3 is simple and fast for watchlist snapshots.
- Swap V2 `/order` can be used as a safe quote-only route probe when `taker` is omitted. That is useful for dashboards, risk warnings, and research tooling because it avoids creating a signable transaction.
- Route labels are useful for explaining where liquidity comes from instead of showing a black-box quote.

## Friction

- The docs state that some endpoints require an API key, but keyless calls worked for this prototype. That is convenient for demos but ambiguous for production planning.
- Tokens V2 responses are marked as subject to change, and the schema is wide. A typed client or downloadable OpenAPI schema for the public data endpoints would reduce integration risk.
- Swap V2 has multiple numeric fields for impact and value. Clearer examples for `priceImpact`, `priceImpactPct`, `inUsdValue`, and `outUsdValue` would help integrators avoid displaying the wrong unit.
- The route plan is excellent but dense. A short "route plan cookbook" showing common UI reductions would help apps explain quotes without overwhelming users.

## AI Stack Feedback

The best AI-agent path was to use live API probes first, then encode those observations into tests and UI. The main improvement I would want from Jupiter's AI stack is a machine-readable "endpoint behavior contract" that an agent can test against:

- Required versus optional auth by endpoint.
- Stable versus experimental fields.
- Safe quote-only examples.
- Rate-limit and cache guidance for dashboard polling.

That would let agents generate integration tests automatically, not just code snippets.

## Future Extensions

- Add hourly snapshots and compare deltas over time.
- Add social/news inputs to tie market tripwires to narrative text.
- Add wallet-aware route checks for a user's real balances without signing or executing swaps.
- Add alert delivery to Telegram or Discord for high-confidence tripwires.
