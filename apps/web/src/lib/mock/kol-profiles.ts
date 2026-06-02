export type MockKolProfileVersion = {
  id: string
  kolId: string
  version: number
  type: 'soul' | 'content_plan'
  content: string
  createdAt: string
  createdByName: string
}

export const mockKolProfileVersions: MockKolProfileVersion[] = [
  {
    id: 'v1',
    kolId: '1',
    version: 1,
    type: 'soul',
    content: `# 陶然 · 人格档案 v1.0\n\n初始版本，基础人设建立。\n\n**标签**：中年女性 / 情感\n\n**定位**：分享中年女性的真实生活故事。`,
    createdAt: '2026-04-01T09:00:00Z',
    createdByName: '王芳',
  },
  {
    id: 'v2',
    kolId: '1',
    version: 2,
    type: 'soul',
    content: `# 陶然 · 人格档案 v2.0\n\n第二版，增加"成长"方向，完善禁忌项。\n\n**标签**：中年女性 / 情感 / 成长\n\n**核心定位**：40+ 职场女性的精神共鸣者，用真实经历传递中年觉醒与自我重建。`,
    createdAt: '2026-05-01T10:00:00Z',
    createdByName: '王芳',
  },
  {
    id: 'v3',
    kolId: '1',
    version: 3,
    type: 'soul',
    content: `# 陶然 · 人格档案 v3.0（当前版本）\n\n第三版，最终版，增加口头禅和选题方向细化。`,
    createdAt: '2026-05-30T10:00:00Z',
    createdByName: '张冲',
  },
  {
    id: 'v4',
    kolId: '1',
    version: 1,
    type: 'content_plan',
    content: `# 陶然 · 内容规划 v1.0\n\nQ1 规划初稿，待补充。`,
    createdAt: '2026-04-10T09:00:00Z',
    createdByName: '王芳',
  },
  {
    id: 'v5',
    kolId: '1',
    version: 2,
    type: 'content_plan',
    content: `# 陶然 · 内容规划 v2.0（当前版本）\n\nQ2 完整规划，《重新出发》系列12期。`,
    createdAt: '2026-05-02T14:00:00Z',
    createdByName: '王芳',
  },
  {
    id: 'v6',
    kolId: '2',
    version: 1,
    type: 'soul',
    content: `# 林晓雨 · 人格档案 v1.0\n\n初始版本。\n\n**定位**：职场干货分享者。`,
    createdAt: '2026-04-05T10:00:00Z',
    createdByName: '李明',
  },
  {
    id: 'v7',
    kolId: '2',
    version: 2,
    type: 'soul',
    content: `# 林晓雨 · 人格档案 v2.0（当前版本）\n\n升级版，增加AI提效定位。`,
    createdAt: '2026-05-20T10:00:00Z',
    createdByName: '李明',
  },
  {
    id: 'v8',
    kolId: '3',
    version: 1,
    type: 'soul',
    content: `# 苏墨 · 人格档案 v1.0（当前版本）\n\n初始版本，慢生活人设建立。`,
    createdAt: '2026-04-15T09:00:00Z',
    createdByName: '王芳',
  },
]
