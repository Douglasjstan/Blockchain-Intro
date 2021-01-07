const SG1Token = artifacts.require('SG1Token')
const DappToken = artifacts.require('DappToken')
const TokenFarm = artifacts.require('TokenFarm')

require('chai')
  .use(require('chai-as-promised'))
  .should()

function tokens(n) {  // helper function to reuse re-typing
  return web3.utils.toWei(n, 'ether');
}

contract('TokenFarm', ([owner, investor]) => {
  let sg1Token, dappToken, tokenFarm

  before(async () => {
    // Load Contracts
    sg1Token = await SG1Token.new()
    dappToken = await DappToken.new()
    tokenFarm = await TokenFarm.new(dappToken.address, sg1Token.address)

    // Transfer all Dapp tokens to farm (1 million)
    await dappToken.transfer(tokenFarm.address, tokens('1000000'))

    // Send tokens to investor
    await sg1Token.transfer(investor, tokens('100'), { from: owner })    // transfer 100 1SG from owner to investor
  })

  describe('1SG deployment', async () => {
    it('has a name', async () => {
      const name = await sg1Token.name()
      assert.equal(name, '1SG Token')
    })
  })

  describe('Dapp Token deployment', async () => {
    it('has a name', async () => {
      const name = await dappToken.name()
      assert.equal(name, 'DApp Token')
    })
  })

  describe('Token Farm deployment', async () => {
    it('has a name', async () => {
      const name = await tokenFarm.name()
      assert.equal(name, 'Dapp Token Farm')
    })

    it('contract has tokens', async () => {
      let balance = await dappToken.balanceOf(tokenFarm.address)
      assert.equal(balance.toString(), tokens('1000000'))
    })
  })

  describe('Farming tokens', async () => {

    it('rewards investors for staking 1SG tokens', async () => {
      let result

      // Check investor balance before staking
      result = await sg1Token.balanceOf(investor)
      assert.equal(result.toString(), tokens('100'), 'investor 1SG wallet balance correct before staking')

      // Stake 1SG Tokens - approve tokenFarm to spend on behalf of sg1Token.
      await sg1Token.approve(tokenFarm.address, tokens('100'), { from: investor })
      await tokenFarm.stakeTokens(tokens('100'), { from: investor })   // stake token in tokenFarm

      // Check staking result by getting the balanceOf investor .. should be zero
      result = await sg1Token.balanceOf(investor)
      assert.equal(result.toString(), tokens('0'), 'investor 1SG wallet balance correct after staking')

      // check staking result by getting the balanceOf tokenFarm .. should have 100
      result = await sg1Token.balanceOf(tokenFarm.address) 
      assert.equal(result.toString(), tokens('100'), 'Token Farm 1SG balance correct after staking')

      // check stakingBalance of investor .. should have increase by 100
      result = await tokenFarm.stakingBalance(investor)  
      assert.equal(result.toString(), tokens('100'), 'investor staking balance correct after staking')

      // check current staking status of investor has been set to true after investor has staked
      result = await tokenFarm.isStaking(investor)
      assert.equal(result.toString(), 'true', 'investor staking status correct after staking')

      // Issue Tokens by owner
      await tokenFarm.issueTokens({ from: owner })   

      // Check balances after issuance
      result = await dappToken.balanceOf(investor)
      assert.equal(result.toString(), tokens('100'), 'investor DApp Token wallet balance correct affter issuance')

      // Ensure that only onwer can issue tokens. Reject if investor tries to issue token.
      await tokenFarm.issueTokens({ from: investor }).should.be.rejected;   

      // Unstake tokens by investor
      await tokenFarm.unstakeTokens({ from: investor })

      // Check results after unstaking
      result = await sg1Token.balanceOf(investor)
      assert.equal(result.toString(), tokens('100'), 'investor 1SG wallet balance correct after staking')

      result = await sg1Token.balanceOf(tokenFarm.address)
      assert.equal(result.toString(), tokens('0'), 'Token Farm 1SG balance correct after staking')

      result = await tokenFarm.stakingBalance(investor)
      assert.equal(result.toString(), tokens('0'), 'investor staking balance correct after staking')

      result = await tokenFarm.isStaking(investor)
      assert.equal(result.toString(), 'false', 'investor staking status correct after staking')
    })
  })

})
