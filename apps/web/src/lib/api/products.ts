// ─── Response Types ──────────────────────────────────────────────────────────

export type ApiSellingPoint = {
  id: string
  version: number
  isCurrent: boolean
  endorsement: string | null
  mechanism: string | null
  seeding: string | null
  rawDocUrl: string | null
  createdAt: string
  createdBy: { id: string; displayName: string }
}

export type ApiSellingPointSummary = { id: string; version: number }

export type ApiProductListItem = {
  id: string
  name: string
  category: string | null
  price: number
  targetAudience: string | null
  scenario: string | null
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
  sellingPoints: ApiSellingPointSummary[]
}

export type ApiProductDetail = Omit<ApiProductListItem, 'sellingPoints'> & {
  sellingPoints: ApiSellingPoint[]
}

export type ProductListParams = {
  page?: number
  pageSize?: number
  status?: string
  category?: string
  q?: string
}

export type CreateProductBody = {
  name: string
  category?: string
  price?: number
  targetAudience?: string
  scenario?: string
}

export type UpdateProductBody = Partial<CreateProductBody & { status: 'active' | 'archived' }>

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error ?? `请求失败 (${res.status})`)
  return body.data as T
}

// ─── Products list ────────────────────────────────────────────────────────────

export async function fetchProducts(params?: ProductListParams): Promise<{
  items: ApiProductListItem[]
  total: number
  page: number
  pageSize: number
}> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  if (params?.status) qs.set('status', params.status)
  if (params?.category) qs.set('category', params.category)
  if (params?.q) qs.set('q', params.q)
  return apiFetch(`/api/products?${qs}`)
}

// ─── Product detail ───────────────────────────────────────────────────────────

export async function fetchProduct(id: string): Promise<ApiProductDetail> {
  return apiFetch(`/api/products/${id}`)
}

// ─── Product create ───────────────────────────────────────────────────────────

export async function createProduct(body: CreateProductBody): Promise<ApiProductListItem> {
  return apiFetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── Product update ───────────────────────────────────────────────────────────

export async function updateProduct(
  id: string,
  body: UpdateProductBody
): Promise<ApiProductListItem> {
  return apiFetch(`/api/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
