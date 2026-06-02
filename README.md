# MCN 内容运营平台

面向 MCN 机构的内容运营管理系统，整合红人管理、产品管理、爆款库与 AI 工具，帮助运营团队提升内容创作效率。

---

## 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | Next.js 14 App Router + TypeScript |
| 样式 | Tailwind CSS |
| 数据库 | PostgreSQL 15 + Prisma 5 |
| 认证 | next-auth v4（JWT，8h） |
| 进程管理 | PM2 cluster（4 workers） |
| 反向代理 | Nginx |
| 包管理 | pnpm 9（monorepo） |

---

## 项目结构

```
mcn-platform/
├── apps/
│   └── web/                    # Next.js 主应用
│       ├── prisma/             # 数据库 schema & 迁移
│       ├── src/
│       │   ├── app/
│       │   │   ├── (admin)/    # 管理员端页面
│       │   │   ├── (operator)/ # 运营端页面
│       │   │   ├── (auth)/     # 登录 / 改密页面
│       │   │   └── api/        # API 路由
│       │   ├── components/     # 公共 UI 组件
│       │   └── lib/            # 工具函数 / API 客户端
│       └── .env.example        # 环境变量模板
├── packages/                   # 共享库（AI / ASR / OSS / TikHub）
├── docs/                       # 项目文档
│   ├── M1/                     # 基础底座文档
│   ├── M2/                     # 数据中台文档
│   ├── M3/                     # 工具迁移文档
│   └── 部署/                   # 服务器部署 / 数据库 / 发布流程
├── nginx/                      # Nginx 配置
├── scripts/                    # 部署 & 备份脚本
├── ecosystem.config.js         # PM2 配置
└── API_CONTRACT.md             # API 接口文档 v2.0
```

---

## 用户角色

| 角色 | 说明 | 登录后进入 |
|---|---|---|
| `admin` | 管理员，维护基础数据与账号 | `/admin` |
| `operator` | 运营人员，使用 AI 工具创作内容 | `/` |

---

## 里程碑进度

| 里程碑 | 状态 | 内容 |
|---|---|---|
| M1 基础底座 | ✅ 已完成 | 登录鉴权、JWT、用户管理 CRUD |
| M2 数据中台 | ✅ 已完成 | 红人管理、产品管理、爆款库、运营端只读页面 |
| M3 工具迁移 | 🟡 规划中 | 9 个 AI 工具模块迁移，待产品决策 |
| M4 看板统计 | ⬜ 未启动 | |
| M5 收尾迁移 | ⬜ 未启动 | |

---

## 本地开发

### 前置要求

- Node.js 20+
- pnpm 9+
- PostgreSQL 15

### 启动步骤

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp apps/web/.env.example apps/web/.env.local
# 编辑 .env.local，填写 DATABASE_URL 和 NEXTAUTH_SECRET

# 3. 初始化数据库
cd apps/web
pnpm db:migrate   # 创建表结构
pnpm db:seed      # 写入初始数据

# 4. 启动开发服务器
pnpm dev
```

访问 `http://localhost:3000`

**测试账号**

| 账号 | 密码 | 角色 |
|---|---|---|
| `admin` | `admin123` | 管理员（首次登录需改密） |
| `operator01` | `Operator@123` | 运营（首次登录需改密） |

---

## 数据库表

| 表名 | 说明 |
|---|---|
| `users` | 用户账号（角色 / 状态 / 密码哈希） |
| `kols` | 红人基础信息 |
| `kol_profiles` | 红人档案版本（人设 + 内容规划） |
| `kol_product_relations` | 红人 ↔ 产品关联 |
| `materials` | 红人素材库 |
| `products` | 产品基础信息 |
| `product_selling_points` | 产品卖点版本（背书 / 机制 / 种草） |
| `viral_scripts` | 爆款库（人设 / 千川 / 直播 / TikTok） |
| `benchmark_scripts` | 对标素材 |
| `outputs` | 运营产出记录 |
| `tool_usage_logs` | 工具调用日志 |

---

## 服务器部署

详见 [`docs/部署/服务器部署文档.md`](docs/部署/服务器部署文档.md)

```bash
# 首次部署
bash scripts/deploy.sh

# 日常发布（推送后在服务器执行）
bash scripts/deploy.sh
```

---

## API 文档

完整接口文档见 [`API_CONTRACT.md`](API_CONTRACT.md)，当前版本 v2.0，覆盖：

- 鉴权（登录 / 登出 / 改密）
- 用户管理
- 红人管理（含档案版本管理）
- 产品管理（含卖点版本管理）
- 爆款库
- 统计汇总

---

## 文档索引

| 文档 | 路径 |
|---|---|
| M1 需求文档 | `docs/M1/M1-需求文档.md` |
| M1 验收报告 | `docs/M1/M1-验收报告.md` |
| M2 需求文档 | `docs/M2/M2-需求文档.md` |
| M2 验收文档 | `docs/M2/M2-验收文档.md` |
| M2 后端开发文档 | `docs/M2/M2-后端开发文档.md` |
| M2 前端开发文档 | `docs/M2/M2-前端开发文档.md` |
| M2 运维文档 | `docs/M2/M2-运维文档.md` |
| M3 待决策问题 | `docs/M3/M3-待决策问题.md` |
| 服务器部署文档 | `docs/部署/服务器部署文档.md` |
| 数据库初始化 | `docs/部署/数据库初始化.md` |
| 发布流程 | `docs/部署/发布流程.md` |
