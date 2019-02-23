#!/usr/bin/env node

const Web3 = require("web3");
const solc = require('solc');
const fs = require("fs");
const path = require('path');
const BigNumber = require('bignumber.js');
const config = require("./config.js")

//config token sale
const senderPK = config.ownerPrivateKey;
const salePrice = config.salePrice;
const thresold = config.thresold;
const typeALevel = config.typeALevel;
const typeBLevel = config.typeBLevel;
const beneficiary = config.beneficiary; // eth collector (should be multisig)
const tokenOwnerAddress = config.tokenOwnerAddress;
const tokenHolderAddress = config.tokenHolderAddress;
const token4SalePercentage = config.token4SalePercentage; // 60 percent
const token4BonusPercentage = config.token4BonusPercentage; // 10 percent

const rpcUrl = config.network;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

// config sender;
const gasPrice =  config.gasPrice * (10 ** 9);

const account = web3.eth.accounts.privateKeyToAccount(senderPK);
const sender = account.address;
const signedTxs = [];
let dontSendTx = false;
let nonce;
let chainId = 0;

const duration = {
    seconds: function (val) { return val; },
    minutes: function (val) { return val * this.seconds(60); },
    hours: function (val) { return val * this.minutes(60); },
    days: function (val) { return val * this.hours(24); },
    weeks: function (val) { return val * this.days(7); },
    years: function (val) { return val * this.days(365); },
};

async function sendTx(txObject) {
    const txTo = txObject._parent.options.address;

    let gasLimit;
    try {
        gasLimit = await txObject.estimateGas();
        console.log("Estimated gas", gasLimit);
    }
    catch (e) {
        gasLimit = 500 * 1000;
    }

    if(txTo !== null) {
        gasLimit = 500 * 1000;
    }

    const txData = txObject.encodeABI();
    const txFrom = account.address;
    const txKey = account.privateKey;

    gasLimit += 50000;
    const tx = {
        from : txFrom,
        to : txTo,
        nonce : nonce,
        data : txData,
        gas : gasLimit,
        chainId,
        gasPrice
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, txKey);
    nonce++;
    // don't wait for confirmation
    signedTxs.push(signedTx.rawTransaction)
    let txHash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction, {from:sender});

    return txHash;
}

async function deployContract(input, contractName, ctorArgs) {
    const source = input[contractName];
    const contractSource = JSON.parse(source);
    const abi = contractSource.abi;
    const bytecode = contractSource.bytecode;
    let contract = new web3.eth.Contract(abi);
    const deploy = contract.deploy({data: bytecode, arguments: ctorArgs});

    console.log("\nDeploying contract", contractName ,",please wait for network to mine")
    let tx = await sendTx(deploy);
    contract = new web3.eth.Contract(abi,tx.contractAddress);
    // contract.options.address = tx.contractAddress;
    console.log("Deployed contract", contractName, "address ", tx.contractAddress);
    console.log("ABI ", JSON.stringify(abi).replace(/\s+/g, ''));
    return contract;
}

const contractBuildPath = path.join(__dirname, "../build/contracts/");

const input = {
    "MSTToken" : fs.readFileSync(contractBuildPath + 'MSTToken.json', 'utf8'),
    "MSTTokenSale" : fs.readFileSync(contractBuildPath + 'MSTTokenSale.json', 'utf8'),
    "MSTTokenAdmin" : fs.readFileSync(contractBuildPath + 'MSTTokenAdmin.json', 'utf8')
};

async function main() {
    console.log("Start deployment use address", sender);
    nonce = await web3.eth.getTransactionCount(sender);
    console.log("Current nonce",nonce);

    chainId = chainId || await web3.eth.net.getId()
    console.log('chainId', chainId);

    if (!dontSendTx) {
        await waitForEth();
    }

    const mstContract = await deployContract(input, "MSTToken", []);
    
    const totalSupply = await mstContract.methods.totalSupply().call();
    const tokenForSale = new BigNumber(totalSupply).multipliedBy(token4SalePercentage/100);
    const tokenForBonus = new BigNumber(totalSupply).multipliedBy(token4BonusPercentage/100);

    let saleSetting = [
        mstContract.options.address,
        salePrice,
        tokenForSale.toFixed(),
        typeALevel.toFixed(),
        typeBLevel.toFixed(),
        thresold.toFixed(),
        beneficiary
    ]
    
    const mstTokenSaleContract = await deployContract(input, "MSTTokenSale", saleSetting);
    const decimal = await mstContract.methods.decimals().call();
    const mstTokenAdminContract = await deployContract(input, "MSTTokenAdmin", [mstContract.options.address]);

    console.log("\nStart adding admins for MSTToken");

    let tx = await sendTx(mstContract.methods.addAdmin(sender));
    console.log("\nAdded owner address",sender, "to admin of MSTToken, txHash", tx.transactionHash);

    if(tokenOwnerAddress != sender) {
        console.log("\nAdding token owner's address to admin of MSTToken");
        tx = await sendTx(mstContract.methods.addAdmin(tokenOwnerAddress));
        console.log("\nAdded token owner's address",tokenOwnerAddress, "to admin of MSTToken, txHash", tx.transactionHash);
    }

    console.log("\nAdding MSTTokenSale contract to admin of MSTToken");
    tx = await sendTx(mstContract.methods.addAdmin(mstTokenSaleContract.options.address));
    console.log("Added token sale address",mstTokenSaleContract.options.address, "to admin of MSTToken, txHash", tx.transactionHash);

    console.log("\nAdding MSTTokenAdmin contract to admin of MSTToken");
    tx = await sendTx(mstContract.methods.addAdmin(mstTokenAdminContract.options.address));
    console.log("Added token admin address",mstTokenAdminContract.options.address, "to admin of MSTToken, txHash", tx.transactionHash);

    console.log("\nAdding token owner's address to admin of MSTTokenSale");
    tx = await sendTx(mstTokenSaleContract.methods.addAdmin(tokenOwnerAddress));
    console.log("Added Sender to admin ",tokenOwnerAddress, "txHash", tx.transactionHash);

    console.log("\nAdding token owner's address to admin of MSTTokenAdmin");
    tx = await sendTx(mstTokenAdminContract.methods.addAdmin(tokenOwnerAddress));
    console.log("Added Sender to admin ",tokenOwnerAddress, "txHash", tx.transactionHash);

    console.log("\nAdding token owner's address to operator of MSTTokenSale Contract");
    tx = await sendTx(mstTokenSaleContract.methods.addOperator(tokenOwnerAddress));
    console.log("Added token owner's address",tokenOwnerAddress, "to operator of mstTokenSale, txHash", tx.transactionHash);

    // send token for sale to TokenSale Contract
    console.log("\nTransfering",tokenForSale.dividedBy(10**decimal).toFixed(),"token to TokenSale contract");
    tx = await sendTx(mstContract.methods.deposit(mstTokenSaleContract.options.address,tokenForSale.toFixed()));
    console.log("Transfered",tokenForSale.dividedBy(10**decimal).toFixed(),"token to TokenSale contract txHash", tx.transactionHash);

    // send token for sale to TokenSale Contract
    console.log("\nTransfering",tokenForBonus.dividedBy(10**decimal).toFixed(),"token to TokenAdmin contract");
    tx = await sendTx(mstContract.methods.deposit(mstTokenAdminContract.options.address,tokenForBonus.toFixed()));
    console.log("Transfered",tokenForBonus.dividedBy(10**decimal).toFixed(),"token to TokenAdmin contract txHash", tx.transactionHash);

    // send remaining token to token address
    let remainingToken = await mstContract.methods.balanceOf(sender).call();
    remainingToken = new BigNumber(remainingToken);
    console.log("\nTransfering remaining ", remainingToken.dividedBy(10**decimal).toFixed(),"token to token owner account");

    tx = await sendTx(mstContract.methods.deposit(tokenHolderAddress, remainingToken.toFixed()));
    console.log("Transfer all remaining token to Token's address txHash", tx.transactionHash);

    if(tokenOwnerAddress != sender) {
        console.log("\nRemove sender from admin list", sender);
        tx = await sendTx(mstContract.methods.removeAdmin(sender));
        console.log("\nRemoved sender from admin list", tx.transactionHash);
    }
    // transfer ownership of token sale to the token owner
    console.log("\nStart transfering ownership of mstToken to token owner's address", tokenOwnerAddress);
    tx = await sendTx(mstContract.methods.transferOwnership(tokenOwnerAddress));
    console.log("Transfered ownership txHash", tx.transactionHash);

    console.log("\nStart transfering ownership of mstTokenSale to token owner's address", tokenOwnerAddress);
    tx = await sendTx(mstTokenSaleContract.methods.transferOwnership(tokenOwnerAddress));
    console.log("Transfered ownership txHash", tx.transactionHash);

    console.log("\nStart transfering ownership of mstTokenAdmin to token owner's address", tokenOwnerAddress);
    tx = await sendTx(mstTokenAdminContract.methods.transferOwnership(tokenOwnerAddress));
    console.log("Transfered ownership txHash", tx.transactionHash);

    console.log("Finished deployment")
}

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

async function waitForEth() {
    while(true) {
        const balance = await web3.eth.getBalance(sender);
        console.log("waiting for balance to account " + sender);
        if(balance.toString() !== "0") {
            console.log("received " + balance.toString() + " wei");
            return;
        }
        else await sleep(10000)
    }
}

main();