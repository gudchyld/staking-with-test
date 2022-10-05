// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "solmate/src/tokens/ERC20.sol";

contract Timidan is ERC20("Timidan", "TMD", 18) {

    address public owner;

    constructor(address user) {
        _mint(user, 100000e18);
        owner = msg.sender;
    }
}
