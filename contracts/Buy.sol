pragma solidity ^0.5.0;

contract Buy {
    address[8] public merchs;

    function buy(uint merchId) public payable returns (uint) {
        require(merchId >= 0 && merchId <= 7);
        merchs[merchId] = msg.sender;
        return merchId;
    }

    function getMerchs() public view returns (address[8] memory) {
        return merchs;
    }
}
