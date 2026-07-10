/*
  Warnings:

  - Made the column `fileName` on table `SubmissionAttachment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SubmissionAttachment" ALTER COLUMN "fileName" SET NOT NULL;
