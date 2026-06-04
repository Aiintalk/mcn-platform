#!/bin/bash
# deploy.sh — MCN Platform 一键部署脚本
# 用法：在服务器 /opt/mcn-platform 目录下执行 bash scripts/deploy.sh
# 任意步骤失败立即中止，不会执行后续步骤

set -e  # 遇到错误立即退出

PROJECT_DIR="/opt/dev/mcn-platform"
APP_NAME="mcn-web"
LOG_TAG="[deploy]"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}${LOG_TAG}${NC} $1"; }
warn() { echo -e "${YELLOW}${LOG_TAG} WARNING:${NC} $1"; }
fail() { echo -e "${RED}${LOG_TAG} ERROR:${NC} $1"; exit 1; }

# ── 前置检查 ──────────────────────────────────────────────
log "开始部署 MCN Platform..."
log "时间: $(date '+%Y-%m-%d %H:%M:%S')"

cd "$PROJECT_DIR" || fail "项目目录不存在：$PROJECT_DIR"

command -v pnpm  >/dev/null 2>&1 || fail "pnpm 未安装"
command -v pm2   >/dev/null 2>&1 || fail "pm2 未安装"

# ── Step 1: 拉取最新代码 ──────────────────────────────────
log "Step 1/5: 拉取最新代码 (main)..."
git pull origin main || fail "git pull 失败，请检查网络或 SSH Key 配置"
log "当前 commit: $(git log --oneline -1)"

# ── Step 2: 安装依赖 ──────────────────────────────────────
log "Step 2/5: 安装依赖..."
pnpm install --frozen-lockfile || fail "pnpm install 失败"

# ── Step 3: 数据库迁移 ────────────────────────────────────
log "Step 3/5: 执行数据库迁移..."
# Prisma 默认只读 .env，生产环境用 .env.production 需手动同步
if [ -f "apps/web/.env.production" ] && [ ! -f "apps/web/.env" ]; then
  cp apps/web/.env.production apps/web/.env
  log ".env.production → .env 已同步"
fi
cd apps/web && npx prisma generate && cd ../..
pnpm db:deploy || fail "数据库迁移失败，请检查 DATABASE_URL 配置"

# ── Step 4: 构建 ──────────────────────────────────────────
log "Step 4/5: 构建生产包..."
pnpm build || fail "构建失败，请查看以上错误信息"

# ── Step 5: 热重载 ────────────────────────────────────────
log "Step 5/5: 热重载应用（零停机）..."
if pm2 list | grep -q "$APP_NAME"; then
  pm2 reload "$APP_NAME" || fail "pm2 reload 失败"
else
  warn "未发现运行中的 $APP_NAME，执行首次启动..."
  pm2 start ecosystem.config.js --env production
  pm2 save
fi

# ── 完成 ──────────────────────────────────────────────────
log "=============================="
log "部署完成！"
log "时间: $(date '+%Y-%m-%d %H:%M:%S')"
log "进程状态:"
pm2 list | grep "$APP_NAME"
