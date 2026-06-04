import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAdmin } from '@/lib/api-helpers'
import { Role, UserStatus } from '@prisma/client'

const VALID_USER_STATUSES = Object.values(UserStatus)
const VALID_USER_ROLES = Object.values(Role)

// GET /api/users — 用户列表
export async function GET(req: NextRequest) {
  const { res } = await requireAdmin()
  if (res) return res

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20')))
  const statusRaw = searchParams.get('status')
  const roleRaw = searchParams.get('role')
  // 枚举白名单：值无效时静默忽略，不报错
  const status = statusRaw && VALID_USER_STATUSES.includes(statusRaw as UserStatus) ? (statusRaw as UserStatus) : null
  const role = roleRaw && VALID_USER_ROLES.includes(roleRaw as Role) ? (roleRaw as Role) : null

  const where = {
    ...(status ? { status } : {}),
    ...(role ? { role } : {}),
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        createdBy: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return ok({
    items: users.map((u) => ({ ...u, id: u.id.toString() })),
    total,
    page,
    pageSize,
  })
}

// POST /api/users — 创建用户
export async function POST(req: NextRequest) {
  const { session, res } = await requireAdmin()
  if (res) return res

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 400)
  }

  const { username, displayName, password, role } = body as Record<string, string>

  if (!username || !displayName || !password || !role) {
    return err('username / displayName / password / role 均为必填', 400)
  }
  if (!['admin', 'operator'].includes(role)) {
    return err('role 必须为 admin 或 operator', 400)
  }
  // Task 9: 用户名格式校验
  if (!/^[a-zA-Z0-9_-]{3,50}$/.test(username)) {
    return err('username 只能含字母、数字、_ 和 -，长度 3~50', 400)
  }
  // Task 9: 显示名格式校验
  const trimmedDisplayName = displayName.trim()
  if (trimmedDisplayName.length === 0 || trimmedDisplayName.length > 100) {
    return err('displayName 长度须在 1~100 之间', 400)
  }
  // Task 10: 密码复杂度校验
  if (password.length < 8) {
    return err('密码至少 8 位', 400)
  }
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return err('密码须包含至少 1 个大写字母和 1 个数字', 400)
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) return err('账号已存在', 409)

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      username,
      displayName: trimmedDisplayName,
      passwordHash,
      role: role as Role,
      status: UserStatus.active,
      // passwordChangedAt 留 null → 首次登录强制改密
      createdById: BigInt(session!.user.id),
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      status: true,
      createdAt: true,
    },
  })

  return ok({ ...user, id: user.id.toString() }, 201)
}
