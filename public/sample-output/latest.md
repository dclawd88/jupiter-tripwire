# Jupiter Tripwire Snapshot

Generated: 2026-05-11T23:04:31.567Z

## API Coverage

- Tokens V2 /search for metadata, organic score, liquidity, holder distribution, and short-window stats
- Price V3 for compact USD price lookup across the watchlist
- Swap V2 /order without taker for route health, price impact, labels, and router behavior

## Live Signals

| Token | Score | Price | 1h Price | 5m Volume | Route | Reasons |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| JUP | 79 | $0.2482 | +0.56% | +176.34% | metis / 2 steps | +176.34% 5m volume shock; 125 net buyers in 1h; 100 organic score; 2 Jupiter route steps |
| SOL | 59 | $97.4423 | -0.29% | -20.55% | base | 11.94K net buyers in 1h; 99 organic score |
| JTO | 48 | $0.5210 | +0.89% | -3.39% | metis / 1 steps | 84 organic score; 1 Jupiter route steps |
| RAY | 44 | $0.8608 | -0.08% | +154.24% | unavailable | +154.24% 5m volume shock; 89 organic score |
| PYTH | 40 | $0.0587 | -0.43% | -75.05% | jupiterz / 1 steps | -75.05% 5m volume shock; 78 organic score; 1 Jupiter route steps |
| Bonk | 39 | $0.0000 | -0.41% | +124.82% | dflow / 2 steps | +124.82% 5m volume shock; 81 net buyers in 1h; 92 organic score; 2 Jupiter route steps |
| DRIFT | 21 | $0.0362 | -0.69% | +319.81% | unavailable | +319.81% 5m volume shock |
| wif | 0 | $0.0000 | 0.00% | 0.00% | dflow / 1 steps | 1 Jupiter route steps |

## Build Ideas

- Build alert feeds around JUP, SOL, JTO when short-window volume accelerates but route impact remains low.
- Expose route friction as a trader-facing warning before swaps, especially when attention spikes faster than liquidity.
- Use organic score plus holder concentration to filter narrative ideas for builders who do not want to chase thin spikes.
- Run hourly schema and latency checks against Jupiter APIs to catch integration drift before user-facing failures.
