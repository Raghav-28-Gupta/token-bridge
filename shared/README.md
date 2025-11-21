# Bridge Shared Package

Shared types, constants, utilities, and ABIs used across all bridge services (backend, indexer, frontend).

## Features

✅ **Type Definitions** - Comprehensive TypeScript types for bridge operations  
✅ **Chain Constants** - Pre-configured chains with explorers and RPC URLs  
✅ **Token Data** - Common token definitions across chains  
✅ **Contract ABIs** - Bridge and BridgeToken contract ABIs  
✅ **Validation Utilities** - Input validation for bridge operations  
✅ **Formatting Utilities** - Format amounts, addresses, timestamps, etc.  
✅ **Zero Dependencies** - Only ethers.js (already used everywhere)  

## Installation

```bash
pnpm add @bridge/shared
```

Or as a monorepo workspace:

```bash
pnpm install
```

## Usage

### Type Definitions

```typescript
import {
  BridgeTransfer,
  DepositTransaction,
  WithdrawTransaction,
  BridgeEvent,
  VolumeStats,
} from '@bridge/shared';

// Use types throughout your application
const transfer: BridgeTransfer = {
  id: '123',
  depositTxHash: '0x...',
  token: '0x...',
  sender: '0x...',
  recipient: '0x...',
  amount: '1000000000000000000',
  sourceChainId: 1,
  targetChainId: 137,
  nonce: 42,
  status: 'completed',
  depositBlockNumber: 12345678,
  withdrawBlockNumber: 87654321,
  depositTime: new Date('2024-01-01'),
  withdrawTime: new Date('2024-01-01T00:05:00'),
};
```

### Chain Constants

```typescript
import { CHAINS, getChain, getChainName, getSupportedChainIds } from '@bridge/shared';

// Get all chains
const allChains = CHAINS;

// Get specific chain
const ethereum = getChain(1);
// => { id: 1, name: 'Ethereum Mainnet', ... }

// Get chain name
const name = getChainName(137);
// => 'Polygon'

// Get all supported chain IDs
const chainIds = getSupportedChainIds();
// => [1, 137, 42161, 10, 11155111, 80001, 421613, 420]

// Get block explorer URL
import { getTxLink, getAddressLink } from '@bridge/shared';

const txLink = getTxLink(1, '0xabc...');
// => 'https://etherscan.io/tx/0xabc...'

const addrLink = getAddressLink(137, '0x123...');
// => 'https://polygonscan.com/address/0x123...'
```

### Token Constants

```typescript
import {
  TOKENS,
  getToken,
  getTokensByChain,
  formatTokenAmount,
  parseTokenAmount,
  ZERO_ADDRESS,
} from '@bridge/shared';

// Get specific token
const usdc = getToken('USDC', 1);
// => { address: '0xa0b86991...', symbol: 'USDC', decimals: 6, ... }

// Get all tokens on a chain
const polygonTokens = getTokensByChain(137);

// Format token amount
const formatted = formatTokenAmount('1000000', 6, 2);
// => '1.00'

// Parse token amount
const parsed = parseTokenAmount('1.5', 18);
// => 1500000000000000000n

// Native token constant
import { NATIVE_TOKEN, ZERO_ADDRESS } from '@bridge/shared';
// Use NATIVE_TOKEN or ZERO_ADDRESS for native (ETH/MATIC) transfers
```

### Validation

```typescript
import {
  isValidAddress,
  isValidTxHash,
  isValidSignature,
  validateTransferParams,
  validateDepositParams,
  validateWithdrawParams,
} from '@bridge/shared';

// Validate individual fields
isValidAddress('0x123...'); // true/false
isValidTxHash('0xabc...'); // true/false
isValidSignature('0x...'); // true/false

// Validate transfer parameters
const validation = validateTransferParams({
  token: '0x...',
  recipient: '0x...',
  amount: '1000000000000000000',
  nonce: 42,
  sourceChainId: 1,
  targetChainId: 137,
});

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
} else {
  console.log('Parameters are valid');
}

// Validate deposit
const depositValidation = validateDepositParams({
  token: '0x...',
  sender: '0x...',
  recipient: '0x...',
  amount: '1000000000000000000',
  nonce: 42,
  sourceChainId: 1,
  targetChainId: 137,
});

// Validate withdrawal
const withdrawValidation = validateWithdrawParams({
  token: '0x...',
  recipient: '0x...',
  amount: '1000000000000000000',
  nonce: 42,
  sourceChainId: 1,
  targetChainId: 137,
  signatures: ['0x...', '0x...'],
});
```

### Formatting

```typescript
import {
  shortenAddress,
  shortenTxHash,
  formatAmount,
  formatNumber,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatDuration,
  getStatusColor,
  getStatusEmoji,
} from '@bridge/shared';

// Shorten addresses
shortenAddress('0x1234567890abcdef1234567890abcdef12345678');
// => '0x123456...5678'

// Shorten tx hash
shortenTxHash('0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789');
// => '0xabcdef...456789'

// Format amounts
formatAmount('1000000000000000000', 18, 2);
// => '1.00'

formatAmount('123456789', 6, 2);
// => '123.46'

// Format numbers
formatNumber(1000000);
// => '1,000,000'

// Format currency
formatCurrency(1234.567, 'USD', 2);
// => '$1,234.57'

// Format dates
formatDate(new Date('2024-01-01'));
// => '1/1/2024'

formatDateTime(new Date('2024-01-01T12:00:00'));
// => '1/1/2024, 12:00:00 PM'

// Format relative time
formatRelativeTime(new Date(Date.now() - 3600000));
// => '1h ago'

// Format duration
formatDuration(3661000);
// => '1h 1m'

// Get status styling
getStatusColor('completed');
// => '#10b981' (green)

getStatusEmoji('pending');
// => '⏳'
```

### Contract ABIs

```typescript
import { ABIS } from '@bridge/shared';
import { ethers } from 'ethers';

// Use with ethers.js
const provider = new ethers.JsonRpcProvider(rpcUrl);
const contract = new ethers.Contract(
  bridgeAddress,
  ABIS.Bridge,
  provider
);

// Or directly import
import BridgeABI from '@bridge/shared/dist/abis/Bridge.json';
import BridgeTokenABI from '@bridge/shared/dist/abis/BridgeToken.json';
```

## API Reference

### Types

#### `BridgeTransfer`
Complete bridge transfer from source to target chain.

```typescript
interface BridgeTransfer {
  id: string;
  depositTxHash: string;
  withdrawTxHash?: string;
  token: string;
  sender: string;
  recipient: string;
  amount: string;
  sourceChainId: number;
  targetChainId: number;
  nonce: number;
  status: 'pending' | 'relaying' | 'completed' | 'failed';
  depositBlockNumber: number;
  withdrawBlockNumber?: number;
  depositTime: Date;
  withdrawTime?: Date;
  error?: string;
}
```

#### `DepositEvent`
Event emitted when tokens are deposited on source chain.

```typescript
interface DepositEvent {
  txHash: string;
  logIndex: number;
  token: string;
  sender: string;
  recipient: string;
  amount: string;
  nonce: number;
  chainId: number;
  targetChainId: number;
  blockNumber: number;
  blockHash: string;
  timestamp: Date;
}
```

#### `WithdrawEvent`
Event emitted when tokens are withdrawn on target chain.

```typescript
interface WithdrawEvent {
  txHash: string;
  logIndex: number;
  token: string;
  recipient: string;
  amount: string;
  nonce: number;
  sourceChainId: number;
  chainId: number;
  blockNumber: number;
  blockHash: string;
  timestamp: Date;
}
```

### Constants

#### `CHAINS`
Mapping of chain IDs to chain configurations.

```typescript
CHAINS: Record<number, Chain> = {
  1: { /* Ethereum */ },
  137: { /* Polygon */ },
  42161: { /* Arbitrum */ },
  10: { /* Optimism */ },
  // ... more chains
}
```

#### `TOKENS`
Mapping of token symbols to chains to token definitions.

```typescript
TOKENS: Record<string, Record<number, Token>> = {
  USDC: {
    1: { address: '0xa0b86991...', ... },
    137: { address: '0x2791bca1...', ... },
  },
  USDT: { ... },
  DAI: { ... },
}
```

### Validation Functions

All validation functions return `{ valid: boolean; errors: string[] }`:

- `isValidAddress(address: string): boolean`
- `isValidTxHash(hash: string): boolean`
- `isValidMessageHash(hash: string): boolean`
- `isValidSignature(signature: string): boolean`
- `isValidNonce(nonce: number): boolean`
- `isValidChainId(chainId: number): boolean`
- `validateTransferParams(params: ...): { valid, errors }`
- `validateDepositParams(params: ...): { valid, errors }`
- `validateWithdrawParams(params: ...): { valid, errors }`

### Formatting Functions

- `shortenAddress(address, startChars?, endChars?): string`
- `shortenTxHash(hash, chars?): string`
- `formatAmount(amount, decimals?, precision?): string`
- `formatNumber(num): string`
- `formatCurrency(amount, symbol?, decimals?): string`
- `formatPercentage(value, decimals?): string`
- `formatDate(timestamp, locale?): string`
- `formatTime(timestamp, locale?): string`
- `formatDateTime(timestamp, locale?): string`
- `formatRelativeTime(date): string`
- `formatDuration(ms): string`
- `formatBytes(bytes): string`
- `getStatusColor(status): string`
- `getStatusEmoji(status): string`

## Building

```bash
# Build TypeScript
pnpm build

# Check types
pnpm typecheck
```

## Exporting from Services

Each service should re-export types from this package:

```typescript
// backend/src/index.ts
export { BridgeTransfer, DepositEvent } from '@bridge/shared';

// indexer/src/index.ts
export { BridgeEvent, VolumeStats } from '@bridge/shared';
```

## Adding New Chains

1. Add chain to `src/constants/chains.ts`:

```typescript
export const CHAINS: Record<number, Chain> = {
  // ...
  1001: {
    id: 1001,
    name: 'My New Chain',
    rpcUrl: 'https://...',
    blockExplorerUrl: 'https://...',
    nativeCurrency: { ... },
  },
};
```

2. Build and deploy:

```bash
pnpm build
pnpm publish
```

## Adding New Tokens

1. Add token to `src/constants/tokens.ts`:

```typescript
export const TOKENS: Record<string, Record<number, Token>> = {
  // ...
  MYTOKEN: {
    1: {
      address: '0x...',
      symbol: 'MYTOKEN',
      name: 'My Token',
      decimals: 18,
      chainId: 1,
    },
    137: { /* ... */ },
  },
};
```

2. Build and deploy:

```bash
pnpm build
pnpm publish
```

## Contributing

When adding new shared utilities:

1. Add types to `src/types/bridge.ts`
2. Add constants to `src/constants/*.ts`
3. Add utilities to `src/utils/*.ts`
4. Export from `src/index.ts`
5. Update README with examples

## License

MIT