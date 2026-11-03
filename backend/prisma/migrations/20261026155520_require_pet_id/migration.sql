/*
  Warnings:

  - Made the column `petId` on table `Animal` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Animal" ALTER COLUMN "petId" SET NOT NULL;
