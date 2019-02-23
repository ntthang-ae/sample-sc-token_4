const config = {
    // network: 'https://mainnet.infura.io/3XZuCubSwAlbClBAMknR', // mainnet
    // network: 'https://ropsten.infura.io/3XZuCubSwAlbClBAMknR', // Ropsten testnet
    // network: 'https://rinkeby.infura.io/3XZuCubSwAlbClBAMknR', // rinkeby testnet
    // network: 'https://kovan.infura.io/3XZuCubSwAlbClBAMknR', // kovan tesnet
    network: 'http://127.0.0.1:8545', // local node
    gasPrice: 5, // in gwei
    ownerPrivateKey: "0xf44fa96d2290504b06a0c76632e8319d85b642b2a5da951d30f7f54722d714b5", // the private key of whom deploying the smart contract
    // ownerPrivateKey: "0x3464c86b458388318e6c8e97e97a4b56908f3e171583516f74717555c4dcf05b",
    // config sale values
    salePrice: 20000,
    thresold: 20e18, // 20 ETH
    typeALevel: 200e18, // 200 ETH
    typeBLevel: 20e18,
    beneficiary: "0x647ffe80025b5afab1224453d9bb2bd1932b00f0", // address to get eth (should be multisig),
    token4SalePercentage: 50,
    token4BonusPercentage: 20,
    // WARNING!: this address will be owner of token and token sale contract after depployment
    tokenOwnerAddress: "0xe2ff374d23c0671030e698f39097457012f96051",
    // WARNING!: After deployment, all remaining token will be transfer to this address
    // Make sure you are owner of this address, if not all token will be lost
    tokenHolderAddress: "0x947c44acb1d6dca65db443bc0a44ea0ae37a8e98"
};

module.exports = config;
