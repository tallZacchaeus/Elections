-- One-time, DATA-PRESERVING upgrade from the single-election schema
-- (with a `Setting` singleton) to the multi-election schema (an `Election`
-- entity that scopes positions, voters, votes and flagged attempts).
--
-- The current single election becomes "Election #1" (status CLOSED) and every
-- existing row is linked to it. No votes or voters are lost.
--
-- Run ONCE against a backed-up database:
--   docker compose exec -T db psql -U <user> -d <db> -f - < prisma/upgrade-to-multi-election.sql
-- It is idempotent-guarded and wrapped in a transaction, so it either fully
-- applies or rolls back.

BEGIN;

-- Abort if this DB has already been upgraded.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'Election') THEN
    RAISE EXCEPTION 'Election table already exists — this database is already multi-election. Aborting.';
  END IF;
END $$;

-- 1. Status enum
CREATE TYPE "ElectionStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');

-- 2. Election table
CREATE TABLE "Election" (
  "id"             TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "institution"    TEXT NOT NULL DEFAULT 'Oyo State College of Agriculture and Technology',
  "faculty"        TEXT NOT NULL DEFAULT 'Faculty of Management & Communication Studies',
  "department"     TEXT NOT NULL DEFAULT 'Department of Public Administration',
  "status"         "ElectionStatus" NOT NULL DEFAULT 'DRAFT',
  "votingOpensAt"  TIMESTAMP(3),
  "votingClosesAt" TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Election_status_idx" ON "Election"("status");

-- 3. Create the legacy election from the existing Setting row (status CLOSED).
INSERT INTO "Election" ("id", "title", "institution", "faculty", "department",
                        "status", "votingOpensAt", "votingClosesAt", "createdAt", "updatedAt")
SELECT 'elec_legacy_0001',
       COALESCE(NULLIF("electionTitle", ''), 'PASA Election'),
       COALESCE("institution", 'Oyo State College of Agriculture and Technology'),
       COALESCE("faculty", 'Faculty of Management & Communication Studies'),
       COALESCE("department", 'Department of Public Administration'),
       'CLOSED',
       "votingOpensAt", "votingClosesAt",
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Setting"
WHERE "id" = 1;

-- Fallback if there was no Setting row at all.
INSERT INTO "Election" ("id", "title", "status", "createdAt", "updatedAt")
SELECT 'elec_legacy_0001', 'PASA Election', 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Election");

-- 4. Add electionId columns (nullable first so existing rows are valid).
ALTER TABLE "Position"       ADD COLUMN "electionId" TEXT;
ALTER TABLE "Voter"          ADD COLUMN "electionId" TEXT;
ALTER TABLE "Vote"           ADD COLUMN "electionId" TEXT;
ALTER TABLE "FlaggedAttempt" ADD COLUMN "electionId" TEXT;

-- 5. Backfill every existing row to the legacy election.
UPDATE "Position"       SET "electionId" = 'elec_legacy_0001' WHERE "electionId" IS NULL;
UPDATE "Voter"          SET "electionId" = 'elec_legacy_0001' WHERE "electionId" IS NULL;
UPDATE "Vote"           SET "electionId" = 'elec_legacy_0001' WHERE "electionId" IS NULL;
UPDATE "FlaggedAttempt" SET "electionId" = 'elec_legacy_0001' WHERE "electionId" IS NULL;

-- 6. Enforce NOT NULL.
ALTER TABLE "Position"       ALTER COLUMN "electionId" SET NOT NULL;
ALTER TABLE "Voter"          ALTER COLUMN "electionId" SET NOT NULL;
ALTER TABLE "Vote"           ALTER COLUMN "electionId" SET NOT NULL;
ALTER TABLE "FlaggedAttempt" ALTER COLUMN "electionId" SET NOT NULL;

-- 7. Foreign keys (cascade — deleting an election removes its data).
ALTER TABLE "Position"       ADD CONSTRAINT "Position_electionId_fkey"       FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Voter"          ADD CONSTRAINT "Voter_electionId_fkey"          FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vote"           ADD CONSTRAINT "Vote_electionId_fkey"           FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FlaggedAttempt" ADD CONSTRAINT "FlaggedAttempt_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Indexes to match the new schema.
CREATE INDEX "Position_electionId_idx"       ON "Position"("electionId");
CREATE INDEX "Voter_electionId_idx"          ON "Voter"("electionId");
CREATE INDEX "Vote_electionId_idx"           ON "Vote"("electionId");
CREATE INDEX "FlaggedAttempt_electionId_idx" ON "FlaggedAttempt"("electionId");

-- 9. Swap voter uniqueness from matricNumber to (electionId, matricNumber).
ALTER TABLE "Voter" DROP CONSTRAINT IF EXISTS "Voter_matricNumber_key";
DROP INDEX IF EXISTS "Voter_matricNumber_key";
ALTER TABLE "Voter" ADD CONSTRAINT "Voter_electionId_matricNumber_key" UNIQUE ("electionId", "matricNumber");

-- 10. Drop the now-obsolete order index on Position (new schema indexes electionId).
DROP INDEX IF EXISTS "Position_order_idx";

-- 11. Drop the Setting table — its data now lives on the Election row.
DROP TABLE "Setting";

COMMIT;
