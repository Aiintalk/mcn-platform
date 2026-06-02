export type SellingPoint = {
  type: 'endorsement' | 'mechanism' | 'seeding'
  content: string
}

export type MockProduct = {
  id: string
  name: string
  category: string
  price: number
  status: 'active' | 'archived'
  targetAudience: string
  updatedAt: string
  sellingPoints: SellingPoint[]
  viralScriptIds: string[]
  benchmarkScriptIds: string[]
}

export const mockProducts: MockProduct[] = [
  {
    id: '1',
    name: '胶原蛋白精华液',
    category: '护肤',
    price: 299,
    status: 'active',
    targetAudience: '25-40岁爱护肤女性',
    updatedAt: '2026-05-30T10:00:00Z',
    sellingPoints: [
      { type: 'endorsement', content: '经皮肤科医生测试，连续使用28天，85%受试者反馈肤质改善' },
      { type: 'mechanism', content: '专利三重胶原蛋白复合体，分子量小于500道尔顿，更易被皮肤吸收' },
      { type: 'seeding', content: '闺蜜推荐后买的，用完第一瓶就回购了，皮肤真的更Q弹了' },
    ],
    viralScriptIds: ['1', '2'],
    benchmarkScriptIds: ['1'],
  },
  {
    id: '2',
    name: '益生菌固体饮料',
    category: '保健',
    price: 168,
    status: 'active',
    targetAudience: '25-45岁注重肠胃健康人群',
    updatedAt: '2026-05-28T09:00:00Z',
    sellingPoints: [
      { type: 'endorsement', content: '含活性益生菌300亿CFU，经国际权威机构认证' },
      { type: 'mechanism', content: '冻干粉技术保活，室温保存2年活性不减，每天一小袋改善肠道菌群' },
      { type: 'seeding', content: '便秘困扰了我三年，用了这个一个月后真的顺畅了很多' },
    ],
    viralScriptIds: ['3'],
    benchmarkScriptIds: ['2'],
  },
  {
    id: '3',
    name: '防晒霜SPF50+',
    category: '护肤',
    price: 89,
    status: 'active',
    targetAudience: '18-35岁户外活动人群',
    updatedAt: '2026-05-25T11:00:00Z',
    sellingPoints: [
      { type: 'endorsement', content: 'SPF50+ PA++++，通过防水测试，游泳后40分钟仍有防护效果' },
      { type: 'mechanism', content: '物化结合防晒技术，内含光稳定剂防止防晒成分分解，持效长达8小时' },
      { type: 'seeding', content: '户外爬山必带，不油腻不泛白，夏天用了整整一年' },
    ],
    viralScriptIds: [],
    benchmarkScriptIds: ['3'],
  },
]
