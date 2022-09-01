//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract Tokens is ERC1155 {
    string public name;
    string public symbol;
    address public controller; // controller contract

    // temp URI
    constructor() ERC1155("https://game.example/api/item/{id}.json") {
        name = "Forging";
        symbol = "FORGE";
        controller = msg.sender;

        // set URIs for all 7 tokens (0-6)
        // default for now
    }

    modifier onlyController() {
        require(msg.sender == controller);
        _;
    }

    function mint(
        address _to,
        uint256 _id,
        uint256 _amount
    ) external onlyController {
        // mints are restricted to the controller contract
        _mint(_to, _id, _amount, "");
    }

    /* unused at the moment
    function mintBatch(
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts
    ) external onlyController {
        // mints are restricted to the controller contract
        _mintBatch(_to, _ids, _amounts, "");
    }
    */

    function burn(
        address _from,
        uint256 _id,
        uint256 _amount
    ) external onlyController {
        _burn(_from, _id, _amount);
    }

    function burnBatch(
        address _from,
        uint256[] memory _ids,
        uint256[] memory _amounts
    ) external onlyController {
        _burnBatch(_from, _ids, _amounts);
    }
}
