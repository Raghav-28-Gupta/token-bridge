# 🚀 Quick Reference: Testing with Anvil

## ✅ Test Status: ALL PASSING
```
✓ 19 tests passed
✓ 0 failed
✓ Bridge.t.sol: 15 tests
✓ BridgeToken.t.sol: 4 tests
```

---

## 📋 Quick Start Commands

### 1. Run Unit Tests (No Anvil needed)
```bash
cd contracts
forge test
```

### 2. Start Anvil (Keep running in separate terminal)
```bash
anvil
```

### 3. Setup Environment
```bash
copy .env.local .env
```

### 4. Deploy to Anvil
```bash
forge script script/Deploy.s.sol:FullDeploy --rpc-url http://localhost:8545 --broadcast
```

---

## 🔑 Anvil Default Accounts

| Account | Address | Private Key |
|---------|---------|-------------|
| **Deployer (#0)** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Validator 1 (#1)** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **Validator 2 (#2)** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| **Validator 3 (#3)** | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |

> **Note:** Each account has 10,000 ETH on Anvil by default

---

## 🎯 Common Testing Scenarios

### Check Bridge Status
```bash
# Set bridge address (from deployment output)
set BRIDGE=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Check chain ID
cast call %BRIDGE% "currentChainId()" --rpc-url http://localhost:8545

# Check if paused
cast call %BRIDGE% "paused()" --rpc-url http://localhost:8545

# Check min validators
cast call %BRIDGE% "minValidators()" --rpc-url http://localhost:8545

# Check deposit nonce
cast call %BRIDGE% "depositNonce()" --rpc-url http://localhost:8545
```

### Make a Deposit
```bash
# Deposit 1 ETH to chain 80001
cast send %BRIDGE% "deposit(address,address,uint256,uint256)" ^
  0x0000000000000000000000000000000000000000 ^
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 ^
  1000000000000000000 ^
  80001 ^
  --value 1ether ^
  --rpc-url http://localhost:8545 ^
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Check Balances
```bash
# Check ETH balance
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545

# Check bridge ETH balance
cast balance %BRIDGE% --rpc-url http://localhost:8545
```

### View Events
```bash
# Get all events from block 0
cast logs --from-block 0 --address %BRIDGE% --rpc-url http://localhost:8545
```

### Admin Operations
```bash
# Pause
cast send %BRIDGE% "pause()" ^
  --rpc-url http://localhost:8545 ^
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Unpause
cast send %BRIDGE% "unpause()" ^
  --rpc-url http://localhost:8545 ^
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

---

## 📦 Deployed Addresses (After FullDeploy)

Contracts deploy to these addresses on Anvil (deterministic):

| Contract | Address |
|----------|---------|
| **Bridge** | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| **WETH** | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| **WUSDC** | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| **WUSDT** | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |

> **Note:** These are the same every time you deploy with the same deployer on fresh Anvil

---

## 🛠️ Useful Cast Commands

```bash
# Get current block number
cast block-number --rpc-url http://localhost:8545

# Get transaction receipt
cast receipt <TX_HASH> --rpc-url http://localhost:8545

# Convert wei to ether
cast to-unit 1000000000000000000 ether

# Convert hex to decimal
cast to-dec 0x01

# Call any function (read-only)
cast call <CONTRACT> "<FUNCTION_SIG>" <ARGS> --rpc-url http://localhost:8545

# Send transaction (write)
cast send <CONTRACT> "<FUNCTION_SIG>" <ARGS> --rpc-url http://localhost:8545 --private-key <KEY>
```

---

## 🔄 Reset Everything

```bash
# 1. Stop Anvil (Ctrl+C)
# 2. Restart Anvil
anvil

# 3. Re-deploy (same addresses!)
forge script script/Deploy.s.sol:FullDeploy --rpc-url http://localhost:8545 --broadcast
```

---

## 📚 Full Guide

For detailed step-by-step instructions, see: [TESTING_GUIDE.md](TESTING_GUIDE.md)

For production deployment, see: [contracts/DEPLOYMENT.md](contracts/DEPLOYMENT.md)

---

## 🎬 Next Steps

1. ✅ **Contracts working** - All tests pass
2. 🔄 **Deploy to Anvil** - Follow Step 5 in TESTING_GUIDE.md
3. 🧪 **Test interactions** - Make deposits, check events
4. 🔗 **Connect backend** - Point to `http://localhost:8545`
5. 📊 **Connect indexer** - Point to `http://localhost:8545`
6. 🎨 **Build frontend** - Connect to local contracts

---

## 💡 Pro Tips

- Keep Anvil running in a separate terminal
- Save deployed addresses for quick access
- Use environment variables for contract addresses
- Test edge cases (zero amounts, unsupported tokens, etc.)
- Check events after each transaction
- Monitor gas usage with `--gas-report`

---

**Ready to deploy? Open two terminals and start with the Quick Start Commands above! 🚀**

---

## 🔗 Backend Testing (Part 2)

### Setup Backend
```bash
# 1. Copy environment
cd backend
copy .env.local .env

# 2. Update bridge address in .env
# ETHEREUM_BRIDGE_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"

# 3. Setup database
psql -U postgres -c "CREATE DATABASE bridge;"
pnpm exec prisma generate
pnpm exec prisma migrate dev

# 4. Build and run
cd ../shared && pnpm build && cd ../backend
pnpm install
pnpm build
pnpm start
```

### Test Backend
```bash
# Health check
curl http://localhost:3001/health

# Get pending withdrawals
curl http://localhost:3001/api/pending-withdrawals/31337

# Get signature for nonce 0
curl http://localhost:3001/api/signatures/0

# Query database
psql -U postgres -d bridge -c "SELECT * FROM \"Deposit\";"
```

---

## 📊 Indexer Testing (Part 3)

### Setup Indexer
```bash
# 1. Copy environment
cd indexer
copy .env.local .env

# 2. Update bridge address in .env
# ETHEREUM_BRIDGE_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"

# 3. Setup database
psql -U postgres -c "CREATE DATABASE bridge_indexer;"
pnpm exec prisma generate
pnpm exec prisma migrate dev

# 4. Build and run
pnpm install
pnpm build
pnpm start
```

### Test Indexer
```bash
# Health check
curl http://localhost:3000/health

# Get all transfers
curl http://localhost:3000/api/transfers

# Get transfers by user
curl http://localhost:3000/api/transfers/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Get stats
curl http://localhost:3000/api/stats

# Query database
psql -U postgres -d bridge_indexer -c "SELECT * FROM \"Transfer\";"
```

---

## 🚀 Full Stack Quick Start

### Terminal Layout
```
Terminal 1: Anvil          (anvil)
Terminal 2: Backend        (cd backend && pnpm start)
Terminal 3: Indexer        (cd indexer && pnpm start)
Terminal 4: Testing        (for running cast commands)
```

### Complete Test Flow
```bash
# 1. Start Anvil (Terminal 1)
anvil

# 2. Deploy contracts (Terminal 4)
cd contracts
copy .env.local .env
forge script script/Deploy.s.sol:FullDeploy --rpc-url http://localhost:8545 --broadcast

# 3. Start backend (Terminal 2)
cd backend
copy .env.local .env
# Update BRIDGE_ADDRESS in .env
psql -U postgres -c "CREATE DATABASE bridge;"
pnpm exec prisma generate && pnpm exec prisma migrate dev
pnpm build && pnpm start

# 4. Start indexer (Terminal 3)
cd indexer
copy .env.local .env
# Update BRIDGE_ADDRESS in .env
psql -U postgres -c "CREATE DATABASE bridge_indexer;"
pnpm exec prisma generate && pnpm exec prisma migrate dev
pnpm build && pnpm start

# 5. Make a deposit (Terminal 4)
cd contracts
set BRIDGE=0x5FbDB2315678afecb367f032d93F642f64180aa3
cast send %BRIDGE% "deposit(address,address,uint256,uint256)" ^
  0x0000000000000000000000000000000000000000 ^
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 ^
  1000000000000000000 ^  31337 ^
  --value 1ether ^
  --rpc-url http://localhost:8545 ^
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# 6. Verify in all services
curl http://localhost:3001/api/pending-withdrawals/31337  # Backend
curl http://localhost:3000/api/transfers                   # Indexer
```

---

## 🗄️ Database Commands

### Reset Everything
```bash
# Drop and recreate databases
psql -U postgres -c "DROP DATABASE IF EXISTS bridge;"
psql -U postgres -c "DROP DATABASE IF EXISTS bridge_indexer;"
psql -U postgres -c "CREATE DATABASE bridge;"
psql -U postgres -c "CREATE DATABASE bridge_indexer;"

# Re-run migrations
cd backend && pnpm exec prisma migrate dev
cd ../indexer && pnpm exec prisma migrate dev
```

### Query Databases
```bash
# Backend database
psql -U postgres -d bridge -c "SELECT COUNT(*) FROM \"Deposit\";"
psql -U postgres -d bridge -c "SELECT * FROM \"Deposit\" ORDER BY \"createdAt\" DESC LIMIT 5;"

# Indexer database
psql -U postgres -d bridge_indexer -c "SELECT COUNT(*) FROM \"Transfer\";"
psql -U postgres -d bridge_indexer -c "SELECT * FROM \"Transfer\" ORDER BY \"timestamp\" DESC LIMIT 5;"
```

---

## 📝 Environment Files

| Service | File | Contents |
|---------|------|----------|
| **Contracts** | `contracts/.env.local` | Deployer + Validator keys |
| **Backend** | `backend/.env.local` | Validator key + Bridge addresses |
| **Indexer** | `indexer/.env.local` | Bridge addresses + API config |

**All point to:** `http://localhost:8545` (Anvil)

---

## 🎯 Testing Checklist

- [ ] Anvil running on port 8545
- [ ] Contracts deployed (`0x5FbDB...`)
- [ ] PostgreSQL running
- [ ] Backend database created
- [ ] Backend running on port 3001
- [ ] Indexer database created
- [ ] Indexer running on port 3000
- [ ] Deposits detected by backend
- [ ] Events indexed by indexer
- [ ] APIs responding

---


