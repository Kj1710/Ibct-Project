import { useState, useEffect } from "react";
import EventContract from "./contracts/EventContract.json";
import Web3 from "web3";
import "./App.css";
import { Navbar, Nav, Container, Form, Button, Card, Row, Col } from "react-bootstrap";

function App() {
  const [state, setState] = useState({
    web3: null,
    contract: null,
    accounts: [],
    selectedAccount: "",
  });
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventPrice, setEventPrice] = useState("");
  const [ticketCount, setTicketCount] = useState("");
  const [events, setEvents] = useState([]);
  const [ticketQuantity, setTicketQuantity] = useState(1);

  useEffect(() => {
    const provider = new Web3.providers.HttpProvider("HTTP://127.0.0.1:7545");

    async function initializeWeb3() {
      const web3 = new Web3(provider);
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = EventContract.networks[networkId];
      const contract = new web3.eth.Contract(
        EventContract.abi,
        deployedNetwork.address
      );
      const accounts = await web3.eth.getAccounts();
      setState({
        web3: web3,
        contract: contract,
        accounts: accounts,
        selectedAccount: accounts[0],
      });
    }

    provider && initializeWeb3();
  }, []);

  const createEvent = async () => {
    const { contract, selectedAccount } = state;
    try {
      await contract.methods
        .createEvent(
          eventName,
          parseInt(new Date(eventDate).getTime() / 1000),
          Web3.utils.toWei(eventPrice, "ether"),
          parseInt(ticketCount)
        )
        .send({ from: selectedAccount, gas: 3000000 });
      alert("Event created successfully!");
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

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

  const buyTicket = async (eventId) => {
    const { contract, selectedAccount, web3 } = state;
    const event = events.find((e) => e.id === eventId);
    const ticketPrice =
      parseFloat(web3.utils.fromWei(event.price, "ether")) * ticketQuantity;
    try {
      await contract.methods
        .buyTicket(eventId, ticketQuantity)
        .send({
          from: selectedAccount,
          value: Web3.utils.toWei(ticketPrice.toString(), "ether"),
        });
      alert("Tickets purchased successfully!");
      fetchEvents();
    } catch (error) {
      console.error("Error buying ticket:", error);
    }
  };

  useEffect(() => {
    if (state.contract) {
      fetchEvents();
    }
  }, [state.contract]);

  const handleAccountChange = (e) => {
    setState((prevState) => ({
      ...prevState,
      selectedAccount: e.target.value,
    }));
  };

  return (
    <div className="App">
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="#home">Event Organizer</Navbar.Brand>
          <Nav className="ml-auto">
            <Nav.Link href="#create">Create Event</Nav.Link>
            <Nav.Link href="#events">View Events</Nav.Link>
            <Nav.Link href="#account">Account</Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        {/* Account Selector */}
        <div id="account" className="mb-4">
          <h3>Connected Account:</h3>
          <Form.Select
            aria-label="Account Selector"
            value={state.selectedAccount}
            onChange={handleAccountChange}
          >
            {state.accounts.map((account) => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </Form.Select>
        </div>

        {/* Create Event Section */}
        <div id="create" className="my-5">
          <h2>Create Event</h2>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Event Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Event Name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Event Date</Form.Label>
              <Form.Control
                type="date"
                placeholder="Event Date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ticket Price in ETH</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ticket Price in ETH"
                value={eventPrice}
                onChange={(e) => setEventPrice(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Total Tickets</Form.Label>
              <Form.Control
                type="number"
                placeholder="Total Tickets"
                value={ticketCount}
                onChange={(e) => setTicketCount(e.target.value)}
              />
            </Form.Group>
            <Button variant="primary" onClick={createEvent}>
              Create Event
            </Button>
          </Form>
        </div>

        {/* Events List Section */}
        <div id="events" className="my-5">
          <h2>Available Events</h2>
          {events.length === 0 ? (
            <p>No events created yet.</p>
          ) : (
            <Row>
              {events.map((event) => (
                <Col key={event.id} md={4} className="mb-4">
                  <Card>
                    <Card.Body>
                      <Card.Title>{event.name}</Card.Title>
                      <Card.Text>
                        Date: {new Date(event.date * 1000).toLocaleString()}
                      </Card.Text>
                      <Card.Text>
                        Price: {Web3.utils.fromWei(event.price, "ether")} ETH
                      </Card.Text>
                      <Card.Text>
                        Tickets Remaining: {event.ticketRemain}
                      </Card.Text>
                      <Form.Group className="mb-3">
                        <Form.Label>Ticket Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          value={ticketQuantity}
                          onChange={(e) =>
                            setTicketQuantity(parseInt(e.target.value))
                          }
                        />
                      </Form.Group>
                      <Button
                        variant="success"
                        onClick={() => buyTicket(event.id)}
                      >
                        Buy Tickets
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Container>
    </div>
  );
}

export default App;
