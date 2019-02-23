pragma solidity ^0.4.24;

import "./SafeMath.sol";
import "./SafeERC20.sol";
import "./Permissions.sol";
import "./MST_Token.sol";
import "./TokenVesting.sol";
import "./TokenTimeLock.sol";

/**
 * @title TokenSale contract for MST token
 * @author Duong Van Sang
 * @dev TokenSale is a base contract for managing a token sale
 * allowing investors to purchase tokens with Ether.
 */
contract MSTTokenSale is Permissions {
    using SafeMath for uint256;
    using SafeERC20 for MSTToken;

    MSTToken public token;

    address public wallet; //multisig wallet address to collect ETH
    uint256 public threshold; // in wei, if buy amount great than this value, sender address needs to be authorized
    uint256 public typeALevel; // in wei, get Type A bonus if buy amount is great than this value. For info only.
    uint256 public typeBLevel; // in wei, get Type B bonus if buy amount is great than this value. For info only.
    uint256 public price; // token sale price (ETH vs MST)

    mapping(address=>bool) internal authorisedAccounts;
    address[] internal aAccounts; // list of authorized account addresses

    // max amount of tokens for sale, in wei. This is determined by the hardcap.
    uint256 public maxTokens;

    uint256 constant MAX_ETH_AMOUNT = 1000e18; // max ETH can buy in one transaction
    uint256 constant MIN_ETH_AMOUNT = 1e18; // min ETH to buy in one transaction

    bool internal saleStarted = false; // this flag is set to true after the admin has started the Token sale.
    bool internal saleFinished = false; // this flag is set to true after the admin has finished the Token sale.
    uint256 public saleStartedTime; // Token sale starting time

    bool public enableWhiteList = true;

    /**
    * @dev Event for token purchase logging
    * @param purchaser who paid for the tokens
    * @param beneficiary who got the tokens
    * @param value weis paid for purchase
    * @param amount amount of tokens purchased
    */
    event TokensPurchased(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
    event SaleClosed();

    // values will be set when deplying the smart contract
    constructor(
        MSTToken _token, // token is used for sale
        uint256 _price, // rate to convert from ETH to Token (20000)
        uint256 _maxTokens, // max token for sale
        uint256 _typeALevel, // Level A (in wei) to get type A bonus 
        uint256 _typeBLevel, // Level B (in wei) to get type B bonus 
        uint256 _threshold, // Level (in wei) to require an address to be authorized
        address _wallet // the multisig address to collect ETH from Token sale
    ) public {
        require(_token != address(0) && _wallet != address(0));
        require(_price > 0 && _maxTokens > 0);
        require(_typeALevel > 0 && _typeBLevel > 0 && _threshold > 0);
        require(_typeALevel > _typeBLevel);

        token = _token;
        price = _price;
        maxTokens = _maxTokens;
        typeALevel = _typeALevel;
        typeBLevel = _typeBLevel;
        threshold = _threshold;
        wallet = _wallet;
    }

    /**
    * @dev fallback function ***DO NOT OVERRIDE***
    */
    function () external payable {
        _buyTokens(msg.sender, msg.value);
    }

    /**
    * @dev return sale status
    */
    function getSaleStatus() external view returns (bool[2]) {
        return [saleStarted,saleFinished];
    }

    /**
    * @dev Enable and disable white list checking
    * Default is true.
    * @param _status true/false to enable and disable whitelist checking
    */
    function enableWhiteListCheck(bool _status) public onlyAdmin {
        enableWhiteList = _status;
    }

    /**
    * @dev Change wallet to collect eth
    * The wallet is set at deployment time, but it can be changed later by the owner when necessary
    * @param _wallet the multisig wallet to collect eth
    */
    function setWallet(address _wallet) public onlyOwner {
        wallet = _wallet;
    }
    
    function isAuthorized(address _addr) public view returns (bool) {
        return authorisedAccounts[_addr];
    }

    function getAuthorizedAccounts() external view returns (address[]) {
        return aAccounts;
    }

    /**
    * authorized a list of addresses to whitelist for token sale.
    */
    function authorizedAccounts(address[] _addrs) public onlyOperator {
        for (uint i = 0; i < _addrs.length; i++) {
            authoriseAccount(_addrs[i]);
        }
    }

    /**
    * @dev authorise an account to participate
    */
    function authoriseAccount(address _addr) public onlyOperator {
        require(_addr != address(0));
        authorisedAccounts[_addr] = true;
        aAccounts.push(_addr);
    }

    /**
    * @dev ban an account from participation
    */
    function blockAccount(address _addr) public onlyOperator{
        authorisedAccounts[_addr] = false;
    }  

    /**
    * @dev Start Token sale
    * Start accepting eth and send mst token to investor
    */
    function startSale() public onlyAdmin {
        require(!saleStarted, "Sale already started");
        saleStarted = true;
        saleStartedTime = block.timestamp;
    }

    /**
    * @dev Finish Token sale
    * No more eth is accepted
    */
    function finishSale() public onlyAdmin {
        require(saleStarted, "Sale is not active");
        saleFinished = true;
        // transfer remaining token to owner wallet address when finish sale
        token.deposit(owner, token.balanceOf(address(this)));

        emit SaleClosed();
    }

    /**
    * @dev Burns a specific amount of tokens.
    * @param _value The amount of token to be burned.
    */
    function burn(uint256 _value) public onlyAdmin {
        require(_value > 0, "Invalid token amount");
        uint256 tokenAmount = _value.mul(10 ** uint256(token.decimals())); // convert to amount in wei format

        token.burn(tokenAmount);
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
    * @dev low level token purchase ***DO NOT OVERRIDE***
    * @param _buyer Address performing the token purchase
    * @param _weiAmount Address performing the token purchase
    */
    function _buyTokens(address _buyer, uint256 _weiAmount) internal {

        // uint256 weiAmount = msg.value;
        _preValidatePurchase(_buyer, _weiAmount);

        // calculate token amount to be created
        uint256 tokens = _getTokenAmount(_weiAmount);

        _processPurchase(_buyer, tokens);

        emit TokensPurchased(
            msg.sender,
            _buyer,
            _weiAmount,
            tokens
        );

        _forwardFunds();
    }

    // -----------------------------------------
    // Internal interface (extensible)
    // -----------------------------------------

    /**
    * @dev Validation of an incoming purchase.
    * @param _buyer Address performing the token purchase
    * @param _weiAmount Value in wei involved in the purchase
    */
    function _preValidatePurchase(address _buyer, uint256 _weiAmount) internal view {
        require(_isSaleActive(), "Sale is not active");
        // require(_buyer != address(0), "Receive address is invalid");
        require(_weiAmount >= MIN_ETH_AMOUNT, "weiAmount is less than min buy");
        require(_weiAmount <= MAX_ETH_AMOUNT, "weiAmount is greater than max buy");
        // require(tokenSold <= maxTokens, "There is no more token for sale");
        if(_weiAmount >= threshold)
            require(_whitelistCheck(_buyer), "Address is not authorized");
    }

    /**
    * @dev Executed when a purchase has been validated and is ready to be executed.
    * deposit funtion require admin permission to be called, 
    * so TokenSale contract address need to be added to Token admin list of Token
    * as default at deployment time to able to call deposit function to move tokens
    * @param _buyer Address receiving mst tokens
    * @param _tokenAmount amount of mst tokens to be purchased
    */
    function _processPurchase(address _buyer, uint256 _tokenAmount) internal {
        // tokenSold.push(_tokenAmount);
        token.deposit(_buyer, _tokenAmount);
    }

    /**
    * @dev Override to extend the way in which ether is converted to tokens.
    * @param _weiAmount ETH value in wei to be converted into tokens
    * @return amount of mst tokens that can be purchased with the specified _weiAmount
    */
    function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
        return _weiAmount.mul(price);
    }

    /**
    * @dev Determines how ETH is stored/forwarded on purchases.
    */
    function _forwardFunds() internal {
        wallet.transfer(msg.value);
    }

    /**
    * @dev Check if address is in whitelist
    */
    function _whitelistCheck(address _beneficiary) internal view returns (bool) {
        return !enableWhiteList || authorisedAccounts[_beneficiary];
    }

    /**
    * @dev check sale phase is active
    */
    function _isSaleActive() internal view returns (bool) {
        return saleStarted && !saleFinished;
    }
}
