import { mkdir, writeFile } from "node:fs/promises";

const JUPITER_API = "https://api.jup.ag";
const JUPITER_LITE_API = "https://lite-api.jup.ag";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const CHECK_ONLY = process.argv.includes("--check");

const WATCHLIST = [
  { query: "SOL", narrative: "base asset and routing depth" },
  { query: "JUP", narrative: "Jupiter ecosystem governance and infra" },
  { query: "BONK", narrative: "Solana consumer and meme liquidity" },
  { query: "WIF", narrative: "high-beta meme attention" },
  { query: "JTO", narrative: "liquid staking and MEV" },
  { query: "PYTH", narrative: "oracle infrastructure" },
  { query: "DRIFT", narrative: "perps and onchain exchange" },
  { query: "RAY", narrative: "DEX infrastructure" }
];

const snapshot = await buildSnapshot();

if (CHECK_ONLY) {
  const broken = snapshot.signals.filter((signal) => !signal.id || !Number.isFinite(signal.score));
  if (broken.length) {
    throw new Error(`Invalid signals: ${broken.map((signal) => signal.symbol).join(", ")}`);
  }
  console.log(`OK: ${snapshot.signals.length} signals, top=${snapshot.signals[0]?.symbol}/${snapshot.signals[0]?.score}`);
} else {
  await mkdir("sample-output", { recursive: true });
  await mkdir("public/sample-output", { recursive: true });
  await writeFile("sample-output/latest.json", JSON.stringify(snapshot, null, 2) + "\n");
  await writeFile("sample-output/latest.md", toMarkdown(snapshot));
  await writeFile("public/sample-output/latest.json", JSON.stringify(snapshot, null, 2) + "\n");
  await writeFile("public/sample-output/latest.md", toMarkdown(snapshot));
  console.log(`Wrote sample-output/latest.json and sample-output/latest.md`);
  console.log(`Top signal: ${snapshot.signals[0]?.symbol} (${snapshot.signals[0]?.score}/100)`);
}

async function buildSnapshot() {
  const tokens = (await mapSeries(WATCHLIST, resolveToken, 250)).filter(Boolean);
  const ids = tokens.map((token) => token.id).join(",");
  const prices = ids ? await fetchJson(`${JUPITER_LITE_API}/price/v3?ids=${ids}`) : {};
  const signals = await mapSeries(
    tokens,
    async (token) => {
      const route = token.id === SOL_MINT ? null : await quoteRoute(token).catch(() => null);
      return scoreToken(token, prices[token.id], route);
    },
    200
  );
  signals.sort((a, b) => b.score - a.score);
  return {
    generatedAt: new Date().toISOString(),
    watchlist: WATCHLIST,
    signals,
    ideas: makeIdeas(signals),
    apiCoverage: [
      "Tokens V2 /search for metadata, organic score, liquidity, holder distribution, and short-window stats",
      "Price V3 for compact USD price lookup across the watchlist",
      "Swap V2 /order without taker for route health, price impact, labels, and router behavior"
    ]
  };
}

async function resolveToken(item) {
  const results = await fetchJson(
    `${JUPITER_LITE_API}/tokens/v2/search?query=${encodeURIComponent(item.query)}`
  );
  const exact = results.find((token) => token.symbol?.toUpperCase() === item.query);
  const verified = results.find((token) => token.isVerified);
  const token = exact || verified || results[0];
  return token ? { ...token, narrative: item.narrative } : null;
}

async function quoteRoute(token) {
  const url = new URL(`${JUPITER_API}/swap/v2/order`);
  url.searchParams.set("inputMint", SOL_MINT);
  url.searchParams.set("outputMint", token.id);
  url.searchParams.set("amount", "10000000");
  return fetchJson(url.toString());
}

function scoreToken(token, price, route) {
  const s5 = token.stats5m || {};
  const s1 = token.stats1h || {};
  const s24 = token.stats24h || {};
  const buyFlow = ratio(s1.buyVolume, s1.sellVolume);
  const organicFlow = ratio(s1.buyOrganicVolume, s1.sellOrganicVolume);
  const routeImpact = Number(route?.priceImpactPct ?? route?.priceImpact ?? 0);
  const routeSteps = route?.routePlan?.length || 0;
  const momentum = clamp(Math.abs(Number(s1.priceChange || 0)) * 3, 0, 24);
  const acceleration = clamp(Math.abs(Number(s5.volumeChange || 0)) / 4, 0, 18);
  const participation = clamp(Number(s1.numTraders || 0) / 120, 0, 16);
  const organic = clamp(Number(token.organicScore || 0) / 7, 0, 14);
  const flow = clamp((buyFlow - 1) * 14 + (organicFlow - 1) * 8, -12, 18);
  const depth = clamp(Math.log10(Math.max(Number(token.liquidity || 1), 1)) * 2, 0, 16);
  const routeStatus = token.id === SOL_MINT ? "base" : route ? "available" : "unavailable";
  const routeHealth =
    routeStatus === "base" ? 8 : route ? clamp(12 - routeImpact * 60 - routeSteps, 0, 12) : 2;
  const riskPenalty =
    (token.isVerified ? 0 : 12) +
    (token.audit?.topHoldersPercentage > 25 ? 8 : 0) +
    (token.audit?.freezeAuthorityDisabled === false ? 8 : 0);

  return {
    id: token.id,
    name: token.name,
    symbol: token.symbol,
    narrative: token.narrative,
    score: Math.round(
      clamp(momentum + acceleration + participation + organic + flow + depth + routeHealth - riskPenalty, 0, 100)
    ),
    usdPrice: price?.usdPrice ?? token.usdPrice,
    liquidity: token.liquidity,
    mcap: token.mcap,
    holderCount: token.holderCount,
    organicScore: token.organicScore,
    organicScoreLabel: token.organicScoreLabel,
    verified: token.isVerified,
    routeStatus,
    stats: {
      price5m: s5.priceChange,
      price1h: s1.priceChange,
      price24h: s24.priceChange,
      volume5m: s5.volumeChange,
      volume1h: s1.volumeChange,
      volume24h: s24.volumeChange,
      buyFlow,
      organicFlow,
      traders1h: s1.numTraders,
      netBuyers1h: s1.numNetBuyers
    },
    route: route
      ? {
          router: route.router,
          swapType: route.swapType,
          priceImpactPct: route.priceImpactPct ?? route.priceImpact,
          routeSteps,
          labels: route.routePlan?.map((leg) => leg.swapInfo?.label).filter(Boolean) || []
        }
      : null,
    reasons: explain(token, s5, s1, s24, route)
  };
}

function explain(token, s5, s1, s24, route) {
  const reasons = [];
  if (Math.abs(Number(s1.priceChange || 0)) >= 1) reasons.push(`${formatPct(s1.priceChange)} 1h price move`);
  if (Math.abs(Number(s5.volumeChange || 0)) >= 25) reasons.push(`${formatPct(s5.volumeChange)} 5m volume shock`);
  if (Number(s1.numNetBuyers || 0) > 50) reasons.push(`${formatNumber(s1.numNetBuyers)} net buyers in 1h`);
  if (Number(token.organicScore || 0) >= 70) reasons.push(`${Math.round(token.organicScore)} organic score`);
  if (route?.routePlan?.length) reasons.push(`${route.routePlan.length} Jupiter route steps`);
  if (Number(s24.priceChange || 0) < -8 && Number(s1.priceChange || 0) > 0) {
    reasons.push("possible rebound after 24h drawdown");
  }
  return reasons.slice(0, 4);
}

function makeIdeas(signals) {
  const top = signals.slice(0, 3).map((signal) => signal.symbol).join(", ");
  return [
    `Build alert feeds around ${top || "the top tokens"} when short-window volume accelerates but route impact remains low.`,
    "Expose route friction as a trader-facing warning before swaps, especially when attention spikes faster than liquidity.",
    "Use organic score plus holder concentration to filter narrative ideas for builders who do not want to chase thin spikes.",
    "Run hourly schema and latency checks against Jupiter APIs to catch integration drift before user-facing failures."
  ];
}

function toMarkdown(snapshot) {
  const rows = snapshot.signals
    .map((signal) => {
      const route = signal.route
        ? `${signal.route.router || "route"} / ${signal.route.routeSteps} steps`
        : signal.routeStatus === "base"
          ? "base"
          : "unavailable";
      return `| ${signal.symbol} | ${signal.score} | ${formatMoney(signal.usdPrice)} | ${formatPct(signal.stats.price1h)} | ${formatPct(signal.stats.volume5m)} | ${route} | ${signal.reasons.join("; ")} |`;
    })
    .join("\n");
  return `# Jupiter Tripwire Snapshot

Generated: ${snapshot.generatedAt}

## API Coverage

${snapshot.apiCoverage.map((item) => `- ${item}`).join("\n")}

## Live Signals

| Token | Score | Price | 1h Price | 5m Volume | Route | Reasons |
| --- | ---: | ---: | ---: | ---: | --- | --- |
${rows}

## Build Ideas

${snapshot.ideas.map((idea) => `- ${idea}`).join("\n")}
`;
}

async function fetchJson(url) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(url);
    if (response.ok) return response.json();
    if (response.status !== 429 || attempt === 5) {
      throw new Error(`${response.status} ${response.statusText} for ${url}`);
    }
    const retryAfter = Number(response.headers.get("retry-after"));
    await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : 1200 * (attempt + 1));
  }
}

async function mapSeries(items, mapper, delayMs) {
  const output = [];
  for (const item of items) {
    output.push(await mapper(item));
    if (delayMs) await sleep(delayMs);
  }
  return output;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ratio(a, b) {
  const left = Number(a || 0);
  const right = Number(b || 0);
  return right <= 0 ? (left > 0 ? 3 : 1) : left / right;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function formatPct(value) {
  const number = Number(value || 0);
  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(2)}%`;
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(4)}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(Number(value || 0));
}
