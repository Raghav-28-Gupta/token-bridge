-- CreateTable
CREATE TABLE "BridgeTransaction" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "targetTxHash" TEXT,
    "messageHash" TEXT NOT NULL,
    "sourceChain" INTEGER NOT NULL,
    "targetChain" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BridgeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidatorSignature" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "validator" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "messageHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidatorSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChainState" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "chainName" TEXT NOT NULL,
    "lastBlockNumber" INTEGER NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChainState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BridgeTransaction_txHash_key" ON "BridgeTransaction"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "BridgeTransaction_targetTxHash_key" ON "BridgeTransaction"("targetTxHash");

-- CreateIndex
CREATE UNIQUE INDEX "BridgeTransaction_messageHash_key" ON "BridgeTransaction"("messageHash");

-- CreateIndex
CREATE INDEX "BridgeTransaction_sourceChain_nonce_idx" ON "BridgeTransaction"("sourceChain", "nonce");

-- CreateIndex
CREATE INDEX "BridgeTransaction_sourceChain_blockNumber_idx" ON "BridgeTransaction"("sourceChain", "blockNumber");

-- CreateIndex
CREATE INDEX "BridgeTransaction_targetChain_idx" ON "BridgeTransaction"("targetChain");

-- CreateIndex
CREATE INDEX "BridgeTransaction_status_idx" ON "BridgeTransaction"("status");

-- CreateIndex
CREATE INDEX "BridgeTransaction_recipient_idx" ON "BridgeTransaction"("recipient");

-- CreateIndex
CREATE INDEX "BridgeTransaction_sender_idx" ON "BridgeTransaction"("sender");

-- CreateIndex
CREATE INDEX "BridgeTransaction_createdAt_idx" ON "BridgeTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "BridgeTransaction_messageHash_idx" ON "BridgeTransaction"("messageHash");

-- CreateIndex
CREATE INDEX "ValidatorSignature_txHash_idx" ON "ValidatorSignature"("txHash");

-- CreateIndex
CREATE INDEX "ValidatorSignature_validator_idx" ON "ValidatorSignature"("validator");

-- CreateIndex
CREATE INDEX "ValidatorSignature_messageHash_idx" ON "ValidatorSignature"("messageHash");

-- CreateIndex
CREATE UNIQUE INDEX "ChainState_chainId_key" ON "ChainState"("chainId");

-- CreateIndex
CREATE INDEX "ChainState_chainId_idx" ON "ChainState"("chainId");
