//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./Tokens.sol";

contract Controller {
    uint256 coolDown; // Cool down for token 0,1,2 mints
    Tokens public tokenContract;

    // tracks total supply of all minted tokens
    mapping(uint256 => uint256) public tokenTotalSupply; // TokenID => totalSupply

    constructor() {
        tokenContract = new Tokens();
    }

    // Purpose is to mint the initial tokens (0-2)
    // These tokens are used to acquire all other possible tokenID's
    function initialMint(uint256 _id) external {
        // check only tokens (0-2) are being attempted to mint
        require(_id < 3, "Initial mint is only for tokenID's 0, 1 or 2!");

        // check the neccessary cool down time has passed
        require(
            block.timestamp > (coolDown + 1 days),
            "1 day cool down not satisfied!"
        );

        // increment token supply
        tokenTotalSupply[_id]++;

        // mints 1 token of ID specified via front-end input
        coolDown = block.timestamp;
        tokenContract.mint(msg.sender, _id, 1);
    }

    function burnableMint(
        uint256 _id,
        uint256[] calldata _toBurn,
        uint256[] calldata _amounts
    ) external {
        // User passes in id to mint on front end, and front end auto fills tokens to burn and amounts of each
        // toBurn amounts passed in numerical order
        // (array values used for batch burn)
        // amounts hardcoded on front end [1,1,1] for tokenID 6 and [1,1] for 3-5

        // check for the specified tokenID to mint, that they have provided correct tokenID's to burn
        if (_id == 3) {
            require
            (
                _toBurn[0] == 0 && 
                _toBurn[1] == 1, 
                "Invalid tokenID to burn for token 3"
            );
        } else if (_id == 4) {
            require
            (
                _toBurn[0] == 1 && 
                _toBurn[1] == 2, 
                "Invalid tokenID to burn for token 4"
            );
        } else if (_id == 5) {
            require
            (
                _toBurn[0] == 0 && 
                _toBurn[1] == 2, 
                "Invalid tokenID to burn for token 5"
            );
        } else if (_id == 6) {
            require
            (
                _toBurn[0] == 0 && 
                _toBurn[1] == 1 && 
                _toBurn[2] == 2, 
                "Invalid tokenID to burn for token 6"
            );
        } else {
            // if neither (3-5)
            revert("Invalid tokenID to mint specified");
        }

        // burn required tokens
        tokenContract.burnBatch(msg.sender, _toBurn, _amounts);

        // decrement total supply of all tokens being burned
        for (uint256 i; i < _toBurn.length; i++) {
            uint256 tokenID = _toBurn[i];
            tokenTotalSupply[tokenID]--;
        }

        // increment supply of minted token
        tokenTotalSupply[_id]++;

        // mint desired token
        tokenContract.mint(msg.sender, _id, 1);
    }

    function trade(uint256 _toTradeID, uint256 _toRecieveID) external {
        // allows trading of any token for tokens 0-2
        require(_toRecieveID < 3, "You can only trade for tokens 0-2!");

        tokenContract.burn(msg.sender, _toTradeID, 1);
        tokenContract.mint(msg.sender, _toRecieveID, 1);
    }
}
