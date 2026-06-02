'use client'

import { useState, useEffect, useCallback } from 'react'
import { pinyin } from 'pinyin-pro'
import { formatDate } from '@/lib/utils'

function generateUsername(displayName: string, existingUsernames: string[]): string {
  const base = pinyin(displayName, { toneType: 'none', separator: '' })
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  if (!base) return ''
  if (!existingUsernames.includes(base)) return base
  let i = 1
  while (existingUsernames.includes(`${base}${i}`)) i++
  return `${base}${i}`
}

type User = {
  id: string
  username: string
  displayName: string
  role: 'admin' | 'operator'
  status: 'active' | 'disabled'
  lastLoginAt: string | null
  createdAt: string
}

type DialogMode = 'create' | 'edit' | 'reset-password' | null

const ROLE_LABEL: Record<string, string> = { admin: '管理员', operator: '运营' }
const STATUS_LABEL: Record<string, string> = { active: '正常', disabled: '已禁用' }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const [formUsername, setFormUsername] = useState('')
  const [formDisplayName, setFormDisplayName] = useState('')
  const [formRole, setFormRole] = useState<'admin' | 'operator'>('operator')
  const [formPassword, setFormPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [resetSuccessPassword, setResetSuccessPassword] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (roleFilter) params.set('role', roleFilter)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/users?${params}`)
    if (res.ok) {
      const body = await res.json()
      setUsers(body.data.items)
      setTotal(body.data.total)
    }
    setLoading(false)
  }, [roleFilter, statusFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // 新建模式下：姓名变化时自动生成账号
  useEffect(() => {
    if (dialogMode !== 'create' || !formDisplayName.trim()) return
    const existingUsernames = users.map(u => u.username)
    setFormUsername(generateUsername(formDisplayName.trim(), existingUsernames))
  }, [formDisplayName, dialogMode, users])

  const filtered = users.filter((u) =>
    !search || u.username.includes(search) || u.displayName.includes(search)
  )

  function openCreate() {
    setFormUsername(''); setFormDisplayName(''); setFormRole('operator')
    setFormPassword('Mcn@123456'); setFormError(''); setSelectedUser(null)
    setDialogMode('create')
  }
  function openEdit(user: User) {
    setFormDisplayName(user.displayName); setFormRole(user.role)
    setFormError(''); setSelectedUser(user); setDialogMode('edit')
  }
  function openResetPassword(user: User) {
    setFormPassword('Mcn@123456'); setFormError(''); setSelectedUser(user)
    setDialogMode('reset-password')
  }
  function closeDialog() {
    setDialogMode(null); setSelectedUser(null)
    setFormError(''); setResetSuccessPassword('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setFormError('')
    if (formPassword.length < 8) { setFormError('密码至少 8 位'); return }
    setFormLoading(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: formUsername, displayName: formDisplayName, role: formRole, password: formPassword }),
    })
    setFormLoading(false)
    if (!res.ok) {
      const body = await res.json()
      setFormError(body.error ?? '创建失败'); return
    }
    closeDialog(); fetchUsers()
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return
    setFormLoading(true)
    const res = await fetch(`/api/users/${selectedUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: formDisplayName, role: formRole }),
    })
    setFormLoading(false)
    if (!res.ok) { const body = await res.json(); setFormError(body.error ?? '保存失败'); return }
    closeDialog(); fetchUsers()
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser) return
    if (formPassword.length < 8) { setFormError('密码至少 8 位'); return }
    setFormLoading(true)
    const res = await fetch(`/api/users/${selectedUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: formPassword }),
    })
    setFormLoading(false)
    if (!res.ok) { const body = await res.json(); setFormError(body.error ?? '重置失败'); return }
    setResetSuccessPassword(formPassword)
    fetchUsers()
  }

  async function toggleStatus(user: User) {
    const next = user.status === 'active' ? 'disabled' : 'active'
    await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    fetchUsers()
  }

  async function handleDelete(user: User) {
    if (!confirm(`确认删除用户「${user.displayName}」？此操作不可恢复。`)) return
    await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
    fetchUsers()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 个账号</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition"
          style={{ background: '#f59a23' }}
        >
          + 新建账号
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="搜索账号 / 姓名"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 w-52"
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400">
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="operator">运营</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400">
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="disabled">已禁用</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">账号</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">姓名</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">角色</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">状态</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">最近登录</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">加载中…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">暂无数据</td></tr>
            )}
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-gray-700">{user.username}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{user.displayName}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>{ROLE_LABEL[user.role]}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{STATUS_LABEL[user.status]}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(user.lastLoginAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(user)} className="text-xs text-blue-600 hover:underline">编辑</button>
                    <button onClick={() => openResetPassword(user)} className="text-xs text-gray-500 hover:underline">重置密码</button>
                    <button onClick={() => toggleStatus(user)}
                      className={`text-xs hover:underline ${user.status === 'active' ? 'text-orange-500' : 'text-green-600'}`}>
                      {user.status === 'active' ? '禁用' : '启用'}
                    </button>
                    <button onClick={() => handleDelete(user)} className="text-xs text-red-500 hover:underline">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialogMode && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={closeDialog}>
          <div className="bg-white rounded-2xl shadow-2xl w-[440px] p-8" onClick={e => e.stopPropagation()}>
            {dialogMode === 'create' && (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-6">新建账号</h2>
                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <Field label="姓名"><input value={formDisplayName} onChange={e => setFormDisplayName(e.target.value)} required placeholder="真实姓名" className="input-base" /></Field>
                  <Field label="账号">
                    <input value={formUsername} onChange={e => setFormUsername(e.target.value)} required placeholder="输入姓名后自动生成" className="input-base" />
                    <p className="text-xs text-gray-400 mt-1">由姓名全拼自动生成，可手动修改</p>
                  </Field>
                  <Field label="角色">
                    <select value={formRole} onChange={e => setFormRole(e.target.value as 'admin' | 'operator')} className="input-base">
                      <option value="operator">运营</option>
                      <option value="admin">管理员</option>
                    </select>
                  </Field>
                  <Field label="初始密码">
                    <input type="text" value={formPassword} onChange={e => setFormPassword(e.target.value)} required placeholder="至少 8 位，首次登录强制修改" className="input-base" />
                    <p className="text-xs text-gray-400 mt-1">已预填默认密码，可直接修改</p>
                  </Field>
                  {formError && <p className="text-sm text-red-500">{formError}</p>}
                  <DialogActions loading={formLoading} onCancel={closeDialog} submitLabel="创建账号" />
                </form>
              </>
            )}
            {dialogMode === 'edit' && selectedUser && (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-1">编辑账号</h2>
                <p className="text-sm text-gray-400 mb-6">@{selectedUser.username}</p>
                <form onSubmit={handleEdit} className="flex flex-col gap-4">
                  <Field label="姓名"><input value={formDisplayName} onChange={e => setFormDisplayName(e.target.value)} required className="input-base" /></Field>
                  <Field label="角色">
                    <select value={formRole} onChange={e => setFormRole(e.target.value as 'admin' | 'operator')} className="input-base">
                      <option value="operator">运营</option>
                      <option value="admin">管理员</option>
                    </select>
                  </Field>
                  {formError && <p className="text-sm text-red-500">{formError}</p>}
                  <DialogActions loading={formLoading} onCancel={closeDialog} submitLabel="保存" />
                </form>
              </>
            )}
            {dialogMode === 'reset-password' && selectedUser && (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-1">重置密码</h2>
                {resetSuccessPassword ? (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-green-500 text-xl">✓</span>
                      <span className="text-gray-900 font-medium">重置成功</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      「{selectedUser.displayName}」的密码已重置，请将以下密码告知本人，下次登录需修改：
                    </p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                      <span className="font-mono text-gray-900 text-sm tracking-wider">{resetSuccessPassword}</span>
                    </div>
                    <button
                      onClick={closeDialog}
                      className="mt-6 w-full py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition"
                      style={{ background: '#f59a23' }}
                    >
                      关闭
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-400 mb-6">为「{selectedUser.displayName}」设置新密码，下次登录强制修改。</p>
                    <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                      <Field label="新密码">
                        <input type="text" value={formPassword} onChange={e => setFormPassword(e.target.value)} required placeholder="至少 8 位" className="input-base" />
                      </Field>
                      {formError && <p className="text-sm text-red-500">{formError}</p>}
                      <DialogActions loading={formLoading} onCancel={closeDialog} submitLabel="重置密码" />
                    </form>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .input-base {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-base:focus {
          border-color: #f59a23;
          box-shadow: 0 0 0 2px rgba(245, 154, 35, 0.15);
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function DialogActions({ loading, onCancel, submitLabel }: { loading: boolean; onCancel: () => void; submitLabel: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel}
        className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition">
        取消
      </button>
      <button type="submit" disabled={loading}
        className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
        style={{ background: '#f59a23' }}>
        {loading ? '提交中…' : submitLabel}
      </button>
    </div>
  )
}
