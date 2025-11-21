# Shared Package - Usage Examples

Comprehensive examples of how to use the `@bridge/shared` package across all services.

## Backend Usage

### Validate Bridge Requests

```typescript
import { validateDepositParams, validateWithdrawParams } from '@bridge/shared';

// In relayer.ts
async function processWithdrawal(depositEvent: any) {
  const validation = validateWithdrawParams({
    token: depositEvent.token,
    recipient: depositEvent.recipient,
    amount: depositEvent.amount,
    nonce: depositEvent.nonce,
    sourceChainId: sourceChainId,
    targetChainId: depositEvent.targetChainId,
    signatures: [], // Will be populated
  });

  if (!validation.valid) {
    logger.error('Invalid withdrawal params', validation.errors);
    return;
  }

  // Process withdrawal...
}
```

### Use Shared Types

```typescript
import { BridgeTransfer, DepositEvent } from '@bridge/shared';

async function saveTransaction(event: DepositEvent): Promise<BridgeTransfer> {
  const transfer: BridgeTransfer = {
    id: crypto.randomUUID(),
    depositTxHash: event.txHash,
    token: event.token,
    sender: event.sender,
    recipient: event.recipient,
    amount: event.amount,
    sourceChainId: event.chainId,
    targetChainId: event.targetChainId,
    nonce: event.nonce,
    status: 'pending',
    depositBlockNumber: event.blockNumber,
    depositTime: event.timestamp,
  };

  await db.saveTransfer(transfer);
  return transfer;
}
```

## Indexer Usage

### Format Event Data

```typescript
import {
  shortenAddress,
  shortenTxHash,
  formatAmount,
  formatDateTime,
} from '@bridge/shared';

async function displayEvent(event: any) {
  console.log(`
    Event: Deposit
    TX: ${shortenTxHash(event.txHash)}
    From: ${shortenAddress(event.sender)}
    To: ${shortenAddress(event.recipient)}
    Amount: ${formatAmount(event.amount)}
    Time: ${formatDateTime(event.timestamp)}
  `);
}
```

### Query by Chain

```typescript
import { CHAINS, getChainName } from '@bridge/shared';

async function getChainEvents(chainId: number) {
  const chainName = getChainName(chainId);
  logger.info(`Fetching events from ${chainName}`);

  const events = await db.getEventsByChain(chainId);
  return events;
}
```

### API Response Formatting

```typescript
import { formatAmount, formatRelativeTime, ApiResponse } from '@bridge/shared';

app.get('/transfers/:id', async (req, res) => {
  const transfer = await db.getTransfer(req.params.id);

  if (!transfer) {
    return res.status(404).json({
      success: false,
      error: 'Transfer not found',
      timestamp: new Date(),
    } as ApiResponse<any>);
  }

  res.json({
    success: true,
    data: {
      ...transfer,
      amount: formatAmount(transfer.amount),
      depositedAgo: formatRelativeTime(transfer.depositTime),
      completedAgo: transfer.withdrawTime 
        ? formatRelativeTime(transfer.withdrawTime)
        : null,
    },
    timestamp: new Date(),
  } as ApiResponse<any>);
});
```

## Frontend Usage (if built)

### Display Transfer Status

```typescript
import { getStatusColor, getStatusEmoji, formatDateTime } from '@bridge/shared';

function TransferCard({ transfer }: { transfer: BridgeTransfer }) {
  const statusColor = getStatusColor(transfer.status);
  const statusEmoji = getStatusEmoji(transfer.status);

  return (
    <div style={{ borderLeft: `4px solid ${statusColor}` }}>
      <h3>{statusEmoji} {transfer.status.toUpperCase()}</h3>
      <p>From: {shortenAddress(transfer.sender)}</p>
      <p>To: {shortenAddress(transfer.recipient)}</p>
      <p>Amount: {formatAmount(transfer.amount)}</p>
      <p>Deposited: {formatDateTime(transfer.depositTime)}</p>
      {transfer.withdrawTime && (
        <p>Completed: {formatDateTime(transfer.withdrawTime)}</p>
      )}
    </div>
  );
}
```

### Validate User Input

```typescript
import { validateTransferParams } from '@bridge/shared';

function handleBridgeSubmit(formData: any) {
  const validation = validateTransferParams({
    token: formData.token,
    recipient: formData.recipient,
    amount: formData.amount,
    nonce: formData.nonce,
    sourceChainId: formData.sourceChainId,
    targetChainId: formData.targetChainId,
  });

  if (!validation.valid) {
    setErrors(validation.errors);
    return;
  }

  // Submit bridge request...
}
```

### Display Supported Chains

```typescript
import { getSupportedChainIds, getChain } from '@bridge/shared';

function ChainSelector() {
  const chainIds = getSupportedChainIds();

  return (
    <select>
      {chainIds.map((chainId) => {
        const chain = getChain(chainId);
        return (
          <option key={chainId} value={chainId}>
            {chain?.name}
          </option>
        );
      })}
    </select>
  );
}
```

### Display Tokens

```typescript
import { getTokensByChain } from '@bridge/shared';

function TokenSelector({ chainId }: { chainId: number }) {
  const tokens = getTokensByChain(chainId);

  return (
    <select>
      {tokens.map((token) => (
        <option key={token.address} value={token.address}>
          {token.symbol} ({formatAmount(token.address, token.decimals)})
        </option>
      ))}
    </select>
  );
}
```

### Format Amount Input

```typescript
import { formatTokenAmount, parseTokenAmount } from '@bridge/shared';

function AmountInput({ token }: { token: Token }) {
  const handleChange = (value: string) => {
    // Parse user input
    const bigIntAmount = parseTokenAmount(value, token.decimals);
    
    // Send to backend
    submitAmount(bigIntAmount.toString());
  };

  const displayAmount = (amount: bigint) => {
    return formatTokenAmount(amount, token.decimals, 4);
  };

  return (
    <input
      type="number"
      onChange={(e) => handleChange(e.target.value)}
      placeholder={`Enter amount in ${token.symbol}`}
    />
  );
}
```

## Contract Interaction

### Using ABIs

```typescript
import { ABIS } from '@bridge/shared';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = provider.getSigner();

// Deploy Bridge
const BridgeFactory = new ethers.ContractFactory(
  ABIS.Bridge,
  CONTRACT_BYTECODE,
  signer
);

const bridge = await BridgeFactory.deploy(
  validators,
  minValidators,
  chainId
);

// Deploy BridgeToken
const TokenFactory = new ethers.ContractFactory(
  ABIS.BridgeToken,
  TOKEN_BYTECODE,
  signer
);

const token = await TokenFactory.deploy(
  'Wrapped ETH',
  'WETH',
  18,
  bridge.address
);

// Interact with deployed contracts
const contract = new ethers.Contract(
  bridgeAddress,
  ABIS.Bridge,
  signer
);

// Call functions
const isSupported = await contract.supportedTokens(tokenAddress);
const isProcessed = await contract.isProcessed(messageHash);

// Send transactions
const tx = await contract.deposit(
  tokenAddress,
  amount,
  recipient,
  targetChainId
);
```

## Monorepo Structure Usage

### Backend imports

```typescript
// backend/src/relayer.ts
import {
  BridgeTransfer,
  DepositEvent,
  validateDepositParams,
  CHAINS,
  ABIS,
} from '@bridge/shared';
```

### Indexer imports

```typescript
// indexer/src/api.ts
import {
  BridgeEvent,
  VolumeStats,
  formatAmount,
  formatDateTime,
  ApiResponse,
} from '@bridge/shared';
```

### Shared re-exports

```typescript
// backend/src/index.ts - Export types to consumers
export {
  BridgeTransfer,
  DepositEvent,
  WithdrawEvent,
  validateDepositParams,
} from '@bridge/shared';

// indexer/src/index.ts
export {
  BridgeEvent,
  VolumeStats,
  formatAmount,
  CHAINS,
} from '@bridge/shared';
```

## Error Handling

```typescript
import { BridgeError } from '@bridge/shared';

function validateAndProcess(data: any) {
  try {
    const validation = validateTransferParams(data);
    if (!validation.valid) {
      throw new BridgeError(
        'INVALID_PARAMS',
        `Invalid transfer parameters: ${validation.errors.join(', ')}`,
        400
      );
    }

    // Process...
  } catch (error) {
    if (error instanceof BridgeError) {
      logger.error(`[${error.code}] ${error.message}`, { statusCode: error.statusCode });
      return { error: error.message, code: error.code };
    }
    throw error;
  }
}
```

## Tips & Best Practices

### 1. Always validate external input
```typescript
const validation = validateTransferParams(userInput);
if (!validation.valid) {
  throw new Error(validation.errors.join(', '));
}
```

### 2. Use chain helpers for explorer links
```typescript
const txLink = getTxLink(chainId, txHash);
const addrLink = getAddressLink(chainId, address);
// Display links in UI
```

### 3. Format amounts consistently
```typescript
// Always format with token decimals
const display = formatAmount(amount, token.decimals, 2);
```

### 4. Share types across services
```typescript
// Define once, use everywhere
export type { BridgeTransfer } from '@bridge/shared';
```

### 5. Use status helpers for UI
```typescript
const color = getStatusColor(transfer.status); // For styling
const emoji = getStatusEmoji(transfer.status); // For display
```

## Performance Considerations

### Cache chain lookups
```typescript
const chainCache = new Map();
function getChainCached(chainId: number) {
  if (!chainCache.has(chainId)) {
    chainCache.set(chainId, getChain(chainId));
  }
  return chainCache.get(chainId);
}
```

### Batch validations
```typescript
const errors = [];
for (const transfer of transfers) {
  const validation = validateTransferParams(transfer);
  if (!validation.valid) {
    errors.push({ transfer, errors: validation.errors });
  }
}
```

### Memoize formatting
```typescript
const formatted = useMemo(
  () => formatAmount(amount, decimals),
  [amount, decimals]
);
```