CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "EventSettings" (
    "id" TEXT NOT NULL,
    "values" JSONB NOT NULL DEFAULT '{}',
    "faqConfigured" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EventSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImageSlot" (
    "key" VARCHAR(40) NOT NULL,
    "source" VARCHAR(2000) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ImageSlot_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "question" VARCHAR(200) NOT NULL,
    "answer" VARCHAR(1200) NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "contentType" VARCHAR(32) NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FaqItem_sortOrder_key" ON "FaqItem"("sortOrder");
CREATE UNIQUE INDEX "MediaAsset_sha256_key" ON "MediaAsset"("sha256");
