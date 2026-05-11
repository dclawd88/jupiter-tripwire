# Jupiter Tripwire Snapshot

Generated: 2026-05-11T20:55:40.661Z

## API Coverage

- Tokens V2 /search for metadata, organic score, liquidity, holder distribution, and short-window stats
- Price V3 for compact USD price lookup across the watchlist
- Swap V2 /order without taker for route health, price impact, labels, and router behavior

## Live Signals

| Token | Score | Price | 1h Price | 5m Volume | Route | Reasons |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| JUP | 74 | $0.2432 | +1.94% | +110.93% | dflow / 1 steps | +1.94% 1h price move; +110.93% 5m volume shock; 136 net buyers in 1h; 100 organic score |
| JTO | 64 | $0.5115 | +0.75% | +1460.40% | metis / 2 steps | +1460.40% 5m volume shock; 84 organic score; 2 Jupiter route steps |
| SOL | 55 | $97.6990 | -0.42% | -1.52% | base | 15.87K net buyers in 1h; 99 organic score |
| Bonk | 54 | $0.0000 | -0.26% | -73.51% | okx / 1 steps | -73.51% 5m volume shock; 108 net buyers in 1h; 94 organic score; 1 Jupiter route steps |
| DRIFT | 52 | $0.0365 | -1.14% | +1731.46% | base | -1.14% 1h price move; +1731.46% 5m volume shock |
| PYTH | 47 | $0.0590 | +0.08% | +16091.65% | metis / 2 steps | +16091.65% 5m volume shock; 79 organic score; 2 Jupiter route steps |
| RAY | 37 | $0.8631 | -0.42% | -50.33% | base | -50.33% 5m volume shock; 90 organic score |
| wif | 31 | $0.0000 | -43.04% | 0.00% | dflow / 1 steps | -43.04% 1h price move; 65 net buyers in 1h; 1 Jupiter route steps |

## Build Ideas

- Build alert feeds around JUP, JTO, SOL when short-window volume accelerates but route impact remains low.
- Expose route friction as a trader-facing warning before swaps, especially when attention spikes faster than liquidity.
- Use organic score plus holder concentration to filter narrative ideas for builders who do not want to chase thin spikes.
- Run hourly schema and latency checks against Jupiter APIs to catch integration drift before user-facing failures.
