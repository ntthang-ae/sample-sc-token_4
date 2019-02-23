#!/usr/bin/env node

const Web3 = require("web3");
const solc = require('solc');
const fs = require("fs");
const path = require('path');
const BigNumber = require('bignumber.js');

const numberOfAccounts = 100;
const rpcURL = "http://127.0.0.1:7545";
const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));
const contractAddress = "0xC780F5297308f8acFCBaAc2fF00A59bfB31d04de";
const abi = [{"constant":false,"inputs":[{"name":"admin","type":"address"}],"name":"removeAdmin","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x1785f53c"},{"constant":true,"inputs":[],"name":"getOperators","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x27a099d8"},{"constant":true,"inputs":[],"name":"getAdmins","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x31ae450b"},{"constant":false,"inputs":[{"name":"newAdmin","type":"address"}],"name":"addAdmin","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x70480275"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x715018a6"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x8da5cb5b"},{"constant":false,"inputs":[{"name":"newOperator","type":"address"}],"name":"addOperator","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x9870d7fe"},{"constant":false,"inputs":[{"name":"operator","type":"address"}],"name":"removeOperator","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0xac8a584a"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0xf2fde38b"},{"constant":true,"inputs":[],"name":"token","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function","signature":"0xfc0c546a"},{"inputs":[{"name":"_token","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor","signature":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newOperator","type":"address"},{"indexed":false,"name":"isAdd","type":"bool"}],"name":"OperatorAdded","type":"event","signature":"0x091a7a4b85135fdd7e8dbc18b12fabe5cc191ea867aa3c2e1a24a102af61d58b"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newAdmin","type":"address"},{"indexed":false,"name":"isAdd","type":"bool"}],"name":"AdminAdded","type":"event","signature":"0x8a7039f4ea6f86a6a98d9c1efb0ea9d190f6b3fa37c32627cf48f767f51e36d5"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"}],"name":"OwnershipRenounced","type":"event","signature":"0xf8df31144d9c2f0f6b59d69b8b98abd5459d07f2742c4df920b25aae33c64820"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event","signature":"0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0"},{"constant":true,"inputs":[],"name":"getBonusAddressList","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function","signature":"0xa93170d8"},{"constant":true,"inputs":[{"name":"_buyer","type":"address"}],"name":"getBonusInfo","outputs":[{"name":"","type":"address"},{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x0e49caa9"},{"constant":true,"inputs":[{"name":"_buyer","type":"address"}],"name":"getTokenTimeLock","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function","signature":"0x75d90e67"},{"constant":true,"inputs":[],"name":"getVestingList","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function","signature":"0xe46ef9df"},{"constant":true,"inputs":[{"name":"_address","type":"address"}],"name":"getVestingToken","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function","signature":"0xe44a785d"},{"constant":false,"inputs":[{"name":"addrs","type":"address[]"}],"name":"revokeOwnerShipOfVestingToken","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x9af1fede"},{"constant":false,"inputs":[{"name":"_tos","type":"address[]"},{"name":"_value","type":"uint256"}],"name":"placeToken","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x352e77ef"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_releaseTime","type":"uint256"}],"name":"placeBonusToken","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0xeff9f88e"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_releaseTime","type":"uint256"}],"name":"placeVestingToken","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x2b5b4a0e"}];
const contractOwnerPK = "0x4b83f5f27686be068b4508c5f65d151d5a3e9b63d19468297df82c51ed4aedf4";

const providerAccount = web3.eth.accounts.privateKeyToAccount(contractOwnerPK);
const gasPrice =  5 * (10 ** 9);
const signedTxs = [];
const accounts = [];


async function main() {

    for(let i = 0; i < numberOfAccounts; i++) {
        let account = web3.eth.accounts.create();
        accounts.push(account);
        // console.log(account);
    }

    let addresses = [];
    accounts.forEach(ac => {
        addresses.push(ac.address);
    });

    console.log("Place token to", addresses);

    let adminContract = new web3.eth.Contract(abi, contractAddress);

    let txObject = adminContract.methods.placeToken(addresses, 10);
    let gasLimit = await txObject.estimateGas({from: providerAccount.address});
    console.log(gasLimit);

    gasLimit += 50000;
    
    const txData = txObject.encodeABI();
    const txFrom = providerAccount.address;
    const txKey = providerAccount.privateKey;

    let chainId = await web3.eth.net.getId();
    let nonce = await web3.eth.getTransactionCount(txFrom);

    const tx = {
        from : txFrom,
        to : contractAddress,
        nonce : nonce,
        data : txData,
        gas : gasLimit,
        chainId,
        gasPrice
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, txKey);
    // don't wait for confirmation
    signedTxs.push(signedTx.rawTransaction)
    let txHash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    console.log(txHash.transactionHash);
}

main();



