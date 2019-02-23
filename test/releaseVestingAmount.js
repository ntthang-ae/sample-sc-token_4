const MSTToken = artifacts.require('./MSTToken.sol');
const TokenVesting = artifacts.require('./TokenVesting.sol');
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
const vestingAddress = "0x01ea00b28a689efb70a6633d066f3743e9661678";
const tokenAdress = "0xc2D499EAb19c062d76994EF290BA9E0630ED3631";
const token4SalePercentage = 70;

const duration = {
    seconds: function (val) { return val; },
    minutes: function (val) { return val * this.seconds(60); },
    hours: function (val) { return val * this.minutes(60); },
    days: function (val) { return val * this.hours(24); },
    weeks: function (val) { return val * this.days(7); },
    years: function (val) { return val * this.days(365); },
  };

contract('ReleaseVesting Testing', (accounts) => {
    beforeEach(async () => {
        MSTToken = await MSTToken.at(tokenAdress);
        tokenVesting = await TokenVesting.at(vestingAddress);
    });

    it('Verify balance of Vesting', async () => {
        // console.log(tx);
        let buyerTokenBefore = await MSTToken.balanceOf(buyer);
        let vestingBalanceBefore = await MSTToken.balanceOf(vestingAddress);
        if(!await MSTToken.tradingStarted()) {
            let tx = await MSTToken.startTrading();
        }
        console.log("Token is started trading");

        await tokenVesting.release(tokenAdress);

        let buyerTokenAfter = await MSTToken.balanceOf(buyer);
        let vestingBalanceAfter = await MSTToken.balanceOf(vestingAddress);
        console.log("Buy balance before", buyerTokenBefore, " after", buyerTokenAfter);
        console.log("Vesting balance before", vestingBalanceBefore, " after", vestingBalanceAfter);
    });

    // it('Release token', async () => {
    //     let tx = await MSTToken.startTrading({from: owner});
    //     console.log(tx);
    //     let buyerTokenBefore = await MSTToken.balanceOf(buyer);
    //     await tokenVesting.release(tokenAdress);
    //     let buyerTokenAfter = await MSTToken.balanceOf(buyer);
    //     console.log("token before", buyerTokenBefore, "token after", buyerTokenAfter);
    // });
});

