pragma solidity ^0.4.24;

import "./Ownable.sol";

/**
 * @title Permission
 * @dev Define permission groups
 */
contract Permissions is Ownable {
    mapping(address=>bool) internal operators;
    mapping(address=>bool) internal admins;
    address[] internal operatorsGroup;
    address[] internal adminsGroup;
    
    uint constant internal MAX_GROUP_SIZE = 20;

    modifier onlyOperator() {
        require(operators[msg.sender]);
        _;
    }
    modifier onlyAdmin() {
        require(admins[msg.sender]);
        _;
    }

    function getAdmins () external view returns(address[]) {
        return adminsGroup;
    }

    function getOperators () external view returns(address[]) {
        return operatorsGroup;
    }

    function addAdmin(address newAdmin) public onlyOwner {
        require(!admins[newAdmin]);
        require(adminsGroup.length < MAX_GROUP_SIZE);

        emit AdminAdded(newAdmin, true);
        admins[newAdmin] = true;
        adminsGroup.push(newAdmin);
    }
    function removeAdmin (address admin) public onlyOwner {
        require(admins[admin]);
        admins[admin] = false;

        for (uint i = 0; i < adminsGroup.length; ++i) {
            if (adminsGroup[i] == admin) {
                adminsGroup[i] = adminsGroup[adminsGroup.length - 1];
                adminsGroup.length -= 1;
                emit OperatorAdded(admin, false);
                break;
            }
        }
    }

    function addOperator(address newOperator) public onlyOwner {
        require(!operators[newOperator]);
        require(operatorsGroup.length < MAX_GROUP_SIZE);

        emit OperatorAdded(newOperator, true);
        operators[newOperator] = true;
        operatorsGroup.push(newOperator);
    }

    function removeOperator (address operator) public onlyOwner {
        require(operators[operator]);
        operators[operator] = false;

        for (uint i = 0; i < operatorsGroup.length; ++i) {
            if (operatorsGroup[i] == operator) {
                operatorsGroup[i] = operatorsGroup[operatorsGroup.length - 1];
                operatorsGroup.length -= 1;
                emit OperatorAdded(operator, false);
                break;
            }
        }
    }

    event OperatorAdded(address newOperator, bool isAdd);
    event AdminAdded(address newAdmin, bool isAdd);
}