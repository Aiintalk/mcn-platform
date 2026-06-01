-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'operator');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "kol_status" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "viral_script_type" AS ENUM ('persona', 'qianchuan', 'livestream', 'tiktok');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "status" "user_status" NOT NULL DEFAULT 'active',
    "password_changed_at" TIMESTAMPTZ,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kols" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "douyin_id" VARCHAR(100),
    "douyin_url" TEXT,
    "sec_user_id" VARCHAR(100),
    "avatar_url" TEXT,
    "tags" TEXT[],
    "owner_id" BIGINT,
    "status" "kol_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "kols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kol_profiles" (
    "id" BIGSERIAL NOT NULL,
    "kol_id" BIGINT NOT NULL,
    "soul_md" TEXT,
    "content_plan_md" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "source_file_url" TEXT,
    "created_by" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kol_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(100),
    "price" DECIMAL(10,2),
    "target_audience" TEXT,
    "scenario" TEXT,
    "status" "product_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_selling_points" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "endorsement" TEXT,
    "mechanism" TEXT,
    "seeding" TEXT,
    "raw_doc_url" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_by" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_selling_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viral_scripts" (
    "id" BIGSERIAL NOT NULL,
    "type" "viral_script_type" NOT NULL,
    "title" VARCHAR(300),
    "source_url" TEXT,
    "platform" VARCHAR(30),
    "digg_count" BIGINT,
    "publish_at" TIMESTAMPTZ,
    "transcript" TEXT,
    "structure_md" TEXT,
    "kol_id" BIGINT,
    "product_id" BIGINT,
    "uploaded_by" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viral_scripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmark_scripts" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT,
    "title" VARCHAR(300),
    "source_url" TEXT,
    "transcript" TEXT,
    "digg_count" BIGINT,
    "uploaded_by" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "benchmark_scripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outputs" (
    "id" BIGSERIAL NOT NULL,
    "tool_code" VARCHAR(50) NOT NULL,
    "user_id" BIGINT,
    "kol_id" BIGINT,
    "product_id" BIGINT,
    "title" VARCHAR(300),
    "result_md" TEXT,
    "payload_jsonb" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_usage_logs" (
    "id" BIGSERIAL NOT NULL,
    "tool_code" VARCHAR(50),
    "user_id" BIGINT,
    "action" VARCHAR(50),
    "meta" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" BIGSERIAL NOT NULL,
    "kol_id" BIGINT NOT NULL,
    "type" VARCHAR(30),
    "title" VARCHAR(300),
    "source" VARCHAR(50),
    "digg_count" BIGINT,
    "content" TEXT,
    "uploaded_by" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kol_product_relations" (
    "kol_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,

    CONSTRAINT "kol_product_relations_pkey" PRIMARY KEY ("kol_id","product_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "kols_douyin_id_key" ON "kols"("douyin_id");

-- CreateIndex
CREATE INDEX "idx_outputs_tool_user" ON "outputs"("tool_code", "user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_outputs_kol" ON "outputs"("kol_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_outputs_product" ON "outputs"("product_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_tool_usage_logs_time" ON "tool_usage_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kols" ADD CONSTRAINT "kols_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_profiles" ADD CONSTRAINT "kol_profiles_kol_id_fkey" FOREIGN KEY ("kol_id") REFERENCES "kols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_profiles" ADD CONSTRAINT "kol_profiles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_selling_points" ADD CONSTRAINT "product_selling_points_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_selling_points" ADD CONSTRAINT "product_selling_points_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viral_scripts" ADD CONSTRAINT "viral_scripts_kol_id_fkey" FOREIGN KEY ("kol_id") REFERENCES "kols"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viral_scripts" ADD CONSTRAINT "viral_scripts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viral_scripts" ADD CONSTRAINT "viral_scripts_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmark_scripts" ADD CONSTRAINT "benchmark_scripts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmark_scripts" ADD CONSTRAINT "benchmark_scripts_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outputs" ADD CONSTRAINT "outputs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outputs" ADD CONSTRAINT "outputs_kol_id_fkey" FOREIGN KEY ("kol_id") REFERENCES "kols"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outputs" ADD CONSTRAINT "outputs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_usage_logs" ADD CONSTRAINT "tool_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_kol_id_fkey" FOREIGN KEY ("kol_id") REFERENCES "kols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_product_relations" ADD CONSTRAINT "kol_product_relations_kol_id_fkey" FOREIGN KEY ("kol_id") REFERENCES "kols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kol_product_relations" ADD CONSTRAINT "kol_product_relations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
