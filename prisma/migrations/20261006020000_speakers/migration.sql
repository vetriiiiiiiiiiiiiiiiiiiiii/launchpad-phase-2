CREATE TABLE "Speaker" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "role" VARCHAR(160) NOT NULL DEFAULT '',
    "organisation" VARCHAR(160) NOT NULL DEFAULT '',
    "topic" VARCHAR(240) NOT NULL DEFAULT '',
    "photo" VARCHAR(2000) NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Speaker_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Speaker_sortOrder_key" ON "Speaker"("sortOrder");
