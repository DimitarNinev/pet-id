-- CreateEnum
CREATE TYPE "DewormingType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateTable
CREATE TABLE "Deworming" (
    "id" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "manufacturer" TEXT,
    "batchNumber" TEXT,
    "dewormingType" "DewormingType" NOT NULL,
    "administeredAt" TIMESTAMP(3) NOT NULL,
    "dose" TEXT,
    "administrationMethod" TEXT,
    "nextDueAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deworming_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Deworming_medicalRecordId_key" ON "Deworming"("medicalRecordId");

-- AddForeignKey
ALTER TABLE "Deworming" ADD CONSTRAINT "Deworming_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
