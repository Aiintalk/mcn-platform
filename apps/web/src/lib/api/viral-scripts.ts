// ─── Types ───────────────────────────────────────────────────────────────────

// API uses 'livestream' — our UI uses 'live' as the tab key.
// Map between the two at the boundary (fetch/submit functions).
export type ApiViralScriptType = 'persona' | 'qianchuan' | 'livestream' | 'tiktok'

export type ApiViralScript = {
  id: string
  type: ApiViralScriptType
  title: string | null
  sourceUrl: string | null
  platform: string | null
  /** BigInt serialized as string */
  diggCount: string | null
  publishAt: string | null
  transcript: string | null
  structureMd: string | null
  kolId: string | null
  productId: string | null
  createdAt: string
  kol: { id: string; name: string } | null
  product: { id: string; name: string } | null
  uploadedBy: { id: string; displayName: string }
}

export type ViralScriptListParams = {
  page?: number
  pageSize?: number
  type?: ApiViralScriptType
  kolId?: string
  productId?: string
}

export type CreateViralScriptBody = {
  type: ApiViralScriptType
  title?: string
  sourceUrl?: string
  platform?: string
  diggCount?: number
  publishAt?: string
  transcript?: string
  structureMd?: string
  kolId?: string | null
  productId?: string | null
}

export type UpdateViralScriptBody = Partial<CreateViralScriptBody>

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error ?? `请求失败 (${res.status})`)
  return body.data as T
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function fetchViralScripts(params?: ViralScriptListParams): Promise<{
  items: ApiViralScript[]
  total: number
  page: number
  pageSize: number
}> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  if (params?.type) qs.set('type', params.type)
  if (params?.kolId) qs.set('kolId', params.kolId)
  if (params?.productId) qs.set('productId', params.productId)
  return apiFetch(`/api/viral-scripts?${qs}`)
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createViralScript(body: CreateViralScriptBody): Promise<ApiViralScript> {
  return apiFetch('/api/viral-scripts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateViralScript(
  id: string,
  body: UpdateViralScriptBody
): Promise<ApiViralScript> {
  return apiFetch(`/api/viral-scripts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteViralScript(id: string): Promise<{ message: string }> {
  return apiFetch(`/api/viral-scripts/${id}`, { method: 'DELETE' })
}
