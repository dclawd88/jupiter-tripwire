const JUPITER_API = "/jup";
const JUPITER_LITE_API = "/jup-lite";
const SOL_MINT = "So11111111111111111111111111111111111111112";

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

const fmtUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 4
});

const fmtCompact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2
});

const elements = {
  refresh: document.querySelector("#refresh"),
  status: document.querySelector("#status"),
  snapshotTime: document.querySelector("#snapshot-time"),
  headline: document.querySelector("#headline"),
  count: document.querySelector("#tripwire-count"),
  watchlist: document.querySelector("#watchlist"),
  signals: document.querySelector("#signals"),
  ideas: document.querySelector("#ideas")
};

elements.watchlist.innerHTML = WATCHLIST.map(
  (item) => `<span title="${item.narrative}">${item.query}</span>`
).join("");

elements.refresh.addEventListener("click", () => loadLiveSnapshot());

loadStaticSnapshot();

async function loadStaticSnapshot() {
  setStatus("Loading", true);
  try {
    const snapshot = await fetchJson("/sample-output/latest.json");
    renderSnapshot(snapshot);
    setStatus("Snapshot", false);
  } catch {
    await loadLiveSnapshot();
  }
}

async function loadLiveSnapshot() {
  setStatus("Loading", true);
  elements.signals.innerHTML = "";
  elements.ideas.innerHTML = "";

  try {
    const snapshot = await buildSnapshot();
    renderSnapshot(snapshot);
    setStatus("Live", false);
  } catch (error) {
    setStatus("Error", false);
    elements.signals.innerHTML = `<div class="empty">Jupiter request failed: ${escapeHtml(error.message)}</div>`;
  }
}

async function buildSnapshot() {
  const tokens = await mapSeries(WATCHLIST, resolveToken, 650);
  const usable = tokens.filter(Boolean);
  const ids = usable.map((token) => token.id).join(",");
  const prices = ids ? await fetchJson(`${JUPITER_LITE_API}/price/v3?ids=${ids}`) : {};

  const signals = await mapSeries(
    usable,
    async (token) => {
      const route = token.id === SOL_MINT ? null : await quoteRoute(token).catch(() => null);
      return scoreToken(token, prices[token.id], route);
    },
    650
  );

  signals.sort((a, b) => b.score - a.score);
  return {
    generatedAt: new Date().toISOString(),
    watchlist: WATCHLIST,
    signals,
    ideas: makeIdeas(signals)
  };
}

async function resolveToken(item) {
  const results = await fetchJson(
    `${JUPITER_LITE_API}/tokens/v2/search?query=${encodeURIComponent(item.query)}`
  );
  const exact = results.find((token) => token.symbol?.toUpperCase() === item.query);
  const verified = results.find((token) => token.isVerified);
  const token = exact || verified || results[0];
  if (!token) return null;
  return { ...token, narrative: item.narrative };
}

async function quoteRoute(token) {
  const amount = "10000000";
  const url = new URL(`${JUPITER_API}/swap/v2/order`, window.location.origin);
  url.searchParams.set("inputMint", SOL_MINT);
  url.searchParams.set("outputMint", token.id);
  url.searchParams.set("amount", amount);
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
  const routeHealth = route ? clamp(12 - routeImpact * 60 - routeSteps, 0, 12) : 8;
  const riskPenalty =
    (token.isVerified ? 0 : 12) +
    (token.audit?.topHoldersPercentage > 25 ? 8 : 0) +
    (token.audit?.freezeAuthorityDisabled === false ? 8 : 0);

  const score = Math.round(
    clamp(momentum + acceleration + participation + organic + flow + depth + routeHealth - riskPenalty, 0, 100)
  );

  return {
    id: token.id,
    name: token.name,
    symbol: token.symbol,
    icon: token.icon,
    narrative: token.narrative,
    score,
    usdPrice: price?.usdPrice ?? token.usdPrice,
    liquidity: token.liquidity,
    mcap: token.mcap,
    holderCount: token.holderCount,
    organicScore: token.organicScore,
    organicScoreLabel: token.organicScoreLabel,
    verified: token.isVerified,
    topHoldersPercentage: token.audit?.topHoldersPercentage,
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
          outAmount: route.outAmount,
          inUsdValue: route.inUsdValue,
          outUsdValue: route.outUsdValue,
          labels: route.routePlan?.map((leg) => leg.swapInfo?.label).filter(Boolean) || []
        }
      : null,
    reasons: explain(token, s5, s1, s24, route)
  };
}

function explain(token, s5, s1, s24, route) {
  const reasons = [];
  if (Math.abs(Number(s1.priceChange || 0)) >= 1) {
    reasons.push(`${formatPct(s1.priceChange)} 1h price move`);
  }
  if (Math.abs(Number(s5.volumeChange || 0)) >= 25) {
    reasons.push(`${formatPct(s5.volumeChange)} 5m volume shock`);
  }
  if (Number(s1.numNetBuyers || 0) > 50) {
    reasons.push(`${fmtCompact.format(s1.numNetBuyers)} net buyers in 1h`);
  }
  if (Number(token.organicScore || 0) >= 70) {
    reasons.push(`${Math.round(token.organicScore)} organic score`);
  }
  if (route?.routePlan?.length) {
    reasons.push(`${route.routePlan.length} Jupiter route step${route.routePlan.length === 1 ? "" : "s"}`);
  }
  if (Number(s24.priceChange || 0) < -8 && Number(s1.priceChange || 0) > 0) {
    reasons.push("possible rebound after 24h drawdown");
  }
  return reasons.slice(0, 4);
}

function makeIdeas(signals) {
  const top = signals.slice(0, 4);
  return [
    {
      title: "Narrative watch alert",
      body: `Trigger alerts when ${top[0]?.symbol || "top tokens"} shows volume acceleration while Jupiter route impact stays low. This catches attention before social feeds converge.`
    },
    {
      title: "Route friction monitor",
      body: "Track when a token has strong flow but swap route depth worsens. Builders can use this to decide whether to add route-specific UX warnings or alternative entry points."
    },
    {
      title: "Organic-score launch filter",
      body: "Combine Tokens V2 organic score, holder distribution, and short-window net buyers to separate durable ecosystem narratives from thin-liquidity spikes."
    },
    {
      title: "Jupiter DX test harness",
      body: "Run the same watchlist every hour and snapshot endpoint latency, missing fields, route labels, and schema drift so integrators can detect API behavior changes before users do."
    }
  ];
}

function renderSnapshot(snapshot) {
  const hot = snapshot.signals.filter((signal) => signal.score >= 65);
  elements.snapshotTime.textContent = `Snapshot ${new Date(snapshot.generatedAt).toLocaleString()}`;
  elements.headline.textContent = hot[0]
    ? `${hot[0].symbol} is the strongest current tripwire at ${hot[0].score}/100`
    : "No high-confidence tripwire right now";
  elements.count.textContent = String(hot.length);

  elements.signals.innerHTML = snapshot.signals
    .map(
      (signal) => `
        <article class="signal">
          <div class="token">
            ${signal.icon ? `<img src="${signal.icon}" alt="" />` : `<span class="fallback">${signal.symbol?.slice(0, 2) || "?"}</span>`}
            <div>
              <h3>${escapeHtml(signal.symbol || signal.name)}</h3>
              <p>${escapeHtml(signal.narrative)}</p>
            </div>
          </div>
          <div class="score ${scoreTone(signal.score)}">${signal.score}</div>
          <dl>
            <div><dt>Price</dt><dd>${fmtUsd.format(Number(signal.usdPrice || 0))}</dd></div>
            <div><dt>1h</dt><dd>${formatPct(signal.stats.price1h)}</dd></div>
            <div><dt>5m vol</dt><dd>${formatPct(signal.stats.volume5m)}</dd></div>
            <div><dt>Liquidity</dt><dd>${fmtCompact.format(Number(signal.liquidity || 0))}</dd></div>
          </dl>
          <div class="route">
            ${signal.route ? `${escapeHtml(signal.route.router || "route")} via ${signal.route.labels.map(escapeHtml).join(" -> ")}` : "Base asset"}
          </div>
          <ul>
            ${signal.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");

  elements.ideas.innerHTML = snapshot.ideas
    .map(
      (idea) => `
        <article class="idea">
          <h3>${escapeHtml(idea.title)}</h3>
          <p>${escapeHtml(idea.body)}</p>
        </article>
      `
    )
    .join("");
}

function setStatus(label, busy) {
  elements.status.textContent = label;
  elements.refresh.disabled = busy;
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

function scoreTone(score) {
  if (score >= 75) return "hot";
  if (score >= 55) return "warm";
  return "cool";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
