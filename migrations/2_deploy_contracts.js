const DappToken = artifacts.require('DappToken')
const SG1Token = artifacts.require('SG1Token')
const TokenFarm = artifacts.require('TokenFarm')

module.exports = async function(deployer, network, accounts) {
  // Deploy 1SG Token
  await deployer.deploy(SG1Token)                    // deployed 
  const sg1Token = await SG1Token.deployed()         // fetch it back 

  // Deploy Dapp Token
  await deployer.deploy(DappToken)                   // deployed
  const dappToken = await DappToken.deployed()       // fetch it back

  // Deploy TokenFarm
  await deployer.deploy(TokenFarm, dappToken.address, sg1Token.address)    // deployed with SG1 and DAPP
  const tokenFarm = await TokenFarm.deployed()

  // All 3 contracts deployed onto blockchain network

  // Transfer all tokens to TokenFarm (1 million)
  await dappToken.transfer(tokenFarm.address, '1000000000000000000000000')

  // Transfer 100 1SG tokens to investor
  await sg1Token.transfer(accounts[1], '100000000000000000000')
}
