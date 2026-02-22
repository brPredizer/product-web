// (removed unused SPECIAL_CATEGORIES) keep categories list below with PT-BR labels

export const sortOptions = [
  { value: "-volume_total", label: "Mais Popular" },
  { value: "-created_date", label: "Mais Recente" },
  { value: "closing_date", label: "Encerra Primeiro" },
  { value: "-yes_price", label: "Maior Probabilidade" },
  { value: "yes_price", label: "Menor Probabilidade" },
  { value: "-imbalance", label: "Maior Desbalanceamento" },
  { value: "-volatility_24h", label: "Maior Volatilidade (24h)" },
];

export const probabilityBuckets = [
  { id: "low", label: "0% - 30%", min: 0, max: 0.3 },
  { id: "mid", label: "30% - 70%", min: 0.3, max: 0.7 },
  { id: "high", label: "70% - 100%", min: 0.7, max: 1 },
];

export const closingOptions = [
  { id: "any", label: "Qualquer data" },
  { id: "today", label: "Hoje" },
  { id: "7", label: "Até 7 dias" },
  { id: "30", label: "Até 30 dias" },
  { id: "90", label: "Até 90 dias" },
];

// Lista fixa de categorias (slugs do backend) com nomes em PT-BR
// Ordem: Todas, Em Alta, Novidades, depois o resto conforme seed
export const categories = [
  { id: "TODAS", name: "Todas" },
  { id: "EM-ALTA", name: "Em Alta" },
  { id: "NOVIDADES", name: "Novidades" },
  { id: "CLIMA", name: "Clima" },
  { id: "CRIPTOMOEDAS", name: "Criptomoedas" },
  { id: "CULTURA", name: "Cultura" },
  { id: "ECONOMIA", name: "Economia" },
  { id: "EMPRESAS", name: "Empresas" },
  { id: "ESPORTES", name: "Esportes" },
  { id: "FINANCAS", name: "Finanças" },
  { id: "MENCOES", name: "Menções" },
  { id: "MUNDO", name: "Mundo" },
  { id: "POLITICA", name: "Política" },
  { id: "SAUDE", name: "Saúde" },
  { id: "TECNOLOGIA-E-CIENCIA", name: "Tecnologia e Ciência" },
];
