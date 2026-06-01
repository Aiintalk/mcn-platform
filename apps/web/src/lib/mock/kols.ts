export type MockKol = {
  id: string
  name: string
  douyinId: string
  avatarUrl: string | null
  tags: string[]
  ownerName: string
  updatedAt: string
}

export const mockKols: MockKol[] = [
  { id: '1', name: '陶然', douyinId: 'taoran2024', avatarUrl: null, tags: ['中年女性', '情感', '成长'], ownerName: '王芳', updatedAt: '2026-05-30T10:00:00Z' },
  { id: '2', name: '林晓雨', douyinId: 'linxiaoyu', avatarUrl: null, tags: ['职场', '干货', '效率'], ownerName: '李明', updatedAt: '2026-05-29T14:00:00Z' },
  { id: '3', name: '苏墨', douyinId: 'sumo_life', avatarUrl: null, tags: ['生活方式', '美食', '旅行'], ownerName: '王芳', updatedAt: '2026-05-28T09:00:00Z' },
]
