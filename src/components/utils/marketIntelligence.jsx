// Market Intelligence & Risk Management Utilities

/**
 * Calcula entropia (disputa) de um mercado
 * Máximo em p=0.5 (mercado disputado)
 */
export function calculateEntropy(p) {
  if (p <= 0 || p >= 1) return 0;
  return -(p * Math.log(p) + (1 - p) * Math.log(1 - p));
}

/**
 * Função logit: ln(p / (1-p))
 */
export function logit(p) {
  const clipped = Math.max(0.001, Math.min(0.999, p));
  return Math.log(clipped / (1 - clipped));
}

/**
 * Função sigmoid: 1 / (1 + e^(-x))
 */
export function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Calcula urgência baseada em dias até liquidação
 * Decai exponencialmente
 */
export function calculateUrgency(daysToSettlement, tau = 10) {
  return Math.exp(-daysToSettlement / tau);
}

/**
 * Calcula Ad Theme Score para rankear mercados para campanhas
 * 
 * @param {Object} market - Dados do mercado
 * @param {Object} external - Sinais externos (news, consensus, shock)
 * @param {Object} perf - Performance histórica de campanhas
 * @returns {number} Score de 0 a 1
 */
export function calculateAdThemeScore(market, external = {}, perf = {}) {
  const p_mkt = market.yes_price || 0.5;
  
  // Entropia (disputa) - mercados em ~50% são mais interessantes
  const H = calculateEntropy(p_mkt);
  
  // Crescimento de volume (normalizado)
  const vol_24h = market.volume_24h || 0;
  const vol_7d_avg = market.volume_7d_avg || 1;
  const vol_g = Math.log(1 + vol_24h / Math.max(vol_7d_avg, 1e-9)) / 5; // normalizado
  
  // Volatilidade recente (mockado se não disponível)
  const sig = market.volatility_24h || 0;
  
  // Urgência (proximidade de liquidação)
  const daysToSettlement = market.closing_date 
    ? (new Date(market.closing_date) - new Date()) / (1000 * 60 * 60 * 24)
    : 30;
  const urg = calculateUrgency(daysToSettlement);
  
  // Sinais externos
  const news = external.news_intensity || 0;
  const shock = external.macro_shock || 0;
  
  // Performance
  const conv = perf.conversion_rate || 0;
  const cpa = perf.cpa_normalized || 0.5;
  
  // Score ponderado (pesos calibrados)
  return Math.min(1, Math.max(0,
    0.22 * H +
    0.18 * vol_g +
    0.12 * sig +
    0.18 * urg +
    0.12 * news +
    0.08 * shock +
    0.07 * conv +
    0.03 * (1 - cpa)
  ));
}

/**
 * Combina probabilidade do mercado com sinais externos
 * 
 * @param {number} p_mkt - Probabilidade implícita do mercado (0-1)
 * @param {number} p_ext - Probabilidade de fontes externas (0-1)
 * @param {number} news_signal - Sinal de notícias (-1 a 1)
 * @param {number} liquidity - Liquidez normalizada (0-1)
 * @returns {number} Probabilidade combinada (0-1)
 */
export function blendProbability(p_mkt, p_ext, news_signal = 0, liquidity = 0.5) {
  // Pesos adaptativos
  const w_m = Math.min(1.0, 0.3 + 0.7 * liquidity); // mais liquidez => mais peso no mercado
  const w_e = 1.0 - w_m;
  const w_n = 0.15;
  
  const combined = w_m * logit(p_mkt) + w_e * logit(p_ext) + w_n * news_signal;
  
  return sigmoid(combined);
}

/**
 * Calcula posição recomendada com Kelly Criterion adaptado (0.25 Kelly + cap)
 * 
 * @param {number} bankroll_brl - Saldo disponível em R$
 * @param {number} price_c - Preço do contrato (0-1)
 * @param {number} q_final - Probabilidade estimada (0-1)
 * @param {number} confidence - Confiança na estimativa (0-1)
 * @returns {Object} Recomendação de posição
 */
export function calculateRiskManagedPosition(bankroll_brl, price_c, q_final, confidence = 0.7) {
  // Shrink por incerteza - quanto menor confiança, mais conservador
  const q_adj = confidence * q_final + (1 - confidence) * price_c;
  
  // Kelly Criterion para binário
  const b = (1 - price_c) / price_c;
  const f_kelly = q_adj - (1 - q_adj) / b;
  
  // Fractional Kelly (0.25) + cap de segurança (3% do bankroll)
  const f_cap = 0.03;
  const f = Math.max(0, Math.min(0.25 * f_kelly, f_cap));
  
  // Stake recomendado
  const stake = f * bankroll_brl;
  const shares = Math.floor(stake / price_c);
  
  // Payoffs
  const max_loss_brl = shares * price_c;
  const max_gain_brl = shares * (1 - price_c);
  const expected_value = shares * (q_adj - price_c);
  
  // Kelly fraction como % do bankroll
  const kelly_fraction_pct = (f * 100).toFixed(2);
  
  // ROI potencial
  const roi_pct = max_loss_brl > 0 ? (max_gain_brl / max_loss_brl * 100).toFixed(0) : 0;
  
  return {
    q_adjusted: q_adj,
    stake_recommended_brl: stake,
    shares: shares,
    kelly_fraction_pct: kelly_fraction_pct,
    max_loss_brl: max_loss_brl,
    max_gain_brl: max_gain_brl,
    expected_value_brl: expected_value,
    roi_pct: roi_pct,
    edge: ((q_adj - price_c) * 100).toFixed(1) // edge em pontos percentuais
  };
}

/**
 * Categoriza nível de risco baseado em Kelly fraction
 */
export function getRiskLevel(kelly_fraction_pct) {
  const kf = parseFloat(kelly_fraction_pct);
  if (kf < 0.5) return { level: 'very_low', label: 'Muito Baixo', color: 'emerald' };
  if (kf < 1.5) return { level: 'low', label: 'Baixo', color: 'green' };
  if (kf < 3.0) return { level: 'moderate', label: 'Moderado', color: 'yellow' };
  return { level: 'high', label: 'Alto', color: 'rose' };
}

/**
 * Busca sinais externos para um mercado usando IA
 * (integração com fontes confiáveis)
 */
export async function fetchExternalSignals(market, apiClient) {
  try {
    const prompt = `Analise o seguinte mercado preditivo e forneça sinais externos baseados em fontes confiáveis brasileiras:

Mercado: "${market.title}"
Categoria: ${market.category}
Preço SIM atual: ${(market.yes_price * 100).toFixed(0)}%

Considere fontes como:
- Banco Central do Brasil (para economia/juros)
- IBGE (para indicadores oficiais)
- B3 (para mercados financeiros)
- Notícias Reuters/Valor (para eventos verificáveis)

Retorne análise com:
1. news_intensity (0-1): intensidade noticiosa recente
2. directional_consensus (-1 a 1): consenso direcional (-1=NÃO, 0=neutro, 1=SIM)
3. macro_shock (0-1): mudanças bruscas em indicadores relevantes
4. external_probability (0-1): probabilidade estimada por fontes externas
5. confidence (0-1): confiança na estimativa
6. key_indicators: lista de indicadores chave encontrados
7. sources: fontes consultadas`;

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
          summary: { type: "string" }
        }
      }
    });

    return response;
  } catch (error) {
    console.error('Error fetching external signals:', error);
    return {
      news_intensity: 0,
      directional_consensus: 0,
      macro_shock: 0,
      external_probability: market.yes_price,
      confidence: 0.3,
      key_indicators: [],
      sources: [],
      summary: 'Dados externos não disponíveis'
    };
  }
}

/**
 * Formata valor em BRL
 */
export function formatBRL(value) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}