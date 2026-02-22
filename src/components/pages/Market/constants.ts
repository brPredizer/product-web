export const categoryLabels: Record<string, string> = {
  'EM-ALTA': 'Em Alta',
  'NOVIDADES': 'Novidades',
  'TODAS': 'Todas',
  'POLITICA': 'Política',
  'ESPORTES': 'Esportes',
  'CULTURA': 'Cultura',
  'CRIPTOMOEDAS': 'Criptomoedas',
  'CLIMA': 'Clima',
  'ECONOMIA': 'Economia',
  'MENCOES': 'Menções',
  'EMPRESAS': 'Empresas',
  'FINANCAS': 'Finanças',
  'TECNOLOGIA-E-CIENCIA': 'Tecnologia e Ciência',
  'SAUDE': 'Saúde',
  'MUNDO': 'Mundo',
};

export const categoryColors: Record<string, string> = {
  CLIMA: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/25',
  CRIPTOMOEDAS: 'bg-amber-500/10 text-amber-800 border-amber-500/25',
  CULTURA: 'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/25',
  ECONOMIA: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25',
  'EM-ALTA': 'bg-lime-400/15 text-lime-800 border-lime-500/25',
  EMPRESAS: 'bg-sky-500/10 text-sky-700 border-sky-500/25',
  ESPORTES: 'bg-orange-500/10 text-orange-700 border-orange-500/25',
  FINANCAS: 'bg-rose-500/10 text-rose-700 border-rose-500/25',
  MENCOES: 'bg-slate-200 text-slate-700 border-slate-300/60',
  MUNDO: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/25',
  NOVIDADES: 'bg-teal-500/10 text-teal-700 border-teal-500/25',
  POLITICA: 'bg-blue-500/10 text-blue-700 border-blue-500/25',
  SAUDE: 'bg-red-500/10 text-red-700 border-red-500/25',
  'TECNOLOGIA-E-CIENCIA': 'bg-purple-500/10 text-purple-700 border-purple-500/25',
};

export const statusLabels: Record<string, { label: string; color: string }> = {
  open: { label: "Aberto", color: "bg-emerald-100 text-emerald-700" },
  closed: { label: "Encerrado", color: "bg-slate-100 text-slate-700" },
  resolved_yes: { label: "Resolvido: SIM", color: "bg-emerald-100 text-emerald-700" },
  resolved_no: { label: "Resolvido: NÃO", color: "bg-rose-100 text-rose-700" },
  cancelled: { label: "Cancelado", color: "bg-amber-100 text-amber-700" },
};
