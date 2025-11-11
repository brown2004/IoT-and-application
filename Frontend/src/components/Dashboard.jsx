import React from "react";
import ParkingLot from "../components/ParkingLot";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>🏙️ Smart Parking Dashboard</h1>
          <p>Giám sát bãi đỗ xe thông minh (IoT)</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Đăng xuất
        </button>
      </header>

      <main className="dashboard-main">
        <ParkingLot />
      </main>
      
      <footer className="dashboard-footer">
        <p>© 2025 Smart Parking System — Powered by ESP32 & React</p>
      </footer>
    </div>
  );
};

export default Dashboard;
