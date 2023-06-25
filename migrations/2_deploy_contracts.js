/* eslint-disable no-undef */
const FLTToken = artifacts.require("FLTToken");
const Ether = artifacts.require("Ether");
const DigilanceContract = artifacts.require("Digilance");


module.exports = async function(deployer, network, accounts) {
	// Deploy FLTToken
  await deployer.deploy(FLTToken);
  const fltToken = await FLTToken.deployed();

  // Deploy Ether
  await deployer.deploy(Ether);
  const etherToken = await Ether.deployed();
  
	// Deploy FreelanceMarketplace
  await deployer.deploy(DigilanceContract, fltToken.address, etherToken.address);
  const digilance = await DigilanceContract.deployed();

	// const ts = await fltToken.totalSupply.call();

	const ts = '10000000000000000000000';

	// Authorize the Freelance Marketplace to make transactions on behalf of the fltToken owner
	await fltToken.approve(digilance.address, ts);



	// Send 100 ETH to the first 5 accounts
	await etherToken.transfer(accounts[1], '100000000000000000000')
	await etherToken.transfer(accounts[2], '100000000000000000000')
	await etherToken.transfer(accounts[3], '100000000000000000000')
	await etherToken.transfer(accounts[4], '100000000000000000000')
	await etherToken.transfer(accounts[5], '100000000000000000000')
};