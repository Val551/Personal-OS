-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastCalendarSyncAt" TIMESTAMP(3),
ADD COLUMN     "lastPRSyncAt" TIMESTAMP(3);
