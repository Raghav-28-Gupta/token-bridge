-- CreateTable
CREATE TABLE "BridgeEvent" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "blockHash" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "sender" TEXT,
    "recipient" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "sourceChainId" INTEGER,
    "targetChainId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BridgeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "depositTxHash" TEXT NOT NULL,
    "withdrawTxHash" TEXT,
    "sourceChainId" INTEGER NOT NULL,
    "targetChainId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "depositBlock" INTEGER NOT NULL,
    "withdrawBlock" INTEGER,
    "depositTime" TIMESTAMP(3) NOT NULL,
    "withdrawTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChainSync" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "chainName" TEXT NOT NULL,
    "lastBlockNumber" INTEGER NOT NULL,
    "lastBlockHash" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalEvents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChainSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stats" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalVolume" TEXT NOT NULL DEFAULT '0',
    "totalTransfers" INTEGER NOT NULL DEFAULT 0,
    "volumeByChain" JSONB NOT NULL DEFAULT '{}',
    "transfersByChain" JSONB NOT NULL DEFAULT '{}',
    "volumeByToken" JSONB NOT NULL DEFAULT '{}',
    "transfersByToken" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BridgeEvent_chainId_blockNumber_idx" ON "BridgeEvent"("chainId", "blockNumber");

-- CreateIndex
CREATE INDEX "BridgeEvent_eventType_idx" ON "BridgeEvent"("eventType");

-- CreateIndex
CREATE INDEX "BridgeEvent_token_idx" ON "BridgeEvent"("token");

-- CreateIndex
CREATE INDEX "BridgeEvent_recipient_idx" ON "BridgeEvent"("recipient");

-- CreateIndex
CREATE INDEX "BridgeEvent_sender_idx" ON "BridgeEvent"("sender");

-- CreateIndex
CREATE INDEX "BridgeEvent_nonce_idx" ON "BridgeEvent"("nonce");

-- CreateIndex
CREATE INDEX "BridgeEvent_timestamp_idx" ON "BridgeEvent"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "BridgeEvent_txHash_logIndex_key" ON "BridgeEvent"("txHash", "logIndex");

-- CreateIndex
CREATE INDEX "Transfer_sourceChainId_targetChainId_idx" ON "Transfer"("sourceChainId", "targetChainId");

-- CreateIndex
CREATE INDEX "Transfer_status_idx" ON "Transfer"("status");

-- CreateIndex
CREATE INDEX "Transfer_recipient_idx" ON "Transfer"("recipient");

-- CreateIndex
CREATE INDEX "Transfer_sender_idx" ON "Transfer"("sender");

-- CreateIndex
CREATE INDEX "Transfer_nonce_idx" ON "Transfer"("nonce");

-- CreateIndex
CREATE INDEX "Transfer_token_idx" ON "Transfer"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_depositTxHash_key" ON "Transfer"("depositTxHash");

-- CreateIndex
CREATE UNIQUE INDEX "ChainSync_chainId_key" ON "ChainSync"("chainId");

-- CreateIndex
CREATE INDEX "ChainSync_chainId_idx" ON "ChainSync"("chainId");

-- CreateIndex
CREATE UNIQUE INDEX "Stats_date_key" ON "Stats"("date");

-- CreateIndex
CREATE INDEX "Stats_date_idx" ON "Stats"("date");
