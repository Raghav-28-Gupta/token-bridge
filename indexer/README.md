# Bridge Indexer

Event indexer with REST API for the token bridge. Indexes all bridge events and provides queryable data for frontends.

## Features

✅ **Multi-chain indexing** - Index events from all configured chains  
✅ **Real-time sync** - Continuous polling for new events  
✅ **Historical sync** - Catch up from any block number  
✅ **REST API** - Query events, transfers, and statistics  
✅ **Transfer tracking** - Match deposits with withdrawals  
✅ **Status tracking** - Track pending, completed, and failed transfers  
✅ **Volume analytics** - Track volume by chain, token, and time  
✅ **Sync monitoring** - Monitor indexer health and progress  

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
│         ▼                  ▼            │
│  ┌────────────────────────────────┐    │
│  │     Event Processor            │    │
│  └────────────┬───────────────────┘    │
│               │                         │
│               ▼                         │
│  ┌────────────────────────────────┐    │
│  │        PostgreSQL              │    │
│  │  - Events                      │    │
│  │  - Transfers                   │    │
│  │  - Stats                       │    │
│  └────────────┬───────────────────┘    │
│               │                         │
│               ▼                         │
│  ┌────────────────────────────────┐    │
│  │       REST API                 │    │
│  │  - GET /events                 │    │
│  │  - GET /transfers              │    │
│  │  - GET /stats                  │    │
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

### Statistics

#### Get Overall Stats

```http
GET /stats
```

Response:
```json
{
  "success": true,
  "data": {
    "totalTransfers": 1234,
    "chainSyncStatus": [
      {
        "chainId": 1,
        "chainName": "Ethereum",
        "lastBlockNumber": 12345678,
        "lastSyncedAt": "2024-01-01T00:00:00.000Z",
        "totalEvents": 5000
      }
    ],
    "volumeByChain": {
      "1": {
        "deposits": 1000,
        "withdraws": 234,
        "total": 1234
      }
    }
  }
}
```

#### Get Chain Stats

```http
GET /stats/chain/:chainId
```

#### Get Volume Stats

```http
GET /stats/volume
```

Response:
```json
{
  "success": true,
  "data": {
    "volumeByToken": [
      {
        "token": "0x...",
        "_count": 500
      }
    ],
    "last24Hours": 150
  }
}
```

### Sync Status

#### Get All Chain Sync Status

```http
GET /sync
```

#### Get Specific Chain Sync Status

```http
GET /sync/:chainId
```

## Database Schema

### BridgeEvent

Stores all indexed bridge events (Deposit and Withdraw).

```prisma
model BridgeEvent {
  id            String
  txHash        String
  logIndex      Int
  eventType     String  // Deposit, Withdraw
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

All operations are logged with structured data:

```
[12:34:56] INFO: Event indexed
  eventType: "Deposit"
  txHash: "0xabc..."
  chainId: 1
  blockNumber: 12345678
  
[12:35:10] INFO: Indexed blocks
  chainId: 1
  fromBlock: 12345678
  toBlock: 12345688
  events: 5
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

-- Calculate daily volume
SELECT 
  DATE("depositTime") as date,
  COUNT(*) as transfers,
  COUNT(DISTINCT sender) as unique_senders
FROM "Transfer"
WHERE status = 'completed'
GROUP BY DATE("depositTime")
ORDER BY date DESC;
```

## Performance

### Optimization Tips

1. **Adjust batch size** for chain block speed:
   ```bash
   # Fast chains (Polygon, BSC)
   BATCH_SIZE=2000
   
   # Slower chains (Ethereum)
   BATCH_SIZE=1000
   ```

2. **Use connection pooling** for high load:
   ```
   DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"
   ```

3. **Add database indexes** for common queries:
   ```sql
   CREATE INDEX idx_events_address ON "BridgeEvent" 
   USING btree (sender, recipient);
   ```

4. **Use dedicated RPC nodes** for better reliability

## Troubleshooting

### Indexer falling behind

```bash
# Check current sync status
curl http://localhost:3000/sync

# Increase batch size
BATCH_SIZE=2000

# Reduce poll interval
POLL_INTERVAL=6000
```

### Missing events

```bash
# Re-sync from specific block
# This requires manual DB update
UPDATE "ChainSync" 
SET "lastBlockNumber" = 12345000 
WHERE "chainId" = 1;

# Restart indexer
pnpm start
```

### High database load

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Add missing indexes
CREATE INDEX idx_transfers_status ON "Transfer" (status);
CREATE INDEX idx_events_timestamp ON "BridgeEvent" (timestamp);
```

## Development

### Running Tests

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

### Database Migrations

```bash
# Create migration
pnpm db:migrate

# Apply migrations
pnpm db:push

# Reset database
prisma migrate reset
```

## License

MIT