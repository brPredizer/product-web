import { apiRequest, API_BASE_URL } from '@/app/api/api'
import { authClient } from '@/app/api/auth'

export type RiskTermResponse = {
  termVersion?: string
  text: string
}

export type RiskAcceptance = {
  id: string
  userId: string | null
  marketId: string | null
  termVersion?: string | null
  acceptedAt?: string | null
  termSnapshot?: string | null
  termHash?: string | null
}

type RiskTermsParams = {
  version?: string | null
  marketId?: string | null
}

type AcceptRiskPayload = {
  marketId: string
  termVersion?: string | null
  termSnapshot?: string | null
  termHash?: string | null
}

const buildQuery = (params?: RiskTermsParams) => {
  const search = new URLSearchParams()
  if (!params) return ''
  if (params.version) search.set('version', params.version)
  if (params.marketId) search.set('marketId', params.marketId)
  const query = search.toString()
  return query ? `?${query}` : ''
}

export const isAcceptanceMissingError = (error: any) => {
  const normalize = (value: unknown) => (typeof value === 'string' ? value.toLowerCase() : '')

  const candidates = [
    normalize(error?.code),
    normalize(error?.message),
    normalize(error?.payload?.message),
    normalize(error?.payload?.code),
    normalize(error?.payload?.title),
  ]

  return candidates.some((value) =>
    value.includes('acceptance_not_found') || value.includes('acceptance not found')
  )
}

const normalizeAcceptance = (data: any): RiskAcceptance | null => {
  if (!data || typeof data !== 'object') return null

  return {
    id: String(data.id ?? data.Id ?? ''),
    userId: data.userId ?? data.user_id ?? null,
    marketId: data.marketId ?? data.market_id ?? null,
    termVersion: data.termVersion ?? data.term_version ?? null,
    acceptedAt: data.acceptedAt ?? data.accepted_at ?? data.createdAt ?? data.created_at ?? null,
    termSnapshot: data.termSnapshot ?? data.term_snapshot ?? null,
    termHash: data.termHash ?? data.term_hash ?? null,
  }
}

const getRiskTerms = async (params?: RiskTermsParams): Promise<RiskTermResponse> => {
  const query = buildQuery(params)
  return apiRequest<RiskTermResponse>(`/terms/risk-terms${query}`)
}

const getAcceptance = async (params?: { marketId?: string | null }): Promise<RiskAcceptance | null> => {
  const query = buildQuery({ marketId: params?.marketId ?? undefined })
  try {
    const raw = await authClient.requestWithAuth<any>(`/terms/risk-acceptance${query}`)
    if (isAcceptanceMissingError({ payload: raw, message: raw?.message, code: raw?.code })) {
      return null
    }
    return normalizeAcceptance(raw)
  } catch (error: any) {
    if (error?.status === 404 || isAcceptanceMissingError(error)) return null
    throw error
  }
}

const acceptRiskTerms = async (payload: AcceptRiskPayload): Promise<RiskAcceptance | null> => {
  const body = {
    marketId: payload.marketId,
    termVersion: payload.termVersion ?? undefined,
    termSnapshot: payload.termSnapshot ?? undefined,
    termHash: payload.termHash ?? undefined,
  }

  const raw = await authClient.requestWithAuth<any>('/terms/risk-acceptance', {
    method: 'POST',
    body,
  })

  return normalizeAcceptance(raw)
}

const sanitizeUserSlug = (value: string) =>
  value
    // Remove diacritics so "joão" becomes "joao" before slugging.
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    // Keep only ASCII letters, digits and hyphen to avoid download quirks.
    .replace(/[^0-9a-zA-Z-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'usuario'

const formatDateLabel = (value?: string | null) => {
  const base = value ? new Date(value) : new Date()
  const fallback = new Date()
  const date = Number.isNaN(base.getTime()) ? fallback : base
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`
}

const downloadAcceptance = async (params?: { marketId?: string | null; acceptedAt?: string | null }) => {
  const url = `${API_BASE_URL || ''}/terms/risk-acceptance/download`

  const buildHeaders = () => {
    const headers: Record<string, string> = {}
    const token = authClient.getSession?.().accessToken
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }

  const attempt = async () => {
    return fetch(url, {
      method: 'GET',
      headers: buildHeaders(),
      credentials: 'include',
    })
  }

  let response = await attempt()

  if (response.status === 401) {
    try {
      await authClient.refresh?.()
      response = await attempt()
    } catch (err) {
      // fall through and let error handler run below
    }
  }

  if (!response.ok) {
    let message = 'Falha ao baixar comprovante de aceite'
    try {
      const text = await response.text()
      if (text) message = text
    } catch (err) {
      /* ignore */
    }
    const error = new Error(message) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  const blob = await response.blob()
  const disposition = response.headers.get('content-disposition') || ''

  const sessionUser = authClient.getSession?.().user
  const rawName =
    sessionUser?.full_name ||
    sessionUser?.fullName ||
    sessionUser?.name ||
    sessionUser?.username ||
    sessionUser?.email ||
    ''
  const safeName = sanitizeUserSlug(rawName)
  const dateLabel = formatDateLabel(params?.acceptedAt)
  const fallbackFilename = `aceite-termo-de-risco-${safeName}-${dateLabel}.pdf`

  const filenameStar = disposition.match(/filename\*=UTF-8''([^;]+)(?:;|$)/i)?.[1]
  const filenameSimple = disposition.match(/filename="?([^";]+)"?/i)?.[1]
  const decodedFilename = filenameStar
    ? decodeURIComponent(filenameStar)
    : filenameSimple
      ? filenameSimple
      : fallbackFilename

  const filename = decodedFilename || fallbackFilename

  return { blob, filename }
}

export const riskTermsClient = {
  getRiskTerms,
  getAcceptance,
  acceptRiskTerms,
  downloadAcceptance,
  isAcceptanceMissingError,
}

export default riskTermsClient
