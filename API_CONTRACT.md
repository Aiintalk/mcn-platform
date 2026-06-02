# MCN 内容运营平台 · API 契约文档

> 版本 v2.0 · 2026-06-02（M2 已实现）
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

## 4. 红人管理

> 列表/详情/创建：已登录用户均可访问；编辑：本人负责 or admin；软删（归档）：仅 admin。

---

### 4.1 红人列表

```
GET /api/kols
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 默认 20，最大 100 |
| status | string | 否 | `active`（默认）\| `archived` |
| ownerId | string | 否 | 按负责人 ID 过滤 |
| tag | string | 否 | 按标签精确匹配 |

**成功响应** `200`

```json
{
  "data": {
    "items": [
      {
        "id": "1",
        "name": "陶然",
        "douyinId": "taoran2024",
        "douyinUrl": null,
        "avatarUrl": null,
        "tags": ["中年女性", "情感"],
        "status": "active",
        "createdAt": "2026-06-01T08:00:00.000Z",
        "updatedAt": "2026-06-01T10:00:00.000Z",
        "owner": { "id": "2", "displayName": "王芳" },
        "profiles": [{ "id": "1", "version": 1, "createdAt": "2026-06-01T09:00:00.000Z" }]
      }
    ],
    "total": 3,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 4.2 创建红人

```
POST /api/kols
```

**权限**：任意已登录用户

**请求体**

```json
{
  "name": "陶然",
  "douyinId": "taoran2024",
  "douyinUrl": "https://www.douyin.com/user/xxx",
  "secUserId": "MS4wLj...",
  "avatarUrl": null,
  "tags": ["中年女性", "情感"],
  "ownerId": "2"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| name | string | 是 | 红人姓名 |
| douyinId | string | 否 | 抖音号，全局唯一 |
| douyinUrl | string | 否 | 主页链接 |
| secUserId | string | 否 | 抖音 secUserId |
| avatarUrl | string | 否 | 头像 URL |
| tags | string[] | 否 | 标签列表，默认 `[]` |
| ownerId | string | 否 | 负责人 ID，默认当前登录用户 |

**成功响应** `201`

```json
{
  "data": {
    "id": "4",
    "name": "陶然",
    "douyinId": "taoran2024",
    "douyinUrl": null,
    "avatarUrl": null,
    "tags": ["中年女性"],
    "status": "active",
    "createdAt": "2026-06-02T08:00:00.000Z",
    "updatedAt": "2026-06-02T08:00:00.000Z",
    "owner": { "id": "2", "displayName": "王芳" }
  }
}
```

**失败响应**

- `400`：name 缺失
- `409`：douyinId 已存在

---

### 4.3 红人详情

```
GET /api/kols/:id
```

**权限**：任意已登录用户

**成功响应** `200`

```json
{
  "data": {
    "id": "1",
    "name": "陶然",
    "douyinId": "taoran2024",
    "douyinUrl": null,
    "secUserId": null,
    "avatarUrl": null,
    "tags": ["中年女性"],
    "status": "active",
    "createdAt": "2026-06-01T08:00:00.000Z",
    "updatedAt": "2026-06-01T10:00:00.000Z",
    "owner": { "id": "2", "displayName": "王芳" },
    "profiles": [
      {
        "id": "2",
        "version": 2,
        "isCurrent": true,
        "soulMd": "...",
        "contentPlanMd": "...",
        "sourceFileUrl": null,
        "createdAt": "2026-06-02T09:00:00.000Z"
      }
    ]
  }
}
```

---

### 4.4 编辑红人

```
PATCH /api/kols/:id
```

**权限**：本人负责（ownerId = me）或 admin。仅 admin 可修改 ownerId。

**请求体**（所有字段均可选，至少传一个）

```json
{
  "name": "新名字",
  "douyinId": "new_id",
  "douyinUrl": "https://...",
  "secUserId": "...",
  "avatarUrl": "https://...",
  "tags": ["新标签"],
  "ownerId": "3",
  "status": "archived"
}
```

**成功响应** `200`：返回更新后的红人对象（同详情格式，不含 profiles）

---

### 4.5 归档红人（软删）

```
DELETE /api/kols/:id
```

**权限**：仅 admin

将 `status` 置为 `archived`。

**成功响应** `200`

```json
{ "data": { "message": "已归档" } }
```

---

### 4.6 上传覆盖人格档案

```
POST /api/kols/:id/upload-profile
```

**权限**：本人负责 or admin

**请求体**

```json
{
  "soulMd": "# 人设档案 Markdown 内容...",
  "contentPlanMd": "# 内容规划 Markdown 内容...",
  "sourceFileUrl": "https://oss.example.com/profiles/xxx.md"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| soulMd | string | 条件必填 | 人设灵魂 MD，至少传 soulMd / contentPlanMd 之一 |
| contentPlanMd | string | 条件必填 | 内容规划 MD |
| sourceFileUrl | string | 否 | 源文件 OSS URL |

> 接口自动将旧档案 `isCurrent` 改为 `false`，新版本 `version = 旧最大值 + 1`，`isCurrent = true`。

**成功响应** `201`

```json
{
  "data": {
    "id": "3",
    "kolId": "1",
    "version": 2,
    "isCurrent": true,
    "soulMd": "...",
    "contentPlanMd": "...",
    "sourceFileUrl": null,
    "createdAt": "2026-06-02T09:00:00.000Z",
    "createdBy": { "id": "2", "displayName": "王芳" }
  }
}
```

---

## 5. 产品管理

> 列表/详情：所有已登录用户；创建/编辑：仅 admin。

---

### 5.1 产品列表

```
GET /api/products
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | number | 否 | 默认 1 |
| pageSize | number | 否 | 默认 20，最大 100 |
| status | string | 否 | `active`（默认）\| `archived` |
| category | string | 否 | 按品类精确筛选 |
| q | string | 否 | 产品名称模糊搜索 |

**成功响应** `200`

```json
{
  "data": {
    "items": [
      {
        "id": "1",
        "name": "胶原蛋白精华液",
        "category": "护肤",
        "price": 299,
        "targetAudience": "25-40岁女性",
        "scenario": "日常护肤",
        "status": "active",
        "createdAt": "2026-06-01T08:00:00.000Z",
        "updatedAt": "2026-06-01T10:00:00.000Z",
        "sellingPoints": [{ "id": "1", "version": 1 }]
      }
    ],
    "total": 3,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 5.2 创建产品

```
POST /api/products
```

**权限**：仅 admin

**请求体**

```json
{
  "name": "胶原蛋白精华液",
  "category": "护肤",
  "price": 299,
  "targetAudience": "25-40岁女性",
  "scenario": "日常护肤"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| name | string | 是 | 产品名称 |
| category | string | 否 | 品类 |
| price | number | 否 | 售价（非负） |
| targetAudience | string | 否 | 目标受众 |
| scenario | string | 否 | 使用场景 |

**成功响应** `201`：返回新建产品对象

**失败响应**

- `400`：name 缺失 / price 非法
- `403`：非 admin

---

### 5.3 产品详情

```
GET /api/products/:id
```

**权限**：任意已登录用户

**成功响应** `200`

```json
{
  "data": {
    "id": "1",
    "name": "胶原蛋白精华液",
    "category": "护肤",
    "price": 299,
    "targetAudience": "25-40岁女性",
    "scenario": "日常护肤",
    "status": "active",
    "createdAt": "2026-06-01T08:00:00.000Z",
    "updatedAt": "2026-06-01T10:00:00.000Z",
    "sellingPoints": [
      {
        "id": "1",
        "version": 1,
        "isCurrent": true,
        "endorsement": "临床背书文案...",
        "mechanism": "作用机制文案...",
        "seeding": "种草逻辑文案...",
        "rawDocUrl": null,
        "createdAt": "2026-06-01T09:00:00.000Z",
        "createdBy": { "id": "1", "displayName": "张冲" }
      }
    ]
  }
}
```

---

### 5.4 编辑产品

```
PATCH /api/products/:id
```

**权限**：仅 admin

**请求体**（所有字段均可选，至少传一个）

```json
{
  "name": "新名称",
  "category": "保健",
  "price": 199,
  "targetAudience": "...",
  "scenario": "...",
  "status": "archived"
}
```

**成功响应** `200`：返回更新后的产品对象（不含 sellingPoints）

---

### 5.5 删除产品

```
DELETE /api/products/:id
```

**权限**：仅 admin

物理删除产品及其关联的卖点卡数据（级联删除）。

**成功响应** `200`

```json
{ "data": { "message": "已删除" } }
```

**失败响应**

- `404`：产品不存在

---

### 5.6 上传卖点卡

```
POST /api/products/:id/upload-selling-points
```

**权限**：仅 admin

前端将 .docx 文档解析为三段文案后，以 JSON 方式提交。接口自动将旧版本 `isCurrent` 改为 `false`，新版本 `version = 旧最大值 + 1`，`isCurrent = true`。

**请求体**

```json
{
  "endorsement": "临床背书文案...",
  "mechanism": "作用机制文案...",
  "seeding": "种草逻辑文案...",
  "rawDocUrl": null
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| endorsement | string | 否 | 背书段落 |
| mechanism | string | 否 | 机制段落 |
| seeding | string | 否 | 种草段落 |
| rawDocUrl | string | 否 | 源文件 OSS URL（M2 暂传 null） |

> 三段内容至少传一个有效值；全部为 null 时视为无效请求。

**成功响应** `201`

```json
{
  "data": {
    "id": "2",
    "productId": "1",
    "version": 2,
    "isCurrent": true,
    "endorsement": "临床背书文案...",
    "mechanism": "作用机制文案...",
    "seeding": "种草逻辑文案...",
    "rawDocUrl": null,
    "createdAt": "2026-06-02T10:00:00.000Z",
    "createdBy": { "id": "1", "displayName": "张冲" }
  }
}
```

**失败响应**

- `400`：请求体解析失败
- `404`：产品不存在

---

## 6. 爆款库

> 所有已登录用户均可读写。

---

### 6.1 爆款库列表

```
GET /api/viral-scripts
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | number | 否 | 默认 1 |
| pageSize | number | 否 | 默认 20，最大 100 |
| type | string | 否 | `persona` \| `qianchuan` \| `livestream` \| `tiktok` |
| kolId | string | 否 | 按红人筛选 |
| productId | string | 否 | 按产品筛选 |

**成功响应** `200`

```json
{
  "data": {
    "items": [
      {
        "id": "1",
        "type": "persona",
        "title": "爆款标题",
        "sourceUrl": "https://www.douyin.com/video/xxx",
        "platform": "douyin",
        "diggCount": "120000",
        "publishAt": "2026-05-01T12:00:00.000Z",
        "kolId": "1",
        "productId": null,
        "createdAt": "2026-06-01T08:00:00.000Z",
        "kol": { "id": "1", "name": "陶然" },
        "product": null,
        "uploadedBy": { "id": "2", "displayName": "王芳" }
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 6.2 新建爆款

```
POST /api/viral-scripts
```

**请求体**

```json
{
  "type": "persona",
  "title": "爆款标题",
  "sourceUrl": "https://www.douyin.com/video/xxx",
  "platform": "douyin",
  "diggCount": 120000,
  "publishAt": "2026-05-01T12:00:00.000Z",
  "transcript": "完整文字稿...",
  "structureMd": "结构化分析 MD...",
  "kolId": "1",
  "productId": null
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| type | string | 是 | `persona` \| `qianchuan` \| `livestream` \| `tiktok` |
| title | string | 否 | 标题 |
| sourceUrl | string | 否 | 原视频 URL |
| platform | string | 否 | 平台名 |
| diggCount | number | 否 | 点赞数 |
| publishAt | ISO8601 | 否 | 发布时间 |
| transcript | string | 否 | 文字稿 |
| structureMd | string | 否 | 结构分析 MD |
| kolId | string | 否 | 关联红人 ID |
| productId | string | 否 | 关联产品 ID |

**成功响应** `201`：返回新建爆款对象

**失败响应**

- `400`：type 缺失或无效

---

## 7. 统计汇总

### 7.1 看板统计汇总

```
GET /api/stats/summary
```

**权限**：任意已登录用户

**成功响应** `200`

```json
{
  "data": {
    "kols": { "total": 10, "active": 8 },
    "products": { "total": 5, "active": 4 },
    "viralScripts": { "total": 32 },
    "outputs": { "total": 156 }
  }
}
```
