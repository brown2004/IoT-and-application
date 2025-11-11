import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./components/Dashboard";
import './App.css';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      if (localStorage.getItem("loggedIn") === "true") {
        <Route path="/dashboard" element={<Dashboard />} />
      }
    </Routes>
  );
};

export default App;
