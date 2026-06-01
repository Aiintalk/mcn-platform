export type MockUser = {
  id: string
  username: string
  displayName: string
  role: 'admin' | 'operator'
  status: 'active' | 'disabled'
  lastLoginAt: string | null
  createdAt: string
}

export const mockUsers: MockUser[] = [
  {
    id: '1',
    username: 'zhangchong',
    displayName: '张冲',
    role: 'admin',
    status: 'active',
    lastLoginAt: '2026-06-01T09:12:00Z',
    createdAt: '2026-05-01T00:00:00Z',
  },
  {
    id: '2',
    username: 'wangfang',
    displayName: '王芳',
    role: 'operator',
    status: 'active',
    lastLoginAt: '2026-06-01T08:30:00Z',
    createdAt: '2026-05-10T00:00:00Z',
  },
  {
    id: '3',
    username: 'liming',
    displayName: '李明',
    role: 'operator',
    status: 'active',
    lastLoginAt: '2026-05-31T17:45:00Z',
    createdAt: '2026-05-10T00:00:00Z',
  },
  {
    id: '4',
    username: 'zhaolei',
    displayName: '赵磊',
    role: 'operator',
    status: 'disabled',
    lastLoginAt: '2026-05-20T10:00:00Z',
    createdAt: '2026-05-12T00:00:00Z',
  },
  {
    id: '5',
    username: 'chenxiao',
    displayName: '陈晓',
    role: 'operator',
    status: 'active',
    lastLoginAt: null,
    createdAt: '2026-05-28T00:00:00Z',
  },
]
