-- Reduce NoteType enum to two values. Postgres can't drop an enum value
-- in-place, so we rename the old enum, build the new one, switch the column,
-- then drop the old enum. Any rows still on "meeting" or "journal" were
-- migrated to "general" before this ran.

BEGIN;

ALTER TYPE "NoteType" RENAME TO "NoteType_old";

CREATE TYPE "NoteType" AS ENUM ('worklog', 'general');

ALTER TABLE "Note"
  ALTER COLUMN "type" TYPE "NoteType"
  USING ("type"::text::"NoteType");

DROP TYPE "NoteType_old";

COMMIT;
