import { useState, useEffect } from "react";
import EventContract from "./contracts/EventContract.json";
import Web3 from "web3";
import "./App.css";

function App() {
  const [state, setState] = useState({
    web3: null,
    contract: null,
    accounts: [],
  });
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventPrice, setEventPrice] = useState("");
  const [ticketCount, setTicketCount] = useState("");
  const [events, setEvents] = useState([]);
  const [ticketQuantity, setTicketQuantity] = useState(1);

  useEffect(() => {
    const provider = new Web3.providers.HttpProvider("HTTP://127.0.0.1:7545");

    async function template() {
      const web3 = new Web3(provider);
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = EventContract.networks[networkId];
      const contract = new web3.eth.Contract(
        EventContract.abi,
        deployedNetwork.address
      );
      const accounts = await web3.eth.getAccounts();
      setState({ web3: web3, contract: contract, accounts: accounts });
    }
    provider && template();
  }, []);

  // Function to create a new event
  const createEvent = async () => {
    const { contract, accounts } = state;
    try {
      await contract.methods
        .createEvent(
          eventName,
          parseInt(new Date(eventDate).getTime() / 1000),
          Web3.utils.toWei(eventPrice, "ether"),
          parseInt(ticketCount)
        )
        .send({ from: accounts[0], gas: 3000000 });
      alert("Event created successfully!");
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  // Function to fetch all events
  const fetchEvents = async () => {
    const { contract } = state;
    const nextId = await contract.methods.nextId().call();
    const eventsArray = [];
    for (let i = 0; i < nextId; i++) {
      const event = await contract.methods.events(i).call();
      eventsArray.push({
        id: i,
        ...event,
        price: event.price.toString(),
        date: event.date.toString(),
        ticketRemain: event.ticketRemain.toString(),
      });
    }
    setEvents(eventsArray);
  };

  // Function to buy tickets
  const buyTicket = async (eventId) => {
    const { contract, accounts, web3 } = state;
    const event = events.find((e) => e.id === eventId);
    const ticketPrice = parseFloat(web3.utils.fromWei(event.price, "ether")) * ticketQuantity;
    try {
      await contract.methods
        .buyTicket(eventId, ticketQuantity)
        .send({ from: accounts[0], value: Web3.utils.toWei(ticketPrice.toString(), "ether") });
      alert("Tickets purchased successfully!");
      fetchEvents();
    } catch (error) {
      console.error("Error buying ticket:", error);
    }
  };

  // Fetch events when component mounts
  useEffect(() => {
    if (state.contract) {
      fetchEvents();
    }
  }, [state.contract]);

  return (
    <div className="App">
      <h1>Event Organizer</h1>

      <div>
        <h2>Create Event</h2>
        <input
          type="text"
          placeholder="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />
        <input
          type="date"
          placeholder="Event Date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />
        <input
          type="text"
          placeholder="Ticket Price in ETH"
          value={eventPrice}
          onChange={(e) => setEventPrice(e.target.value)}
        />
        <input
          type="number"
          placeholder="Total Tickets"
          value={ticketCount}
          onChange={(e) => setTicketCount(e.target.value)}
        />
        <button onClick={createEvent}>Create Event</button>
      </div>

      <div>
        <h2>Available Events</h2>
        {events.length === 0 ? (
          <p>No events created yet.</p>
        ) : (
          events.map((event) => (
            <div key={event.id}>
              <h3>{event.name}</h3>
              <p>Date: {new Date(event.date * 1000).toLocaleString()}</p>
              <p>Price: {Web3.utils.fromWei(event.price, "ether")} ETH</p>
              <p>Tickets Remaining: {event.ticketRemain}</p>
              <input
                type="number"
                min="1"
                placeholder="Quantity"
                value={ticketQuantity}
                onChange={(e) => setTicketQuantity(parseInt(e.target.value))}
              />
              <button onClick={() => buyTicket(event.id)}>Buy Tickets</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
