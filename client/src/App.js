import { useState, useEffect } from "react";
import EventContract from "./contracts/EventContract.json";
import Web3 from "web3";
import "./App.css";

function App() {
  const [state, setState] = useState({
    web3: null,
    contract: null,
  });
  const [data, setData] = useState("nill");
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
      console.log("Deployed Network",deployedNetwork)
      console.log(contract);
      setState({ web3: web3, contract: contract });
    }
    provider && template();
  }, []);
  console.log(state)

  return (
   <>
   </>
  );
}

export default App;
