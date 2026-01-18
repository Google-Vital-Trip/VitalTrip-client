-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'ACK', 'FIXED', 'IGNORED');

-- CreateTable
CREATE TABLE "SentryIssue" (
    "id" TEXT NOT NULL,
    "project" TEXT,
    "environment" TEXT,
    "level" TEXT,
    "title" TEXT,
    "culprit" TEXT,
    "url" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "windowStartAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "windowCount" INTEGER NOT NULL DEFAULT 0,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "lastNotifiedAt" TIMESTAMP(3),
    "triageJson" JSONB,
    "triageUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "SentryIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMsg" TEXT,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriageRun" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" JSONB NOT NULL,

    CONSTRAINT "TriageRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SentryIssue_lastSeenAt_idx" ON "SentryIssue"("lastSeenAt");

-- CreateIndex
CREATE INDEX "NotificationLog_issueId_sentAt_idx" ON "NotificationLog"("issueId", "sentAt");

-- CreateIndex
CREATE INDEX "TriageRun_issueId_createdAt_idx" ON "TriageRun"("issueId", "createdAt");

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "SentryIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageRun" ADD CONSTRAINT "TriageRun_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "SentryIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
