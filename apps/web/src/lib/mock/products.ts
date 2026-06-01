export type MockProduct = {
  id: string
  name: string
  category: string
  price: number
  status: 'active' | 'archived'
  updatedAt: string
}

export const mockProducts: MockProduct[] = [
  { id: '1', name: '胶原蛋白精华液', category: '护肤', price: 299, status: 'active', updatedAt: '2026-05-30T10:00:00Z' },
  { id: '2', name: '益生菌固体饮料', category: '保健', price: 168, status: 'active', updatedAt: '2026-05-28T09:00:00Z' },
  { id: '3', name: '防晒霜SPF50+', category: '护肤', price: 89, status: 'active', updatedAt: '2026-05-25T11:00:00Z' },
]
