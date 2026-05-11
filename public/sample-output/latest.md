# Jupiter Tripwire Snapshot

Generated: 2026-05-11T21:51:34.324Z

## API Coverage

- Tokens V2 /search for metadata, organic score, liquidity, holder distribution, and short-window stats
- Price V3 for compact USD price lookup across the watchlist
- Swap V2 /order without taker for route health, price impact, labels, and router behavior

## Live Signals

| Token | Score | Price | 1h Price | 5m Volume | Route | Reasons |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| JTO | 58 | $0.5149 | +0.66% | -59.37% | base | -59.37% 5m volume shock; 84 organic score |
| SOL | 56 | $97.5023 | -0.23% | +4.35% | base | 14.27K net buyers in 1h; 99 organic score |
| JUP | 56 | $0.2449 | +0.91% | +5.18% | okx / 1 steps | 115 net buyers in 1h; 100 organic score; 1 Jupiter route steps |
| PYTH | 45 | $0.0588 | -0.29% | -87.93% | base | -87.93% 5m volume shock; 78 organic score |
| RAY | 43 | $0.8596 | -0.46% | +108.10% | base | +108.10% 5m volume shock; 89 organic score |
| Bonk | 39 | $0.0000 | -0.06% | +236.28% | metis / 3 steps | +236.28% 5m volume shock; 67 net buyers in 1h; 93 organic score; 3 Jupiter route steps |
| DRIFT | 9 | $0.0364 | -0.10% | 0.00% | base |  |
| wif | 3 | $0.0000 | 0.00% | 0.00% | base |  |

## Build Ideas

- Build alert feeds around JTO, SOL, JUP when short-window volume accelerates but route impact remains low.
- Expose route friction as a trader-facing warning before swaps, especially when attention spikes faster than liquidity.
- Use organic score plus holder concentration to filter narrative ideas for builders who do not want to chase thin spikes.
- Run hourly schema and latency checks against Jupiter APIs to catch integration drift before user-facing failures.
