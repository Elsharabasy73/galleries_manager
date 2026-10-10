-- Google sign-in: linkable googleId + nullable password for OAuth-only accounts.
-- Hand-written to be additive-only.
ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE IF EXISTS "User" ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");
