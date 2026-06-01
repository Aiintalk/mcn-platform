'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('账号或密码错误')
      return
    }

    // middleware 会处理 mustChangePassword 跳转
    router.push('/')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #f59a23 0%, #fdf6ec 100%)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl px-14 py-12 w-[420px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-4"
            style={{ background: '#f59a23' }}
          >
            达
          </div>
          <h1 className="text-xl font-bold text-gray-900">达人说 AI 内容运营平台</h1>
          <p className="text-sm text-gray-400 mt-1.5">内部系统 · 仅限授权员工使用</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">账号</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入账号"
              required
              autoComplete="username"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-lg text-white font-medium text-sm transition disabled:opacity-60 hover:opacity-90"
            style={{ background: '#f59a23' }}
          >
            {loading ? '登录中…' : '登录'}
          </button>

          <p className="text-xs text-gray-400 text-center mt-1">忘记密码？联系管理员重置</p>
        </form>
      </div>
    </div>
  )
}
