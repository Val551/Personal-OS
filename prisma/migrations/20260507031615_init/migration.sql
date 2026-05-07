-- CreateEnum
CREATE TYPE "Workspace" AS ENUM ('internship', 'school', 'personal', 'club');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'med', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'doing', 'blocked', 'done');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('meeting', 'worklog', 'general', 'journal');

-- CreateEnum
CREATE TYPE "PRState" AS ENUM ('open', 'draft', 'merged', 'closed');

-- CreateEnum
CREATE TYPE "PRBucket" AS ENUM ('authored', 'review_requested', 'assigned', 'stale');

-- CreateEnum
CREATE TYPE "CIStatus" AS ENUM ('passing', 'failing', 'pending', 'none');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "workspace" "Workspace" NOT NULL,
    "priority" "Priority" NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "linkedMeetingId" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "attendees" TEXT[],
    "description" TEXT,
    "workspace" "Workspace" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "externalId" TEXT,
    "calendarSyncToken" TEXT,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "NoteType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "linkedMeetingId" TEXT,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PullRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "externalId" TEXT,
    "number" INTEGER NOT NULL,
    "repo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "state" "PRState" NOT NULL,
    "bucket" "PRBucket" NOT NULL,
    "author" TEXT NOT NULL,
    "reviewers" TEXT[],
    "htmlUrl" TEXT NOT NULL,
    "additions" INTEGER NOT NULL,
    "deletions" INTEGER NOT NULL,
    "comments" INTEGER NOT NULL,
    "ciStatus" "CIStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PullRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "accomplishments" TEXT NOT NULL,
    "blockers" TEXT NOT NULL,
    "topThree" TEXT NOT NULL,
    "carryOver" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TaskNotes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TaskNotes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Task_userId_status_idx" ON "Task"("userId", "status");

-- CreateIndex
CREATE INDEX "Task_userId_dueAt_idx" ON "Task"("userId", "dueAt");

-- CreateIndex
CREATE INDEX "Task_userId_workspace_idx" ON "Task"("userId", "workspace");

-- CreateIndex
CREATE INDEX "Task_linkedMeetingId_idx" ON "Task"("linkedMeetingId");

-- CreateIndex
CREATE INDEX "Meeting_userId_startAt_idx" ON "Meeting"("userId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_userId_externalId_key" ON "Meeting"("userId", "externalId");

-- CreateIndex
CREATE INDEX "Note_userId_type_idx" ON "Note"("userId", "type");

-- CreateIndex
CREATE INDEX "Note_userId_updatedAt_idx" ON "Note"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Note_linkedMeetingId_idx" ON "Note"("linkedMeetingId");

-- CreateIndex
CREATE INDEX "PullRequest_userId_bucket_idx" ON "PullRequest"("userId", "bucket");

-- CreateIndex
CREATE INDEX "PullRequest_userId_updatedAt_idx" ON "PullRequest"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PullRequest_userId_externalId_key" ON "PullRequest"("userId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "PullRequest_userId_repo_number_key" ON "PullRequest"("userId", "repo", "number");

-- CreateIndex
CREATE INDEX "Recap_userId_date_idx" ON "Recap"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Recap_userId_date_key" ON "Recap"("userId", "date");

-- CreateIndex
CREATE INDEX "_TaskNotes_B_index" ON "_TaskNotes"("B");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_linkedMeetingId_fkey" FOREIGN KEY ("linkedMeetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_linkedMeetingId_fkey" FOREIGN KEY ("linkedMeetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequest" ADD CONSTRAINT "PullRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recap" ADD CONSTRAINT "Recap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskNotes" ADD CONSTRAINT "_TaskNotes_A_fkey" FOREIGN KEY ("A") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskNotes" ADD CONSTRAINT "_TaskNotes_B_fkey" FOREIGN KEY ("B") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
