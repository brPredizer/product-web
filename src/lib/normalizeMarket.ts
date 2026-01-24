export function normalizeMarket(raw: any) {
  if (!raw) return null;

  const yesPrice = Number(raw.yesPrice ?? raw.yes_price ?? 0);
  const noPrice = Number(raw.noPrice ?? raw.no_price ?? (1 - yesPrice));

  return {
    ...raw,
    // keep original camelCase too but provide snake_case for older UI
    yes_price: yesPrice,
    no_price: noPrice,
    yesPrice: yesPrice,
    noPrice: noPrice,
    closing_date: raw.closingDate ?? raw.closing_date ?? null,
    created_date: raw.createdDate ?? raw.created_date ?? null,
    closingDate: raw.closingDate ?? raw.closing_date ?? null,
    createdDate: raw.createdDate ?? raw.created_date ?? null,
    volume_total: Number(raw.volumeTotal ?? raw.volume_total ?? 0),
    volumeTotal: Number(raw.volumeTotal ?? raw.volume_total ?? 0),
    probability_yes: Number(raw.probabilityYes ?? raw.probability_yes ?? (yesPrice * 100)),
    probabilityYes: Number(raw.probabilityYes ?? raw.probability_yes ?? (yesPrice * 100)),
  } as any;
}

export function normalizeHistoryPoint(point: any) {
  if (!point) return null;
  return {
    timestamp: point.timestamp ?? point.time ?? point.t ?? null,
    yesPrice: Number(point.yesPrice ?? point.yes_price ?? 0),
    noPrice: Number(point.noPrice ?? point.no_price ?? (1 - (point.yesPrice ?? point.yes_price ?? 0))),
    volume: Number(point.volume ?? point.volumeTotal ?? 0),
  };
}
