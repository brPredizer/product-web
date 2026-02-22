export const toLocalInputValue = (date: Date) => {
  const offsetMs = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
};

export const toIsoStringOrNull = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const toLocalInputOrEmpty = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return toLocalInputValue(date);
};

export const clampProbability = (value: unknown) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 50;
  return Math.min(99, Math.max(1, numeric));
};

export const clampNumber = (n: number, min: number, max: number) => {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
};

export const formatBRDateTime = (value?: string | Date | null) => {
  if (!value) return 'â€”';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return 'â€”';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
