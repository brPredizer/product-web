// Market Intelligence & Risk Management Utilities (TypeScript)

export interface Market {
  title?: string
  category?: string
  yes_price?: number
  volume_24h?: number
  volume_7d_avg?: number
  volatility_24h?: number
  closing_date?: string | Date
}

export interface ExternalSignals {
  news_intensity?: number
  directional_consensus?: number
  macro_shock?: number
  external_probability?: number
  confidence?: number
  key_indicators?: string[]
  sources?: string[]
  summary?: string
}

export function calculateEntropy(p: number): number {
  if (p <= 0 || p >= 1) return 0
  return -(p * Math.log(p) + (1 - p) * Math.log(1 - p))
}

export function logit(p: number): number {
  const clipped = Math.max(0.001, Math.min(0.999, p))
  return Math.log(clipped / (1 - clipped))
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

export function calculateUrgency(daysToSettlement: number, tau = 10): number {
  return Math.exp(-daysToSettlement / tau)
}

export function calculateAdThemeScore(
  market: Market,
  external: Partial<ExternalSignals> = {},
  perf: Record<string, number> = {}
): number {
  const p_mkt = market.yes_price ?? 0.5

  const H = calculateEntropy(p_mkt)

  const vol_24h = market.volume_24h ?? 0
  const vol_7d_avg = market.volume_7d_avg ?? 1
  const vol_g = Math.log(1 + vol_24h / Math.max(vol_7d_avg, 1e-9)) / 5

  const sig = market.volatility_24h ?? 0

  const daysToSettlement = market.closing_date
    ? (new Date(market.closing_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    : 30
  const urg = calculateUrgency(daysToSettlement)

  const news = external.news_intensity ?? 0
  const shock = external.macro_shock ?? 0

  const conv = perf.conversion_rate ?? 0
  const cpa = perf.cpa_normalized ?? 0.5

  const score =
    0.22 * H + 0.18 * vol_g + 0.12 * sig + 0.18 * urg + 0.12 * news + 0.08 * shock + 0.07 * conv + 0.03 * (1 - cpa)

  return Math.min(1, Math.max(0, score))
}

export function blendProbability(p_mkt: number, p_ext: number, news_signal = 0, liquidity = 0.5): number {
  const w_m = Math.min(1.0, 0.3 + 0.7 * liquidity)
  const w_e = 1.0 - w_m
  const w_n = 0.15

  const combined = w_m * logit(p_mkt) + w_e * logit(p_ext) + w_n * news_signal

  return sigmoid(combined)
}

export interface PositionRecommendation {
  q_adjusted: number
  stake_recommended_brl: number
  shares: number
  kelly_fraction_pct: string
  max_loss_brl: number
  max_gain_brl: number
  expected_value_brl: number
  roi_pct: string | number
  edge: string
}

export function calculateRiskManagedPosition(
  bankroll_brl: number,
  price_c: number,
  q_final: number,
  confidence = 0.7
): PositionRecommendation {
  const q_adj = confidence * q_final + (1 - confidence) * price_c

  const b = (1 - price_c) / price_c
  const f_kelly = q_adj - (1 - q_adj) / b

  const f_cap = 0.03
  const f = Math.max(0, Math.min(0.25 * f_kelly, f_cap))

  const stake = f * bankroll_brl
  const shares = Math.floor(stake / price_c)

  const max_loss_brl = shares * price_c
  const max_gain_brl = shares * (1 - price_c)
  const expected_value = shares * (q_adj - price_c)

  const kelly_fraction_pct = (f * 100).toFixed(2)

  const roi_pct = max_loss_brl > 0 ? Math.round((max_gain_brl / max_loss_brl) * 100) : 0

  return {
    q_adjusted: q_adj,
    stake_recommended_brl: stake,
    shares,
    kelly_fraction_pct,
    max_loss_brl,
    max_gain_brl,
    expected_value_brl: expected_value,
    roi_pct,
    edge: ((q_adj - price_c) * 100).toFixed(1),
  }
}

export function getRiskLevel(kelly_fraction_pct: string) {
  const kf = parseFloat(kelly_fraction_pct)
  if (kf < 0.5) return { level: "very_low", label: "Muito Baixo", color: "emerald" }
  if (kf < 1.5) return { level: "low", label: "Baixo", color: "green" }
  if (kf < 3.0) return { level: "moderate", label: "Moderado", color: "yellow" }
  return { level: "high", label: "Alto", color: "rose" }
}

export async function fetchExternalSignals(market: Market, apiClient: any): Promise<ExternalSignals> {
  try {
    const prompt = `Analise o seguinte mercado preditivo e forneça sinais externos baseados em fontes confiáveis brasileiras:

Mercado: "${market.title ?? ""}"
Categoria: ${market.category ?? ""}
Preço SIM atual: ${((market.yes_price ?? 0.5) * 100).toFixed(0)}%\n\nConsidere fontes como:\n- Banco Central do Brasil (para economia/juros)\n- IBGE (para indicadores oficiais)\n- B3 (para mercados financeiros)\n- Notícias Reuters/Valor (para eventos verificáveis)\n\nRetorne análise com:\n1. news_intensity (0-1): intensidade noticiosa recente\n2. directional_consensus (-1 a 1): consenso direcional (-1=NÃO, 0=neutro, 1=SIM)\n3. macro_shock (0-1): mudanças bruscas em indicadores relevantes\n4. external_probability (0-1): probabilidade estimada por fontes externas\n5. confidence (0-1): confiança na estimativa\n6. key_indicators: lista de indicadores chave encontrados\n7. sources: fontes consultadas`;

    const response = await apiClient.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          news_intensity: { type: "number" },
          directional_consensus: { type: "number" },
          macro_shock: { type: "number" },
          external_probability: { type: "number" },
          confidence: { type: "number" },
          key_indicators: { type: "array", items: { type: "string" } },
          sources: { type: "array", items: { type: "string" } },
          summary: { type: "string" },
        },
      },
    })

    return response as ExternalSignals
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching external signals:", error)
    return {
      news_intensity: 0,
      directional_consensus: 0,
      macro_shock: 0,
      external_probability: market.yes_price ?? 0.5,
      confidence: 0.3,
      key_indicators: [],
      sources: [],
      summary: "Dados externos não disponíveis",
    }
  }
}

export function formatBRL(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
