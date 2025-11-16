// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IBridgeToken.sol";

contract BridgeToken is IBridgeToken{
     string public name;
     string public symbol;
     uint8 public decimals;
     uint256 public totalSupply;

     address public bridge;
     address public owner;

     mapping(address => uint256) public balanceOf;
     mapping(address => mapping(address => uint256)) public allowance;

     event Transfer(address indexed from, address indexed to, uint256 value);
     event Approval(address indexed owner, address indexed spender, uint256 value);
     event Mint(address indexed to, uint256 value);
     event Burn(address indexed from, uint256 value);
     event BridgeUpdated(address indexed oldBridge, address indexed newBridge);

     modifier onlyBridge() {
          require(msg.sender == bridge, "Only Bridge can call");
          _;
     }

     modifier onlyOwner() {
          require(msg.sender == owner, "Only Owner can call");
          _;
     }

     constructor(string memory _name, string memory _symbol, uint8 _decimals, address _bridge) {
          require(_bridge != address(0), "Invalid bridge address");
          name = _name;
          symbol = _symbol;
          decimals = _decimals;
          bridge = _bridge;
          owner = msg.sender;
     }

     function transfer(address to, uint256 amount) external returns (bool) {
          require(to != address(0), "Transfer to zero address");
          require(balanceOf[msg.sender] >= amount, "Insufficient address");

          balanceOf[msg.sender] -= amount;
          balanceOf[to] += amount;

          emit Transfer(msg.sender, to, amount);
          return true;
     }

     function approve(address spender, uint256 amount) external returns (bool) {
          require(spender != address(0), "Approve to zero address");

          allowance[msg.sender][spender] = amount;
          emit Approval(msg.sender, spender, amount);
          return true;
     }

     function transferFrom(address from, address to, uint256 amount) external returns (bool){
          require(from != address(0), "Transfer from Zero Address");
          require(to != address(0), "Transfer to Zero Address");
          require(balanceOf[from] >= amount, "Insufficient Amount");
          require(allowance[from][msg.sender] >= amount, "Insufficient Amount");
          
          // Bridge contract is msg.sender in transferFrom
          balanceOf[from] -= amount;
          balanceOf[to] += amount;
          allowance[from][msg.sender] -= amount;

          emit Transfer(from, to, amount);
          return true;
     }
     
     function mint(address to, uint256 amount) external onlyBridge {
          require(to != address(0), "Mint to zero address");
          require(amount > 0, "Amount must be > 0");

          totalSupply += amount;
          balanceOf[to] += amount;

          emit Mint(to, amount);
          emit Transfer(address(0), to, amount);
     }

     function burnFromBridge(address from, uint256 amount) external onlyBridge{
          require(from != address(0), "From Address Zero");
          require(amount > 0, "Amount must be > 0");
          
          totalSupply -= amount;
          balanceOf[from] -= amount;

          emit Burn(from, amount);
          emit Transfer(from, address(0), amount);
     }

     function updateBridge(address newBridge) external onlyBridge{
          require(newBridge != address(0), "Invalid bridge address");

          address oldBridge = bridge;
          bridge = newBridge;

          emit BridgeUpdated(oldBridge, newBridge);
     }

     function transferOwnership(address newOwner) external onlyOwner{
          require(newOwner != address(0), "Invalid owner address");
          owner = newOwner;
     }

}