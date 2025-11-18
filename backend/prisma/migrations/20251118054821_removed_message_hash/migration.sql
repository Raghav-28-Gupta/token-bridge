/*
  Warnings:

  - You are about to drop the column `messageHash` on the `BridgeTransaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "BridgeTransaction_messageHash_idx";

-- DropIndex
DROP INDEX "BridgeTransaction_messageHash_key";

-- AlterTable
ALTER TABLE "BridgeTransaction" DROP COLUMN "messageHash";
