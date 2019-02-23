pragma solidity ^0.4.24;

import "./SafeMath.sol";
import "./SafeERC20.sol";
import "./Permissions.sol";
import "./MST_Token.sol";
import "./TokenVesting.sol";
import "./TokenTimeLock.sol";

/**
 * @title TokenAdmin contract for MST token
 * @author Duong Van Sang
 * @dev TokenAdmin is a contract for veritag admin to manage mst tokens.
 *      TokenAdmin contract address is added in the admin list at deployment time
 */
contract MSTTokenAdmin is Permissions {
    using SafeMath for uint256;
    using SafeERC20 for MSTToken;

    struct BonusInfo {
        address buyer;
        uint256 amount;
        uint256 releaseTime;
    }

    MSTToken public token;
    mapping(address => BonusInfo) internal bonusInfos;
    // mapping buyer address --> TokeTimelock Contract
    mapping(address => TokenTimelock) internal tokenTimeLockMapping;
    // list of investor have bonus
    address[] internal bonusAddressList;

    mapping(address => TokenVesting) internal tokenVestingMapping;
    address[] internal vestingAddressList;

    constructor(
        MSTToken _token
    ) public {
        require(_token != address(0));
        token = _token;
    }

    function getBonusAddressList () external view returns (address[]){
        return bonusAddressList;
    }

    /**
    * Get bonus information for an invester
    * @param _buyer investor wallet address where bonus will be transferred after unlocking
    */
    function getBonusInfo (address _buyer) external view returns (address, uint256, uint256){
        return (bonusInfos[_buyer].buyer, bonusInfos[_buyer].amount, bonusInfos[_buyer].releaseTime);
    }
    /**
    * Get token lock smart contract address
    * @param _buyer investor wallet address
    */
    function getTokenTimeLock(address _buyer) external view returns (address){
        return tokenTimeLockMapping[_buyer];
    }

    function getVestingList() external view returns (address[]){
        return vestingAddressList;
    }

    /**
    * Get vesting constract address
    * @param _address an address which has tokens locked in vesting
    */
    function getVestingToken(address _address) external view returns (address){
        return tokenVestingMapping[_address];
    }

    /**
    * @dev Revoke ownership of some vesting addresses when needed
    */
    function revokeOwnershipOfVestingToken(address[] addrs) public onlyAdmin {
        for(uint i = 0; i < addrs.length; i++) {
            tokenVestingMapping[addrs[i]].transferOwnership(owner);
        }
    }

    /**
    * @dev This can be used by admin / owner to manually transfer mst token to addresses. E.g. for airdrop purposes.
    * @param _tos list of addresses to receive a specified amount of mst token.  
    * @param _value amount of mst tokens (example 200 mst tokens, not in wei format)
    */
    function placeToken(address[] _tos, uint256 _value) public onlyAdmin returns (bool) {
        require(_value > 0, "Invalid token amount");

        uint256 tokenAmount = _value.mul(10 ** uint256(token.decimals())); // convert to amount in wei format
        
        for(uint i = 0; i < _tos.length; i++) {
            token.deposit(_tos[i], tokenAmount);
        }
        
        return true;
    }
    /**
    * @dev Send sale token bonus for investor to the timelock contract.
    * @param _to investor wallet addressn to get bonus tokens
    * @param _value amount of mst token (example 20,000 mst tokens)
    * @param _releaseTime number of days to lock starting from the current date (example 180 days from now)
    */
    function placeBonusToken(address _to, uint256 _value, uint256 _releaseTime) public onlyAdmin returns (bool) {

        require(_to != address(0), "Invalid address");
        require(_value > 0, "Invalid token amount");

        uint256 currentBlockTime = now;
        uint256 releaseDate = currentBlockTime.add(_releaseTime.mul(86400));
        uint256 tokenAmount = _value.mul(10 ** uint256(token.decimals())); // convert the amount in wei format

        if(tokenTimeLockMapping[_to] == address(0)) {
            bonusInfos[_to] = BonusInfo(_to, tokenAmount, releaseDate);

            TokenTimelock timeLock = new TokenTimelock(token, _to, releaseDate);
            tokenTimeLockMapping[_to] = timeLock;
            token.deposit(timeLock, tokenAmount);

            bonusAddressList.push(_to);
        } else {
            //deposit more bonus
            token.deposit(tokenTimeLockMapping[_to], tokenAmount);
            // update bonus information
            bonusInfos[_to].amount = bonusInfos[_to].amount.add(tokenAmount);
        }

        return true;
    }

    /**
    * @dev Send token to a vesting contract. This can be used for vesting of tokens of core team members and advisors.
    * @param _to wallet address to receive the tokens after the vesting
    * @param _value amount of mst token (e.g., 200,000 mst tokens)
    * @param _releaseTime number of days from now to vest (e.g., 360 days from now)
    */
    function placeVestingToken(address _to, uint _value, uint256 _releaseTime) public onlyAdmin returns (bool) {
        require(_to != address(0), "Invalid address");
        require(_value > 0, "Invalid token amount");

        uint256 currentBlockTime = now;
        uint256 releaseDate = currentBlockTime.add(_releaseTime.mul(86400));
        uint256 tokenAmount = _value.mul(10 ** uint256(token.decimals())); // convert amount in wei format

        if(tokenVestingMapping[_to] == address(0)) {
            tokenVestingMapping[_to] = new TokenVesting(_to, currentBlockTime, releaseDate, true);

            token.deposit(tokenVestingMapping[_to], tokenAmount);

            vestingAddressList.push(_to);
        } else {
            //deposit more bonus
            token.deposit(tokenVestingMapping[_to], tokenAmount);
        }
        return true;
    }
}
