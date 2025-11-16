// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Test.sol";
import "../src/Bridge.sol";
import "../src/BridgeToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract MockERC20 is ERC20{
     constructor() ERC20("Mock Token", "MOCK") {}

     function mint(address to, uint256 amount) external {
          _mint(to, amount);
     }
     
     // NOTE: When overriding, the new function must be at least as visible as the parent {public > external}
     function transfer(address to, uint256 amount) public override returns (bool) {
          _transfer(msg.sender, to, amount);
          return true;
     }
     
     function approve(address spender, uint256 amount) public override returns (bool) {
          _approve(msg.sender, spender, amount);
          return true;
     }
     
     function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
          _transfer(from, to, amount);
          uint256 currentAllowance = allowance(from, msg.sender);
          require(currentAllowance >= amount, "Insufficient allowance");
          _approve(from, msg.sender, currentAllowance - amount);
          return true;
     }
}


contract BridgeTest is Test{
     Bridge public bridge;
     MockERC20 public token;
     BridgeToken public bridgeToken;

     address public owner;
     address public validator1;
     address public validator2;
     address public validator3;
     address public user;

     uint256 public validator1Key = 0x1;
     uint256 public validator2Key = 0x2;
     uint256 public validator3Key = 0x3;

     uint256 public constant SOURCE_CHAIN = 1;
     uint256 public constant TARGET_CHAIN = 137;
     
     event Deposit(address indexed token, address indexed sender, address indexed recipient, uint256 amount, uint256 nonce, uint256 targetChainId);
     event withdraw(address indexed token, address indexed recipient, uint256 amount, uint256 nonce, uint256 SourceChainId);

     function setUp() public {
          owner = address(this);
          validator1 = vm.addr(validator1Key);
          validator2 = vm.addr(validator2Key);
          validator3 = vm.addr(validator3Key);
          user = makeAddr("user");

          address[] memory validators = new address[](3);
          validators[0] = validator1;
          validators[1] = validator2;
          validators[2] = validator3;

          bridge = new Bridge(validators, 2, TARGET_CHAIN);

          token = new MockERC20();
          token.mint(user, 1000 ether);

          bridgeToken = new BridgeToken("Wrapped Token", "Token", 18, address(bridge));
          
          bridge.addSupportedToken(address(token));
          bridge.addSupportedToken(address(bridgeToken));
     }

     function testDepositERC20() public {
          uint256 amount = 100 ether;

          vm.startPrank(user);
          token.approve(address(bridge), amount);

          vm.expectEmit(true, true, true, true);
          emit Deposit(address(token), user, user, amount, 0, SOURCE_CHAIN);

          bridge.deposit(address(token), amount, user, SOURCE_CHAIN);
          vm.stopPrank();

          assertEq(token.balanceOf(address(bridge)), amount);
          assertEq(bridge.depositNonce(), 1);
     }

     function testDepositNativeToken() public {
          uint256 amount = 1 ether;

          vm.deal(user, amount);
          vm.prank(user);

          vm.expectEmit(true, true, true, true);
          emit Deposit(address(0), user, user, amount, 0, SOURCE_CHAIN);

          bridge.deposit{value: amount}(address(0), amount, user, SOURCE_CHAIN);

          assertEq(address(bridge).balance, amount);
     }

     function testDepositRevertsOnSameChain() public {
          vm.prank(user);
          vm.expectRevert("Cannot bridge to same chain");
          bridge.deposit(address(token), 100 ether, user, TARGET_CHAIN);
     }

     function testDepositRevertsOnUnsupportedToken() public {
        MockERC20 unsupportedToken = new MockERC20();
        
        vm.prank(user);
        vm.expectRevert("Token not supported");
        bridge.deposit(address(unsupportedToken), 100 ether, user, SOURCE_CHAIN);
     }

     function testDepositRevertsWhenPaused() public {
        bridge.pause();
        
        vm.prank(user);
        vm.expectRevert("Pausable: paused");
        bridge.deposit(address(token), 100 ether, user, SOURCE_CHAIN);
     }

     // withdraw tests tmrw
     
}

