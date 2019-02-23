pragma solidity ^0.4.24;

import "./SafeMath.sol";
import "./ERC20Basic.sol";
import "./SafeERC20.sol";
import "./Ownable.sol";



/**
 * @title TokenVesting
 * @dev A token holder contract that can release its token balance gradually like a
 * typical vesting scheme, with a cliff and vesting period. Optionally revocable by the
 * owner.
 */
contract TokenVesting is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for ERC20Basic;

    event Released(uint256 amount);
    event Revoked();

    // beneficiary of tokens after they are released
    address public beneficiary;

    uint256 public start;
    uint256 public releaseTime;

    bool internal revocable;
    bool internal revoked;

    // mapping (address => uint256) public released;
    // mapping (address => bool) public revoked;

    /**
    * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
    * _beneficiary, gradually in a linear fashion until _start + _duration. By then all
    * of the balance will have vested.
    * @param _beneficiary address of the beneficiary to whom vested tokens are transferred
    * @param _start the time (as Unix time) at which point vesting starts
    * @param _releaseTime The time, Unit time, until which tokens will be vested
    * @param _revocable whether the vesting is revocable or not
    */
    constructor(
        address _beneficiary,
        uint256 _start,
        uint256 _releaseTime,
        bool _revocable
    )
        public
    {
        require(_beneficiary != address(0));
        beneficiary = _beneficiary;
        revocable = _revocable;
        releaseTime = _releaseTime;
        start = _start;
    }

    /**
    * @notice Transfers vested tokens to beneficiary.
    * @param _token ERC20 token which is being vested
    */
    function release(ERC20Basic _token) public {
        require(block.timestamp >= releaseTime);

        uint256 balance = _token.balanceOf(address(this));

        _token.safeTransfer(beneficiary, balance);

        emit Released(balance);
    }

    /**
    * @notice Allows the owner to revoke the vesting. Tokens already vested
    * remain in the contract, the rest are returned to the owner.
    * @param _token ERC20 token which is being vested
    */
    function revoke(ERC20Basic _token) public onlyOwner {
        require(revocable, "Token is not revocable");
        require(!revoked, "Already revoked");

        uint256 balance = _token.balanceOf(address(this));
        revoked = true;

        _token.safeTransfer(owner, balance);

        emit Revoked();
    }
}
