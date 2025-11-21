# Bridge Backend Relayer

Backend service that listens for deposit events on source chains and relays withdrawals to target chains with validator signatures.

## Features

✅ **Multi-chain monitoring** - Monitor multiple chains simultaneously  
✅ **Automatic withdrawal relay** - Sign and submit withdrawals automatically  
✅ **Replay protection** - Prevents duplicate withdrawals  
✅ **Confirmation tracking** - Waits for sufficient confirmations  
✅ **Gas optimization** - Estimates gas with configurable buffers  
✅ **Error handling** - Comprehensive retry logic with exponential backoff  
✅ **Database persistence** - Track all transactions and state  
✅ **Simple logging** - Console-based logging for easy debugging  
✅ **Graceful shutdown** - Clean shutdown on SIGINT/SIGTERM  

## Architecture

```
┌─────────────┐         ┌─────────────┐
│  Chain A    │         │  Chain B    │
│  (Source)   │         │  (Target)   │
└─────┬───────┘         └─────▲───────┘
      │                       │
      │ Deposit Event         │ Withdraw TX
      │                       │
      ▼                       │
┌─────────────────────────────┴───────┐
│                                     │
│         Bridge Relayer              │
│                                     │
│  ┌───────────┐   ┌──────────────┐  │
│  │ Monitor   │───│  Validator   │  │
│  └───────────┘   └──────────────┘  │
│                                     │
│  ┌───────────┐   ┌──────────────┐  │
│  │  Signer   │───│   Database   │  │
│  └───────────┘   └──────────────┘  │
│                                     │
└─────────────────────────────────────┘
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

Create a `.env` file based on `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/bridge"

# Validator Private Key
VALIDATOR_PRIVATE_KEY="0x..." # Your validator private key

# Chain RPCs
ETHEREUM_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY"

# Chain IDs
ETHEREUM_CHAIN_ID=1
POLYGON_CHAIN_ID=137

# Contract Addresses
ETHEREUM_BRIDGE_ADDRESS="0x..."
POLYGON_BRIDGE_ADDRESS="0x..."

# Settings
POLL_INTERVAL=12000
MIN_CONFIRMATIONS=12
LOG_LEVEL="info"
MAX_GAS_PRICE_GWEI=100
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

### With Docker

```bash
# Build image
docker build -t bridge-relayer .

# Run
docker run -d \
  --name bridge-relayer \
  --env-file .env \
  bridge-relayer
```

## How It Works

### 1. Event Monitoring

The relayer continuously monitors configured chains for `Deposit` events:

```typescript
// Listens for deposits on Chain A
event Deposit(
  address indexed token,
  address indexed sender,
  address indexed recipient,
  uint256 amount,
  uint256 nonce,
  uint256 targetChainId
)
```

### 2. Validation

Each deposit is validated:
- ✓ Valid addresses
- ✓ Positive amount
- ✓ Sufficient confirmations
- ✓ Not already processed
- ✓ Bridge has sufficient balance

### 3. Signature Generation

The validator signs the withdrawal message:

```typescript
messageHash = keccak256(
  token,
  recipient,
  amount,
  nonce,
  sourceChainId,
  targetChainId
)

signature = sign(messageHash, validatorPrivateKey)
```

### 4. Withdrawal Execution

The relayer submits the withdrawal transaction to the target chain:

```typescript
await bridge.withdraw(
  token,
  recipient,
  amount,
  nonce,
  sourceChainId,
  [signature]
)
```

### 5. State Tracking

All transactions are stored in the database with status updates:
- `pending` - Deposit detected, waiting for confirmations
- `relaying` - Withdrawal being processed
- `completed` - Successfully bridged
- `failed` - Error occurred (with error message)

## Database Schema

### BridgeTransaction

Tracks all bridge transactions:

```prisma
model BridgeTransaction {
  id            String   @id
  txHash        String   @unique
  targetTxHash  String?
  sourceChain   Int
  targetChain   Int
  token         String
  sender        String
  recipient     String
  amount        String
  nonce         Int
  blockNumber   Int
  status        String
  error         String?
  createdAt     DateTime
  updatedAt     DateTime
}
```

## API Reference

### Core Functions

#### `initializeRelayer()`
Initializes the relayer with all configured chains.

#### `relayer.start()`
Starts monitoring all chains and processing deposits.

#### `relayer.stop()`
Gracefully stops the relayer.

### Validator Functions

#### `validateDepositEvent(event)`
Validates deposit event data.

#### `hasEnoughConfirmations(provider, blockNumber, minConfirmations)`
Checks if transaction has enough confirmations.

#### `checkBridgeBalance(provider, bridgeAddress, token, amount)`
Verifies bridge has sufficient balance.

### Signer Functions

#### `signer.signWithdrawal(params)`
Signs a withdrawal message.

#### `signer.verifySignature(messageHash, signature, expectedSigner)`
Verifies a signature.

## Error Handling

The relayer includes comprehensive error handling:

### Retryable Errors
- Network timeouts
- Connection resets
- RPC errors
- Nonce issues

These are automatically retried with exponential backoff.

### Non-Retryable Errors
- Invalid parameters
- Insufficient balance
- Already processed

These are logged and marked as failed in the database.

## Monitoring

### Logs

All operations are logged to console:

```
[2024-01-01T12:34:56.000Z] INFO: Deposit detected: 100.0 USDC from 0x123... -> 0x456... {"type":"deposit","token":"0xA0b86...","nonce":42,"sourceChain":1,"targetChain":137}
  
[2024-01-01T12:35:10.000Z] INFO: Withdrawal processed: 100.0 USDC to 0x456... {"type":"withdrawal","txHash":"0xabc...","gasUsed":"150000"}
```

### Database Queries

Monitor transaction status:

```sql
-- Pending transactions
SELECT * FROM "BridgeTransaction" 
WHERE status = 'pending' 
ORDER BY "createdAt" DESC;

-- Failed transactions
SELECT * FROM "BridgeTransaction" 
WHERE status = 'failed'
ORDER BY "createdAt" DESC;

-- Transaction volume
SELECT 
  "sourceChain",
  "targetChain",
  COUNT(*) as count,
  SUM(CAST(amount AS NUMERIC)) as volume
FROM "BridgeTransaction"
WHERE status = 'completed'
GROUP BY "sourceChain", "targetChain";
```

## Security Considerations

### Private Key Management
- ✅ Store validator private key in environment variables
- ✅ Use hardware wallet or HSM in production
- ✅ Never commit private keys to version control
- ✅ Rotate keys regularly

### Gas Price Protection
- ✅ Maximum gas price limits configured
- ✅ Gas estimation with safety buffers
- ✅ Transaction monitoring and alerts

### Replay Protection
- ✅ Nonce-based replay protection
- ✅ Message hash verification
- ✅ Database state tracking

## Troubleshooting

### Relayer not starting
```bash
# Check logs
pnpm dev

# Verify configuration
node -e "require('./dist/config').validateConfig()"

# Test database connection
psql $DATABASE_URL -c "SELECT 1"
```

### Transactions stuck in pending
```sql
-- Check pending transactions
SELECT * FROM "BridgeTransaction" WHERE status = 'pending';

-- Check confirmations
-- Ensure MIN_CONFIRMATIONS is set appropriately
```

### High gas prices
```bash
# Adjust maximum gas price
MAX_GAS_PRICE_GWEI=50  # Lower limit
```

### RPC rate limiting
```bash
# Increase polling interval
POLL_INTERVAL=30000  # 30 seconds
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
```

## Performance

### Recommended Settings

**Testnet:**
- `POLL_INTERVAL`: 12000ms
- `MIN_CONFIRMATIONS`: 5
- `MAX_GAS_PRICE_GWEI`: 50

**Mainnet:**
- `POLL_INTERVAL`: 12000ms
- `MIN_CONFIRMATIONS`: 12-20
- `MAX_GAS_PRICE_GWEI`: 100-200

### Optimization Tips

1. **Use dedicated RPC nodes** for better reliability
2. **Adjust polling interval** based on chain block time
3. **Monitor gas prices** and adjust limits accordingly
4. **Use database indexes** for faster queries
5. **Enable connection pooling** for high throughput

## License

MIT