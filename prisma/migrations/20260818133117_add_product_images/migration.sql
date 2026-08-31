/*
 Warnings:
 
 - You are about to drop the column `imageUrl` on the `Product` table. All the data in the column will be lost.
 
 */
-- AlterTable
ALTER TABLE "Gallery"
ADD COLUMN "images" TEXT [];
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "imageUrl",
  ADD COLUMN "images" TEXT [],
  ADD COLUMN "mainImageUrl" TEXT;