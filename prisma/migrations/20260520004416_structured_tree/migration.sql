-- Structured tree tables: slim Person, add Union, polymorphic Relationship.
-- Idempotent where possible. Drops legacy Person/Relationship shape.

-- 1. Drop old tables (no production data in them yet — all trees live in Family.treeData JSON)
DROP TABLE IF EXISTS "Relationship" CASCADE;
DROP TABLE IF EXISTS "Person" CASCADE;
DROP TABLE IF EXISTS "Union" CASCADE;

-- 2. Person (slim)
CREATE TABLE "Person" (
    "id"           TEXT PRIMARY KEY,
    "familyId"     TEXT NOT NULL,
    "name"         TEXT,
    "surname"      TEXT,
    "birthSurname" TEXT,
    "gender"       TEXT,
    "otherGender"  TEXT,
    "birthYear"    TEXT,
    "birthPlace"   TEXT,
    "deathDate"    TEXT,
    "email"        TEXT,
    "biography"    TEXT,
    "avatarUrl"    TEXT,
    "colorLabel"   TEXT,
    "posX"         DOUBLE PRECISION NOT NULL DEFAULT 0,
    "posY"         DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Person_familyId_fkey" FOREIGN KEY ("familyId")
        REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Person_familyId_idx" ON "Person"("familyId");

-- 3. Union
CREATE TABLE "Union" (
    "id"        TEXT PRIMARY KEY,
    "familyId"  TEXT NOT NULL,
    "posX"      DOUBLE PRECISION NOT NULL DEFAULT 0,
    "posY"      DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Union_familyId_fkey" FOREIGN KEY ("familyId")
        REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Union_familyId_idx" ON "Union"("familyId");

-- 4. Relationship (polymorphic, symmetric for partner)
CREATE TABLE "Relationship" (
    "id"        TEXT PRIMARY KEY,
    "familyId"  TEXT NOT NULL,
    "type"      TEXT NOT NULL, -- "partner" | "parent-child"
    "nodeAType" TEXT NOT NULL, -- "person" | "union"
    "nodeAId"   TEXT NOT NULL,
    "nodeBType" TEXT NOT NULL,
    "nodeBId"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Relationship_familyId_fkey" FOREIGN KEY ("familyId")
        REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Relationship_familyId_nodeAId_nodeBId_type_key"
    ON "Relationship"("familyId", "nodeAId", "nodeBId", "type");
CREATE INDEX "Relationship_familyId_idx" ON "Relationship"("familyId");
