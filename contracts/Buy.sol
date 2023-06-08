pragma solidity ^0.5.0;

contract Buy {
    struct Merch {
        address[] buyers;
    }

    Merch[8] private merchs;

    function buy(uint merchId) public payable returns (uint) {
        require(merchId >= 0 && merchId <= 7);
        merchs[merchId].buyers.push(msg.sender);
        return merchId;
    }

    function getBuyers(uint merchId) public view returns (address[] memory) {
        require(merchId >= 0 && merchId <= 7);
        return merchs[merchId].buyers;
    }
}
