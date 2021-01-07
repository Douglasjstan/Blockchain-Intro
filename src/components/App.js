import React, { Component } from 'react'
import Web3 from 'web3'
import SG1Token from '../abis/SG1Token.json'
import DappToken from '../abis/DappToken.json'
import TokenFarm from '../abis/TokenFarm.json'
import Navbar from './Navbar'
import Main from './Main'
import './App.css'

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadBlockchainData() {
    const web3 = window.web3

    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })           // get 1st account in Ganache and update React state variable

    const networkId = await web3.eth.net.getId()      // first, fetch the correct network (ie Ganache) ID 
                                                      //   then fetch all necessary data from all smart contracts
    // Load SG1Token
    const sg1TokenData = SG1Token.networks[networkId] // fetch data from SG1Token contract
    if(sg1TokenData) {                                //   if exist, convert it to a web3 version and update React state variables
	  // https://web3js.readthedocs.io/en/v1.3.0/web3-eth-contract.html#id27
      const sg1Token = new web3.eth.Contract(SG1Token.abi, sg1TokenData.address)
      this.setState({ sg1Token })
      let sg1TokenBalance = await sg1Token.methods.balanceOf(this.state.account).call()
      this.setState({ sg1TokenBalance: sg1TokenBalance.toString() })
    } else {                                          //   if does not exist, then contract is not deployed to network at all.
      window.alert('SG1Token contract not deployed to detected network.')
    }

    // Load DappToken
    const dappTokenData = DappToken.networks[networkId]  // fetch data from DappToken contract
    if(dappTokenData) {
      const dappToken = new web3.eth.Contract(DappToken.abi, dappTokenData.address)
      this.setState({ dappToken })
      let dappTokenBalance = await dappToken.methods.balanceOf(this.state.account).call()
      this.setState({ dappTokenBalance: dappTokenBalance.toString() })
    } else {
      window.alert('DappToken contract not deployed to detected network.')
    }

    // Load TokenFarm                                    // fetch data from TokenFarm contract
    const tokenFarmData = TokenFarm.networks[networkId]
    if(tokenFarmData) {
      const tokenFarm = new web3.eth.Contract(TokenFarm.abi, tokenFarmData.address)
      this.setState({ tokenFarm })
      let stakingBalance = await tokenFarm.methods.stakingBalance(this.state.account).call()
      this.setState({ stakingBalance: stakingBalance.toString() })
    } else {
      window.alert('TokenFarm contract not deployed to detected network.')
    }

    this.setState({ loading: false })   // loading is set to true during loading. Set to false after loading.
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  stakeTokens = (amount) => {
    this.setState({ loading: true })
    this.state.sg1Token.methods.approve(this.state.tokenFarm._address, amount).send({ from: this.state.account }).on('transactionHash', (hash) => {
      this.state.tokenFarm.methods.stakeTokens(amount).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
    })
  }

  unstakeTokens = (amount) => {
    this.setState({ loading: true })
    this.state.tokenFarm.methods.unstakeTokens().send({ from: this.state.account }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
    })
  }

  // state variables
  constructor(props) {
    super(props)
    this.state = {
      account: '0x0',           // default account is 0x0
      sg1Token: {},
      dappToken: {},
      tokenFarm: {},
      sg1TokenBalance: '0',
      dappTokenBalance: '0',
      stakingBalance: '0',
      loading: true             // default is true when first startup. Set to false after loading 
    }                           //        and updating state variables is completed.
  }

  render() {
    let content
    if(this.state.loading) {   // if page is loading, show Loading ...
      content = <p id="loader" className="text-center">Loading...</p>
    } else {
      content = <Main          // else load Main.js and refresh with state variables 
        sg1TokenBalance={this.state.sg1TokenBalance}
        dappTokenBalance={this.state.dappTokenBalance}
        stakingBalance={this.state.stakingBalance}
        stakeTokens={this.stakeTokens}
        unstakeTokens={this.unstakeTokens}
      />
    }

    // update account in Navbar using state variable
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '600px' }}>
              <div className="content mr-auto ml-auto">
                <a
                  href="https://singaporefintech.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                </a>

                {content}

              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
