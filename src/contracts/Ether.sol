pragma solidity >=0.8.1;
// SPDX-License-Identifier: MIT

import "../../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Ether is ERC20 {
	constructor() ERC20("Ether Token", "ETH") {
		_mint(msg.sender, 1000000 * (10 ** uint256(decimals())));
	}
}