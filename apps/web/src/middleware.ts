import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // 强制改密：除 /change-password 和 /api/auth 和 /api/users/me/change-password 外全部拦截
    if (
      token?.mustChangePassword &&
      !pathname.startsWith('/change-password') &&
      !pathname.startsWith('/api/auth') &&
      !pathname.startsWith('/api/users/me/change-password')
    ) {
      return NextResponse.redirect(new URL('/change-password', req.url))
    }

    // 运营访问 /admin/* 或 /api/admin/* → 403
    const isAdminRoute =
      pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
    if (isAdminRoute && token?.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden', message: '无权访问管理员区域' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // /api/users 管理接口（非 /me）仅 admin 可访问
    const isUsersAdminRoute =
      pathname.startsWith('/api/users') &&
      !pathname.startsWith('/api/users/me')
    if (isUsersAdminRoute && token?.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden', message: '无权访问用户管理接口' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // 未登录时 withAuth 自动跳 /login（pages.signIn）
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    // 保护所有页面和 API，排除静态资源和 NextAuth 自身路由
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)',
  ],
}
