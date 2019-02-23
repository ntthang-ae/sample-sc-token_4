## mst-smart-contract

MST ICO uses the following smart contracts:

*MST_TokenSale smart contract for token sales
*MST_Admin smart contract for managing vtag tokens, such as airdrop, manually send bonus tokens, create vesting and time lock tokens
*MST_Token smart contract for vtag token, an ERC20 token

Refer to white paper for the tokenomics specifications


## MST_TokenSale smart contract

Each sales phase is started and ended by the contract owner as follows:
 
Crowd Sales:

* Start - Only the contract owner / admin can start.
* End - Only the contract owner / admin can stop.

## Sale (fallback function)

* min purchase is 1 ether
* max purchase is  10000 ether

## Authorisation

* by Operator
* can approve or block a transaction from an account or many acccounts
* call `authoriseAccount()` / `authoriseManyAccounts()` / `blockAccount()

## Finishing the sale (owner) - passes control of token back to the owner

* call `finishSale()` 

## Starting Trading

* call `startTrading()` on the TOKEN-contract



