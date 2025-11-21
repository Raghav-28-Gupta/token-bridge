# Bridge Indexer

Event indexer with REST API for the token bridge. Indexes all bridge events and provides queryable data for frontends.

## Features

✅ **Multi-chain indexing** - Index events from all configured chains  
✅ **Real-time sync** - Continuous polling for new events  
✅ **Historical sync** - Catch up from any block number  
✅ **REST API** - Query events and transfers  
✅ **Transfer tracking** - Match deposits with withdrawals  
✅ **Status tracking** - Track pending, completed, and failed transfers  
✅ **Simple logging** - Console-based logging for easy debugging  

## Architecture

```
┌─────────────────────────────────────────┐
│          Bridge Indexer                 │
│                                         │
│  ┌──────────────┐   ┌──────────────┐   │
│  │   Chain A    │   │   Chain B    │   │
│  │   Monitor    │   │   Monitor    │   │
│  └──────┬───────┘   └──────┬───────┘   │
│         │                  │            │
│         ▼                 ▼            │
│  ┌────────────────────────────────┐    │
│  │     Event Processor            │    │
│  └────────────┬───────────────────┘    │
│               │                         │
│               ▼                         │
│  ┌────────────────────────────────┐    │
│  │        PostgreSQL              │    │
│  │  - BridgeEvents                │    │
│  │  - Transfers                   │    │
│  │  - ChainSync                   │    │
│  └────────────┬───────────────────┘    │
│               │                         │
│               ▼                         │
│  ┌────────────────────────────────┐    │
│  │       REST API                 │    │
│  │  - GET /events                 │    │
│  │  - GET /transfers              │    │
│  │  - GET /health                 │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Setup database
pnpm db:push
```

### Configuration

Create a `.env` file:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/bridge_indexer"

# API
PORT=3000
HOST="0.0.0.0"
CORS_ORIGIN="*"

# Chain RPCs
ETHEREUM_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY"

# Chain IDs
ETHEREUM_CHAIN_ID=1
POLYGON_CHAIN_ID=137

# Contract Addresses
ETHEREUM_BRIDGE_ADDRESS="0x..."
POLYGON_BRIDGE_ADDRESS="0x..."

# Indexing
POLL_INTERVAL=12000
BATCH_SIZE=1000
START_BLOCK_ETHEREUM=0
START_BLOCK_POLYGON=0

# Logging
LOG_LEVEL="info"
```

## Usage

### Development

```bash
# Start in development mode with hot reload
pnpm dev
```

### Production

```bash
# Build
pnpm build

# Start
pnpm start
```

## API Documentation

Base URL: `http://localhost:3000`

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Events

#### Get Recent Events

```http
GET /events?limit=50
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "txHash": "0x...",
      "eventType": "Deposit",
      "chainId": 1,
      "blockNumber": 12345678,
      "token": "0x...",
      "sender": "0x...",
      "recipient": "0x...",
      "amount": "1000000000000000000",
      "nonce": 42,
      "targetChainId": 137,
       "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 50
}
```

#### Get Events by Chain

```http
GET /events/chain/:chainId?limit=50
```

#### Get Events by Address

```http
GET /events/address/:address?limit=50
```

### Transfers

#### Get Recent Transfers

```http
GET /transfers?limit=50&status=completed
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "depositTxHash": "0x...",
      "withdrawTxHash": "0x...",
      "sourceChainId": 1,
      "targetChainId": 137,
      "token": "0x...",
      "sender": "0x...",
      "recipient": "0x...",
      "amount": "1000000000000000000",
      "nonce": 42,
      "status": "completed",
      "depositBlock": 12345678,
      "withdrawBlock": 87654321,
      "depositTime": "2024-01-01T00:00:00.000Z",
      "withdrawTime": "2024-01-01T00:05:00.000Z"
    }
  ],
  "count": 50
}
```

#### Get Pending Transfers

```http
GET /transfers/pending
```

#### Get Transfers by Address

```http
GET /transfers/address/:address?limit=50
```

#### Get Transfer by TX Hash

```http
GET /transfers/tx/:txHash
```

## Database Schema

### BridgeEvent

Stores all indexed bridge events (Deposit and Withdraw).

```prisma
model BridgeEvent {
  id            String
  txHash        String
  logIndex      Int
  eventType String  // Deposit, Withdraw
  chainId       Int
  blockNumber   Int
  token         String
  sender        String?
  recipient     String
  amount        String
  nonce         Int
  timestamp     DateTime
}
```

### Transfer

Tracks complete transfers from deposit to withdrawal.

```prisma
model Transfer {
  id              String
  depositTxHash   String
  withdrawTxHash  String?
  sourceChainId   Int
  targetChainId   Int
  token           String
  sender          String
  recipient       String
  amount          String
  nonce           Int
  status          String  // pending, completed, failed
  depositTime     DateTime
  withdrawTime    DateTime?
}
```

### ChainSync

Tracks indexing progress for each chain.

```prisma
model ChainSync {
  id              String
  chainId         Int
  chainName       String
  lastBlockNumber Int
  lastSyncedAt    DateTime
  totalEvents     Int
}
```

## How It Works

### 1. Event Indexing

The indexer continuously polls configured chains for new blocks:

```typescript
while (running) {
  // Get current block
  const currentBlock = await provider.getBlockNumber();
  
  // Query events in batch
  const events = await contract.queryFilter(
    filter,
    fromBlock,
    toBlock
  );
  
  // Process events
  await processEvents(events);
  
  // Update sync state
  await updateChainSync(chainId, toBlock);
  
  // Wait for next poll
  await sleep(POLL_INTERVAL);
}
```

### 2. Event Processing

Each event is validated and stored:

```typescript
// Validate event
if (!validateEvent(event)) {
  return;
}

// Save to database
await createBridgeEvent({
  txHash: event.transactionHash,
  eventType: 'Deposit',
  chainId,
  blockNumber: event.blockNumber,
  ...eventData,
});

// Create or update transfer
await createOrUpdateTransfer({
  depositTxHash: event.transactionHash,
  status: 'pending',
  ...transferData,
});
```

### 3. Transfer Matching

Withdrawals are matched with their corresponding deposits:

```typescript
// When withdraw event is indexed
const deposit = await findMatchingDeposit(
  nonce,
  sourceChainId
);

if (deposit) {
  await updateTransferWithWithdraw(
    deposit.depositTxHash,
    withdrawTxHash,
    withdrawBlock,
    withdrawTime
  );
}
```

## Monitoring

### Logs

All operations are logged:

```
[2024-01-01T12:34:56.000Z] INFO: Deposit event indexed {...}
[2024-01-01T12:35:10.000Z] INFO: Indexed blocks {...}
```

### Database Queries

Monitor indexer health:

```sql
-- Check sync status
SELECT * FROM "ChainSync" ORDER BY "chainId";

-- Check recent events
SELECT * FROM "BridgeEvent" 
ORDER BY "blockNumber" DESC 
LIMIT 10;

-- Check pending transfers
SELECT * FROM "Transfer" 
WHERE status = 'pending' 
ORDER BY "depositTime" DESC;
```

## License

MIT