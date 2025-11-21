// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/forge-std/src/Test.sol";
import "../src/Bridge.sol";
import "../src/BridgeToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/libraries/MessageLib.sol";


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

contract BridgeTokenTest is Test{
     BridgeToken public token;
     address public bridge;
     address public owner;
     address public user;

     function setUp() public {
          owner = address(this);
          bridge = makeAddr("bridge");
          user = makeAddr("user");

          token = new BridgeToken("Test Token", "TEST", 18, bridge);
     }

     function testMintByBridge() public {
          vm.prank(bridge);
          token.mint(user, 100 ether);

          assertEq(token.balanceOf(user), 100 ether);
          assertEq(token.totalSupply(), 100 ether);
     }

     function testBurnByBridge() public {
          vm.prank(bridge);
          token.mint(user, 100 ether);
          
          vm.prank(bridge);
          token.burnFromBridge(user, 50 ether);
          
          assertEq(token.balanceOf(user), 50 ether);
          assertEq(token.totalSupply(), 50 ether);
     }
     
     function testOnlyBridgeCanMint() public {
          vm.prank(user);
          vm.expectRevert("Only Bridge can call");
          token.mint(user, 100 ether);
     }
     
     function testTransfer() public {
          vm.prank(bridge);
          token.mint(user, 100 ether);
          
          address recipient = makeAddr("recipient");
          
          vm.prank(user);
          token.transfer(recipient, 50 ether);
          
          assertEq(token.balanceOf(user), 50 ether);
          assertEq(token.balanceOf(recipient), 50 ether);
    }
}