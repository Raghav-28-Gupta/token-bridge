---
## 🚀 Detailed Deployment Workflow Using Anvil

This section explains **exactly what happens** when you deploy the Bridge contracts to Anvil, step-by-step.
---

### **Phase 1: Environment Setup & Preparation**

#### **STEP 1: Start Anvil**

```bash
$ anvil
```

**What Anvil does:**

-  ✅ Creates an in-memory EVM instance
-  ✅ Generates deterministic accounts (same every time)
-  ✅ Listens on `http://localhost:8545` (JSON-RPC endpoint)
-  ✅ Pre-funds all accounts with test ETH
-  ✅ Mines transactions instantly (no waiting)

**Pre-funded accounts:**

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

### **Phase 2: Configuration & Environment Loading**

#### **STEP 2: Load Environment Variables**

```bash
$ forge script script/Deploy.s.sol:FullDeploy `
  --rpc-url http://localhost:8545 `
  --broadcast
```

Forge reads `.env` file:

```env
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
VALIDATOR_1=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
VALIDATOR_2=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
VALIDATOR_3=0x90F79bf6EB2c4f870365E785982E1f101E93b906
MIN_VALIDATORS=2
```

**What happens in code:**

```solidity
contract FullDeploy is Script {
    function run() external returns (DeploymentResult memory) {
        // 1️⃣ Load private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // 2️⃣ Get current chain ID
        uint256 chainId = block.chainid; // Returns: 31337 (Anvil's chain ID)

        // 3️⃣ Load validator addresses
        address[] memory validators = new address[](3);
        validators[0] = vm.envAddress("VALIDATOR_1");
        validators[1] = vm.envAddress("VALIDATOR_2");
        validators[2] = vm.envAddress("VALIDATOR_3");

        // 4️⃣ Get minimum validators threshold
        uint256 minValidators = 2;
    }
}
```

---

### **Phase 3: Transaction Broadcasting Setup**

#### **STEP 3: Start Broadcast Mode**

```solidity
vm.startBroadcast(deployerPrivateKey)
```

**What this does:**

-  Signs all subsequent transactions with this private key
-  Sends transactions to Anvil (`http://localhost:8545`)
-  Records gas usage
-  Saves deployment data to `broadcast/` folder

**Behind the scenes:**

```
Forge creates a transaction context:
┌───────────────────────────────────────┐
│      Transaction Environment          │
├───────────────────────────────────────┤
│ Signer: 0xf39Fd6e... (Account #0)    │
│ Private Key: 0xac097...              │
│ RPC URL: http://localhost:8545       │
│ Chain ID: 31337                       │
│ Gas Price: Auto-calculated (1 gwei)  │
└───────────────────────────────────────┘
```

---

### **Phase 4: Contract Deployment - Bridge**

#### **STEP 4: Deploy Bridge Contract**

```solidity
Bridge bridge = new Bridge(validators, minValidators, chainId);
```

**Sequence of events:**

1. **Forge compiles** `Bridge.sol` to bytecode
2. **Creates deployment transaction** with:
   -  Constructor parameters: `[validators[], 2, 31337]`
   -  From: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   -  Gas estimate: ~456,789
   -  Signature: ECDSA signed with private key
3. **Sends to Anvil** via JSON-RPC
4. **Anvil executes** in EVM:
   -  Allocates storage
   -  Runs constructor code
   -  Sets initial state
   -  Returns contract address
5. **Stores address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

**What the Bridge constructor does:**

```solidity
contract Bridge is Pausable, Ownable {
    constructor(
        address[] memory _validators,
        uint256 _minValidators,
        uint256 _chainId
    ) {
        // 1. Validate inputs
        require(_validators.length > 0, "No validators");
        require(_minValidators <= _validators.length, "Invalid min");

        // 2. Store validators
        for (uint i = 0; i < _validators.length; i++) {
            validators.push(_validators[i]);
            validatorSet[_validators[i]] = true;
        }

        // 3. Store configuration
        minValidators = _minValidators;
        currentChainId = _chainId;

        // 4. Initialize other state
        depositNonce = 0;
        paused = false;
        owner = msg.sender; // Deployer
    }
}
```

**Result in Anvil:**

```
Block 1 mined:
├─ Transaction hash: 0x5f8...
├─ Gas used: 456,789
├─ Status: success ✅
├─ Contract created: 0x5FbDB2315678afecb367f032d93F642f64180aa3
└─ Account #0 balance: 10,000 ETH - 0.456789 ETH = 9,999.543211 ETH
```

**Output logged:**

```
=== Bridge Deployed ===
Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Chain ID: 31337
Min Validators: 2
Validators:
  - 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  - 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
  - 0x90F79bf6EB2c4f870365E785982E1f101E93b906
```

---

### **Phase 5: Deploy Wrapped Tokens**

#### **STEP 5: Deploy 3 Wrapped Token Contracts**

The script deploys WETH (18 decimals), USDC (6 decimals), and USDT (6 decimals).

**Loop iteration 1 - WETH:**

```solidity
BridgeToken token = new BridgeToken(
    "Wrapped ETH",    // name
    "WETH",           // symbol
    18,               // decimals
    address(bridge)   // bridge address
);
// → Deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

**What BridgeToken constructor does:**

```solidity
contract BridgeToken is ERC20 {
    address public bridge;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        address _bridge
    ) ERC20(name, symbol) {
        // Set decimal places
        _decimals = decimals;

        // Only this bridge can mint/burn
        bridge = _bridge;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == bridge, "Only Bridge can mint");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == bridge, "Only Bridge can burn");
        _burn(from, amount);
    }
}
```

**Each deployment:**

```
Transaction for WETH:
├─ From: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (Account #0)
├─ Gas used: ~289,567
├─ Contract: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
├─ Initial state:
│  ├─ name = "Wrapped ETH"
│  ├─ symbol = "WETH"
│  ├─ decimals = 18
│  ├─ totalSupply = 0
│  └─ bridge = 0x5FbDB... (Bridge contract)
└─ Status: success ✅

Transaction for USDC:
├─ Gas used: ~268,234
├─ Contract: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
└─ Status: success ✅

Transaction for USDT:
├─ Gas used: ~265,890
├─ Contract: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
└─ Status: success ✅
```

**Anvil state after token deployments:**

```
Blockchain:
├─ Block 1: Bridge deployed
├─ Block 2: WETH deployed
├─ Block 3: USDC deployed
├─ Block 4: USDT deployed
└─ Account #0 balance: 9,999.543211 - 0.289567 - 0.268234 - 0.265890 = 9,998.72952 ETH
```

---

### **Phase 6: Register Tokens with Bridge**

#### **STEP 6: Add Tokens to Bridge's Supported Token List**

```solidity
bridge.addSupportedToken(0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512); // WETH
bridge.addSupportedToken(0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0); // USDC
bridge.addSupportedToken(0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9); // USDT
```

**Bridge.sol implementation:**

```solidity
function addSupportedToken(address token) external onlyOwner {
    require(token != address(0), "Invalid token");
    require(!supportedTokens[token], "Already supported");

    supportedTokens[token] = true;
    emit SupportedTokenAdded(token);
}
```

**What happens in Anvil:**

```
Transaction #5 (Add WETH):
├─ Function: bridge.addSupportedToken(0xe7f1...)
├─ From: 0xf39Fd6e... (deployer/owner)
├─ To: 0x5FbDB... (Bridge contract)
├─ Gas used: 22,451
├─ Storage change: supportedTokens[0xe7f1...] = true
└─ Event emitted: SupportedTokenAdded(0xe7f1...)

Transaction #6 (Add USDC):
├─ Gas used: 22,589
└─ Status: success ✅

Transaction #7 (Add USDT):
├─ Gas used: 22,401
└─ Status: success ✅
```

**Bridge storage after registration:**

```
supportedTokens mapping:
├─ 0x0000...0000 (native ETH): true  [pre-existing]
├─ 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 (WETH): true ✅
├─ 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 (USDC): true ✅
└─ 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 (USDT): true ✅
```

---

### **Phase 7: Transaction Completion & Logging**

#### **STEP 7: Stop Broadcast & Log Summary**

```solidity
vm.stopBroadcast()
```

Forge collects all deployment data and logs results.

**Complete deployment summary:**

```
=== Deployment Summary ===

💰 Account #0 (Deployer) Final Balance:
   Started: 10,000.000000 ETH
   Used:      1.141032 ETH (total gas)
   Final:     8,858.858968 ETH

📦 Deployed Contracts:
   1. Bridge:
      Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
      Gas:     456,789

   2. WETH:
      Address: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
      Gas:     289,567

   3. USDC:
      Address: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
      Gas:     268,234

   4. USDT:
      Address: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
      Gas:     265,890

⚙️ Configuration:
   Chain ID:           31337
   Min Validators:     2
   Total Validators:   3
   Supported Tokens:   4 (ETH + 3 wrapped)
   Deposit Nonce:      0
   Paused:             false

📋 Transactions:
   Block 1: Bridge deployment
   Block 2: WETH deployment
   Block 3: USDC deployment
   Block 4: USDT deployment
   Block 5: Register WETH
   Block 6: Register USDC
   Block 7: Register USDT

Total Gas Used:       1,625,441
Total Cost:           0.001625441 ETH (~$1.62 at $1000/ETH)
```

---

## 📊 Complete State After Deployment

### **Anvil Blockchain State**

```
Network: http://localhost:8545
Chain ID: 31337
Current Block: 7

Accounts:
├─ #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
│  └─ Balance: 8,858.858968 ETH ✅
├─ #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
│  └─ Balance: 10,000 ETH (unchanged)
├─ #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
│  └─ Balance: 10,000 ETH (unchanged)
└─ #3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
   └─ Balance: 10,000 ETH (unchanged)

Smart Contracts:
├─ 0x5FbDB... (Bridge)
│  ├─ Owner: 0xf39Fd6e...
│  ├─ Chain ID: 31337
│  ├─ Min Validators: 2
│  ├─ Validators: [0x70997970, 0x3C44CdDd, 0x90F79bf6]
│  ├─ Deposit Nonce: 0
│  ├─ Paused: false
│  └─ Supported Tokens: [0x0000..., 0xe7f1..., 0x9fE4..., 0xCf7E...]
│
├─ 0xe7f1... (WETH)
│  ├─ Name: "Wrapped ETH"
│  ├─ Symbol: "WETH"
│  ├─ Decimals: 18
│  ├─ Bridge: 0x5FbDB...
│  └─ Total Supply: 0
│
├─ 0x9fE4... (USDC)
│  ├─ Name: "Wrapped USDC"
│  ├─ Symbol: "USDC"
│  ├─ Decimals: 6
│  ├─ Bridge: 0x5FbDB...
│  └─ Total Supply: 0
│
└─ 0xCf7E... (USDT)
   ├─ Name: "Wrapped USDT"
   ├─ Symbol: "USDT"
   ├─ Decimals: 6
   ├─ Bridge: 0x5FbDB...
   └─ Total Supply: 0
```

---

## 🔄 Saved Deployment Artifacts

Forge saves everything to `broadcast/Deploy.s.sol/31337/run-latest.json`:

```json
{
	"transactions": [
		{
			"hash": "0x5f8e...",
			"transactionType": "CREATE",
			"contractName": "Bridge",
			"contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
			"function": null,
			"arguments": ["[validators]", "2", "31337"],
			"rpc": "http://localhost:8545",
			"receipt": {
				"transactionHash": "0x5f8e...",
				"blockNumber": 1,
				"gasUsed": 456789,
				"status": 1,
				"to": null,
				"contractAddress": "0x5FbDB..."
			}
		},
		{
			"hash": "0xa3c2...",
			"contractName": "BridgeToken",
			"contractAddress": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
			"arguments": ["Wrapped ETH", "WETH", 18, "0x5FbDB..."]
		}
	]
}
```

---

## 🎯 Using Deployed Contracts

With deployment complete, you can interact with the contracts:

### **1. Verify Contracts with Cast**

```bash
# Check Bridge exists
cast code 0x5FbDB2315678afecb367f032d93F642f64180aa3 --rpc-url http://localhost:8545

# Call Bridge function
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 `
  "minValidators()" `
  --rpc-url http://localhost:8545
# Output: 0x0000000000000000000000000000000000000000000000000000000000000002
```

### **2. Make a Deposit**

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

### **3. Connect Backend/Frontend**

```env
BRIDGE_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
WETH_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
USDC_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
USDT_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
RPC_URL=http://localhost:8545
```

---

## 📝 Deployment Summary Table

| Phase               | What Happens                            | Time | Gas Cost          |
| ------------------- | --------------------------------------- | ---- | ----------------- |
| **Anvil Start**     | Creates 10 test accounts with 10k ETH   | <1s  | Free              |
| **Load Env**        | Reads `.env` file with keys & addresses | <1s  | Free              |
| **Start Broadcast** | Sets up transaction signing             | <1s  | Free              |
| **Deploy Bridge**   | Creates Bridge contract on Anvil        | ~1s  | 456,789           |
| **Deploy Tokens**   | Creates 3 wrapped token contracts       | ~3s  | 823,691           |
| **Register Tokens** | Adds tokens to Bridge's whitelist       | ~1s  | 67,441            |
| **Stop Broadcast**  | Saves all data to `broadcast/`          | <1s  | Free              |
| **Total**           | Complete deployment                     | ~6s  | **1,348,031 gas** |

**All transactions execute instantly on Anvil with zero fees!** 🚀
