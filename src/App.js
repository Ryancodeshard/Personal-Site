import logo from './logo.svg';
import './css/App.css';
import { Link, Outlet } from "react-router-dom";

function App() {
  return (
    <div className="App">
      <header className="App-header" >
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <nav>
      <Link to="/chatapp">Chat app</Link>
      </nav>
      <Outlet/>
    </div>
  );
}

export default App;
