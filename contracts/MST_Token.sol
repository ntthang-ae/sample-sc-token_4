pragma solidity ^0.4.24;

import "./StandardToken.sol";
import "./BurnableToken.sol";
import "./Permissions.sol";


/**
 * @title MST Token
 * My Sample Token (MST)
 */
contract MSTToken is StandardToken, BurnableToken, Permissions {
    using SafeMath for uint256;

    string public constant name = "MST Token";
    string public constant symbol = "mst";
    uint8 public constant decimals = 18;
    bool public tradingStarted = false;

    uint256 internal constant INITIAL_SUPPLY = 1000 * (10**6) * (10 ** uint256(decimals)); // Total 1 billion mst tokens

    /**
    * @dev Constructor that gives msg.sender all of existing tokens.
    */
    constructor() public {
        totalSupply_ = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
        emit Transfer(address(0), msg.sender, INITIAL_SUPPLY);
    }

    /**
    * @dev modifier that throws if trading has not started yet
    */
    modifier hasStartedTrading() {
        require(tradingStarted);
        _;
    }

    /**
    * @dev Allows the owner to enable the trading. This can not be undone
    */
    function startTrading(bool _status) public onlyOwner {
        tradingStarted = _status;
    }

    /**
    * @dev Allows anyone to transfer the tokens once trading has started
    * @param _to the recipient address of the tokens.
    * @param _value the amount of tokens to be transfered.
    */
    function transfer(address _to, uint256 _value) public hasStartedTrading returns (bool) {
        return super.transfer(_to, _value);
    }
    /**
    * @dev Transfer tokens from one address to another
    * @param _from address The address which you want to send tokens from
    * @param _to address The address which you want to transfer to
    * @param _value the amount of tokens to be transferred
    */
    function transferFrom(address _from, address _to, uint256 _value) public hasStartedTrading returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }
    /**
    * @dev Transfer tokens from one address to another for admin (owner is an admin)
    * @param _to address The address which you want to transfer to
    * @param _value the amount of tokens to be transferred
    */
    function deposit(address _to, uint256 _value) public onlyAdmin returns (bool) {
        return super.transfer(_to, _value);
    }
}
