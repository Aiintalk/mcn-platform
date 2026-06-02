// ─── Response Types ──────────────────────────────────────────────────────────

export type ApiKolOwner = { id: string; displayName: string }

export type ApiKolProfileSummary = {
  id: string
  version: number
  createdAt: string
}

export type ApiKolListItem = {
  id: string
  name: string
  douyinId: string | null
  douyinUrl: string | null
  avatarUrl: string | null
  tags: string[]
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
  owner: ApiKolOwner
  profiles: ApiKolProfileSummary[]
}

export type ApiKolProfile = {
  id: string
  version: number
  isCurrent: boolean
  soulMd: string | null
  contentPlanMd: string | null
  sourceFileUrl: string | null
  createdAt: string
  createdBy?: { id: string; displayName: string }
}

export type ApiKolDetail = Omit<ApiKolListItem, 'profiles'> & {
  secUserId: string | null
  profiles: ApiKolProfile[]
}

export type KolListParams = {
  page?: number
  pageSize?: number
  status?: string
  ownerId?: string
  tag?: string
}

export type CreateKolBody = {
  name: string
  douyinId?: string
  douyinUrl?: string
  secUserId?: string
  avatarUrl?: string
  tags?: string[]
  ownerId?: string
}

export type UpdateKolBody = Partial<CreateKolBody & { status: 'active' | 'archived' }>

export type UploadProfileBody = {
  soulMd?: string
  contentPlanMd?: string
  sourceFileUrl?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error ?? `请求失败 (${res.status})`)
  return body.data as T
}

// ─── KOL list ────────────────────────────────────────────────────────────────

export async function fetchKols(params?: KolListParams): Promise<{
  items: ApiKolListItem[]
  total: number
  page: number
  pageSize: number
}> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  if (params?.status) qs.set('status', params.status)
  if (params?.ownerId) qs.set('ownerId', params.ownerId)
  if (params?.tag) qs.set('tag', params.tag)
  return apiFetch(`/api/kols?${qs}`)
}

// ─── KOL detail ──────────────────────────────────────────────────────────────

export async function fetchKol(id: string): Promise<ApiKolDetail> {
  return apiFetch(`/api/kols/${id}`)
}

// ─── KOL create ──────────────────────────────────────────────────────────────

export async function createKol(body: CreateKolBody): Promise<ApiKolDetail> {
  return apiFetch('/api/kols', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── KOL update ──────────────────────────────────────────────────────────────

export async function updateKol(id: string, body: UpdateKolBody): Promise<ApiKolDetail> {
  return apiFetch(`/api/kols/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── KOL archive ─────────────────────────────────────────────────────────────

export async function archiveKol(id: string): Promise<{ message: string }> {
  return apiFetch(`/api/kols/${id}`, { method: 'DELETE' })
}

// ─── KOL upload profile ──────────────────────────────────────────────────────

export async function uploadKolProfile(
  id: string,
  body: UploadProfileBody
): Promise<ApiKolProfile> {
  return apiFetch(`/api/kols/${id}/upload-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
