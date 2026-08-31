/*
  Warnings:

  - You are about to drop the column `address` on the `Gallery` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Gallery" DROP COLUMN "address",
ADD COLUMN     "mapAddress" TEXT,
ADD COLUMN     "street" TEXT;
