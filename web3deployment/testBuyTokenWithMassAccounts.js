#!/usr/bin/env node

const Web3 = require("web3");
const solc = require('solc');
const fs = require("fs");
const path = require('path');
const BigNumber = require('bignumber.js');

const numberOfAccounts = 100;
const rpcURL = "http://127.0.0.1:7545";
const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));
const contractAddress = "0x233BAA049b4ae43D55C7145b35229A51C67b161E";
const moneyProvider = "0xf37e9dd423186b2e2bf857afe806dd73404279e65d016c3311d0148a7e7a3627";
const providerAccount = web3.eth.accounts.privateKeyToAccount(moneyProvider);
const gasPrice =  5 * (10 ** 9);
const signedTxs = [];
const accounts = [];


async function main() {
    let chainId = await web3.eth.net.getId();
    for(let i = 0; i < numberOfAccounts; i++) {
        let account = web3.eth.accounts.create();
        accounts.push(account);
        // console.log(account);

        let nonce = await web3.eth.getTransactionCount(providerAccount.address);
        
        let tx = {
            from: providerAccount.address,
            to: account.address, 
            value: web3.utils.toWei("30", "ether"),
            nonce : nonce,
            gas: 200000,
            chainId,
            gasPrice
        };

        let signedTx = await web3.eth.accounts.signTransaction(tx, moneyProvider);
        // don't wait for confirmation
        signedTxs.push(signedTx.rawTransaction)
        let txHash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction, {from:providerAccount.address});

        console.log("Deposited ETH to account", account.address, "txHash", txHash.transactionHash);

        nonce = await web3.eth.getTransactionCount(account.address);
        tx = {
            from: account.address,
            to: contractAddress, 
            value: web3.utils.toWei("10", "ether"),
            nonce : nonce,
            gas: 200000,
            chainId,
            gasPrice
        };

        signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);
        // don't wait for confirmation
        signedTxs.push(signedTx.rawTransaction)
        txHash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction, {from:account.address});

        console.log("Buy token with eth from ", account.address,"txHash", txHash.transactionHash);
    }
}

main();



