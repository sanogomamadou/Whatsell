-- AlterTable subscriptions: ajouter warningSentAt pour idempotency des emails J-2
ALTER TABLE "subscriptions" ADD COLUMN "warningSentAt" TIMESTAMP(3);

-- AlterTable subscriptions: aligner ordersLimit default sur la règle métier FREE tier (20)
ALTER TABLE "subscriptions" ALTER COLUMN "ordersLimit" SET DEFAULT 20;
