/*
  Warnings:

  - A unique constraint covering the columns `[petId]` on the table `Animal` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "petId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Animal_petId_key" ON "Animal"("petId");
