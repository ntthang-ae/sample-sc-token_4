/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a 
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() { 
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>') 
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

module.exports = {
    solc: {
        optimizer: {
            enabled: true,
            runs: 200,
        },
    },
    networks: {
        development: {
            host: '127.0.0.1',
            port: 7545,
            network_id: '1',
            gas: 5000000,
        },
        ropsten: {
            host: '127.0.0.1',
            port: 8545,
            network_id: 42,
            gas: 6712390,
            from: "0x00da81b54e0b52153C0D839Ba59c4eeb824B8D8d"
        }
    }
};
