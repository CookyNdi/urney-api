/*
  Warnings:

  - Added the required column `price` to the `Outlays` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Outlays" ADD COLUMN     "price" INTEGER NOT NULL;
