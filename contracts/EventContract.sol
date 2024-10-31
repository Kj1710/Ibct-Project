// SPDX-License-Identifier: Unlicense1

pragma solidity ^0.8.13;

contract EventContract {
    struct Event {
        address organizer;
        string name;
        uint date;
        uint price;
        uint ticketCount;
        uint ticketRemain;
    }

    mapping(uint => Event) public events;
    mapping(address => mapping(uint => uint)) public tickets;
    uint public nextId;

    function createEvent(
        string memory name,
        uint date,
        uint price,
        uint ticketCount
    ) external {
        require(date > block.timestamp, "Event date must be in the future");
        require(ticketCount > 0, "Must create at least one ticket");

        events[nextId] = Event(
            msg.sender,
            name,
            date,
            price,
            ticketCount,
            ticketCount
        );
        nextId++;
    }

    function buyTicket(uint id, uint quantity) external payable {
        Event storage _event = events[id];
        require(_event.date != 0, "Event does not exist");
        require(_event.date > block.timestamp, "Event has already occurred");
        require(
            msg.value == (_event.price * quantity),
            "Incorrect Ether sent"
        );
        require(_event.ticketRemain >= quantity, "Not enough tickets");

        _event.ticketRemain -= quantity;
        tickets[msg.sender][id] += quantity;
    }

    function transferTicket(
        uint id,
        uint quantity,
        address to
    ) external {
        require(events[id].date != 0, "Event does not exist");
        require(events[id].date > block.timestamp, "Event has already occurred");
        require(tickets[msg.sender][id] >= quantity, "Not enough tickets");

        tickets[msg.sender][id] -= quantity;
        tickets[to][id] += quantity;
    }
}
