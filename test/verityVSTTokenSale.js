
const TokenVesting = artifacts.require('./TokenVesting.sol');
const VeriTAGToken = artifacts.require('./MST_Token.sol');
const VeriTAGTokenSale = artifacts.require('./MST_TokenSale.sol');
const assert = require('assert');


const privateSaleRate = 26000;
const preSaleRate = 23000;
const publicSaleRate = 20000;
const MAX_ETH_BUY = 10000e18;
const MIN_ETH_PRISALE = 5e18;
const MIN_ETH_PRESALE = 1e18;
const MIN_ETH_PUBLICSALE = 0.1e18;
const owner = "0xC8367BAb4d0e61A53fdf3D637C5e8D32c8ad9E7f";
const beneficiary = "0x08685bdD88c57518FD315Fc904aD1A27d8C1b1a0";
const buyer = "0x1aACAa67504102540cf386C7ee2972B82bf63473";
const token4SalePercentage = 70;

function eventListener(error, result){
    console.log("error", error);
    console.log("Result", result);
}

const duration = {
    seconds: function (val) { return val; },
    minutes: function (val) { return val * this.seconds(60); },
    hours: function (val) { return val * this.minutes(60); },
    days: function (val) { return val * this.hours(24); },
    weeks: function (val) { return val * this.days(7); },
    years: function (val) { return val * this.days(365); },
  };

function convertUTCDateToLocalDate(date) {
    var newDate = new Date(date);
    newDate.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return newDate;
}
contract('MSTTokenSale', (accounts) => {
    beforeEach(async () => {
        
        // console.log("Deploying VeriTagToken contract");
        veriTagToken = await VeriTAGToken.new({from: owner});
        const totalSupply = await veriTagToken.totalSupply();
        // get VeriTAG deployed address
        // console.log("Create from owner", await veriTagToken1.owner());
        // const startTime = new Date().getTime();
        const privateSaleCliff = duration.minutes(2);
        const preSaleCliff = duration.minutes(4);
        const tokenForSale = (token4SalePercentage/100) * totalSupply;

        // console.log("Deploying VeriTag Token Sale for Token", veriTagToken.address);
        contractInstance = await VeriTAGTokenSale.new(
            privateSaleRate,
            preSaleRate,
            publicSaleRate,
            privateSaleCliff,
            preSaleCliff,
            beneficiary,
            veriTagToken.address,
            tokenForSale,
            {from: owner}
        );

        let tx = await veriTagToken.deposit(contractInstance.address, tokenForSale);
        // console.log(tx);
        
        let deployedTime = await web3.eth.getBlock(tx.receipt.blockNumber).timestamp;
        console.log("BlockTime", convertUTCDateToLocalDate(new Date(deployedTime*1000)), "MST Token", veriTagToken.address, "Token Sale", contractInstance.address);

        let balanceOfOwner = await veriTagToken.balanceOf(owner);
        let balanceOfTokenSale = await veriTagToken.balanceOf(contractInstance.address);

        tx = await veriTagToken.transferOwnership(contractInstance.address);
        // console.log("Transfer ownership of token to sale contract");
    });

    //check rate settings
    it('Check default settings of sale contract', async () => {
        // console.log("Checking setting of tokensale after deploying");
        const saleRate = await contractInstance.getSaleRates();
        // const todoContent = web3.toUtf8(newAddedTodo[1])
        // console.log(_privateSaleRate, _preSaleRate,_publicSaleRate);
        assert.equal(saleRate[0], privateSaleRate, 'privateSaleRate is correct');
        assert.equal(saleRate[1], preSaleRate, 'preSaleRate is correct');
        assert.equal(saleRate[2], publicSaleRate, 'publicSaleRate is correct');
    })

    // init token and transfer 50% to TokenSaleContract
    it('Check balance token sale contract', async () => {
        // const INITIAL_SUPPLY = 1000000e18;
        const totalSupply = await veriTagToken.totalSupply();
        const TRANSFER_AMOUNT = totalSupply*(token4SalePercentage/100);
        let balanceOfTokenSale = await veriTagToken.balanceOf(contractInstance.address);
        
        // console.log("Sale contract balance", balanceOfTokenSale);
        assert.equal(balanceOfTokenSale, TRANSFER_AMOUNT, 'Total Token of contract after transfering is correct');
    });

    // start sale and start private sale
    it('Start private sale', async () => {
        await contractInstance.startSale();
        let status = await contractInstance.getSaleStatus();
        console.log(status);
        assert.equal(true, status[1], 'Private sale is started');
    });

    it('Start pre sale', async () => {
        // start privateSale
        await contractInstance.startSale();
        await contractInstance.startPreSale();
        let status = await contractInstance.getSaleStatus();
        assert.equal(true, status[3], 'Pre sale is started');
    });

    it('Start public sale', async () => {
        // start tokensale
        // start privateSale
        await contractInstance.startSale();
        await contractInstance.startPreSale();
        await contractInstance.startPublicSale();

        let status = await contractInstance.getSaleStatus();
        assert.equal(true, status[5], 'Pre sale is started');
    });

    it('Finish sale', async () => {
        // start privateSale
        await contractInstance.startSale();
        await contractInstance.startPreSale();
        await contractInstance.startPublicSale();
        await contractInstance.finishSale();

        let status = await contractInstance.getSaleStatus();
        assert.equal(true, status[7], 'Sale is finished');
        
    });

    it('Buy token at private sale phase', async () => {
        // console.log("Balance of buyer before buy", tokeBalanceOfBuyer);
        // start tokensale
        let tx = await contractInstance.startSale();
        //check current price
        let currentPrice = await contractInstance.getPrice();
        console.log("currentPrice", currentPrice);
        assert.equal(currentPrice, privateSaleRate, 'Price is correct');
        
        let sellerETHBalanceBefore = await web3.eth.getBalance(beneficiary);
        console.log("sellerETHBalanceBefore", sellerETHBalanceBefore);
        // send 10eth to buy token
        let sendEth = 10e18;
        // console.log("Expected buy amount", currentPrice*sendEth);
        tx = await contractInstance.sendTransaction({from: buyer, value: sendEth});
        // let tx = await contractInstance.send(sendEth, {from: buyer});

        // check vesting address
        let vestings = await contractInstance.getPrivateSaleVesting();
        console.log("Vesting contract ", vestings);

        let vestingToken = await TokenVesting.at(vestings[0]);
        let buyerTokenBalance = await veriTagToken.balanceOf(vestings[0]);
        let vestingBuyer = await vestingToken.beneficiary();
        assert.equal(vestingBuyer.toLowerCase(), buyer.toLowerCase(), 'Vesting to incorrect address');
        assert.equal(buyerTokenBalance, currentPrice*sendEth, 'Vesting to incorrect address');

        // check token balance of buyer
        
        console.log("Buyer token balance after buying (Investing)", buyerTokenBalance);
        let sellerETHBalanceAfter = await web3.eth.getBalance(beneficiary);
        
        console.log("ETH balance before", sellerETHBalanceBefore.toNumber(), "ETH token after", sellerETHBalanceAfter.toNumber());
        assert.equal(sellerETHBalanceAfter - sendEth, sellerETHBalanceBefore, 'ETH balance of seller is correct');

        await contractInstance.startPreSale();
        await contractInstance.startPublicSale();
        await contractInstance.finishSale();
    });


    it('Buy token at pre sale phase', async () => {
        // start tokensale
        await contractInstance.startSale();
        await contractInstance.startPreSale();
        //check current price
        let currentPrice = await contractInstance.getPrice();
        // console.log("currentPrice", currentPrice);
        assert.equal(currentPrice, preSaleRate, 'Price is correct');
        
        let sellerETHBalanceBefore = await web3.eth.getBalance(beneficiary);
        // send 10eth to buy token
        let sendEth = 10e18;
        // console.log("Expected buy amount", currentPrice*sendEth);
        let tx = await contractInstance.sendTransaction({from: buyer, value: sendEth});

        let vestings = await contractInstance.getPreSaleVesting();
        console.log("Vesting pre sale contract ", vestings);

        // check token balance of buyer
        let buyerTokenBalance = await veriTagToken.balanceOf(vestings[0]);
        let sellerETHBalanceAfter = await web3.eth.getBalance(beneficiary);
        console.log("Buyer token balance after buying (investing)", buyerTokenBalance);
        // console.log("ETH balance before", sellerETHBalanceBefore.toNumber(), "ETH token after", sellerETHBalanceAfter.toNumber());
        assert.equal(buyerTokenBalance, currentPrice*sendEth, 'Balance of buyer is correct');
        assert.equal(sellerETHBalanceAfter - sendEth, sellerETHBalanceBefore, 'ETH balance of seller is correct');

        await contractInstance.startPublicSale();
        await contractInstance.finishSale();
    });

    it('Buy token at public sale phase', async () => {
        // start tokensale
        await contractInstance.startSale();
        await contractInstance.startPreSale();
        await contractInstance.startPublicSale();
        // start privateSale
        //check current price
        let currentPrice = await contractInstance.getPrice();
        // console.log("currentPrice", currentPrice);
        assert.equal(currentPrice, publicSaleRate, 'Price is correct');
        
        let sellerETHBalanceBefore = await web3.eth.getBalance(beneficiary);
        // console.log("Seller balance before", sellerETHBalanceBefore);
        // send 10eth to buy token
        let sendEth = 10e18;
        // console.log("Expected buy amount", currentPrice*sendEth);
        let tx = await contractInstance.sendTransaction({from: buyer, value: sendEth});

        // check token balance of buyer
        let buyerTokenBalance = await veriTagToken.balanceOf(buyer);
        let sellerETHBalanceAfter = await web3.eth.getBalance(beneficiary);
        // console.log("Buyer token balance after buying", buyerTokenBalance);
        // console.log("ETH balance before", sellerETHBalanceBefore.toNumber(), "ETH token after", sellerETHBalanceAfter.toNumber());
        assert.equal(buyerTokenBalance, currentPrice*sendEth, 'Balance of buyer is correct');
        assert.equal(sellerETHBalanceAfter - sendEth, sellerETHBalanceBefore, 'ETH balance of seller is correct');

        await contractInstance.finishSale();
    });

    it('Buy token when sale is not start, reject transaction', async () => {
        let balanceOfTokenSale = await veriTagToken.balanceOf(contractInstance.address);
        // start tokensale
        // check current price
        let currentPrice = await contractInstance.getPrice();
        // console.log("currentPrice", currentPrice);
        assert.equal(currentPrice, 0, 'Price is correct');
        // let sellerETHBalanceBefore = await web3.eth.getBalance(wallet);
        // send 10eth to buy token
        let sendEth = 10e18;
        try {
            let tx = await contractInstance.sendTransaction({from: buyer, value: sendEth});
        } catch (ex) {
            assert(ex, "Expected an error but did not get one");
        }
    });

    it('Buy token than max amount', async () => {
        let sendEth = 10001e18;
        // buy at private sale
        await contractInstance.startSale();
        try {
            let tx = await contractInstance.sendTransaction({from: buyer, value: sendEth});
        } catch (ex) {
            assert(ex, "Expected an error but did not get one");
        }

        // buy at presale
        await contractInstance.startPreSale();
        try {
            let tx = await contractInstance.sendTransaction({from: buyer, value: sendEth});
        } catch (ex) {
            assert(ex, "Expected an error but did not get one");
        }
        
        //buy at public sale
        await contractInstance.startPublicSale();
        try {
            let tx = await contractInstance.sendTransaction({from: buyer, value: sendEth});
        } catch (ex) {
            assert(ex, "Expected an error but did not get one");
        }
    });
});

