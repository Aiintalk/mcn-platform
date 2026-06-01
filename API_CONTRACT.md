# MCN 内容运营平台 · M1 API 契约文档

> 版本 v1.0 · 2026-06-01
> 基础 URL：`http://localhost:3000`（开发）/ `https://<域名>`（生产）
> 所有请求/响应均为 JSON，`Content-Type: application/json`。
> 鉴权：登录后 next-auth 自动写 `__Secure-next-auth.session-token` cookie，后续请求携带即可。

---

## 通用响应格式

### 成功
```json
{ "data": { ... } }
```

### 失败
```json
{ "error": "错误描述" }
```

### HTTP 状态码约定

| 状态码 | 含义 |
|---|---|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 参数错误 |
| 401 | 未登录 |
| 403 | 无权限（角色不足） |
| 404 | 资源不存在 |
| 409 | 冲突（如账号已存在） |

---

## 1. 鉴权

### 1.1 登录

```
POST /api/auth/callback/credentials
```

**请求体**

```json
{
  "username": "zhangchong",
  "password": "Admin@123456"
}
```

**成功响应** `200`

next-auth 写入 session cookie，响应体为 next-auth 内部格式（前端通过 `signIn()` 调用，无需手动解析）。

**失败响应** `401`

账号不存在、密码错误或账号已禁用时，`signIn()` 返回 `{ error: "CredentialsSignin" }`。

**登录后 session 包含字段**

```json
{
  "user": {
    "id": "1",
    "username": "zhangchong",
    "displayName": "张冲",
    "role": "admin",
    "mustChangePassword": false
  }
}
```

> `mustChangePassword: true` 时，middleware 自动跳转 `/change-password`，前端无需额外处理。

---

### 1.2 登出

```
POST /api/auth/signout
```

next-auth 标准接口，前端通过 `signOut()` 调用。

---

## 2. 用户管理

> 所有 `/api/users` 接口（除 `/me/change-password`）均需 `role=admin`，否则返回 `403`。

---

### 2.1 获取用户列表

```
GET /api/users
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 20，最大 100 |
| status | string | 否 | `active` \| `disabled` |
| role | string | 否 | `admin` \| `operator` |

**成功响应** `200`

```json
{
  "data": {
    "items": [
      {
        "id": "1",
        "username": "zhangchong",
        "displayName": "张冲",
        "role": "admin",
        "status": "active",
        "lastLoginAt": "2026-06-01T10:00:00.000Z",
        "createdAt": "2026-06-01T08:00:00.000Z",
        "createdBy": { "id": "1", "displayName": "张冲" }
      }
    ],
    "total": 3,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 2.2 创建用户

```
POST /api/users
```

**请求体**

```json
{
  "username": "operator03",
  "displayName": "运营三号",
  "password": "Temp@123456",
  "role": "operator"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | 是 | 账号名，全局唯一 |
| displayName | string | 是 | 显示名称 |
| password | string | 是 | 初始密码，至少 8 位 |
| role | string | 是 | `admin` \| `operator` |

**成功响应** `201`

```json
{
  "data": {
    "id": "4",
    "username": "operator03",
    "displayName": "运营三号",
    "role": "operator",
    "status": "active",
    "createdAt": "2026-06-01T10:30:00.000Z"
  }
}
```

> 新建账号 `passwordChangedAt` 为 `null`，首次登录会被强制跳转改密。

**失败响应**

- `400`：参数缺失 / 密码不足 8 位
- `409`：账号名已存在

---

### 2.3 获取用户详情

```
GET /api/users/:id
```

**成功响应** `200`

```json
{
  "data": {
    "id": "2",
    "username": "operator01",
    "displayName": "运营一号",
    "role": "operator",
    "status": "active",
    "passwordChangedAt": null,
    "lastLoginAt": null,
    "createdAt": "2026-06-01T08:00:00.000Z",
    "createdBy": { "id": "1", "displayName": "张冲" }
  }
}
```

---

### 2.4 编辑用户 / 重置密码 / 启停

```
PATCH /api/users/:id
```

**请求体**（所有字段均可选，至少传一个）

```json
{
  "displayName": "新名字",
  "role": "admin",
  "status": "disabled",
  "password": "NewPass@789"
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| displayName | string | 修改显示名称 |
| role | string | `admin` \| `operator` |
| status | string | `active` \| `disabled` |
| password | string | 重置密码（至少 8 位），重置后 `passwordChangedAt` 清空，下次登录强制改密 |

**成功响应** `200`

```json
{
  "data": {
    "id": "2",
    "username": "operator01",
    "displayName": "新名字",
    "role": "operator",
    "status": "disabled",
    "passwordChangedAt": null,
    "lastLoginAt": null,
    "createdAt": "2026-06-01T08:00:00.000Z"
  }
}
```

---

### 2.5 禁用用户（软删）

```
DELETE /api/users/:id
```

将 `status` 置为 `disabled`，不物理删除。

**成功响应** `200`

```json
{
  "data": { "message": "已禁用" }
}
```

---

### 2.6 修改自己的密码（强制改密 / 主动改密）

```
POST /api/users/me/change-password
```

**权限**：任意已登录用户（包括 `mustChangePassword=true` 状态下）

**请求体**

```json
{
  "currentPassword": "Temp@123456",
  "newPassword": "MyNew@Password1"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| currentPassword | string | 是 | 当前密码 |
| newPassword | string | 是 | 新密码，至少 8 位，不能与当前密码相同 |

**成功响应** `200`

```json
{
  "data": { "message": "密码修改成功" }
}
```

> 修改成功后前端需调用 `signOut()` 并重新登录，以刷新 JWT 中的 `mustChangePassword` 字段。

**失败响应**

- `400`：参数缺失 / 新密码不足 8 位 / 新旧密码相同 / 当前密码错误

---

## 3. 中间件路由规则（供前端参考）

| 路径 | 未登录 | operator | admin |
|---|---|---|---|
| `/login` | 可访问 | 可访问 | 可访问 |
| `/change-password` | 跳 `/login` | 可访问 | 可访问 |
| `/` | 跳 `/login` | 渲染工作台 | 跳 `/admin` |
| `/admin/*` | 跳 `/login` | `403` | 可访问 |
| `/api/auth/*` | 可访问 | 可访问 | 可访问 |
| `/api/users/*`（非 `/me`） | `401` | `403` | 可访问 |
| `/api/users/me/change-password` | `401` | 可访问 | 可访问 |

> `mustChangePassword=true` 时，除 `/change-password` 和 `/api/auth/*` 和 `/api/users/me/change-password` 外，所有路由均跳转 `/change-password`。

---

## 4. M2 预告接口（本期不实现，供前端提前了解）

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/kols` | 红人列表 |
| POST | `/api/kols` | 创建红人 |
| GET | `/api/kols/:id` | 红人详情 |
| PATCH | `/api/kols/:id` | 编辑红人 |
| DELETE | `/api/kols/:id` | 软删红人 |
| POST | `/api/kols/:id/upload-profile` | 上传覆盖人格档案 |
| GET | `/api/products` | 产品列表 |
| POST | `/api/products` | 创建产品 |
| GET | `/api/products/:id` | 产品详情 |
| PATCH | `/api/products/:id` | 编辑产品 |
| GET | `/api/viral-scripts` | 爆款库列表 |
| POST | `/api/viral-scripts` | 新建爆款 |
| GET | `/api/stats/summary` | 看板统计汇总 |
