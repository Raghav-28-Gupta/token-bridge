# 🧪 Complete Testing Guide with Anvil

This guide will walk you through testing your entire Token Bridge project using Anvil (Foundry's local blockchain). No testnets, no API keys, no real money needed!

---

## 📚 Table of Contents

1. [Part 1: Contract Testing with Anvil](#part-1-contract-testing-with-anvil)
2. [Part 2: Backend Testing with Anvil](#part-2-backend-testing-with-anvil)
3. [Part 3: Indexer Testing with Anvil](#part-3-indexer-testing-with-anvil)
4. [Part 4: Full Integration Test](#part-4-full-integration-test)

---

## Part 1: Contract Testing with Anvil

### 🎯 What You'll Learn
- How to run Foundry unit tests
- How to deploy contracts to Anvil
- How to interact with deployed contracts using `cast`
- How to test different scenarios

---

## Step 1: Understanding Anvil

**What is Anvil?**
- A local Ethereum blockchain that runs on your computer
- Gives you 10 pre-funded test accounts with 10,000 ETH each
- Instant transactions (no waiting)
- Perfect for development and testing

**Anvil Default Accounts (we'll use these):**
```
Account #0 (Deployer):
  Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1 (Validator 1):
  Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2 (Validator 2):
  Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
  Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

Account #3 (Validator 3):
  Address: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
  Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
```

---

## Step 2: Running Unit Tests (No Anvil Needed)

Foundry unit tests run in their own isolated EVM, so you don't need Anvil for these.

### 2.1 Run All Tests

```bash
cd contracts
forge test
```

**Expected Output:**
```
[⠊] Compiling...
[⠒] Compiling 2 files with 0.8.20
[⠑] Solc 0.8.20 finished in 1.23s

Running 15 tests for test/Bridge.t.sol:BridgeTest
[PASS] testAddSupportedToken() (gas: 45822)
[PASS] testDepositNativeToken() (gas: 89234)
[PASS] testDepositRevertsWhenPaused() (gas: 23456)
... [all tests]
Test result: ok. 15 passed; 0 failed; 0 skipped; finished in 12.34ms

Running 8 tests for test/BridgeToken.t.sol:BridgeTokenTest
[PASS] testMint() (gas: 51234)
[PASS] testBurn() (gas: 45123)
... [all tests]
Test result: ok. 8 passed; 0 failed; 0 skipped; finished in 8.45ms
```

### 2.2 Run Specific Test File

```bash
forge test --match-path test/Bridge.t.sol
```

### 2.3 Run Specific Test Function

```bash
forge test --match-test testDepositNativeToken
```

### 2.4 Run Tests with Detailed Output

```bash
forge test -vvv
```

**Verbosity levels:**
- `-v`: Show test results
- `-vv`: Show logs from passing tests
- `-vvv`: Show execution traces
- `-vvvv`: Show execution traces + setup traces
- `-vvvvv`: Show execution + setup traces + internal calls

### 2.5 Check Gas Usage

```bash
forge test --gas-report
```

**Result:**
```
╭────────────────────┬─────────────────┬────────┬────────┬────────┬─────────╮
│ Contract           ┆ Function        ┆ Min    ┆ Avg    ┆ Max    ┆ # calls │
├────────────────────┼─────────────────┼────────┼────────┼────────┼─────────┤
│ Bridge             ┆ deposit         ┆ 45234  ┆ 67890  ┆ 89234  ┆ 5       │
│ Bridge             ┆ withdraw        ┆ 78123  ┆ 89234  ┆ 98765  ┆ 3       │
...
```

✅ **If all tests pass, you're ready for deployment!**

---

## Step 3: Starting Anvil

Open a **new terminal** and keep it running:

```bash
anvil
```

**You should see:**
```
                             _   _
                            (_) | |
      __ _   _ __   __   __  _  | |
     / _` | | '_ `  ` ` / / | | | |
    | (_| | | | | |  ` V /  | | | |
     `__,_| |_| |_|   `_/   |_| |_|

    0.2.0 (abcd1234 2024-01-15T00:00:00.000000000Z)
    https://github.com/foundry-rs/foundry

Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000.000000000000000000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000.000000000000000000 ETH)
(2) 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000.000000000000000000 ETH)
...

Private Keys
==================
(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...

Listening on 127.0.0.1:8545
```

**Keep this terminal open!** Anvil is now running on `http://localhost:8545`

---

## Step 4: Setting Up Environment

In your **contracts** directory, copy the local environment:

```bash
cd contracts
copy .env.local .env
```

**What's in `.env.local`:**
```env
# Deployer (Account #0)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Validators (Accounts #1-3)
VALIDATOR_1=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
VALIDATOR_2=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
VALIDATOR_3=0x90F79bf6EB2c4f870365E785982E1f101E93b906

# Local RPC
RPC_URL=http://localhost:8545
```

✅ **No real keys needed - these are Anvil's public test keys!**

---

## Step 5: Deploying Contracts to Anvil

### 5.1 Deploy Everything (Recommended)

```bash
forge script script/Deploy.s.sol:FullDeploy `
  --rpc-url http://localhost:8545 `
  --broadcast
```

**What this does:**
1. Deploys Bridge contract with 3 validators
2. Deploys 3 wrapped tokens (WETH, USDC, USDT)
3. Adds validators to the bridge
4. Adds tokens to supported list
5. Sets minimum validators to 2

**Expected Output:**
```
[⠊] Compiling...
No files changed, compilation skipped

Script ran successfully.

== Logs ==
  
=== Deploying Bridge ===
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Chain ID: 31337
Bridge deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3

=== Adding Validators ===
Adding validator: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Adding validator: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Adding validator: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
Total validators: 3

=== Deploying Bridge Tokens ===
Deploying Wrapped ETH...
WETH deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

Deploying Wrapped USDC...
WUSDC deployed at: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

Deploying Wrapped USDT...
WUSDT deployed at: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

## Setting up 1 EVM.
==========================

Chain 31337

Estimated gas price: 1.000000001 gwei
Estimated total gas used for script: 4567890
Estimated amount required: 0.004567890004567890 ETH

==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
Total Paid: 0.0034567 ETH (3456789 gas * avg 1.000000001 gwei)
```

**✅ Save these addresses - you'll need them!**

---

## Step 6: Verifying Deployment

### 6.1 Check Bridge Address

From the output above, your Bridge is at: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

Let's verify it:

```bash
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "currentChainId()" --rpc-url http://localhost:8545
```

**Expected:** `0x0000000000000000000000000000000000000000000000000000000000007a69` (31337 in hex)

### 6.2 Check Minimum Validators

```bash
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "minValidators()" --rpc-url http://localhost:8545
```

**Expected:** `0x0000000000000000000000000000000000000000000000000000000000000002` (2)

### 6.3 Check if Validator 1 is Added

```bash
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 `
  "isValidator(address)" `
  0x70997970C51812dc3A010C7d01b50e0d17dc79C8 `
  --rpc-url http://localhost:8545
```

**Expected:** `0x0000000000000000000000000000000000000000000000000000000000000001` (true)

### 6.4 Check Native Token Support

```bash
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 `
  "supportedTokens(address)" `
  0x0000000000000000000000000000000000000000 `
  --rpc-url http://localhost:8545
```

**Expected:** `0x0000000000000000000000000000000000000000000000000000000000000001` (true)

---

## Step 7: Interactive Testing

Now let's test actual bridge functionality!

### 7.1 Check Initial Balance

```bash
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545
```

**Expected:** ~`9999996543210987654321` (slightly less than 10000 ETH due to deployment gas)

### 7.2 Make a Deposit

Let's deposit 1 ETH to bridge to chain 80001 (Mumbai):

```bash
cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 `
  "deposit(address,address,uint256,uint256)" `
  0x0000000000000000000000000000000000000000 `
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 `
  1000000000000000000 `
  80001 `
  --value 1ether `
  --rpc-url http://localhost:8545 `
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Expected Output:**
```
blockHash               0x1234...
blockNumber             2
contractAddress         
cumulativeGasUsed       89234
effectiveGasPrice       1000000001
gasUsed                 89234
logs                    [{"address":"0x5fbd...","topics":["0x123..."],...}]
logsBloom               0x000...
root                    
status                  1
transactionHash         0xabcd...
transactionIndex        0
type                    2
```

### 7.3 Verify Deposit Event

```bash
cast logs --from-block 0 `
  --address 0x5FbDB2315678afecb367f032d93F642f64180aa3 `
  "Deposit(address,address,address,uint256,uint256,uint256)" `
  --rpc-url http://localhost:8545
```

### 7.4 Check Deposit Nonce Increased

```bash
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "depositNonce()" --rpc-url http://localhost:8545
```

**Expected:** `0x0000000000000000000000000000000000000000000000000000000000000001` (1)

### 7.5 Check Bridge Balance

```bash
cast balance 0x5FbDB2315678afecb367f032d93F642f64180aa3 --rpc-url http://localhost:8545
```

**Expected:** `1000000000000000000` (1 ETH)

---

## Step 8: Testing Admin Functions

### 8.1 Pause the Bridge

```bash
cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 `
  "pause()" `
  --rpc-url http://localhost:8545 `
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 8.2 Verify Bridge is Paused

```bash
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "paused()" --rpc-url http://localhost:8545
```

**Expected:** `0x0000000000000000000000000000000000000000000000000000000000000001` (true)

### 8.3 Try to Deposit (Should Fail)

```bash
cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 `
  "deposit(address,uint256,address,uint256)" `
  0x0000000000000000000000000000000000000000 `
  0xde0b6b3a7640000 `
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 `
  80001 `
  --value 1ether `
  --rpc-url http://localhost:8545 `
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Expected:** Error with `EnforcedPause()` custom error

### 8.4 Unpause the Bridge

```bash
cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 `
  "unpause()" `
  --rpc-url http://localhost:8545 `
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

---

## Step 9: Testing Configuration Scripts

### 9.1 Add a New Validator

First, set environment variables for the new validator:

```bash
# Windows PowerShell
$env:BRIDGE_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
$env:NUM_NEW_VALIDATORS="1"
$env:NEW_VALIDATOR_1="0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
```

Then run the script:

```bash
forge script script/Configure.s.sol:AddValidators `
  --rpc-url http://localhost:8545 `
  --broadcast
```

### 9.2 Update Min Validators

```bash
$env:BRIDGE_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
$env:NEW_MIN_VALIDATORS="3"

forge script script/Configure.s.sol:UpdateMinValidators `
  --rpc-url http://localhost:8545 `
  --broadcast
```

### 9.3 View Bridge Status

```bash
$env:BRIDGE_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"

forge script script/Configure.s.sol:ViewBridgeStatus `
  --rpc-url http://localhost:8545
```

---

## Step 10: Testing Wrapped Tokens

### 10.1 Check WETH Balance

```bash
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 `
  "balanceOf(address)" `
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 `
  --rpc-url http://localhost:8545
```

### 10.2 Try to Mint (Should Fail - Only Bridge Can Mint)

```bash
cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 `
  "mint(address,uint256)" `
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 `
  1000000000000000000 `
  --rpc-url http://localhost:8545 `
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Expected:** Error with "Only Bridge can call"

---

## Step 11: Common Cast Commands

### Get Transaction Receipt
```bash
cast receipt <TX_HASH> --rpc-url http://localhost:8545
```

### Get Block Number
```bash
cast block-number --rpc-url http://localhost:8545
```

### Get Block Info
```bash
cast block latest --rpc-url http://localhost:8545
```

### Convert Wei to Ether
```bash
cast to-unit 1000000000000000000 ether
```

### Convert Hex to Decimal
```bash
cast to-dec 0x7a69
```

### Get Contract Code
```bash
cast code 0x5FbDB2315678afecb367f032d93F642f64180aa3 --rpc-url http://localhost:8545
```

---

## Step 12: Resetting Anvil

If you want to start fresh:

1. Stop Anvil (Ctrl+C in the Anvil terminal)
2. Start it again: `anvil`
3. Re-deploy: `forge script script/Deploy.s.sol:FullDeploy --rpc-url http://localhost:8545 --broadcast`

**Note:** The contract addresses will be the same each time if you use the same deployer account!

---

## 📊 Summary Checklist

After completing this part, you should be able to:

- [x] Run Foundry unit tests
- [x] Start Anvil local blockchain
- [x] Deploy contracts to Anvil
- [x] Verify deployment with `cast call`
- [x] Make deposits with `cast send`
- [x] Check events with `cast logs`
- [x] Test admin functions (pause/unpause)
- [x] Use configuration scripts
- [x] Reset and redeploy

---

## 🎯 Next Steps

Once you've mastered contract testing, move on to:
- **Part 2**: Backend Testing with Anvil
- **Part 3**: Indexer Testing with Anvil
- **Part 4**: Full Integration Test

---

## 💡 Pro Tips

1. **Keep Anvil logs visible** - Watch transactions in real-time
2. **Use `cast` aliases** - Create shortcuts for common commands
3. **Save addresses** - Keep a note of deployed addresses
4. **Test edge cases** - Try invalid inputs, zero amounts, etc.
5. **Check gas usage** - Use `--gas-report` to optimize

---

## 🐛 Common Issues

### "Connection refused"
- Make sure Anvil is running: `anvil`
- Check it's on port 8545

### "Nonce too low"
- Reset Anvil or wait for transaction to process

### "Insufficient funds"
- You should have 10,000 ETH per account on Anvil
- Check balance: `cast balance <ADDRESS> --rpc-url http://localhost:8545`

### "Invalid signature"
- Make sure you're using the correct private key
- Check the key matches the sender address

---

Ready to test? Start with Step 2 (running unit tests) and work your way through! 🚀

---

## Part 2: Backend Testing with Anvil

### 🎯 What You'll Learn
- How to configure backend to connect to Anvil
- How to set up the PostgreSQL database
- How to run the relayer service locally
- How to test deposit detection and withdrawal signing

---

## Step 13: Backend Prerequisites

Before testing the backend, ensure:
- ✅ Anvil is running with deployed contracts (Part 1 complete)
- ✅ PostgreSQL is installed and running
- ✅ Node.js and pnpm are installed

### 13.1 Check PostgreSQL

```bash
# Windows - Check if PostgreSQL is running
Get-Service postgresql*

# If not running, start it
Start-Service postgresql-x64-14  # Adjust version as needed
```

---

## Step 14: Setup Backend Environment

### 14.1 Copy Local Environment

```bash
cd backend
copy .env.local .env
```

### 14.2 Update Bridge Address

After deploying contracts (Part 1), update `.env` with the actual bridge address:

```env
# Update these lines in backend/.env
ETHEREUM_BRIDGE_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
POLYGON_BRIDGE_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
```

**Note:** Both point to the same address since we're using one Anvil instance for testing.

---

## Step 15: Setup Database

### 15.1 Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bridge;

# Exit psql
`q
```

### 15.2 Run Migrations

```bash
cd backend

# Generate Prisma client
pnpm exec prisma generate

# Run migrations
pnpm exec prisma migrate dev
```

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma`schema.prisma
Datasource "db": PostgreSQL database "bridge"

✔ Generated Prisma Client
✔ Database synchronized with Prisma schema
```

### 15.3 Verify Database

```bash
# Connect to database
psql -U postgres -d bridge

# List tables
`dt

# Should see:
# - Deposit
# - Withdrawal
# - _prisma_migrations

# Exit
`q
```

---

## Step 16: Build and Run Backend

### 16.1 Install Dependencies

```bash
cd backend
pnpm install
```

### 16.2 Build Shared Package First

```bash
cd ../shared
pnpm install
pnpm build

cd ../backend
```

### 16.3 Build Backend

```bash
pnpm build
```

**Expected Output:**
```
> backend@1.0.0 build
> tsc

✓ TypeScript compilation successful
```

### 16.4 Run Backend

```bash
pnpm start
```

**Expected Output:**
```
> backend@1.0.0 start
> node dist/index.js

[INFO] 🚀 Backend Relayer starting...
[INFO] 📡 Connecting to Ethereum RPC: http://localhost:8545
[INFO] 📡 Connecting to Polygon RPC: http://localhost:8545
[INFO] 🌉 Ethereum Bridge: 0x5FbDB2315678afecb367f032d93F642f64180aa3
[INFO] 🌉 Polygon Bridge: 0x5FbDB2315678afecb367f032d93F642f64180aa3
[INFO] ✓ Connected to database
[INFO] ✓ Started listening for Deposit events on chain 31337
[INFO] ✓ Backend ready and running on port 3001
```

**Keep this terminal running!**

---

## Step 17: Test Backend Functionality

### 17.1 Make a Deposit (In contracts terminal)

Open a **new terminal** and make a deposit:

```bash
cd contracts

# Set bridge address
set BRIDGE=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Make deposit
cast send %BRIDGE% "deposit(address,address,uint256,uint256)" ^
  0x0000000000000000000000000000000000000000 ^
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 ^
  1000000000000000000 ^
  31337 ^
  --value 1ether ^
  --rpc-url http://localhost:8545 ^
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 17.2 Check Backend Logs

In the backend terminal, you should see:

```
[DEBUG] 📥 New Deposit detected
[DEBUG] Token: 0x0000000000000000000000000000000000000000
[DEBUG] Sender: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
[DEBUG] Recipient: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
[DEBUG] Amount: 1000000000000000000
[DEBUG] Target Chain: 31337
[INFO] ✓ Deposit saved to database
[INFO] ✓ Validator signature added
```

### 17.3 Check Database

```bash
# In a new terminal
psql -U postgres -d bridge -c "SELECT * FROM `"Deposit`";"
```

**You should see your deposit record!**

### 17.4 Test Health Endpoint

```bash
curl http://localhost:3001/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-22T18:15:30.000Z"
}
```

### 17.5 Test Pending Withdrawals Endpoint

```bash
curl http://localhost:3001/api/pending-withdrawals/31337
```

**Expected:**
```json
{
  "withdrawals": [
    {
      "id": "...",
      "token": "0x0000000000000000000000000000000000000000",
      "recipient": "0xf39Fd...",
      "amount": "1000000000000000000",
      "nonce": 0,
      "sourceChainId": 31337,
      "targetChainId": 31337,
      "signatures": ["0x..."]
    }
  ]
}
```

---

## Step 18: Test Validator Signing

### 18.1 Check Validator Signature

The backend automatically signs deposits as a validator. Check the signature:

```bash
curl http://localhost:3001/api/signatures/0
```

**Expected:**
```json
{
  "nonce": 0,
  "signature": "0x...",
  "validator": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
}
```

---

## 📊 Backend Testing Checklist

After completing Part 2, you should have:

- [x] PostgreSQL database created and migrated
- [x] Backend environment configured for Anvil
- [x] Backend service running and connected to Anvil
- [x] Deposits detected and stored in database
- [x] Validator signatures generated automatically
- [x] API endpoints responding correctly

---

## Part 3: Indexer Testing with Anvil

### 🎯 What You'll Learn
- How to configure indexer to read from Anvil
- How to set up the indexer database
- How to run the indexer service
- How to query indexed data via API

---

## Step 19: Setup Indexer Environment

### 19.1 Copy Local Environment

```bash
cd indexer
copy .env.local .env
```

### 19.2 Update Bridge Address

Update `.env` with the deployed bridge address:

```env
# Update these lines in indexer/.env
ETHEREUM_BRIDGE_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
POLYGON_BRIDGE_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
```

---

## Step 20: Setup Indexer Database

### 20.1 Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bridge_indexer;

# Exit psql
`q
```

### 20.2 Run Migrations

```bash
cd indexer

# Generate Prisma client
pnpm exec prisma generate

# Run migrations
pnpm exec prisma migrate dev
```

**Expected Output:**
```
✔ Generated Prisma Client
✔ Database synchronized with Prisma schema
```

### 20.3 Verify Database

```bash
psql -U postgres -d bridge_indexer -c "`dt"
```

**Should see tables:**
- Transfer
- Event
- _prisma_migrations

---

## Step 21: Build and Run Indexer

### 21.1 Install Dependencies

```bash
cd indexer
pnpm install
```

### 21.2 Build Indexer

```bash
pnpm build
```

### 21.3 Run Indexer

```bash
pnpm start
```

**Expected Output:**
```
> indexer@1.0.0 start
> node dist/index.js

[INFO] 🔍 Bridge Indexer starting...
[INFO] 📡 Connecting to Ethereum RPC: http://localhost:8545
[INFO] 📡 Connecting to Polygon RPC: http://localhost:8545
[INFO] 🌉 Ethereum Bridge: 0x5FbDB2315678afecb367f032d93F642f64180aa3
[INFO] ✓  Connected to database
[INFO] ✓ Indexing from block 0 on chain 31337
[INFO] 🌐 API server running on http://localhost:3000
```

**Keep this terminal running!**

---

## Step 22: Test Indexer Functionality

### 22.1 Make Another Deposit

In contracts terminal:

```bash
cast send %BRIDGE% "deposit(address,address,uint256,uint256)" ^
  0x0000000000000000000000000000000000000000 ^
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 ^
  2000000000000000000 ^
  31337 ^
  --value 2ether ^
  --rpc-url http://localhost:8545 ^
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 22.2 Check Indexer Logs

You should see:

```
[DEBUG] 📥 Processing Deposit event
[DEBUG] Block: 3
[DEBUG] Token: 0x0000...0000
[DEBUG] Amount: 2000000000000000000
[INFO] ✓ Transfer indexed
```

### 22.3 Query Indexer API

**Get all transfers:**
```bash
curl http://localhost:3000/api/transfers
```

**Expected:**
```json
{
  "transfers": [
    {
      "id": "...",
      "txHash": "0x...",
      "token": "0x0000000000000000000000000000000000000000",
      "sender": "0xf39Fd...",
      "recipient": "0xf39Fd...",
      "amount": "1000000000000000000",
      "sourceChain": 31337,
      "targetChain": 31337,
      "status": "pending",
      "timestamp": "2025-11-22T18:20:00.000Z"
    },
    {
      ...second deposit...
    }
  ]
}
```

**Get transfers by user:**
```bash
curl http://localhost:3000/api/transfers/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

**Get transfer statistics:**
```bash
curl http://localhost:3000/api/stats
```

**Expected:**
```json
{
  "totalTransfers": 2,
  "totalVolume": "3000000000000000000",
  "pendingTransfers": 2,
  "completedTransfers": 0
}
```

### 22.4 Check Indexer Database

```bash
psql -U postgres -d bridge_indexer -c "SELECT * FROM `"Transfer`";"
```

---

## 📊 Indexer Testing Checklist

After completing Part 3, you should have:

- [x] Indexer database created and migrated
- [x] Indexer environment configured for Anvil
- [x] Indexer service running and reading from Anvil
- [x] Events indexed and stored in database
- [x] API endpoints returning indexed data
- [x] Real-time indexing of new events working

---

## Part 4: Full Integration Test

Now test the complete flow with all services running together!

### 🎯 What You'll Test
- Complete deposit-to-withdrawal flow
- Multi-validator signing
- Cross-chain simulation
- API interactions

---

## Step 23: Full Flow Test

### Prerequisites
Ensure all services are running:
- ✅ Terminal 1: Anvil
- ✅ Terminal 2: Backend (port 3001)
- ✅ Terminal 3: Indexer (port 3000)

### 23.1 Make a Deposit

```bash
# Terminal 4: Contracts
cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 ^
  "deposit(address,address,uint256,uint256)" ^
  0x0000000000000000000000000000000000000000 ^
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 ^
  5000000000000000000 ^
  31337 ^
  --value 5ether ^
  --rpc-url http://localhost:8545 ^
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 23.2 Verify All Services Detected It

**Backend logs (Terminal 2):**
```
[DEBUG] 📥 New Deposit detected
[INFO] ✓ Deposit saved to database
[INFO] ✓ Validator signature added
```

**Indexer logs (Terminal 3):**
```
[DEBUG] 📥 Processing Deposit event
[INFO] ✓ Transfer indexed
```

### 23.3 Query the APIs

**Check backend for pending withdrawal:**
```bash
curl http://localhost:3001/api/pending-withdrawals/31337
```

**Check indexer for transfer record:**
```bash
curl http://localhost:3000/api/transfers | jq '.transfers | length'
```

Should return `3` (or more depending on previous tests)

### 23.4 Get Validator Signatures

```bash
curl http://localhost:3001/api/signatures/2
```

This returns the signature for nonce 2 (your third deposit).

### 23.5 Simulate Withdrawal

Use the signature(s) to withdraw (in production, frontend would do this):

```bash
# Get the signature from API
set SIG=<signature_from_api>

# Execute withdrawal
cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 ^
  "withdraw(address,address,uint256,uint256,uint256,bytes[])" ^
  0x0000000000000000000000000000000000000000 ^
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 ^
  5000000000000000000 ^
  2 ^
  31337 ^
  [%SIG%] ^
  --rpc-url http://localhost:8545 ^
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Note:** In a real multi-validator setup, you'd need 2+ signatures.

### 23.6 Verify Withdrawal in Indexer

```bash
curl http://localhost:3000/api/transfers
```

The transfer status should update to `"completed"`.

---

## Step 24: Monitor Everything

### 24.1 Check All Databases

```bash
# Backend database
psql -U postgres -d bridge -c "SELECT COUNT(*) FROM `"Deposit`";"

# Indexer database
psql -U postgres -d bridge_indexer -c "SELECT COUNT(*) FROM `"Transfer`";"
```

### 24.2 Check Anvil Logs

Look at Terminal 1 (Anvil) to see all transactions.

### 24.3 Get Statistics

```bash
# Indexer stats
curl http://localhost:3000/api/stats

# Bridge status on-chain
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "depositNonce()" --rpc-url http://localhost:8545
```

---

## 🎉 Final Integration Checklist

After completing Part 4, you've successfully:

- [x] Deployed contracts to Anvil
- [x] Set up and ran backend relayer
- [x] Set up and ran indexer service
- [x] Made deposits and verified detection
- [x] Generated validator signatures
- [x] Indexed events in real-time
- [x] Queried data via APIs
- [x] Tested complete deposit-withdrawal flow

---

## 🚀 What's Next?

Now that everything works locally:

1. **Build the Frontend** - Connect to these APIs
2. **Test Edge Cases** - Try failed transactions, reverts
3. **Optimize** - Improve polling intervals, add caching
4. **Deploy to Testnets** - When ready for public demo
5. **Add Monitoring** - Prometheus, Grafana, logs

---

## 💡 Pro Tips for Full Stack Testing

1. **Use separate terminals** - One for each service
2. **Check logs frequently** - Catch issues early
3. **Reset databases** - `DROP DATABASE` and recreate for fresh start
4. **Save test scripts** - Automate common test flows
5. **Monitor resource usage** - PostgreSQL, Node.js memory
6. **Use Docker Compose** - Run all services together (optional)

---

## 🐛 Troubleshooting Full Stack

### Backend not detecting deposits
- Check RPC URL in `.env`
- Verify bridge address is correct
- Check database connection
- Restart backend service

### Indexer not indexing
- Check `START_BLOCK` in `.env`
- Verify RPC connection
- Check database migrations
- Restart indexer

### Database connection errors
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists
- Check user permissions

### API not responding
- Check port conflicts (3000, 3001)
- Verify service is running
- Check firewall/antivirus
- Try `curl localhost:3000/health`

---

🎊 **Congratulations!** You now have a fully functional Token Bridge running locally with Anvil! 🎊

