-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "objectName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "sha256Hash" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slicer_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "printerId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "configFilePath" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slicer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "uploadedFileId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "gcodeObjectName" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_costs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "filamentUsedGrams" DOUBLE PRECISION NOT NULL,
    "materialType" TEXT NOT NULL DEFAULT 'PLA',
    "materialCost" DOUBLE PRECISION NOT NULL,
    "printTimeSeconds" INTEGER NOT NULL,
    "electricityCost" DOUBLE PRECISION NOT NULL,
    "machineCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_costs" (
    "id" TEXT NOT NULL,
    "materialType" TEXT NOT NULL,
    "pricePerKg" DOUBLE PRECISION NOT NULL,
    "density" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "printer_economy" (
    "id" TEXT NOT NULL,
    "printerId" TEXT NOT NULL,
    "powerConsumptionW" INTEGER NOT NULL,
    "electricityRate" DOUBLE PRECISION NOT NULL,
    "machineHourlyRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "printer_economy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_files_objectName_key" ON "uploaded_files"("objectName");

-- CreateIndex
CREATE UNIQUE INDEX "slicer_profiles_printerId_profileId_version_key" ON "slicer_profiles"("printerId", "profileId", "version");

-- CreateIndex
CREATE INDEX "jobs_createdAt_idx" ON "jobs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "job_costs_jobId_key" ON "job_costs"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "material_costs_materialType_key" ON "material_costs"("materialType");

-- CreateIndex
CREATE UNIQUE INDEX "printer_economy_printerId_key" ON "printer_economy"("printerId");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES "uploaded_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "slicer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_costs" ADD CONSTRAINT "job_costs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
