import { PrismaClient, Role, UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 超管账号（文档测试账号：admin / admin123）
  const adminHash = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      displayName: '管理员',
      passwordHash: adminHash,
      role: Role.admin,
      status: UserStatus.active,
      // passwordChangedAt 为 null → 首次登录强制改密
    },
  })

  // 运营测试账号 1
  const op1Hash = await bcrypt.hash('Operator@123', 12)
  await prisma.user.upsert({
    where: { username: 'operator01' },
    update: {},
    create: {
      username: 'operator01',
      displayName: '运营一号',
      passwordHash: op1Hash,
      role: Role.operator,
      status: UserStatus.active,
      createdById: admin.id,
    },
  })

  // 运营测试账号 2
  const op2Hash = await bcrypt.hash('Operator@456', 12)
  await prisma.user.upsert({
    where: { username: 'operator02' },
    update: {},
    create: {
      username: 'operator02',
      displayName: '运营二号',
      passwordHash: op2Hash,
      role: Role.operator,
      status: UserStatus.active,
      createdById: admin.id,
    },
  })

  // 示例红人
  const kol1 = await prisma.kol.upsert({
    where: { douyinId: 'demo_kol_001' },
    update: {},
    create: {
      name: '示例红人 A',
      douyinId: 'demo_kol_001',
      tags: ['美妆', '护肤'],
      ownerId: admin.id,
    },
  })

  const kol2 = await prisma.kol.upsert({
    where: { douyinId: 'demo_kol_002' },
    update: {},
    create: {
      name: '示例红人 B',
      douyinId: 'demo_kol_002',
      tags: ['穿搭', '生活方式'],
      ownerId: admin.id,
    },
  })

  await prisma.kol.upsert({
    where: { douyinId: 'demo_kol_003' },
    update: {},
    create: {
      name: '示例红人 C',
      douyinId: 'demo_kol_003',
      tags: ['美食', '探店'],
      ownerId: admin.id,
    },
  })

  // 为红人 A 创建初始档案
  const existingProfile = await prisma.kolProfile.findFirst({
    where: { kolId: kol1.id, isCurrent: true },
  })
  if (!existingProfile) {
    await prisma.kolProfile.create({
      data: {
        kolId: kol1.id,
        soulMd: '# 示例红人 A 人格档案\n\n> 待填写',
        contentPlanMd: '# 示例红人 A 内容规划\n\n> 待填写',
        version: 1,
        isCurrent: true,
        createdById: admin.id,
      },
    })
  }

  // 示例产品
  await prisma.product.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      name: '示例产品 X',
      category: '护肤',
      price: 299.0,
      targetAudience: '25-35 岁女性',
      scenario: '日常护肤',
    },
  })

  console.log('✅ Seed 完成')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
