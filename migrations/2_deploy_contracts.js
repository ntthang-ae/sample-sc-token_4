var MST_TokenSale = artifacts.require("./MST_TokenSale.sol");
// var TokenVesting = artifacts.require("./TokenVesting");

module.exports = function(deployer) {
  // deployer.deploy(VeriTAGTokenSale);

  // const privateSaleRate = 26000;
  // const preSaleRate = 23000;
  // const publicSaleRate = 20000;
  // const owner = "0x627306090abaB3A6e1400e9345bC60c78a8BEf57";
  // const wallet = "0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef";
  // const buyer = "0xf17f52151EbEF6C7334FAD080c5704D77216b732";

  // // const startTime = new Date().getTime();
  // // const cliff = startTime + duration.days(5);
  // // const dur = startTime + duration.days(45);
  // deployer.deploy(
  //   VeriTAGTokenSale, 
  //   privateSaleRate, 
  //   preSaleRate,
  //   publicSaleRate,
  //   wallet);
};

const duration = {
  seconds: function (val) { return val; },
  minutes: function (val) { return val * this.seconds(60); },
  hours: function (val) { return val * this.minutes(60); },
  days: function (val) { return val * this.hours(24); },
  weeks: function (val) { return val * this.days(7); },
  years: function (val) { return val * this.days(365); },
};