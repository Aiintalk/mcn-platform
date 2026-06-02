import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 小时
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: '账号', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        })

        if (!user) return null
        if (user.status !== 'active') throw new Error('ACCOUNT_DISABLED')

        const passwordValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!passwordValid) return null

        // 更新最近登录时间
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id.toString(),
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          // passwordChangedAt 为 null 表示从未改过密，强制改密
          mustChangePassword: user.passwordChangedAt === null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.displayName = user.displayName
        token.role = user.role
        token.mustChangePassword = user.mustChangePassword
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        username: token.username,
        displayName: token.displayName,
        role: token.role as Role,
        mustChangePassword: token.mustChangePassword,
      }
      return session
    },
  },
}
