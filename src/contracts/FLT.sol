pragma solidity >=0.8.1;
// SPDX-License-Identifier: MIT

import "../../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FLTToken is ERC20 {
	constructor() ERC20("Freelance Token", "FLT") {
		_mint(msg.sender, 1000000 * (10 ** uint256(decimals())));
	}
}
