-- Script to manually create password reset tokens table if needed
-- Run this only if the table doesn't exist

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'password_reset_tokens') THEN
        CREATE TABLE "password_reset_tokens" (
            "id" TEXT NOT NULL,
            "user_id" TEXT NOT NULL,
            "token" TEXT NOT NULL,
            "expires_at" TIMESTAMP(3) NOT NULL,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "used_at" TIMESTAMP(3),
            CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
        );

        CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");
        CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");
        CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

        ALTER TABLE "password_reset_tokens" 
            ADD CONSTRAINT "password_reset_tokens_user_id_fkey" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
