-- CreateTable
CREATE TABLE "TrailCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bboxHash" TEXT NOT NULL,
    "geojson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ElevationCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "polyHash" TEXT NOT NULL,
    "samples" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UploadRoute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "geojson" TEXT NOT NULL,
    "stats" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "TrailCache_bboxHash_key" ON "TrailCache"("bboxHash");

-- CreateIndex
CREATE UNIQUE INDEX "ElevationCache_polyHash_key" ON "ElevationCache"("polyHash");
