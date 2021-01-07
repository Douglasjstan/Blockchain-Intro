pragma solidity ^0.5.0;

import "./DappToken.sol";
import "./SG1Token.sol";

contract TokenFarm {
    string public name = "Dapp Token Farm";
    address public owner;
    DappToken public dappToken;
    SG1Token public sg1Token;

    address[] public stakers;     // array containing all the investors that have staked.
    mapping(address => uint) public stakingBalance;
    mapping(address => bool) public hasStaked;
    mapping(address => bool) public isStaking;

    constructor(DappToken _dappToken, SG1Token _sg1Token) public {
        dappToken = _dappToken;
        sg1Token = _sg1Token;
        owner = msg.sender;   // owner is the person who call this contract
    }

    function stakeTokens(uint _amount) public {
        // Require amount greater than 0 ie cannot stake 0 amount
        require(_amount > 0, "amount cannot be 0");

        // Transfer 1SG tokens to this contract for staking 
        sg1Token.transferFrom(msg.sender, address(this), _amount);  

        // Update staking balance
        stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;

        // Add user to stakers array *only* if they haven't staked already
        if(!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
        }

        // Update staking status
        isStaking[msg.sender] = true;
        hasStaked[msg.sender] = true;
    }

    // Unstaking Tokens (Withdraw)
    function unstakeTokens() public {
        // Fetch staking balance
        uint balance = stakingBalance[msg.sender];

        // Require amount greater than 0 ie cannot unstake 0 amount
        require(balance > 0, "staking balance cannot be 0");

        // Transfer 1SG tokens (balance) from contract back to investor
        sg1Token.transfer(msg.sender, balance);

        // Reset staking balance of investor to zero
        stakingBalance[msg.sender] = 0;

        // Update staking status
        isStaking[msg.sender] = false;
    }

    // Issuing Tokens
    function issueTokens() public {
        // Only owner can call this function ie only the person who call this contract can issue token
        require(msg.sender == owner, "caller must be the owner");

        // Issue tokens to all stakers by looping the array of stakers
        for (uint i=0; i<stakers.length; i++) {
            address recipient = stakers[i];
            uint balance = stakingBalance[recipient];   // 1 to 1 transfer ie. stakingBalance = 100
            if(balance > 0) {                           //    then transfer 100 DappToken  
                dappToken.transfer(recipient, balance);
            }
        }
    }
}
