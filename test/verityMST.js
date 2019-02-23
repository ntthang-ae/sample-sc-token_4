const VeriTAGToken = artifacts.require('./MSTToken.sol');
const assert = require('assert');


/*contract('MSTToken', (accounts) => {
    beforeEach(async () => {
       contractInstance = await MSTToken.deployed();
    });

    //check total supply coin
    it('Total initial supply coin is 1000000', async () => {
        const INITIAL_SUPPLY = 1000000e18;

        const totalSupply = await contractInstance.totalSupply();
        // const todoContent = web3.toUtf8(newAddedTodo[1])
        // console.log("totalSupply", totalSupply);
        assert.equal(totalSupply, INITIAL_SUPPLY, 'Total supply is correct');
    })

    //test mintable function
    it('Mint 10000 token, new total supply should be 1010000', async () => {
        // mint more 10000 token
        const MINTCOIN = 10000e18;
        const NEW_SUPPLY = 1010000e18;
        await contractInstance.mint("0x627306090abaB3A6e1400e9345bC60c78a8BEf57", MINTCOIN);
        // console.log(result);
        // const todoContent = web3.toUtf8(newAddedTodo[1])
        
        const totalSupply = await contractInstance.totalSupply();
        // console.log("New TotalSupply", totalSupply);
        assert.equal(totalSupply, NEW_SUPPLY, 'Mint 10000 token is correct');
    })
    // can mint with address that is not owner of token
    it('Calling minting with address not owner, expected revert', async () => {
        // mint more 10000 token
        const PREFIX = "VM Exception while processing transaction: ";
        const MINTCOIN = 10000e18;
        try {
            await contractInstance.mint("0x627306090abaB3A6e1400e9345bC60c78a8BEf57", MINTCOIN, 
            {from: "0xf17f52151EbEF6C7334FAD080c5704D77216b732"});
            throw null;
        }
        catch (error) {
            assert(error, "Expected an error but did not get one");
           //assert(error.message.startsWith(PREFIX + errType), "Expected an error starting with '" + PREFIX + errType + "' but got '" + error.message + "' instead");
        }
        
    });
 });
*/
