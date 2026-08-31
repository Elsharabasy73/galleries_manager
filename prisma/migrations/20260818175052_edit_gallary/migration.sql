/*
  Warnings:

  - You are about to drop the column `mapAddress` on the `Gallery` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Gallery" DROP COLUMN "mapAddress",
ADD COLUMN     "mapAddressUrl" TEXT,
ADD COLUMN     "phone" TEXT;
