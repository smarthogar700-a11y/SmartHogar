-- =============================================
-- SCHEMA COMPLETO PARA SUPABASE
-- Ejecutar en SQL Editor de Supabase
-- =============================================

-- 1. CREAR ENUMS
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED');
CREATE TYPE "LedgerType" AS ENUM ('DAILY_PROFIT', 'REFERRAL_BONUS', 'WITHDRAW_REQUEST', 'WITHDRAW_REJECT', 'ADJUSTMENT');
CREATE TYPE "BannerLocation" AS ENUM ('HOME_TOP', 'HOME_BOTTOM');

-- 2. TABLA USER
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "user_code" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "sponsor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_user_code_key" ON "User"("user_code");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_sponsor_id_idx" ON "User"("sponsor_id");
CREATE INDEX "User_user_code_idx" ON "User"("user_code");
CREATE INDEX "User_username_idx" ON "User"("username");
CREATE INDEX "User_email_idx" ON "User"("email");

ALTER TABLE "User" ADD CONSTRAINT "User_sponsor_id_fkey"
    FOREIGN KEY ("sponsor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. TABLA VipPackage
CREATE TABLE "VipPackage" (
    "id" SERIAL NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "investment_bs" DOUBLE PRECISION NOT NULL,
    "daily_profit_bs" DOUBLE PRECISION NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "qr_image_url" TEXT,
    "package_image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VipPackage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VipPackage_level_key" ON "VipPackage"("level");
CREATE INDEX "VipPackage_level_idx" ON "VipPackage"("level");

-- 4. TABLA Purchase
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vip_package_id" INTEGER NOT NULL,
    "investment_bs" DOUBLE PRECISION NOT NULL,
    "daily_profit_bs" DOUBLE PRECISION NOT NULL,
    "receipt_url" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "activated_at" TIMESTAMP(3),
    "last_profit_at" TIMESTAMP(3),
    "total_earned_bs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Purchase_user_id_idx" ON "Purchase"("user_id");
CREATE INDEX "Purchase_status_idx" ON "Purchase"("status");
CREATE INDEX "Purchase_activated_at_idx" ON "Purchase"("activated_at");
CREATE INDEX "Purchase_last_profit_at_idx" ON "Purchase"("last_profit_at");

ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_vip_package_id_fkey"
    FOREIGN KEY ("vip_package_id") REFERENCES "VipPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. TABLA WalletLedger
CREATE TABLE "WalletLedger" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "amount_bs" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletLedger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WalletLedger_user_id_idx" ON "WalletLedger"("user_id");
CREATE INDEX "WalletLedger_type_idx" ON "WalletLedger"("type");
CREATE INDEX "WalletLedger_created_at_idx" ON "WalletLedger"("created_at");

ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. TABLA Withdrawal
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_bs" DOUBLE PRECISION NOT NULL,
    "qr_image_url" TEXT,
    "bank_name" TEXT NOT NULL DEFAULT '',
    "account_number" TEXT NOT NULL DEFAULT '',
    "payout_method" TEXT NOT NULL DEFAULT '',
    "phone_number" TEXT NOT NULL DEFAULT '',
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Withdrawal_user_id_idx" ON "Withdrawal"("user_id");
CREATE INDEX "Withdrawal_status_idx" ON "Withdrawal"("status");

ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. TABLA ReferralBonusRule
CREATE TABLE "ReferralBonusRule" (
    "id" SERIAL NOT NULL,
    "level" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralBonusRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferralBonusRule_level_key" ON "ReferralBonusRule"("level");
CREATE INDEX "ReferralBonusRule_level_idx" ON "ReferralBonusRule"("level");

-- 8. TABLA Banner
CREATE TABLE "Banner" (
    "id" SERIAL NOT NULL,
    "location" "BannerLocation" NOT NULL,
    "image_url" TEXT NOT NULL,
    "link_url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Banner_location_order_idx" ON "Banner"("location", "order");

-- 9. TABLA Announcement
CREATE TABLE "Announcement" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Announcement_is_active_idx" ON "Announcement"("is_active");
CREATE INDEX "Announcement_created_at_idx" ON "Announcement"("created_at");

-- 10. TABLA PasswordReset
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");
CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset"("token");
CREATE INDEX "PasswordReset_user_id_idx" ON "PasswordReset"("user_id");

ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 11. TABLA DailyProfitRun
CREATE TABLE "DailyProfitRun" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "last_run_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyProfitRun_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- FIN DEL SCHEMA
-- =============================================
